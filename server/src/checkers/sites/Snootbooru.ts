import type { SourceCheckQueueItem, SourceData, ScoredSourceData } from '../../shared';
import { SourceChecker } from '../SourceChecker';

const API_URL_BASE = 'https://snootbooru.com/api/post/';
const URL_BASE = 'https://snootbooru.com/';

export default class SnootbooruSourceChecker extends SourceChecker {
  constructor() {
    super('Snootbooru');

    this.supported = [
      /^https?:\/\/(?:www\.)?snootbooru\.com\/post\/(\d+).*/,
    ];
  }

  async _internalProcessPost(post: SourceCheckQueueItem, source: string): Promise<SourceData> {
    try {
      const id = /^https?:\/\/(?:www\.)?snootbooru\.com\/post\/(\d+).*/.exec(source)![1];

      if (id) {
        const res = await fetch(`${API_URL_BASE}${id}`, {
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!res.ok) {
          return {
            unknown: true,
            error: true
          };
        }

        const snootPost = await res.json() as any;

        const matchData: ScoredSourceData[] = [];

        const urls = [
          {
            url: `${URL_BASE}${snootPost.contentUrl}`,
            isPreview: false
          },
          {
            url: `${URL_BASE}${snootPost.thumbnailUrl}`,
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