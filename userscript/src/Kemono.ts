type KemonoFile = {
  name: string
  path: string
}

type KemonoPost = {
  file_id: number
  id: string
  user: string
  service: string
  title: string
  substring: string
  published: string
  file: KemonoFile
  attachments: KemonoFile[]
}

type KemonoResponse = {
  id: number
  hash: string
  mtime: string
  ctime: string
  mime: string
  ext: string
  added: string
  size: number
  flags: string
  ihash: any
  posts: KemonoPost[]
  discord_posts: any[]
}

async function getImageSHA256(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      method: 'GET',
      responseType: 'arraybuffer',
      url,
      onload: async function (response) {
        try {
          const hashBuffer = await window.crypto.subtle.digest('SHA-256', response.response);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          resolve(hashArray.map(b => b.toString(16).padStart(2, '0')).join(''));
        } catch (e) {
          reject(e);
        }
      },
      onerror: function (e) {
        reject(e);
      }
    });
  });
}

async function getKemonoData(hash: string): Promise<KemonoResponse> {
  return new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      method: 'GET',
      url: `https://kemono.cr/api/v1/search_hash/${hash}`,
      headers: {
        Accept: 'text/css'
      },
      onload: async function (response) {
        try {
          resolve(JSON.parse(response.responseText));
        } catch (e) {
          reject(e);
        }
      },
      onerror: function (e) {
        reject(e);
      }
    });
  });
}

export async function getKemonoDataFromUrl(url: string) {
  return await getKemonoData(await getImageSHA256(url));
}