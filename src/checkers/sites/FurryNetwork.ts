import { type ScoredSourceData, type SourceData } from '../../modules';
import { SourceChecker } from '../SourceChecker';
import { type SourceCheckQueueItem } from '../SourceCheckerManager';

const API_URL_BASE = 'https://furrynetwork.com/api';

export default class FurryNetworkSourceChecker extends SourceChecker {
  constructor() {
    super('FurryNetwork');

    this.supported = [
      /^https?:\/\/(?:www\.)?furrynetwork\.com\/artwork\/(\d+).*/,
    ];
  }

  async _internalProcessPost(post: SourceCheckQueueItem, source: string): Promise<SourceData> {
    try {
      const id = /^https?:\/\/(?:www\.)?furrynetwork\.com\/artwork\/(\d+).*/.exec(source)![1];

      const res = await fetch(`${API_URL_BASE}/artwork/${id}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      const postData = await res.json() as any;

      const matchData: ScoredSourceData[] = [];

      const urls = [
        {
          url: postData.images.original,
          isPreview: false
        },
        {
          url: postData.images.thumbnail,
          isPreview: true
        },
        {
          url: postData.images.thumbnailSmall,
          isPreview: true
        },
      ];

      for (const urlData of urls) {
        const data = await SourceChecker.processDirectLink(post, urlData.url, urlData.isPreview) as ScoredSourceData;

        if (urlData.isPreview) {
          data.originalUrl = urls[0].url;
        }

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

    return {
      unknown: true,
      error: true,
    };
  }

}