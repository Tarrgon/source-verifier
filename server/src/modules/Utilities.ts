import { execFile } from 'child_process';
import { JSDOM, VirtualConsole } from 'jsdom';
import type { DatabasePost, Dimensions, Rename } from '../shared';
import { type E621Post } from './e621';

export function wait(ms): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

export function transformE621Post(post: E621Post): DatabasePost {
  return {
    _id: post.id,
    sources: post.sources,
    isPending: post.flags.pending,
    isDeleted: post.flags.deleted,
    md5: post.files.meta.md5,
    dimensions: {
      width: post.files.original.width,
      height: post.files.original.height
    },
    fileType: post.files.meta.ext,
    fileSize: post.files.meta.size,
    updatedAt: new Date(post.updated_at),
  };
}

export function replaceId<T extends { _id: any }>(data: T): Rename<T, '_id', 'id'> {
  const newData = ({ _id, ...remainder }: T): Rename<T, '_id', 'id'> => ({ id: _id, ...remainder });

  return newData(data);
}

export function getDOM(html: string, virtualConsole?: VirtualConsole): JSDOM {
  if (!virtualConsole) return new JSDOM(html);
  else return new JSDOM(html, {
    virtualConsole
  });
}

// ffprobe -v quiet -print_format json -show_streams -select_streams v:0 <filename>
export function getVideoDimensions(filePath: string): Promise<Dimensions> {
  return new Promise((resolve) => {
    execFile('ffprobe', ['-v', 'quiet', '-print_format', 'json', '-show_streams', '-select_streams', 'v:0', filePath], (error, stdout, stderr) => {
      if (error) {
        console.error(`Error getting video dimensions:\n${error.message}`);
        return resolve({ width: -1, height: -1 });
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

export async function getBlueskyDid(handle: string): Promise<string | null> {
  try {
    const res = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${handle}`);
    const data = await res.json();
    return data.did;
  } catch (e) {
    console.error(e);
  }

  return null;
}