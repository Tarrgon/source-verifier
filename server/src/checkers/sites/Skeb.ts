import parseSrcset from 'parse-srcset';
import { wait } from '../../modules';
import { SourceChecker } from '../SourceChecker';
import type { SourceCheckQueueItem, SourceData, ScoredSourceData } from '../../shared';
import type { ElementHandle, Page } from 'puppeteer';

export default class SkebSourceChecker extends SourceChecker {
  constructor() {
    super('Skeb');

    this.supported = [
      /^https?:\/\/(?:www\.)?skeb\.jp\/@.*\/works\/(\d+).*/,
    ];
  }

  async _internalProcessPost(post: SourceCheckQueueItem, source: string): Promise<SourceData> {
    while (!SourceChecker.puppetReady) await wait(500);

    let page!: Page;
    try {
      page = await SourceChecker.browser!.newPage();
      await page.goto(source);

      await page.waitForNetworkIdle();

      const main = await SourceChecker.waitForSelectorOrNull(page, '.image-column', 5000) as ElementHandle<HTMLDivElement>;

      if (!main) {
        return {
          unknown: true,
          error: true
        };
      }

      const allImages = (await main.$$('img'));
      const urls: string[] = [];

      for (const img of allImages) {
        urls.push(await img.evaluate(e => e.getAttribute('src')!));
      }

      const matchData: ScoredSourceData[] = [];

      for (const url of urls) {
        const data = await SourceChecker.processDirectLink(post, url) as ScoredSourceData;

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