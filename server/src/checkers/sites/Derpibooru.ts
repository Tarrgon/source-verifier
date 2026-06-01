import type { SourceCheckQueueItem, SourceData } from '../../shared';
import { getDOM } from '../../modules';
import { SourceChecker } from '../SourceChecker';

export default class DerpibooruSourceChecker extends SourceChecker {
  constructor() {
    super('Derpibooru');

    this.supported = [
      /^https?:\/\/(?:www\.)?derpibooru\.org\/images\/(\d+).*/,
      /^https?:\/\/(?:www\.)?derpibooru\.org\/(\d+).*/
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

      const href = document.querySelector("a[title='View (no tags in filename)']")?.getAttribute('href');

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