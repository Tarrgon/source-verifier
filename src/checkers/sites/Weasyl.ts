import { config } from '../../config';
import { type ScoredSourceData, type SourceData } from '../../modules';
import { SourceChecker } from '../SourceChecker';
import { type SourceCheckQueueItem } from '../SourceCheckerManager';

const API_URL_BASE = 'https://www.weasyl.com/api';

export default class WeasylSourceChecker extends SourceChecker {
  constructor() {
    super('Weasyl');

    this.supported = [
      /^https?:\/\/(?:www\.)?weasyl\.com\/.*\/submissions\/(\d+).*/,
      /^https?:\/\/(?:www\.)?weasyl\.com\/submission\/(\d+).*/
    ];
  }

  async _internalProcessPost(post: SourceCheckQueueItem, source: string): Promise<SourceData> {
    try {
      const id = ((/^https?:\/\/(?:www\.)?weasyl\.com\/.*\/submissions\/(\d+).*/).exec(source) || (/^https?:\/\/(?:www\.)?weasyl\.com\/submission\/(\d+).*/).exec(source))?.[1];

      if (id) {
        try {
          const res = await fetch(`${API_URL_BASE}/submissions/${id}/view`, {
            headers: {
              'Accept': 'application/json',
              'X-Weasyl-API-Key': config.WEASYL_API_KEY
            }
          });

          if (!res.ok) {
            return {
              unknown: true,
              error: true
            };
          }

          const postData = await res.json() as any;

          const matchData: ScoredSourceData[] = [];

          const urls = [
            {
              url: postData.media.submission?.[0]?.url,
              isPreview: false
            },
            {
              url: postData.media.thumbnail[0].url,
              isPreview: true
            }
          ];

          for (const urlData of urls) {
            if (!urlData.url) continue;

            const data = await SourceChecker.processDirectLink(post, urlData.url, urlData.isPreview) as ScoredSourceData;

            if (urlData.isPreview && urls[0].url) {
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