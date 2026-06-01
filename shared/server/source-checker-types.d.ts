import type { DatabasePost, BaseSourceData } from "./database-types.d";
import type { Rename } from "./types.d";

type CallbackFunction = (data: Result) => void;

export type SourceCheckQueueItem = DatabasePost & { date: Date, callbacks: CallbackFunction[] | null, priority: number };

export type Result = Rename<BaseSourceData, '_id', 'id'> & Partial<ResultExtras>;

export type ResultExtras = {
  notPending: boolean
  unsupported: boolean
  queued: boolean
  notIndexed: boolean
}
