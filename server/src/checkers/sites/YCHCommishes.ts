import type { SourceCheckQueueItem, SourceData, ScoredSourceData } from '../../shared';
import { getDOM } from '../../modules';
import { SourceChecker } from '../SourceChecker';

export default class YCHCommishesSourceChecker extends SourceChecker {
  constructor() {
    super('YCHCommishes');

    this.supported = [
      /^https?:\/\/ych\.commishes\.com\/auction\/show.*/,
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

      const element = document.querySelector("img[src*='resize']");
      const previewSrc = element?.getAttribute('src');
      const fullSrc = element?.parentElement?.getAttribute('href');

      const authorName = document.querySelector('.font-semibold[href^="/user/"]')?.textContent;

      if (element) {
        const urls = [
          {
            url: fullSrc,
            isPreview: false
          },
          {
            url: previewSrc,
            isPreview: true
          }
        ];

        const matchData: ScoredSourceData[] = [];

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