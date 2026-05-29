import type { FluffleResponse } from '../../../shared';
import { config } from '../config';

export async function getFluffleData(blob: Blob): Promise<FluffleResponse> {
  const formData = new FormData();
  formData.append('limit', '32');
  formData.append('file', blob, 'image.png');

  const res = await fetch('https://api.fluffle.xyz/exact-search-by-file', {
    method: 'POST',
    headers: {
      'User-Agent': config.USER_AGENT,
      'Accept': 'application/json'
    },
    body: formData
  });

  return await res.json();
}