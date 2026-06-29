import type { SourceCheckQueueItem, SourceData } from '../../shared';
import { ARTIST_SEPARATOR, getDOM } from '../../modules';
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
        const authors = Array.from(document.querySelectorAll('.block.tagsauce [data-tag-name^="artist:"]')).map((e: any) => e.getAttribute('data-tag-name').slice(7)).join(ARTIST_SEPARATOR);
        return await SourceChecker.processDirectLink(post, href, false, authors);
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