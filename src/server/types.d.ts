import type { Result, ResultExtras } from "../checkers";
import type { BaseSourceData, DatabasePost, Rename, SourceDataMap } from "../modules";

type Response = Partial<Omit<BaseSourceData, '_id'> & Rename<Omit<DatabasePost, 'sources'>, '_id', 'id'> & Result> & { id: number }

export type ServerResponse = CompleteResponse | IncompleteResponse;
export type CompleteResponse = Required<Omit<Response, 'notIndexed' | 'queued' | 'notPending' | 'unsupported'>>;
export type IncompleteResponse = Partial<ResultExtras> & { id: number };