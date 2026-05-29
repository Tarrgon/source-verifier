import type { SourceCheckQueueItem, SourceData } from '../../../../shared';
import { getFromFlareSolverr } from '../../modules';
import { SourceChecker } from '../SourceChecker';

export default class DirectSourceChecker extends SourceChecker {
  private previewRegex: RegExp[];
  private useFlareSolverrRegex: RegExp[];
  private headersRegex: Map<RegExp, { [header: string]: string }>;

  constructor() {
    super('Direct');

    this.supported = [
      /^https?:\/\/pbs\.twimg\.com\/media\/.*\.(png|jpg|jpeg|webp).*/,
      /^https?:\/\/pbs\.twimg\.com\/media\/.*\?format=(png|jpg|jpeg|webp).*/,
      /^https?:\/\/inkbunny\.net\/files\/.*\.(png|jpg|jpeg|webp|gif).*/,
      /^https?:\/\/d\.furaffinity\.net\/art\/.*\.(png|jpg|jpeg|webp|gif).*/,
      /^https?:\/\/d\.facdn\.net\/art\/.*\.(png|jpg|jpeg|webp|gif).*/,
      /^https?:\/\/media\.baraag\.net\/media_attachments\/.*\.(png|jpg|jpeg|webp|gif).*/,
      /^https?:\/\/artconomy.com\/media\/art\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/images\.artfight\.net\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/cdn.*\.artstation\.com\/p\/assets\/images\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/derpicdn\.net\/img\/(view|download)\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/images-wixmp-.*\.wixmp\.com\/f\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/dl\.dropboxusercontent\.com\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/.*\.cloudfront\.net\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/itaku.ee\/api\/.*\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/cdn\.weasyl\.com\/.*\/submissions\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/cdn\.weasyl\.com\/static\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/uploads\.ungrounded\.net\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/art\.ngfiles\.com\/images\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/.*\.ib\.metapix\.net\/files\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/files\.catbox\.moe\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/i\.imgur\.com\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/i\.redd\.it\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/.*sofurryfiles\.com\/.*\?page=(\d+).*/,
      /^https?:\/\/img\.pawoo\.net\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/pawb\.fun\/system\/media_attachments\/files\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/files\.mastodon\.social\/media_attachments\/files\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/cdn\.discordapp\.com\/attachments\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/staging\.cohostcdn\.org\/attachment\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/cdn\.buymeacoffee\.com\/uploads\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/.*\.rule34\.xxx\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/r34i\.paheal-cdn\.net\/.*/,
      /^https?:\/\/aryion.com\/g4\/data.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/.*\.bsky\.network\/xrpc\/com.atproto.sync.getBlob.*/,
      /^https?:\/\/cdn\.bsky\.app.*/,
      /^https?:\/\/snootbooru.com\/data\/posts.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/desu-usergeneratedcontent\.xyz.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/.*\.gelbooru\.com\/\/?(images|samples)\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/images\.steamusercontent\.com\/ugc\/.*\//,
      /^https?:\/\/r34i\.paheal-cdn\.net\/[a-fA-F0-9]{2}\/[a-fA-F0-9]{2}\/[a-fA-F0-9]{32}/,
      /^https?:\/\/pictures\.hentai-foundry\.com\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/s3\.amazonaws\.com\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/.*\.pillowfort\.social\/posts\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/images\.plurk\.com\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/downloads\.fanbox\.cc\/images\/post\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/co\.llection\.pics\/_images\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
      /^https?:\/\/piczel\.tv\/static\/uploads\/gallery_image\/.*\.(png|jpg|jpeg|webp|gif|webm|mp4).*/,
    ];

    this.previewRegex = [
      /^https?:\/\/cdn\.bsky\.app.*/
    ];

    this.headersRegex = new Map();

    this.headersRegex.set(/^https?:\/\/i\.pximg\.net\/.*\.(png|jpg|jpeg|gif).*/, { Referer: 'https://www.pixiv.net/' });

    this.useFlareSolverrRegex = [
      /^https?:\/\/d\.furaffinity\.net\/art\/.*\.(png|jpg|jpeg|webp|gif).*/
    ];
  }

  isPreview(source: string): boolean {
    for (const regex of this.previewRegex) {
      if (regex.test(source)) return true;
    }

    return false;
  }

  async _internalProcessPost(post: SourceCheckQueueItem, source: string): Promise<SourceData> {
    let headers: { [header: string]: string } | undefined;

    for (const regex of this.headersRegex.keys()) {
      if (regex.test(source)) {
        headers = this.headersRegex.get(regex);
        break;
      }
    }

    const useFlareSolverr = this.useFlareSolverrRegex.some(r => r.test(source));

    return await SourceChecker.processDirectLink(post, source, this.isPreview(source), headers, useFlareSolverr ? getFromFlareSolverr : null);
  }

}