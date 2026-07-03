import { Agent, AppBskyEmbedImages, AppBskyEmbedRecord, AppBskyEmbedRecordWithMedia, AppBskyEmbedVideo, AppBskyFeedPost, CredentialSession } from '@atproto/api';
import { config } from '../../config';
import { wait } from '../../modules';
import { SourceChecker } from '../SourceChecker';
import type { SourceCheckQueueItem, SourceData, ScoredSourceData } from '../../shared';

export default class BlueskySourceChecker extends SourceChecker {
  private ready = false;

  // @ts-ignore: Assigned in login
  private BlueskyAgent: Agent;

  constructor() {
    super('Bluesky');

    this.supported = [
      /^https?:\/\/(?:www\.)?bsky\.app\/profile\/(.*)\/post\/(.*)/,
      /^https?:\/\/web-cdn\.bsky\.app\/profile\/(.*)\/post\/(.*)/
    ];

    this.ready = false;

    this.login();
  }

  async login() {
    const session = new CredentialSession(new URL('https://bsky.social'));

    await session.login({ identifier: config.BLUESKY_USERNAME!, password: config.BLUESKY_PASSWORD! });

    this.BlueskyAgent = new Agent(session);
    await this.BlueskyAgent.setAdultContentEnabled(true);

    this.ready = true;
  }

  async _internalProcessPost(post: SourceCheckQueueItem, source: string): Promise<SourceData> {
    while (!this.ready) await wait(500);

    try {
      const sourceData = /^https?:\/\/(?:www\.)?bsky\.app\/profile\/(.*)\/post\/(.*)/.exec(source);

      if (!sourceData) {
        return {
          unknown: true,
          error: true
        };
      }

      const res = await this.BlueskyAgent.getPost({ repo: sourceData[1], rkey: sourceData[2] });

      if (!res.value) {
        return {
          unknown: true,
          error: true
        };
      }

      const author = await this.BlueskyAgent.getProfile({ actor: sourceData[1] });
      const authorName = author?.data?.handle;

      // @ts-ignore: This is just a mess, the typings here suck to work with. This line would be 20 lines longer otherwise.
      const images: AppBskyEmbedImages.Image[] = res.value?.embed?.images ?? res.value?.embed?.media?.images ?? res.value?.embed?.items;

      if (!images || images.length == 0) {
        return {
          unknown: true
        };
      }

      const did = res.uri.slice(5).split('/')[0];

      const urls: string[][] = [];

      for (const imageData of images) {
        if (!imageData.image) continue;

        const cid = imageData.image.ref.toString();
        if (!cid) continue;

        const originalUrl = `https://bsky.social/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${cid}`;
        const fullSizeUrl = `https://cdn.bsky.app/img/feed_fullsize/plain/${did}/${cid}@${imageData.image.mimeType.split('/')[1]}`;
        const thumbnailUrl = `https://cdn.bsky.app/img/feed_thumbnail/plain/${did}/${cid}@jpeg`;

        urls.push([originalUrl, fullSizeUrl, thumbnailUrl]);
      }

      const matchData: ScoredSourceData[] = [];

      for (const [originalUrl, fullSizeUrl, thumbnailUrl] of urls) {
        for (const url of ([originalUrl, fullSizeUrl, thumbnailUrl])) {
          const data = await SourceChecker.processDirectLink(post, url, url == thumbnailUrl || url == fullSizeUrl, authorName ? [authorName] : []) as ScoredSourceData;

          if (data.isPreview) {
            data.originalUrl = originalUrl;
          }

          if (!data || data.error || data.unknown || data.unsupported) {
            data.score = 0;
            matchData.push(data);
            continue;
          }

          data.score = (Number(data.md5Match!) * 5000) + (1000 / (data.phashDistance! + 1)) + (Number(data.dimensionMatch!) * 200) + Number(data.fileTypeMatch) + (data.isPreview ? 0 : 5);

          matchData.push(data);
        }
      }


      if (matchData.length > 0) {
        matchData.sort((a, b) => b.score! - a.score!);

        return matchData[0];
      } else {
        console.error(JSON.stringify(res, null, 4));
      }
    } catch (e) {
      console.error(e);
    }

    return {
      unknown: true,
      error: true,
    };
  }

}