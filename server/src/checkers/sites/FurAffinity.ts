import type { SourceCheckQueueItem, SourceData } from '../../../../shared';
import { getDOM, getFromFlareSolverr } from '../../modules';
import { SourceChecker } from '../SourceChecker';

const PROXY_URL_BASE = 'https://xfuraffinity.net/view';

export default class FurAffinitySourceChecker extends SourceChecker {
  constructor() {
    super('FurAffinity');

    this.supported = [
      /^https?:\/\/.*furaffinity\.net\/(view|full)\/(\d+).*/
    ];
  }

  async _internalProcessPost(post: SourceCheckQueueItem, source: string): Promise<SourceData> {
    const id = (/^https?:\/\/.*furaffinity\.net\/(?:view|full)\/(\d+).*/).exec(source)?.[1];

    if (id) {
      try {
        const res = await fetch(`${PROXY_URL_BASE}/${id}?full`, { redirect: 'manual' });
        const html = await res.text();
        const dom = getDOM(html);
        const document = dom.window.document;

        const href = document.querySelector("meta[property='og:image']")?.getAttribute('content');

        if (href) {
          return await SourceChecker.processDirectLink(post, href, false, {}, getFromFlareSolverr);
        } else {
          return { unknown: true };
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