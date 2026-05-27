import { getDOM, type SourceData } from '../../modules';
import { SourceChecker } from '../SourceChecker';
import { type SourceCheckQueueItem } from '../SourceCheckerManager';

export default class Rule34PahealSourceChecker extends SourceChecker {
  constructor() {
    super('Rule34Paheal');

    this.supported = [
      /^https?:\/\/rule34\.paheal\.net\/post\/view\/\d+/,
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

      const url = document.querySelector('#main_image')?.getAttribute('src');

      return await SourceChecker.processDirectLink(post, url);
    } catch (e) {
      console.error(e);
    }

    return {
      unknown: true,
      error: true,
    };
  }

}