import type { Page } from 'puppeteer';
import type { ScoredSourceData, SourceCheckQueueItem, SourceData } from '../../shared';
import { getDOM, wait } from '../../modules';
import { SourceChecker } from '../SourceChecker';

export default class TrelloSourceChecker extends SourceChecker {
  constructor() {
    super('Trello');

    // Doesn't work, they have some kinda protection.
    this.supported = [
      // /^https?:\/\/trello\.com\/c\/.*/,
    ];
  }

  async _internalProcessPost(post: SourceCheckQueueItem, source: string): Promise<SourceData> {
    while (!SourceChecker.puppetReady) await wait(500);

    let page: Page | undefined;
    try {
      page = await SourceChecker.browser!.newPage();
      await page.goto(source);

      await page.waitForFunction('window.performance.timing.loadEventEnd - window.performance.timing.navigationStart >= 500');

      const html = await page.content();

      const dom = getDOM(html);
      const document = dom.window.document;

      const urlData = Array.from<HTMLLIElement>(document.querySelectorAll('li[data-testid="card-back-action"]'))
        .filter(e => e.innerText.includes('attached'))
        .map<HTMLAnchorElement | null>(e => e.querySelector('a[href*="download"]'))
        .map(e => ({ preview: e?.querySelector('img')?.src, original: e?.href }));

      const urls: { url: string, isPreview: boolean, original?: string }[] = [];
      for (const url of urlData) {
        if (url.original) {
          urls.push({ url: url.original, isPreview: false });
        }

        if (url.preview) {
          urls.push({ url: url.preview, isPreview: true, original: url.original });
        }
      }

      const matchData: ScoredSourceData[] = [];


      for (const urlData of urls) {
        const data = await SourceChecker.processDirectLink(post, urlData.url, urlData.isPreview) as ScoredSourceData;

        if (urlData.isPreview) {
          data.originalUrl = urlData.original;
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
    } finally {
      await page?.close();
    }

    return {
      unknown: true,
      error: true
    };
  }

}