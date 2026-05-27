import { Collection, Db, MongoClient, UnorderedBulkOperation } from 'mongodb';
import { config } from '../../config';
import type { BaseSourceData, DatabasePost, MainSchema, SourceDataMap, SourceCheckQueueItem } from '../../../../shared';

export class Database {
  private static _database: Db;

  static async start() {
    const mongoClient = new MongoClient(config.MONGO_DB_URL!);
    await mongoClient.connect();
    const database = mongoClient.db(config.MONGO_DB_NAME!);
    // await database.dropDatabase();
    this._database = database;
  }

  static get sourceData(): Collection<BaseSourceData> {
    return this._database.collection<BaseSourceData>('sourceData');
  }

  static get posts(): Collection<DatabasePost> {
    return this._database.collection<DatabasePost>('posts');
  }

  static get main(): Collection<MainSchema> {
    return this._database.collection<MainSchema>('main');
  }

  static get sourceCheckerQueue(): Collection<SourceCheckQueueItem> {
    return this._database.collection<SourceCheckQueueItem>('sourceCheckerQueue');
  }

  static get tokens(): Collection<any> {
    return this._database.collection<any>('tokens');
  }

  static async getSource(id: number): Promise<BaseSourceData | null> {
    return await this.sourceData.findOne({ _id: id });
  }

  static async getManySources(ids: number[]): Promise<BaseSourceData[]> {
    return await this.sourceData.find({ _id: { $in: ids } }).toArray();
  }

  static async deleteSource(id: number) {
    await this.sourceData.deleteOne({ _id: id });
  }

  static async getPost(id: number): Promise<DatabasePost | null> {
    return await this.posts.findOne({ _id: id });
  }

  static async getManyPosts(ids: number[]): Promise<DatabasePost[]> {
    return await this.posts.find({ _id: { $in: ids } }).toArray();
  }

  static async getLatestId(): Promise<number> {
    return (await this.main.findOne({}))?.latestId ?? -1;
  }

  static async setLatestId(id: number) {
    await this.main.updateOne({}, { $set: { latestId: id } }, { upsert: true });
  }

  static async updateSourceData(id: number, sources: SourceDataMap) {
    await this.sourceData.updateOne({ _id: id }, { $set: { date: new Date(), sources } }, { upsert: true });
  }

  static async getQueue(): Promise<SourceCheckQueueItem[]> {
    return await this.sourceCheckerQueue.find({}).sort({ date: 1 }).toArray();
  }

  static async addToQueue(queueItem: SourceCheckQueueItem) {
    await this.sourceCheckerQueue.insertOne(queueItem);
  }

  static async addManyToQueue(items: SourceCheckQueueItem[]) {
    await this.sourceCheckerQueue.insertMany(items);
  }

  static async removeFromQueue(id: number) {
    await this.sourceCheckerQueue.deleteOne({ _id: id });
  }

  static startQueueBulk(): UnorderedBulkOperation {
    return this.sourceCheckerQueue.initializeUnorderedBulkOp();
  }

  static startSourceBulk(): UnorderedBulkOperation {
    return this.sourceData.initializeUnorderedBulkOp();
  }

  static async updatePost(id: number, update: Partial<DatabasePost>) {
    await this.posts.updateOne({ _id: id }, { $set: update });
  }

  static async replacePost(post: DatabasePost) {
    await this.posts.replaceOne({ _id: post._id }, post, { upsert: true });
  }

  static async bulkReplacePosts(posts: DatabasePost[]): Promise<DatabasePost[]> {
    const postsToQueue: DatabasePost[] = [];
    const existingPosts = await this.getManyPosts(posts.map(p => p._id));

    for (const post of posts) {
      const existingPost = existingPosts.find(p => p._id == post._id);

      if (existingPost) {
        if (existingPost.md5 != post.md5) {
          delete post.phash;
          postsToQueue.push(post);
        } else if (post.sources.some(s => !existingPost.sources.includes(s)) && !post.isDeleted && post.isPending) {
          postsToQueue.push(post);
        }
      } else if (!post.isDeleted && post.isPending && post.sources.length > 0) {
        postsToQueue.push(post);
      }
    }

    const bulkOperation = this.posts.initializeUnorderedBulkOp();

    for (const post of posts) {
      bulkOperation.find({ _id: post._id }).upsert().replaceOne(post);
    }

    await bulkOperation.execute();

    return postsToQueue;
  }

  static async setTokens<T extends Partial<any>>(site: 'pixiv', tokens: T) {
    await this.tokens.updateOne({ _id: site }, { $set: tokens }, { upsert: true });
  }

  static async getTokens<T>(site: 'pixiv'): Promise<T> {
    return await this.tokens.findOne({ _id: site });
  }
}