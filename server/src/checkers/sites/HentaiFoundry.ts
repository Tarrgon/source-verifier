import type { Page } from 'puppeteer';
import type { SourceCheckQueueItem, SourceData } from '../../shared';
import { wait } from '../../modules';
import { SourceChecker } from '../SourceChecker';

export default class HentaiFoundrySourceChecker extends SourceChecker {
  constructor() {
    super('HentaiFoundry', 'hentaifoundry', [
      // /^https?:\/\/(www\.)?hentai-foundry\.com\/pictures\/user\/.*/,
    ]);
  }

  async _internalProcessPost(post: SourceCheckQueueItem, source: string): Promise<SourceData> {
    while (!SourceChecker.puppetReady) await wait(500);

    let page!: Page;
    try {
      const sourceUrl = new URL(source);
      sourceUrl.searchParams.append('enterAgree', '1');
      // sourceUrl.searchParams.append("size", "0")
      page = await SourceChecker.browser!.newPage();
      await page.goto(sourceUrl.toString());

      const img = await SourceChecker.waitForSelectorOrNull(page, '#picBox img', 8000);

      if (!img) {
        return {
          unknown: true,
          error: true
        };
      }

      let src = await img.evaluate(e => e.getAttribute('src'));

      if (src.includes('//thumbs.hentai-foundry.com')) {
        await img.click();
        await wait(500);
        src = await img.evaluate(e => e.getAttribute('src'));
      }

      if (!src.startsWith('https:')) src = `https:${src}`;

      return await SourceChecker.processDirectLink(post, src);
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