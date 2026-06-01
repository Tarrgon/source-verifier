import type { CompleteResponse, IncompleteResponse, ServerResponse } from './response-types.d';

export function isCompleteResponse(response: ServerResponse): response is CompleteResponse {
  const incompleteResponse = response as IncompleteResponse;
  const completeResponse = response as CompleteResponse;
  if (incompleteResponse.notPending || incompleteResponse.unsupported || incompleteResponse.queued || incompleteResponse.notIndexed || !completeResponse.sources) return false;

  return true;
}

export async function normalizeURL(url: URL | string, getBlueskyDid: (handle: string) => Promise<string>): Promise<string> {
  if (url == '') return '';
  if (!(url instanceof URL)) url = new URL(url.startsWith('-') ? url.slice(1) : url);

  if (url.hostname == 'twitter.com') url.hostname = 'x.com';
  else if (url.hostname.endsWith('weasyl.com')) {
    if (!url.pathname.match(/\d+$/)) {
      const id = /\/submissions?\/(\d+)/.exec(url.pathname)![1];
      url = new URL(`https://www.weasyl.com/submission/${id}`);
    }
  }

  let regexData: RegExpExecArray | null = null;
  if ((regexData = /https:\/\/bsky\.app\/profile\/(.*)\/post/.exec(url.toString())) != null) {
    if (!regexData[1].startsWith('did:plc:')) {
      const did = await getBlueskyDid(regexData[1]);

      if (did) {
        const u = url.toString().replace(regexData[1], did);
        url = new URL(u);
      }
    }
  }

  const u = url.toString();
  return u.endsWith('/') ? u.slice(0, -1) : u;
}