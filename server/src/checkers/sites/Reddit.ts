import { VirtualConsole } from 'jsdom';
import parseSrcset from 'parse-srcset';
import { config } from '../../config';
import { getDOM, type ScoredSourceData, type SourceData } from '../../modules';
import { SourceChecker } from '../SourceChecker';
import { type SourceCheckQueueItem } from '../SourceCheckerManager';

const con = new VirtualConsole();
con.on('error', () => { });

export default class RedditSourceChecker extends SourceChecker {
  constructor() {
    super('Reddit');

    this.supported = [
      /^https?:\/\/(www\.)?reddit\.com\/r\/.*/,
    ];
  }

  async _internalProcessPost(post: SourceCheckQueueItem, source: string): Promise<SourceData> {
    try {
      const res = await fetch(source, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
          'cookie': config.REDDIT_COOKIE!
        }
      });
      const html = await res.text();
      const dom = getDOM(html, con);
      const document = dom.window.document;

      const imgs: any[] = Array.from(document.querySelectorAll("img[role='presentation'][alt='']")).concat(Array.from(document.querySelectorAll("img[src*='i.redd.it']")));

      const urls: Set<string> = new Set();

      for (const img of imgs) {
        const set = img.getAttribute('srcset') ?? img.getAttribute('data-lazy-srcset');
        const srcset = set ? parseSrcset(set).map(s => s.url) : null;
        const src = img.getAttribute('src') ?? img.getAttribute('data-lazy-src');
        if (src) {
          urls.add(src);
          const url = new URL(src);
          url.host = 'i.redd.it';
          urls.add(url.toString());
        }

        if (srcset) {
          for (const src of srcset) {
            urls.add(src);
            const url = new URL(src);
            url.host = 'i.redd.it';
            urls.add(url.toString());
          }
        }
      }

      const matchData: ScoredSourceData[] = [];
      for (const url of urls) {
        const u = new URL(url);
        u.host = 'i.redd.it';
        const originalUrl = u.toString();

        const isPreview = !url.includes('i.redd.it');

        const data = await SourceChecker.processDirectLink(post, url, isPreview) as ScoredSourceData;

        if (!data || data.error || data.unknown || data.unsupported) {
          data.score = 0;
          matchData.push(data);
          continue;
        }

        if (isPreview) data.originalUrl = originalUrl;

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