import type { SourceCheckQueueItem, SourceData } from '../../../../shared';
import { getDOM } from '../../modules';
import { SourceChecker } from '../SourceChecker';

export default class PiczelSourceChecker extends SourceChecker {
  constructor() {
    super('Piczel');

    this.supported = [
      /^https?:\/\/piczel\.tv\/gallery\/image\/(\d+).*/
    ];
  }

  async _internalProcessPost(post: SourceCheckQueueItem, source: string): Promise<SourceData> {
    try {
      const res = await fetch(source);
      const html = await res.text();
      const dom = getDOM(html);
      const document = dom.window.document;

      const href = document.querySelector("meta[property='og:image']")?.getAttribute('content');

      if (href) {
        return await SourceChecker.processDirectLink(post, href);
      } else {
        return { unknown: true };
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