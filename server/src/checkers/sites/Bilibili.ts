import type { SourceCheckQueueItem, SourceData, ScoredSourceData } from '../../shared';
import { getDOM } from '../../modules';
import { SourceChecker } from '../SourceChecker';

export default class BilibiliSourceChecker extends SourceChecker {
  constructor() {
    super('Bilibili');

    this.supported = [
      /^https?:\/\/(www\.)?bilibili\.com\/opus\/\d+/,
      /^https?:\/\/t.bilibili.com\/\d+/
    ];
  }

  async _internalProcessPost(post: SourceCheckQueueItem, source: string): Promise<SourceData> {
    try {
      const res = await fetch(source, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:142.0) Gecko/20100101 Firefox/142.0'
        }
      });

      if (!res.ok) {
        return {
          unknown: true,
          error: true
        };
      }

      const html = await res.text();

      const dom = getDOM(html);
      const document = dom.window.document;

      const elements = document.querySelectorAll('.bili-album .b-img__inner');

      if (!elements || elements.length == 0) {
        return {
          unknown: true,
          error: true
        };
      }

      const matchData: ScoredSourceData[] = [];

      for (const element of elements) {
        const url = `https:${element.getAttribute('src')}`;

        const urls = [
          {
            url: url.slice(0, url.lastIndexOf('@')),
            isPreview: false
          },
          {
            url,
            isPreview: true
          },
          {
            url: `${url.slice(0, url.lastIndexOf('@'))}@1052w_!web-dynamic.jpg`,
            isPreview: true
          }
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