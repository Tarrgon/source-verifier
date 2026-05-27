import type { DatabasePost, Result, ServerResponse } from '../../../shared';
import { replaceId } from '../modules';

export function getServerResponse(post: Omit<DatabasePost, 'sources'>, result: Result): ServerResponse {
  const idReplacedPost = replaceId(post);

  return {
    ...idReplacedPost,
    ...result
  };
}