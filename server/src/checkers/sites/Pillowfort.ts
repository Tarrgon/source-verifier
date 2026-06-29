import type { SourceCheckQueueItem, SourceData, ScoredSourceData } from '../../shared';
import { getDOM } from '../../modules';
import { SourceChecker } from '../SourceChecker';

export default class PillowfortSourceChecker extends SourceChecker {
  constructor() {
    super('Pillowfort');

    this.supported = [
      /^https?:\/\/(?:www\.)?pillowfort\.social\/posts\/\d+.*/,
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

      const authorName = document.querySelector('.username > a')?.textContent;
      const sourceUrls = Array.from(document.querySelectorAll("meta[property='og:image']")).map((e: any) => e.getAttribute('content'));

      const matchData: ScoredSourceData[] = [];

      for (const sourceUrl of sourceUrls) {
        let originalUrl = sourceUrl;
        let thumbnailUrl = sourceUrl;

        if (originalUrl.includes('_small')) {
          originalUrl = originalUrl.replace('_small', '');
        } else {
          thumbnailUrl = originalUrl.slice(0, originalUrl.lastIndexOf('.')) + '_small' + originalUrl.slice(originalUrl.lastIndexOf('.'));
        }

        const urls = [
          {
            url: originalUrl,
            isPreview: false
          },
          {
            url: thumbnailUrl,
            isPreview: true
          }
        ];

        for (const urlData of urls) {
          const data = await SourceChecker.processDirectLink(post, urlData.url, urlData.isPreview, authorName) as ScoredSourceData;

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