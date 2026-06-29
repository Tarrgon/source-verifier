import type { ScoredSourceData, SourceCheckQueueItem, SourceData } from '../../shared';
import { getDOM } from '../../modules';
import { SourceChecker } from '../SourceChecker';

type VGenGalleryItem = {
  type: 'IMAGE' | 'ANIMATED_IMAGE'
  url: string
}

type VGenProps = {
  props: {
    pageProps: {
      linkedShowcase?: {
        showcaseItems: VGenGalleryItem[]
      }
      services?: {
        galleryItems: VGenGalleryItem[]
      }
      product?: {
        galleryItems: VGenGalleryItem[]
      }
      user: {
        username: string
      }
    }
  }
}

export default class VGenSourceChecker extends SourceChecker {
  constructor() {
    super('VGen');

    // https://vgen.co/xanderavell/portfolio/showcase/birdpathy-s-spicy-furry-illustration/e755fbd7-127a-4fb6-99bc-5513632dd2fd
    this.supported = [
      /^https?:\/\/(?:www\.)?vgen\.co\/.+\/portfolio\/showcase\/.*/,
    ];
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

      const vgenProps = JSON.parse(document.getElementById('__NEXT_DATA__').textContent) as VGenProps;

      const matchData: ScoredSourceData[] = [];

      const images = vgenProps.props.pageProps.linkedShowcase?.showcaseItems
        ?? vgenProps.props.pageProps.services?.galleryItems
        ?? vgenProps.props.pageProps.product?.galleryItems;

      if (!images) {
        return {
          unknown: true
        };
      }

      for (const item of images) {
        if (item.type == 'IMAGE' || item.type == 'ANIMATED_IMAGE') {
          const data = await SourceChecker.processDirectLink(post, item.url, false, vgenProps.props.pageProps.user.username) as ScoredSourceData;

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