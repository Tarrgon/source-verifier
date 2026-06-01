import type { SourceCheckQueueItem, SourceData } from '../../shared';
import { SourceChecker } from '../SourceChecker';

const URL_BASE = 'https://sofurry.com/s';

export default class SoFurryChecker extends SourceChecker {
  constructor() {
    super('SoFurry');

    this.supported = [
      /^https?:\/\/.*sofurry\.com\/s\/(\d+).*/,
    ];
  }

  async _internalProcessPost(post: SourceCheckQueueItem, source: string): Promise<SourceData> {
    try {
      const id = /^https?:\/\/.*sofurry\.com\/s\/(\d+).*/.exec(source)![1];

      if (id) {
        try {
          return await SourceChecker.processDirectLink(post, `${URL_BASE}/${id}/dl`);
        } catch (e) {
          console.error(e);
        }
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