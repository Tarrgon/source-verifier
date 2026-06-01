import type { BaseSourceData, DatabasePost } from './database-types.d';
import type { Rename } from './types.d';
import type { ResultExtras } from './source-checker-types.d';

type BaseSourceDataWithoutId = Omit<BaseSourceData, '_id'>;
type DatabasePostWithoutSources = Omit<DatabasePost, 'sources'>;
type Response = Partial<BaseSourceDataWithoutId & Rename<DatabasePostWithoutSources, '_id', 'id'> & ResultExtras> & { id: number };

export type ServerResponse = CompleteResponse | IncompleteResponse;
export type CompleteResponse = Required<Omit<Response, 'notIndexed' | 'queued' | 'notPending' | 'unsupported'>>;
export type IncompleteResponse = Partial<ResultExtras> & { id: number };