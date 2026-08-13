import { getDOM } from '../../modules';
import type { ScoredSourceData, SourceCheckQueueItem, SourceData } from '../../shared';
import { SourceChecker } from '../SourceChecker';

export default class GelbooruSourceChecker extends SourceChecker {
  constructor() {
    super('Gelbooru', 'gelbooru', [
      /^https?:\/\/(?:www\.)?gelbooru\.com\/index\.php\?.*/,
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

      const authors = Array.from(document.querySelectorAll('.tag-type-artist > a')).map((e: any) => e.textContent);

      const matchData: ScoredSourceData[] = [];

      const sampleSrc = document.querySelector('#image')?.getAttribute('src');

      if (!sampleSrc) {
        const video = document.querySelector('#gelcomVideoPlayer');
        if (!video) return { unknown: true };

        const sources = video.querySelectorAll('source').map(s => s.getAttribute('src'));

        for (const src of sources) {
          const data = await SourceChecker.processDirectLink(post, src, false, authors, { Accept: '*/*', Referer: 'https://gelbooru.com' }) as ScoredSourceData;
          data.score = (Number(data.md5Match) * 5000) + (Number(data.dimensionMatch) * 200) + Number(data.fileTypeMatch);

          matchData.push(data);
        }
      } else {
        const fullSrc = document.querySelector('a[href*="/images/"][target="_blank"]')?.getAttribute('href');
        const urls = [{ url: sampleSrc, isPreview: true }, { url: fullSrc, isPreview: false }];

        for (const urlData of urls) {
          const data = await SourceChecker.processDirectLink(post, urlData.url, urlData.isPreview, authors, { Accept: '*/*', Referer: 'https://gelbooru.com' }) as ScoredSourceData;

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