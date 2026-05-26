// ffprobe -v quiet -print_format json -show_streams -select_streams v:0 <filename>
import { execFile } from 'child_process';
import { Dimensions } from './database/types';

export function getVideoDimensions(filePath): Promise<Dimensions> {
  return new Promise((resolve) => {
    execFile('ffprobe', ['-v quiet', '-print_format json', '-show_streams', '-select_streams v:0', filePath], (error, stdout, stderr) => {
      if (error) {
        console.error(`Error getting video dimensions:\n${error.message}`);
        resolve({ width: -1, height: -1 });
      }

      try {
        const data = JSON.parse(stdout);
        resolve({ width: data.streams?.[0]?.width ?? -1, height: data.streams?.[0]?.height ?? -1 });
      } catch (e) {
        console.error('Error getting video dimensions: not JSON format');
        console.error(stdout);
        resolve({ width: -1, height: -1 });
      }
    });
  });
}