import type { Result } from "../checkers";
import { replaceId, type DatabasePost } from "../modules";
import type { CompleteResponse, IncompleteResponse, ServerResponse } from "./types";

export function getServerResponse(post: Omit<DatabasePost, 'sources'>, result: Result): ServerResponse {
  const idReplacedPost = replaceId(post);

  return {
    ...idReplacedPost,
    ...result
  }
}

export function isCompleteResponse(response: ServerResponse): response is CompleteResponse {
  const incompleteResponse = response as IncompleteResponse;
  const completeResponse = response as CompleteResponse;
  if (incompleteResponse.notPending || incompleteResponse.unsupported || incompleteResponse.queued || incompleteResponse.notIndexed || !completeResponse.sources) return false;

  return true;
}