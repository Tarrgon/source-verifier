import type { Result } from "../checkers";
import { replaceId, type DatabasePost } from "../modules";
import type { ServerResponse } from "./types";

export function getServerResponse(post: Omit<DatabasePost, 'sources'>, result: Result): ServerResponse {
  const idReplacedPost = replaceId(post);

  return {
    ...idReplacedPost,
    ...result
  }
}

export function isComplete(response: ServerResponse): response is Required<Omit<ServerResponse, 'notIndexed' | 'queued' | 'notPending' | 'unsupported'>> {
  if (response.notIndexed || response.queued || response.notPending || response.unsupported || !response.sources) return false;

  return true;
}