import sizeOf from 'buffer-image-size';
import { existsSync, rmSync, writeFileSync } from 'fs';
import { md5 as jsmd5 } from 'js-md5';
import puppeteer, { Browser, Page, TimeoutError } from 'puppeteer';
import calcPhash from 'sharp-phash';
import calcPhashDistance from 'sharp-phash/distance.js';
import { config } from '../config';
import { Database, DetectFileType, getVideoDimensions, wait } from '../modules';
import type { BaseSourceData, DatabasePost, Dimensions, SourceCheckQueueItem, SourceData, SourceDataMap } from '../shared';

class NotImplementedError extends Error {
  message: string;
  name: string;

  constructor() {
    super();

    this.message = 'This method has not been implemented.';
    this.name = 'NotImplementedError';
  }
}

export const SUPPORTED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/webm', 'video/mp4'];

export const MIME_TYPE_TO_FILE_EXTENSION = {
  'image/png': 'png',
  'image/apng': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'video/webm': 'webm',
  'image/webp': 'webp',
  'video/mp4': 'mp4'
};

export type UrlData = {
  url: string
  isPreview: boolean
}

export class SourceChecker {
  static puppetReady = false;
  static browser: Browser;

  enabled: boolean = true;
  ready: boolean = false;
  inUse: boolean = false;

  constructor(public name: string, public slug: string, public supported: RegExp[] = []) {
    SourceChecker.setup(this);
  }

  static async setup(checker: SourceChecker) {
    const savedData = await Database.getSourceCheckerData(checker.slug);

    if (savedData) {
      if (savedData.supported.length > 0) checker.supported = savedData.supported;
      checker.enabled = savedData.enabled;
    }

    await Database.saveSourceCheckerData(checker);

    checker.ready = true;
  }

  static async initializePuppet() {
    this.browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'], executablePath: config.CHROME_EXECUTABLE_LOCATION });
    this.puppetReady = true;
  }

  static async processDirectLink(post: DatabasePost, source: string, isPreview = false, authors: string[] = [], headers: { [header: string]: string } = {}, customFetch: ((source: string, options?: { headers?: { [header: string]: string } }) => Promise<Response | null>) | null = null): Promise<SourceData> {
    if (!source || !post) {
      return {
        unknown: true,
        error: true
      };
    }

    try {
      const res = customFetch ? await customFetch(source, {
        headers
      }) : await fetch(source, {
        headers
      });

      if (!res || !res.ok) {
        return {
          unknown: true,
          error: true
        };
      }

      const mimeType = res.headers.get('Content-Type') ?? '';

      if (!SUPPORTED_MIME_TYPES.includes(mimeType)) {
        return { unsupported: true };
      }

      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const md5 = jsmd5(arrayBuffer);

      const dimensions = await this.getDimensions(blob.type, arrayBuffer, post);

      const realFileType = await this.getRealFileType(arrayBuffer);

      if (!realFileType) {
        return {
          unsupported: true
        };
      }

      const phash = await this.calculatePhash(arrayBuffer);
      const phashDistance = phash.startsWith('9') || post.phash?.startsWith('9') ? -1 : calcPhashDistance(phash, post.phash!);

      return {
        md5Match: md5 == post.md5,
        dimensionMatch: dimensions.width == post.dimensions.width && dimensions.height == post.dimensions.height,
        fileTypeMatch: realFileType == post.fileType,
        fileType: realFileType,
        phash,
        phashDistance,
        url: source,
        dimensions,
        isPreview,
        authors
      };
    } catch (e) {
      console.error(`Error with: ${source} (${post._id})`);
      console.error(e);
    }

    return {
      unknown: true,
      error: true
    };
  }

  static async waitForSelectorOrNull(page: Page, selector: string, ms: number): Promise<any> {
    try {
      return await page.waitForSelector(selector, { timeout: ms });
    } catch (e) {
      if (e instanceof TimeoutError) return null;
      else throw e;
    }
  }

  static async calculatePhash(arrayBuffer) {
    try {
      return await calcPhash(arrayBuffer);
    } catch (e) {
      return '9'.repeat(64);
    }
  }

  static async getDimensions(type: string, arrayBuffer: ArrayBuffer, post: DatabasePost): Promise<Dimensions> {
    try {
      switch (type) {
        case 'video/mp4':
        case 'video/webm': {
          const name = `${post._id}.${type == 'video/mp4' ? 'mp4' : 'webm'}`;
          writeFileSync(name, Buffer.from(arrayBuffer));

          while (!existsSync(name)) await wait(50);
          const dimensions = await getVideoDimensions(name);

          rmSync(name);

          return dimensions;
        }
        default: {
          const dimensions = sizeOf(Buffer.from(arrayBuffer));
          return { width: dimensions.width, height: dimensions.height };
        }
      }
    } catch (e) {
      console.error(e);
    }

    return { width: -1, height: -1 };
  }

  static async getRealFileType(arrayBuffer): Promise<string | null> {
    try {
      return (await DetectFileType.fromBuffer(arrayBuffer))?.ext ?? null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async _internalProcessPost(post: SourceCheckQueueItem, source: string): Promise<SourceData> {
    throw new NotImplementedError();
  }

  async processPost(post: SourceCheckQueueItem, current: BaseSourceData | null): Promise<SourceDataMap> {
    while (this.inUse) await wait(100);
    try {
      const data: SourceDataMap = {};
      for (const source of post.sources) {
        if (current?.sources?.[source]) continue;
        if (this.supportsSource(source)) {
          this.inUse = true;
          const processedData = await this._internalProcessPost(post, source);
          data[source] = processedData;
          if (processedData.error || processedData.unknown) await Database.incrementFailure(this.slug);
          else Database.incrementSuccess(this.slug);
        }
      }

      return data;
    } catch {
      await Database.incrementFailure(this.slug);

      return {};
    } finally {
      this.inUse = false;
    }
  }

  supportsSource(source: string): boolean {
    for (const supported of this.supported!) {
      if (supported.test(source)) return true;
    }

    return false;
  }

  puppetSetup() {
    throw new NotImplementedError();
  }
}