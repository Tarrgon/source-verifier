import { JSDOM, VirtualConsole } from 'jsdom';
import { type DatabasePost } from './database';
import { type E621Post } from './e621';
import type { Rename } from './types.d';

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
  else new JSDOM(html, {
    virtualConsole
  });
}