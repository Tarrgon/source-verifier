import { normalizeURL, type FluffleResponse, type FluffleResult } from './shared';
import { anyLinksSupported, checkFluffleLinks } from './Backend';
import { FluffleFaces, FluffleMessages, UserAgent } from './Constants';
import { spinner } from './icons';
import { createSidebarList, createSourceItem, getBlueskyDid, getImageBlob, normalizeSourceLinks, processData } from './Utilities';

export function getFluffleData(blob: Blob): Promise<FluffleResponse> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('limit', '32');
    formData.append('file', blob, 'image.png');

    GM.xmlHttpRequest({
      method: 'POST',
      url: 'https://api.fluffle.xyz/exact-search-by-file',
      headers: {
        'User-Agent': UserAgent,
        'Accept': 'application/json'
      },
      onload: function (response) {
        try {
          if (response.status >= 200 && response.status < 300) resolve(JSON.parse(response.responseText));
          else reject(JSON.parse(response.responseText));
        } catch (e) {
          reject(e);
        }
      },
      onerror: function (e) {
        reject(e);
      },
      data: formData,
      fetch: true
    });
  });
}

export async function checkFluffle(id: number) {
  const cachedData = await getFluffleCache(id);

  let fluffleData: FluffleResponse | undefined;

  if (!cachedData) {
    const container = document.getElementById('image-container');
    if (!container) return;

    const fileType = container.getAttribute('data-file-ext');

    if (fileType == 'webm' || fileType == 'mp4') return;

    createTemporaryList();

    const fileUrl = container.getAttribute('data-file-url');
    const imageBlob = await getImageBlob(fileUrl);

    if (!imageBlob) {
      console.error('[SourceVerifier] Failed to get image blob from file url');
      return;
    }

    fluffleData = await getFluffleData(imageBlob);
  }

  const fluffleResults = cachedData ?? fluffleData!.results.filter(r => r.match == 'exact' && r.platform != 'e621');

  if (!cachedData && fluffleResults.length > 0) await setFluffleCache(id, fluffleResults);

  const links = await addResults(fluffleResults);

  if (await anyLinksSupported(links)) {
    const linkElement = document.querySelector('#fluffle-results .source-links');
    if (!linkElement) {
      console.error('[SourceVerifier] Fluffle source links list not found');
      return;
    }
    const spinny = spinner.cloneNode(true) as HTMLElement;
    linkElement.insertBefore(spinny, linkElement.firstElementChild);

    const data = await checkFluffleLinks(id, links);

    spinny.remove();

    await processData(data, links, false, '#fluffle-results .source-links');
  }
}

export async function hasCachedFluffleData(id: number): Promise<boolean> {
  return await getFluffleCache(id) != null;
}

async function getFluffleCache(id: number): Promise<FluffleResult[] | null> {
  const fluffleCache = JSON.parse(await GM.getValue('fluffleCache', '[]')) as { id: number, data: FluffleResult[] }[];

  return fluffleCache.find(c => c.id == id)?.data ?? null;
}

async function setFluffleCache(id: number, data: FluffleResult[]) {
  const fluffleCache = JSON.parse(await GM.getValue('fluffleCache', '[]'));
  fluffleCache.unshift({ id: id, data });

  if (fluffleCache.length >= 10) fluffleCache.pop();

  await GM.setValue('fluffleCache', JSON.stringify(fluffleCache));
}

async function addResults(results: FluffleResult[]): Promise<string[]> {
  const urls: string[] = [];
  const realSourceLinks = (await Promise.all(Array.from(document.querySelectorAll<HTMLElement | HTMLAnchorElement>('.source-link > a[href]')).map(normalizeSourceLinks))).filter(a => a);

  const existingList = document.getElementById('unused-results') ?? document.querySelector('.post-sidebar-info');

  document.getElementById('fluffle-results')?.remove();

  const list = createSidebarList('fluffle-results', 'Fluffle:');

  const listItem = list.firstElementChild!;

  if (results.length == 0) {
    listItem.appendChild(document.createElement('br'));
    listItem.append(getRandomEmptyResultMessage());
  } else {
    for (const result of results) {
      const url = await normalizeURL(result.url, getBlueskyDid);
      if (!realSourceLinks.includes(url)) {
        listItem.append(await createSourceItem(result, results.length == 1));
        urls.push(url);
      }
    }
  }

  if (listItem.childElementCount > 0 && existingList != null) {
    existingList.after(list);
  }

  return urls;
}

function createTemporaryList() {
  const existingList = document.getElementById('unused-results') ?? document.querySelector('.post-sidebar-info');

  const list = document.createElement('ul');
  list.id = 'fluffle-results';
  list.setAttribute('data-loaded', 'false');
  list.classList.add('post-sidebar-info');

  const listItem = document.createElement('li');
  listItem.classList.add('source-links');
  listItem.append('Fluffle:');

  listItem.appendChild(document.createElement('br'));

  const loading = document.createElement('div');
  loading.innerText = 'Loading';
  loading.classList.add('loading');
  listItem.appendChild(loading);

  list.appendChild(listItem);

  if (existingList) existingList.after(list);
}

function getRandomEmptyResultMessage() {
  return `${FluffleMessages[Math.floor(Math.random() * FluffleMessages.length)]} ${FluffleFaces[Math.floor(Math.random() * FluffleFaces.length)]}`;
}