import type { SourceCheckQueueItem, SourceData, ScoredSourceData } from '../../shared';
import { config } from '../../config';
import { wait } from '../../modules';
import { MIME_TYPE_TO_FILE_EXTENSION, SourceChecker } from '../SourceChecker';

type InkBunnyLoginResponse = {
  sid: string;
}

type InkBunnyFile = {
  file_id: number
  mimetype: string
  file_url_full: string
  file_url_screen: string
  file_url_preview: string
  thumbnail_url_huge: string
  thumbnail_url_huge_noncustom: string
  thumbnail_url_large: string
  thumbnail_url_large_noncustom: string
  thumbnail_url_medium: string
  thumbnail_url_medium_noncustom: string
}

type InkBunnySubmission = {
  submission_id: string
  username: string
  files: InkBunnyFile[]
}

type InkBunnySubmissionsDetails = {
  submissions: InkBunnySubmission[]
}

export default class InkBunnySourceChecker extends SourceChecker {
  private inkbunnyReady = false;
  private disabled = false;

  private sid: string | undefined;

  constructor() {
    super('Inkbunny', 'inkbunny', [
      /^https?:\/\/(?:www\.)?inkbunny\.net\/s\/(\d+).*/,
      /^https?:\/\/(?:www\.)?inkbunny\.net\/submissionview\.php\?.*id=(\d+).*/,
    ]);

    console.log('[InkbunnySourceChecker] Calling setup...');
  }

  async setup() {
    try {
      console.log('[InkbunnySourceChecker] Logging in to InkBunny...');
      const res = await fetch(`https://inkbunny.net/api_login.php?username=${encodeURIComponent(config.INKBUNNY_USERNAME!)}&password=${encodeURIComponent(config.INKBUNNY_PASSWORD!)}`);
      const data = await res.json() as InkBunnyLoginResponse;

      this.sid = data.sid;
      console.log('[InkbunnySourceChecker] Successfully logged in...');

      this.disabled = false;
    } catch (e) {
      this.disabled = true;
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
      console.error('[InkbunnySourceChecker] Disabled...');
      return {
        unknown: true,
        error: true
      };
    }

    while (!this.inkbunnyReady) await wait(500);

    try {
      const id = this.getIdFromSource(source);
      if (!id) {
        console.error('[InkbunnySourceChecker] ID not parsed...');
        return {
          unknown: true,
          error: true
        };
      }

      const res = await fetch(`https://inkbunny.net/api_submissions.php?sid=${this.sid}&submission_ids=${id}&show_description=no&show_description_bbcode_parsed=no&show_pools=no&show_writing=no&show_writing_bbcode_parsed=no&sort_keywords_by=alphabetical`);
      const data = await res.json() as InkBunnySubmissionsDetails;
      const submission = data.submissions[0];
      if (!submission) {
        console.error('[InkbunnySourceChecker] No submission...');
        console.log(data);
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
        console.log(matchData);
        matchData.sort((a, b) => b.score! - a.score!);

        return matchData[0];
      } else {
        console.error('[InkbunnySourceChecker] No match data...');
        console.log(data);
      }
    } catch (e) {
      console.error(e);
    }

    console.error('[InkbunnySourceChecker] Fell out...');

    return {
      unknown: true,
      error: true,
    };
  }

}