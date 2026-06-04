import type { ScoredSourceData, SourceCheckQueueItem, SourceData } from '../../shared';
import { getDOM } from '../../modules';
import { SourceChecker } from '../SourceChecker';

type TumblrContent = {
  type: 'text'
}

type TumblrMediaContent = {
  type: 'image',
  media: TumblrMedia[]
}

type TumblrMedia = {
  mediaKey: string
  type: string
  width: number
  height: number
  url: string
  cropped?: boolean
  hasOriginalDimensions?: boolean
}

type TumblrObject = {
  content: (TumblrMediaContent | TumblrContent)[]
}

export default class TumblrSourceChecker extends SourceChecker {
  constructor() {
    super('Tumblr');

    this.supported = [
      /^https?:\/\/(?:www\.)?tumblr\.com\/.+\/\d+/,
      /^https?:\/\/(.*)\.tumblr\.com\/post\/(\d+).*/,
    ];
  }

  async _internalProcessPost(post: SourceCheckQueueItem, source: string): Promise<SourceData> {
    try {
      const requireRewrite = /^https?:\/\/(.*)\.tumblr\.com\/post\/(\d+).*/.exec(source);

      if (requireRewrite) source = `https://www.tumblr.com/${requireRewrite[1]}/${requireRewrite[2]}`;

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

      const data = JSON.parse(document.getElementById('___INITIAL_STATE___').textContent).PeeprRoute.initialTimeline.objects as TumblrObject[];

      const matchData: ScoredSourceData[] = [];

      for (const object of data) {
        for (const content of object.content) {
          if (content.type == 'image') {
            const urls: { url: string, isPreview: boolean }[] = [];

            let isOriginal = true;
            for (const media of content.media) {
              urls.push({
                url: media.url,
                isPreview: !(media.hasOriginalDimensions || isOriginal)
              });

              isOriginal = false;
            }

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