import type { Result } from "../checkers";
import type { BaseSourceData, DatabasePost, Rename, SourceDataMap } from "../modules";

export type ServerResponse = Partial<Response> & Pick<Response, 'id'>
type Response = Omit<BaseSourceData, '_id'> & Rename<Omit<DatabasePost, 'sources'>, '_id', 'id'> & Result