import type { SourceCheckQueueItem, SourceData, ScoredSourceData } from '../../shared';
import { getDOM} from '../../modules';
import { SourceChecker } from '../SourceChecker';

export default class DesuArchiveSourceChecker extends SourceChecker {
  constructor() {
    super('DesuArchive');

    this.supported = [
      /^https?:\/\/(?:www\.)?desuarchive\.org\/.*\/thread\/\d+\/#(\d+)/,
    ];
  }

  async _internalProcessPost(post: SourceCheckQueueItem, source: string): Promise<SourceData> {
    try {
      const id = /^https?:\/\/(?:www\.)?desuarchive\.org\/.*\/thread\/\d+\/?#(\d+)/.exec(source)![1];

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

      const anchor = document.getElementById(id)?.querySelector('.thread_image_link');

      if (!anchor) {
        return { unknown: true };
      }

      const imgSrc = anchor.getAttribute('href');
      const thumbHref = anchor.querySelector('img')?.getAttribute('src');

      const matchData: ScoredSourceData[] = [];

      const urls = [
        {
          url: imgSrc,
          isPreview: false
        },
        {
          url: thumbHref,
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