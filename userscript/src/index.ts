import type { ServerResponse, CompleteResponse, IncompleteResponse } from '../../shared';

function isCompleteResponse(response: ServerResponse): response is CompleteResponse {
  const incompleteResponse = response as IncompleteResponse;
  const completeResponse = response as CompleteResponse;
  if (incompleteResponse.notPending || incompleteResponse.unsupported || incompleteResponse.queued || incompleteResponse.notIndexed || !completeResponse.sources) return false;

  return true;
}

async function main() {
  const res = await fetch('');
  const data = await res.json() as ServerResponse;

  if (isCompleteResponse(data)) {
    console.log(data.sources);
  } else {
    console.log(data);
  }
}

main();