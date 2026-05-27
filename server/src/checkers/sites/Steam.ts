import type { SourceCheckQueueItem, SourceData } from '../../../../shared';
import { getDOM } from '../../modules';
import { SourceChecker } from '../SourceChecker';

export default class SteamSourceChecker extends SourceChecker {
  constructor() {
    super('Steam');

    this.supported = [
      /^https?:\/\/(?:www\.)?steamcommunity\.com\/sharedfiles\/filedetails\/?\?id=\d+/,
    ];
  }

  async _internalProcessPost(post: SourceCheckQueueItem, source: string): Promise<SourceData> {
    try {
      const res = await fetch(source);

      if (!res.ok) {
        return {
          unknown: true,
          error: true
        };
      }

      const html = await res.text();
      const dom = getDOM(html);
      const document = dom.window.document;

      const url = document.querySelector('#ActualMedia').parentElement?.getAttribute('href');

      const index = url.lastIndexOf('?');

      return await SourceChecker.processDirectLink(post, index != -1 ? url.slice(0, index) : url);
    } catch (e) {
      console.error(e);
    }

    return {
      unknown: true,
      error: true,
    };
  }

}