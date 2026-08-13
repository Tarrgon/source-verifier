import type { SourceCheckQueueItem, SourceData } from '../../shared';
import { SourceChecker } from '../SourceChecker';

export default class TumblrDirectSourceChecker extends SourceChecker {
  constructor() {
    super('TumblrDirect', 'tumblrdirect', [
      /^https?:\/\/.*\.media\.tumblr\.com\/.*\.(png|jpg|jpeg|gif|webm|pnj).*/,
    ]);
  }

  async _internalProcessPost(post: SourceCheckQueueItem, source: string): Promise<SourceData> {
    try {
      const urls = [
        source
      ];

      if (source.includes('.pnj')) {
        urls.push(
          source.replace('.pnj', '.png'),
          source.replace('.pnj', '.jpg'),
          source.replace('.pnj', '.png').replace(/\/s\d+x\d+\//, '/s999999x999999/'),
          source.replace('.pnj', '.jpg').replace(/\/s\d+x\d+\//, '/s999999x999999/')
        );
      } else if (source.includes('.jpg')) {
        urls.push(
          source.replace('.jpg', '.png'),
          source.replace('.jpg', '.png').replace(/\/s\d+x\d+\//, '/s999999x999999/')
        );
      } else if (source.includes('.png')) {
        urls.push(source.replace(/\/s\d+x\d+\//, '/s999999x999999/'));
      }

      const matchData: SourceData[] = [];

      for (const url of urls) {
        const data = await SourceChecker.processDirectLink(post, url) as SourceData;
        if (data.unknown || data.error || data.unsupported) continue;
        matchData.push(data);
      }

      let largestDimensions = 0;
      let largestDimensionsIndex = -1;

      let bestFileType = '';
      let bestFileTypeIndex = -1;

      for (let i = 0; i < matchData.length; i++) {
        const data = matchData[i];
        if (data.unsupported) continue;

        if (data.dimensions!.height * data.dimensions!.width > largestDimensions) {
          largestDimensions = data.dimensions!.height * data.dimensions!.width;
          largestDimensionsIndex = i;
        }

        if (bestFileType == '' || bestFileType == 'pnj') {
          bestFileType = data.fileType!;
          bestFileTypeIndex = i;
        } if (data.fileType == 'png' && bestFileType == 'jpg') {
          bestFileType = data.fileType;
          bestFileTypeIndex = i;
        } else if (data.fileType == 'webm' && bestFileType == 'gif') {
          bestFileType = data.fileType;
          bestFileTypeIndex = i;
        }
      }

      const anyMd5Match = matchData.some(d => d.md5Match);

      if (bestFileTypeIndex == largestDimensionsIndex) {
        const data = matchData[bestFileTypeIndex];
        data.isPreview = data.url != source;
        data.originalUrl = data.url;
        data.md5Match = anyMd5Match;

        return data;
      } else if (bestFileType == 'png') {
        const data = matchData[bestFileTypeIndex];
        data.isPreview = data.url != source;
        data.originalUrl = data.url;
        data.md5Match = anyMd5Match;

        return data;
      } else {
        const data = matchData[largestDimensionsIndex];
        data.isPreview = data.url != source;
        data.originalUrl = data.url;
        data.md5Match = anyMd5Match;

        return data;
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