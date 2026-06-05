import type { ScoredSourceData, SourceCheckQueueItem, SourceData } from '../../shared';
import { getDOM } from '../../modules';
import { SourceChecker } from '../SourceChecker';

const PROXY_URL_BASE = 'https://vxinstagram.com/p';

export default class InstagramSourceChecker extends SourceChecker {
  constructor() {
    super('FurAffinity');

    this.supported = [
      /^https?:\/\/.*instagram\.com\/p\/([^/]+).*/
    ];
  }

  async _internalProcessPost(post: SourceCheckQueueItem, source: string): Promise<SourceData> {
    const id = (/^https?:\/\/.*instagram\.com\/p\/([^/]+).*/).exec(source)?.[1];

    if (id) {
      try {
        const res = await fetch(`${PROXY_URL_BASE}/${id}`);
        const html = await res.text();
        const dom = getDOM(html);
        const document = dom.window.document;

        const activityData = await (await fetch(document.querySelector('link[type="application/activity+json"')?.getAttribute('href'))).json();

        const matchData: ScoredSourceData[] = [];

        const urls: string[] = activityData.media_attachments.map(a => a.url);

        for (const url of urls) {
          const data = await SourceChecker.processDirectLink(post, url) as ScoredSourceData;

          if (!data || data.error || data.unknown || data.unsupported) {
            data.score = 0;
            matchData.push(data);
            continue;
          }

          data.score = (Number(data.md5Match!) * 5000) + (1000 / (data.phashDistance! + 1)) + (Number(data.dimensionMatch!) * 200) + Number(data.fileTypeMatch) + (data.isPreview ? 0 : 5);

          matchData.push(data);
        }

        if (matchData.length > 0) {
          matchData.sort((a, b) => b.score! - a.score!);

          return matchData[0];
        }
      } catch (e) {
        console.error(e);
      }
    }

    return {
      unknown: true,
      error: true,
    };
  }

}