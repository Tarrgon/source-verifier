import type { SourceCheckQueueItem, SourceData, ScoredSourceData } from '../../shared';
import { config } from '../../config';
import { Helper as InkbunnyHelper } from '../../ib-helper/dist/index.js';
import { wait } from '../../modules';
import { MIME_TYPE_TO_FILE_EXTENSION, SourceChecker } from '../SourceChecker';

export default class InkbunnySourceChecker extends SourceChecker {
  private inkbunnyReady = false;
  private disabled = false;
  private inkbunnyHelper: InkbunnyHelper;

  constructor() {
    super('Inkbunny', 'inkbunny', [
      /^https?:\/\/(?:www\.)?inkbunny\.net\/s\/(\d+).*/,
      /^https?:\/\/(?:www\.)?inkbunny\.net\/submissionview\.php\?.*id=(\d+).*/,
    ]);

    this.inkbunnyHelper = new InkbunnyHelper();
    this.setup();
  }

  async setup() {
    try {
      await this.inkbunnyHelper.login(config.INKBUNNY_USERNAME, config.INKBUNNY_PASSWORD);
      this.inkbunnyReady = true;
    } catch (e) {
      console.error('[InkbunnySourceChecker] Got error while logging into inkbunny. Disabling. Retrying in 5 minutes.');
      console.error(e);
      this.disabled = true;

      setTimeout(() => {
        this.setup();
      }, 1000 * 60 * 5);
    }
  }

  getIdFromSource(source) {
    for (const supported of this.supported!) {
      const r = supported.exec(source);
      supported.lastIndex = 0;
      if (r) return r[1];
    }

    return null;
  }

  async _internalProcessPost(post: SourceCheckQueueItem, source: string): Promise<SourceData> {
    if (this.disabled) {
      return {
        unknown: true,
        error: true
      };
    }

    while (!this.inkbunnyReady) await wait(500);

    try {
      const id = this.getIdFromSource(source);
      if (!id) {
        return {
          unknown: true,
          error: true
        };
      }

      const data = await this.inkbunnyHelper.details(id, false, false, false);
      const submission = data.submissions[0];
      if (!submission) {
        return {
          unknown: true,
          error: true,
          md5Match: false,
          dimensionMatch: false,
          fileTypeMatch: false
        };
      }

      const matchData: ScoredSourceData[] = [];

      for (const file of submission.files) {
        const fileType = MIME_TYPE_TO_FILE_EXTENSION[file.mimetype];
        if (!fileType) {
          continue;
        }

        const urls = [
          { url: file.file_url_full, isPreview: false },
          { url: file.file_url_preview, isPreview: true },
          { url: file.file_url_screen, isPreview: true },
          { url: file.thumbnail_url_huge, isPreview: true },
          { url: file.thumbnail_url_huge_noncustom, isPreview: true },
          { url: file.thumbnail_url_large, isPreview: true },
          { url: file.thumbnail_url_large_noncustom, isPreview: true },
          { url: file.thumbnail_url_medium, isPreview: true },
          { url: file.thumbnail_url_medium_noncustom, isPreview: true }
        ];

        for (const urlData of urls) {
          if (!urlData.url) continue;

          const data = await SourceChecker.processDirectLink(post, urlData.url, urlData.isPreview, [submission.username]) as ScoredSourceData;

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