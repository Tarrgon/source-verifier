import type { SourceCheckQueueItem, SourceData, ScoredSourceData } from '../../shared';
import { getDOM } from '../../modules';
import { SourceChecker, type UrlData } from '../SourceChecker';

const NAMES = ['orig', '4096x4096', 'large'];

export default class TwitterSourceChecker extends SourceChecker {
  constructor() {
    super('Twitter');

    this.supported = [
      /^https?:\/\/.*\.?(x|twitter)\.com\/.*\/status\/(\d+).*/,
    ];
  }

  async _internalProcessPost(post: SourceCheckQueueItem, source: string): Promise<SourceData> {
    try {
      const url = new URL(source);
      url.host = 'fixupx.com';

      const res = await fetch(url, {
        redirect: 'manual'
      });

      if (!res.ok) {
        return {
          unknown: true,
          error: true
        };
      }

      const html = await res.text();
      const dom = getDOM(html);
      const document = dom.window.document;

      const imageMeta = document.querySelector("meta[property='og:image']");

      if (!imageMeta) {
        return {
          unknown: true,
          error: true
        };
      }

      const imageUrl = imageMeta.getAttribute('content');

      const urlsToCheck: string[] = [];

      if (imageUrl.includes('pbs.twimg.com')) {
        urlsToCheck.push(imageUrl.split('?')[0].replace('.jpg', '').replace('.png', ''));
      } else {
        const data = imageUrl.split('/').slice(5);
        urlsToCheck.push(...data.map(id => `https://pbs.twimg.com/media/${id}`));
      }

      const matchData: ScoredSourceData[] = [];

      for (const imageUrl of urlsToCheck) {
        const theseMatchDatas: ScoredSourceData[] = [];
        const url = new URL(imageUrl);

        let urls: UrlData[] = [];

        for (const name of NAMES) {
          url.searchParams.set('format', 'png');
          urls.push({ url: url.toString(), isPreview: name != 'orig' && !url.toString().includes('tweet_video_thumb') });
          url.searchParams.set('format', 'jpg');
          urls.push({ url: url.toString(), isPreview: name != 'orig' && !url.toString().includes('tweet_video_thumb') });

          url.searchParams.set('name', name);
        }

        urls = urls.filter(s => !(!s.url.includes('name=orig') && s.url.includes('format=png')));

        for (const urlData of urls) {
          const data = await SourceChecker.processDirectLink(post, urlData.url, urlData.isPreview) as ScoredSourceData;

          if (!data || data.error || data.unknown || data.unsupported) {
            continue;
          }

          data.score = (Number(data.md5Match!) * 5000) + (1000 / (data.phashDistance! + 1)) + (Number(data.dimensionMatch!) * 200) + Number(data.fileTypeMatch) + (data.isPreview ? 0 : 5);

          theseMatchDatas.push(data);
        }

        for (const data of theseMatchDatas) {
          if (data.isPreview) {
            data.originalUrl = theseMatchDatas.find(u => !u.isPreview)?.url;
          }

          matchData.push(data);
        }
      }

      if (matchData.length > 0) {
        matchData.sort((a, b) => b.score! - a.score!);

        return matchData[0];
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