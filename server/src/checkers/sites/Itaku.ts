import type { SourceCheckQueueItem, SourceData, ScoredSourceData } from '../../shared';
import { SourceChecker } from '../SourceChecker';

export default class ItakuSourceChecker extends SourceChecker {
  constructor() {
    super('Itaku');

    this.supported = [
      /^https?:\/\/(?:www\.)?itaku\.ee\/images\/(\d+).*/,
    ];
  }

  async _internalProcessPost(post: SourceCheckQueueItem, source: string): Promise<SourceData> {
    try {
      const id = /^https?:\/\/(?:www\.)?itaku\.ee\/images\/(\d+).*/.exec(source)![1];

      const res = await fetch(`https://itaku.ee/api/galleries/images/?ids=${id}&format=json`);

      if (!res.ok) {
        return {
          unknown: true,
          error: true
        };
      }

      const matchData: ScoredSourceData[] = [];

      const data = await res.json();
      const result = data.results[0];

      if (!result) {
        return {
          unknown: true,
          error: true
        };
      }

      const urls = [
        {
          url: result.image,
          isPreview: false
        },
        {
          url: result.image_lg,
          isPreview: true
        },
        {
          url: result.image_xl,
          isPreview: true
        },
        {
          url: result.image_sm,
          isPreview: true
        }
      ];

      for (const urlData of urls) {
        const data = await SourceChecker.processDirectLink(post, urlData.url, urlData.isPreview, [result.owner_displayname]) as ScoredSourceData;

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