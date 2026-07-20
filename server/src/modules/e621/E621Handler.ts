import SourceCheckerManager from '../../checkers/SourceCheckerManager';
import { Database } from '../database';
import Queue, { Priority } from '../Queue';
import { transformE621Post } from '../Utilities';
import type { E621Post } from './types.d';
import type { DatabasePost } from '../../shared';
import { config } from '../../config';

const BASE_URL = 'https://e621.net';

type E621RequestQueueItem = {
  _id: number
  priority: number
  date: Date
  url: string
  options: RequestInit
  onResolve: (data: any) => void
  onReject: (error: any) => void
}

const PAGE_LIMIT = 320;
const E621_AUTH = `Basic ${btoa(`${config.E621_USERNAME}:${config.E621_API_KEY}`)}`;

export class E621Handler {
  private static queue = new Queue<E621RequestQueueItem>();
  private static queueRunning = false;

  static async queueRoutine() {
    if (!this.queue.hasMoreItems()) {
      this.queueRunning = false;
      return;
    }

    this.queueRunning = true;

    const item = this.queue.pop();

    let res: Response | undefined;

    const url = new URL(`${BASE_URL}/${item.url}`);
    try {
      if (!item.options.headers) item.options.headers = {};

      item.options.headers['User-Agent'] = config.USER_AGENT;
      item.options.headers['Authorization'] = E621_AUTH;

      res = await fetch(url.toString(), item.options);
      if (res.ok) {
        item.onResolve(await res.json());
      } else {
        item.onReject({ code: res.status, url: BASE_URL + `/${item.url}`, text: await res.text() });
      }

    } catch (e) {
      console.error(`[E621Handler] Fetch failed while requesting ${url.toString()}`);
      console.error(e);
      item.onReject({ code: 500, url: 'Fetch failed' });
    }

    if (res && (res.status == 501 || res.status == 429 || res.status == 520)) {
      console.error(`[E621Handler] Response code is ${res.status}. Waiting extra time.`);
      setTimeout(() => {
        this.queueRoutine();
      }, 120000);
    } else {
      setTimeout(() => {
        this.queueRoutine();
      }, 600 + (Math.random() * 1000));
    }
  }

  static addUrlToQueue(url, options: RequestInit | undefined = undefined, queueSkip = false) {
    return new Promise((resolve, reject) => {
      const queueItem: E621RequestQueueItem = {
        _id: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
        url,
        priority: queueSkip ? Priority.HIGH : Priority.LOW,
        date: new Date(),
        options: options ?? { method: 'GET' },
        onResolve: resolve,
        onReject: reject
      };

      this.queue.addItem(queueItem);

      if (!this.queueRunning) {
        this.queueRoutine();
      }
    });
  }

  static async updateRoutine() {
    try {
      await this.addNewPosts();
      await this.applyUpdates();
    } catch (e) {
      console.error(e);
    }

    setTimeout(() => {
      this.updateRoutine();
    }, 1000 * 30);
  }

  static async addNewPosts() {
    try {
      const latestPostId = await Database.getLatestId();
      console.log(`[E621Handler] Adding new posts after: ${latestPostId}`);

      const data: E621Post[] = await this.addUrlToQueue(`posts.json?v2=true&tags=status:any&limit=${PAGE_LIMIT}${latestPostId == -1 ? '' : `&page=a${latestPostId}`}`) as E621Post[];

      if (data.length > 0) await Database.setLatestId(data[0].id);

      const posts: DatabasePost[] = data.map(p => transformE621Post(p));


      if (posts.length > 0) {
        const postsToQueue = await Database.bulkReplacePosts(posts);

        await SourceCheckerManager.queuePosts(postsToQueue);
      }

      if (data.length >= PAGE_LIMIT) {
        await this.addNewPosts();
      }
    } catch (e) {
      console.error(e);
    }
  }

  static async applyUpdates(page = 1) {
    try {
      console.log(`[E621Handler] Applying post updates page: ${page}`);
      let anyUpdated = page < 5;

      const data: E621Post[] = await this.addUrlToQueue(`posts.json?v2=true&tags=order:updated_desc%20status:any&limit=${PAGE_LIMIT}&page=${page}`) as E621Post[];
      const posts: DatabasePost[] = data.map(p => transformE621Post(p));
      const existingPosts: DatabasePost[] = await Database.getManyPosts(posts.map(p => p._id));

      for (const post of posts) {
        const existingPost = existingPosts.find(p => p._id == post._id);
        if (existingPost && existingPost.updatedAt.getTime() != post.updatedAt.getTime()) {
          anyUpdated = true;
          break;
        }
      }

      if (posts.length > 0) {
        const postsToQueue = await Database.bulkReplacePosts(posts);

        await SourceCheckerManager.queuePosts(postsToQueue);
      }

      if (anyUpdated && page < 750) {
        await this.applyUpdates(page + 1);
      }

    } catch (e) {
      console.error(e);
    }
  }

  static async updatePost(id: number, queueSkip = false): Promise<DatabasePost | null> {
    try {
      const post: E621Post = await this.addUrlToQueue(`posts/${id}.json?v2=true`, undefined, queueSkip) as E621Post;

      if (post && post.id) {
        const databasePost = transformE621Post(post);
        await Database.replacePost(databasePost);

        return databasePost;
      }

      return null;
    } catch (e) {
      console.error(e);
    }

    return null;
  }
}