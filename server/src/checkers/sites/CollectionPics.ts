import type { SourceCheckQueueItem, SourceData } from '../../shared';
import { getDOM } from '../../modules';
import { SourceChecker } from '../SourceChecker';

export default class CollectionPicsSourceChecker extends SourceChecker {
  constructor() {
    super('CollectionPics', 'collectionpics', [
      /^https?:\/\/co\.llection\.pics\/post\/view\/(\d+).*/,
    ]);
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

      const url = document.getElementById('main_image')?.getAttribute('src');

      if (!url) {
        return {
          unknown: true,
          error: true,
          md5Match: false,
          dimensionMatch: false,
          fileTypeMatch: false
        };
      }

      return await SourceChecker.processDirectLink(post, url.startsWith('/') ? `https://co.llection.pics${url}` : url);
    } catch (e) {
      console.error(e);
    }

    return {
      unknown: true,
      error: true,
    };
  }

}