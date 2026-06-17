import { isCompleteResponse, normalizeURL, type ServerResponse, type SourceData } from './shared';
import { anyLinksSupported, getData, sendSources } from './Backend';
import { addSourceSign, aspectRatioMatch, bvas, dimensionAndFileTypeMatch, dimensionMatch, fileTypeMatch, force, kemonoIcon, md5Match, noMatches, phashMatch, reload, spinner, unknown } from './icons';
import { getKemonoDataFromUrl } from './Kemono';
import { BACKEND_URL_BASE } from './Constants';

export function getCSRFToken(): string {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

export function wait(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

export function waitForSelector<T extends Element>(selector, timeout = 5000): Promise<T | null> {
  return new Promise(async (resolve) => {
    let waited = 0;
    while (true) {
      const ele = document.querySelector<T>(selector);
      if (ele) return resolve(ele);
      await wait(100);
      waited += 100;
      if (waited >= timeout) return resolve(null);
    }
  });
}

export function getImageBlob(fileUrl: string | null): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    try {
      if (fileUrl == null) return null;

      const container = document.getElementById('image-container')!;
      const image = new Image();

      const width = Number(container.getAttribute('data-width'));
      const height = Number(container.getAttribute('data-height'));
      const ratio = width < height ? 256 / width : 256 / height;
      const calculatedWidth = Math.floor(width * ratio);
      const calculatedHeight = Math.floor(height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = calculatedWidth;
      canvas.height = calculatedHeight;

      image.onload = () => {
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, 0, 0, calculatedWidth, calculatedHeight);
        setTimeout(() => { canvas.toBlob(resolve, 'image/png'); });
      };

      image.crossOrigin = '';
      image.src = fileUrl;
    } catch (e) {
      reject(e);
    }
  });
}

export async function getFaviconBlob(hostname: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      method: 'GET',
      url: `${BACKEND_URL_BASE}/favicons/${hostname}.png`,
      responseType: 'blob',
      onload: function (response) {
        try {
          resolve(response.response);
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

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

function gcd(a: number, b: number): number {
  return (b == 0) ? a : gcd(b, a % b);
}

export function calculateAspectRatio(width: number, height: number): string {
  const ratio = gcd(width, height);
  const widthRatio = width / ratio;
  const heightRatio = height / ratio;
  return `${(widthRatio / heightRatio).toFixed(2)}:1`;
}

export function roundTo(x, n) {
  const power = 10 ** n;
  return Math.floor(x * power) / power;
}

export async function getBlueskyDid(handle: string): Promise<string | null> {
  try {
    const data: { did: string } = await new Promise((resolve, reject) => {
      GM.xmlHttpRequest({
        method: 'GET',
        url: `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${handle}`,
        onload: function (response) {
          try {
            const data = JSON.parse(response.responseText);

            resolve(data);
          } catch (e) {
            reject(e);
          }
        },
        onerror: function (e) {
          reject(e);
        }
      });
    });

    return data.did;
  } catch (e) {
    console.error(e);
  }

  return null;
}

export async function getReplacementUrl(id: number | string, sourceData: SourceData, source: string, reason: string) {
  const normalizedSource = await normalizeURL(source, getBlueskyDid);

  if (!normalizedSource) throw new Error('Error normalizing source. Cannot normalize replacement URL.');

  return `https://e621.net/post_replacements/new?post_id=${id}&url=${encodeURIComponent(sourceData.originalUrl ? sourceData.originalUrl : sourceData.url!)}&reason=${encodeURIComponent(reason)}&source=${encodeURIComponent(normalizedSource)}`;
}

async function checkForUnusedSources(data: ServerResponse, links: string[]) {
  const unusedSources: string[] = [];

  if (isCompleteResponse(data)) {
    for (const source of Object.keys(data.sources)) {
      const normalizedUrl = await normalizeURL(source, getBlueskyDid);
      if (!normalizedUrl) continue;

      const hasMatchingSourceEntry = links.find(e => decodeURI(e) == normalizedUrl || e == normalizedUrl);

      if (!hasMatchingSourceEntry) unusedSources.push(normalizedUrl);
    }
  }

  if (unusedSources.length > 0) {
    const existingList = document.querySelector('.post-sidebar-info');

    document.getElementById('unused-results')?.remove();

    const list = createSidebarList('unused-results', 'Potential Sources:');

    const listItem = list.firstElementChild!;

    for (const url of unusedSources) {
      listItem.append(await createSourceItem({ url }, unusedSources.length == 1));
    }

    if (listItem.childElementCount > 0 && existingList != null) {
      existingList.after(list);
    }

    await processData(data, links, false, '#unused-results .source-links');
  }
}

export async function processData(data: ServerResponse, links: string[], refreshable = true, containerSelector = '.source-links') {
  const _isCompleteResponse = isCompleteResponse(data);
  if (!_isCompleteResponse && data.unsupported) return false;

  const id = parseInt(document.querySelector('#image-container[data-id]')?.getAttribute('data-id') ?? '-1');

  if (id == -1) return false;

  const container = document.querySelector(containerSelector);

  if (!container) return false;

  if (container.firstChild?.nodeName == '#text') {
    const span = document.createElement('span');
    span.style.display = 'inline-flex';
    span.innerText = container.firstChild.textContent!;
    container.firstChild.remove();
    container.insertBefore(span, container.firstElementChild);
  }

  if (!_isCompleteResponse && data.notPending && refreshable) {
    const linkHrefs = Array.from(container.querySelectorAll('a')).map(a => a.href);

    let supported = _isCompleteResponse || (!_isCompleteResponse && !data.unsupported);

    if (!supported && linkHrefs.length > 0) {
      if (await anyLinksSupported(linkHrefs)) supported = true;
    }

    if (supported) {
      const forceClone = force.cloneNode(true) as HTMLElement;
      forceClone.addEventListener('click', async () => {
        for (const ele of container.querySelectorAll('.jsv-icon')) {
          ele.remove();
        }
        forceClone.remove();

        const spinny = spinner.cloneNode(true) as HTMLElement;
        container.firstElementChild?.appendChild(spinny);
        const data = await getData(id, true, true);
        spinny.remove();
        processData(data, links);
      });
      container.firstElementChild?.appendChild(forceClone);
    }

    return supported;
  }

  if (!_isCompleteResponse && (data.queued || data.notIndexed) && refreshable) {
    container.firstElementChild?.appendChild(spinner.cloneNode(true));

    getData(id, true, true).then(async (data) => {
      for (const ele of container.querySelectorAll('.jsv-icon')) {
        ele.remove();
      }

      await processData(data, links, false);
    });

    return true;
  } else if (!_isCompleteResponse && data.unsupported && refreshable) {
    const linkHrefs = Array.from(container.querySelectorAll('a')).map(a => a.href);

    if (linkHrefs.length > 0) {
      if (await anyLinksSupported(linkHrefs)) {
        const forceClone = force.cloneNode(true) as HTMLElement;
        forceClone.addEventListener('click', async () => {
          for (const ele of container.querySelectorAll('.jsv-icon')) {
            ele.remove();
          }
          forceClone.remove();

          const spinny = spinner.cloneNode(true) as HTMLElement;
          container.firstElementChild?.appendChild(spinny);
          const data = await getData(id, true, true);
          spinny.remove();
          processData(data, links);
        });
        container.firstElementChild?.appendChild(forceClone);
      }
    }

    const noMatchesClone = noMatches.cloneNode(true) as HTMLElement;
    noMatchesClone.title = 'Unsupported';
    container.firstElementChild?.appendChild(noMatchesClone);
    return true;
  }

  if (refreshable) {
    const reloadClone = reload.cloneNode(true) as HTMLElement;
    reloadClone.addEventListener('click', async () => {
      for (const ele of container.querySelectorAll('.jsv-icon')) {
        ele.remove();
      }
      reloadClone.remove();

      const spinny = spinner.cloneNode(true) as HTMLElement;
      container.firstElementChild?.appendChild(spinny);
      try {
        const data = await getData(id, true, true);
        spinny.remove();
        processData(data, links);
      } catch (e) {
        spinny.remove();
        console.error(e);
        Danbooru.error('Error reloading post. Check console.');
      }
    });
    container.firstElementChild?.appendChild(reloadClone);
  }

  const allSourceLinks: { normalizedUrl: string, element: HTMLAnchorElement }[] = (await Promise.all(Array.from(container.querySelectorAll<HTMLAnchorElement>('.source-link > a[href]')).map(async (a) => {
    return {
      normalizedUrl: await normalizeURL(a.href, getBlueskyDid) as string,
      element: a
    };
  }))).filter(e => e.normalizedUrl != null);

  const width = parseInt(document.querySelector<HTMLSpanElement>("span[itemprop='width']")?.innerText ?? '-1');
  const height = parseInt(document.querySelector<HTMLSpanElement>("span[itemprop='height']")?.innerText ?? '-1');
  const fileType = document.querySelector<HTMLElement>('#image-container[data-file-ext]')?.getAttribute('data-file-ext') ?? 'unk';

  const aspectRatio = calculateAspectRatio(width, height);

  let anyMatches = false;

  if (_isCompleteResponse) {
    for (const [source, sourceData] of Object.entries(data.sources)) {
      const matchingSourceEntry = allSourceLinks.find(e => decodeURI(e.element.href) == source || e.normalizedUrl == source)?.element;

      if (matchingSourceEntry) {
        anyMatches = true;

        let matchingAspectRatio = false;

        const sourceAspectRatio = sourceData.dimensions ? calculateAspectRatio(sourceData.dimensions.width, sourceData.dimensions.height) : '-1:-1';
        matchingAspectRatio = aspectRatio == sourceAspectRatio;

        if (!sourceData.md5Match && sourceData.phashDistance !== undefined && sourceData.phashDistance != -1) {
          const phashClone = phashMatch.cloneNode(true) as HTMLElement;

          if (sourceData.phashDistance == 0) {
            matchingSourceEntry.prepend(phashClone);
          } else if (sourceData.phashDistance < 7) {
            phashClone.style.color = 'yellow';
            // phashClone.style.outlineColor = colors["yellow"][colorIndex]
            phashClone.title = 'Perceptually similar';
            matchingSourceEntry.prepend(phashClone);
          } else {
            phashClone.style.color = 'red';
            // phashClone.style.outlineColor = colors["red"][colorIndex]
            phashClone.title = 'Perceptually dissimilar';
            matchingSourceEntry.prepend(phashClone);
          }

          if (sourceData.phashDistance > 0) {
            const pd = 100 - (sourceData.phashDistance / 64 * 100);
            phashClone.title += ` Similarity: ${Math.floor(pd)}%`;
          }

          if (!sourceData.fileTypeMatch && !sourceData.dimensionMatch && !matchingAspectRatio) {
            phashClone.title += ` (${sourceData.dimensions!.width}x${sourceData.dimensions!.height} | ${roundTo(sourceData.dimensions!.width / width, 2)}:${roundTo(sourceData.dimensions!.height / height, 2)}) & different file type (${sourceData.fileType!.toUpperCase()})`;
          }
        }

        if (sourceData.md5Match) {
          matchingSourceEntry.prepend(md5Match.cloneNode(true));
        } else if (sourceData.dimensionMatch && sourceData.fileTypeMatch) {
          matchingSourceEntry.prepend(dimensionAndFileTypeMatch.cloneNode(true));
        } else if (sourceData.dimensionMatch) {
          const clone = dimensionMatch.cloneNode(true) as HTMLElement;
          clone.title += ` (${sourceData.fileType!.toUpperCase()})`;
          matchingSourceEntry.prepend(clone);
        } else if (matchingAspectRatio) {
          if (sourceData.fileTypeMatch) {
            const clone = aspectRatioMatch.cloneNode(true) as HTMLElement;
            clone.title += ` (${sourceData.dimensions!.width}x${sourceData.dimensions!.height} | ${roundTo(sourceData.dimensions!.width / width, 2)}:${roundTo(sourceData.dimensions!.height / height, 2)}) & file type match`;
            clone.style.color = 'lime';
            matchingSourceEntry.prepend(clone);
          } else {
            const clone = aspectRatioMatch.cloneNode(true) as HTMLElement;
            clone.title += ` (${sourceData.dimensions!.width}x${sourceData.dimensions!.height} | ${roundTo(sourceData.dimensions!.width / width, 2)}:${roundTo(sourceData.dimensions!.height / height, 2)}) & different file type (${sourceData.fileType!.toUpperCase()})`;
            clone.style.color = 'yellow';
            matchingSourceEntry.prepend(clone);
          }
        } else if (sourceData.fileTypeMatch) {
          const clone = fileTypeMatch.cloneNode(true) as HTMLElement;
          clone.title += ` (${sourceData.dimensions!.width}x${sourceData.dimensions!.height} | ${roundTo(sourceData.dimensions!.width / width, 2)}:${roundTo(sourceData.dimensions!.height / height, 2)})`;
          matchingSourceEntry.prepend(clone);
        } else if (sourceData.unknown) {
          matchingSourceEntry.prepend(unknown.cloneNode(true));
        } else if (sourceData.phashDistance != 0) {
          matchingSourceEntry.prepend(noMatches.cloneNode(true));
        }

        if (sourceData.isPreview) {
          const clone = bvas.cloneNode(true) as HTMLElement;
          clone.title = 'Matched version is preview image. Original version available.';
          clone.style.color = 'red';

          const a = document.createElement('a');
          a.classList.add('jsv-replacement-anchor');
          a.target = '_blank';
          a.setAttribute('data-replacement-url', sourceData.originalUrl ? sourceData.originalUrl : sourceData.url!);
          a.appendChild(clone);

          if (sourceData.originalUrl) {
            a.href = await getReplacementUrl(id, sourceData, source, 'Original version');
          }

          matchingSourceEntry.insertBefore(a, matchingSourceEntry.children[2]);
        }

        if (sourceData.dimensions && sourceData.fileType) {
          if (sourceData.dimensions.width > width && sourceData.dimensions.height > height) {
            if (fileType == 'jpg' && sourceData.fileType == 'png') {
              const clone = bvas.cloneNode(true) as HTMLElement;
              clone.title = `Bigger dimensions, PNG ${sourceData.dimensions.width}x${sourceData.dimensions.height}`;

              const a = document.createElement('a');
              a.classList.add('jsv-replacement-anchor');
              a.target = '_blank';
              a.setAttribute('data-replacement-url', sourceData.originalUrl ? sourceData.originalUrl : sourceData.url!);
              a.appendChild(clone);

              if (sourceData.originalUrl)
                a.href = await getReplacementUrl(id, sourceData, source, 'Original version');
              else
                a.href = await getReplacementUrl(id, sourceData, source, 'Bigger dimensions, PNG');

              matchingSourceEntry.insertBefore(a, matchingSourceEntry.children[2]);
            } else if (fileType == 'png' && sourceData.fileType == 'jpg') {
              if (sourceData.dimensions.width >= width * 3 && sourceData.dimensions.height >= height * 3) {
                const clone = bvas.cloneNode(true) as HTMLElement;
                clone.title = `3x size, JPG ${sourceData.dimensions.width}x${sourceData.dimensions.height}`;

                const a = document.createElement('a');
                a.classList.add('jsv-replacement-anchor');
                a.target = '_blank';
                a.setAttribute('data-replacement-url', sourceData.originalUrl ? sourceData.originalUrl : sourceData.url!);
                a.appendChild(clone);

                if (sourceData.originalUrl)
                  a.href = await getReplacementUrl(id, sourceData, source, 'Original version');
                else
                  a.href = await getReplacementUrl(id, sourceData, source, '3x size, JPG');

                matchingSourceEntry.insertBefore(a, matchingSourceEntry.children[2]);
              } else if (sourceData.dimensions.width >= width * 2 && sourceData.dimensions.height >= height * 2) {
                const clone = bvas.cloneNode(true) as HTMLElement;
                clone.style.color = 'yellow';
                clone.title = `2x size, JPG ${sourceData.dimensions.width}x${sourceData.dimensions.height}`;

                const a = document.createElement('a');
                a.classList.add('jsv-replacement-anchor');
                a.target = '_blank';
                a.setAttribute('data-replacement-url', sourceData.originalUrl ? sourceData.originalUrl : sourceData.url!);
                a.appendChild(clone);

                if (sourceData.originalUrl)
                  a.href = await getReplacementUrl(id, sourceData, source, 'Original version');
                else
                  a.href = await getReplacementUrl(id, sourceData, source, '2x size, JPG');

                matchingSourceEntry.insertBefore(a, matchingSourceEntry.children[2]);
              }
            } else if (fileType == sourceData.fileType) {
              const clone = bvas.cloneNode(true) as HTMLElement;
              clone.title = `Bigger (${sourceData.fileType.toUpperCase()}) ${sourceData.dimensions.width}x${sourceData.dimensions.height}`;

              const a = document.createElement('a');
              a.classList.add('jsv-replacement-anchor');
              a.target = '_blank';
              a.setAttribute('data-replacement-url', sourceData.originalUrl ? sourceData.originalUrl : sourceData.url!);
              a.appendChild(clone);

              if (sourceData.originalUrl)
                a.href = await getReplacementUrl(id, sourceData, source, 'Original version');
              else
                a.href = await getReplacementUrl(id, sourceData, source, 'Higher resolution');

              matchingSourceEntry.insertBefore(a, matchingSourceEntry.children[2]);
            }
          } else if (fileType == 'jpg' && sourceData.fileType == 'png') {
            if (width <= sourceData.dimensions.width * 1.5 && height <= sourceData.dimensions.height * 1.5) {
              const clone = bvas.cloneNode(true) as HTMLElement;
              clone.title = `PNG Version ${sourceData.dimensions.width}x${sourceData.dimensions.height}`;

              const a = document.createElement('a');
              a.classList.add('jsv-replacement-anchor');
              a.target = '_blank';
              a.setAttribute('data-replacement-url', sourceData.originalUrl ? sourceData.originalUrl : sourceData.url!);
              a.appendChild(clone);

              if (sourceData.originalUrl)
                a.href = await getReplacementUrl(id, sourceData, source, 'Original version');
              else
                a.href = await getReplacementUrl(id, sourceData, source, 'PNG version');

              matchingSourceEntry.insertBefore(a, matchingSourceEntry.children[2]);
            }
          } else if (fileType == sourceData.fileType) {
            if (sourceData.dimensions.width > width || sourceData.dimensions.height > height) {
              const clone = bvas.cloneNode(true) as HTMLElement;
              clone.title = `Bigger (${sourceData.fileType.toUpperCase()}) ${sourceData.dimensions.width}x${sourceData.dimensions.height}`;

              const a = document.createElement('a');
              a.classList.add('jsv-replacement-anchor');
              a.target = '_blank';
              a.setAttribute('data-replacement-url', sourceData.originalUrl ? sourceData.originalUrl : sourceData.url!);
              a.appendChild(clone);

              if (sourceData.originalUrl)
                a.href = await getReplacementUrl(id, sourceData, source, 'Original version');
              else
                a.href = await getReplacementUrl(id, sourceData, source, 'Higher resolution');

              matchingSourceEntry.insertBefore(a, matchingSourceEntry.children[2]);
            }
          }
        }
      }
    }
  }

  if (containerSelector == '.source-links') await checkForUnusedSources(data, allSourceLinks.map(e => e.normalizedUrl));

  return anyMatches;
}

export const enum MatchType {
  NO_MATCHES = 0,
  MD5_MATCH = 1,
  DIMENSION_AND_FILE_TYPE_MATCH = 2,
  DIMENSION_MATCH = 3,
  FILE_TYPE_MATCH = 4
}

export function getMatchType(data: SourceData): MatchType {
  if (data.md5Match) return MatchType.MD5_MATCH;
  if (data.dimensionMatch && data.fileTypeMatch) return MatchType.DIMENSION_AND_FILE_TYPE_MATCH;
  if (data.dimensionMatch) return MatchType.DIMENSION_MATCH;
  if (data.fileTypeMatch) return MatchType.FILE_TYPE_MATCH;

  return MatchType.NO_MATCHES;
}

export function processDataOnPostsView(data: ServerResponse) {
  const _isCompleteResponse = isCompleteResponse(data);

  let post = document.getElementById(`entry_${data.id}`);
  const isRe6 = !!post;

  if (!isRe6) post = document.querySelector(`article[data-id='${data.id}']`);

  if (!post) return;

  const postInfo = isRe6 ? post.querySelector('post-info') : post.querySelector('.thm-desc-a');

  if (!postInfo) return;

  for (const element of postInfo.querySelectorAll<HTMLElement>('.jsv-container')) {
    element.remove();
  }

  if (!_isCompleteResponse) return;

  let closestPerceptually: SourceData | null = null;

  for (const sourceData of Object.values(data.sources)) {
    const closestIsError = closestPerceptually && (closestPerceptually.unknown || closestPerceptually.error || closestPerceptually.unsupported || closestPerceptually.phashDistance === undefined || closestPerceptually.phashDistance == -1);
    const currentIsError = (sourceData.unknown || sourceData.error || sourceData.unsupported);

    if (closestPerceptually == null || (closestIsError && !currentIsError) || (sourceData.md5Match && !closestPerceptually.md5Match) || (sourceData.phashDistance !== undefined && sourceData.phashDistance >= 0 && sourceData.phashDistance! < closestPerceptually.phashDistance!)) {
      closestPerceptually = sourceData;
      if (sourceData.md5Match) break;
    }
  }

  if (closestPerceptually && !closestPerceptually.unknown && !closestPerceptually.error && !closestPerceptually.unsupported) {
    post.setAttribute('data-jsv-phash-distance', (closestPerceptually.phashDistance ?? -1).toString());
    post.setAttribute('data-jsv-match-type', getMatchType(closestPerceptually).toString());

    if (!isRe6) {
      const link = post.querySelector('.thm-link');

      const ribbon = document.createElement('div');
      ribbon.classList.add('jsv-container', 'ribbon', 'bottom');

      if (closestPerceptually.md5Match) {
        ribbon.classList.add('md5-match', 'right');
        ribbon.title = 'MD5 Match';
      } else {
        if (closestPerceptually.dimensionMatch && closestPerceptually.fileTypeMatch) {
          ribbon.classList.add('right');
        } else {
          ribbon.classList.add('left');
        }

        if (closestPerceptually.dimensionMatch) {
          ribbon.classList.add('dimension-match');
          ribbon.title = 'Dimension match.';
        }

        if (closestPerceptually.fileTypeMatch) {
          ribbon.classList.add('file-type-match');
          ribbon.title += ' File type match.';
          ribbon.title = ribbon.title.trim();
        }

        if (!closestPerceptually.dimensionMatch && !closestPerceptually.fileTypeMatch) {
          ribbon.classList.add('no-matches');
          ribbon.title += 'No matches.';
        }

        if (closestPerceptually.phashDistance !== undefined && closestPerceptually.phashDistance != -1) {
          if (closestPerceptually.phashDistance == 0) {
            ribbon.classList.add('perceptually-identical');
            ribbon.title += ' Perceptually identical.';
          } else if (closestPerceptually.phashDistance < 7) {
            ribbon.classList.add('perceptually-similar');
            ribbon.title += ' Perceptually similar.';
          } else {
            ribbon.classList.add('perceptually-dissimilar');
            ribbon.title += ' Perceptually dissimilar.';
          }

          if (closestPerceptually.phashDistance > 0) {
            const pd = 100 - (closestPerceptually.phashDistance / 64 * 100);
            ribbon.title += ` Similarity: ${Math.floor(pd)}%`;
          }
        }
      }

      if (closestPerceptually.phashDistance === undefined || closestPerceptually.phashDistance == -1) {
        ribbon.classList.add('no-perceputal-hash');
        ribbon.title += ' No perceptual hash.';
      }

      link?.appendChild(ribbon);
    } else {
      const ribbons = post.querySelector('img-ribbons');

      const bottomRibbons = document.createElement('img-ribbons');
      bottomRibbons.classList.add('jsv-container', 'bottom-ribbons');
      const ribbon = document.createElement('ribbon');
      const span = document.createElement('span');
      ribbon.appendChild(span);

      if (closestPerceptually.md5Match) {
        ribbon.classList.add('md5-match', 'right');
        ribbon.title = 'MD5 Match';
      } else {
        if (closestPerceptually.dimensionMatch && closestPerceptually.fileTypeMatch) {
          ribbon.classList.add('right');
        } else {
          ribbon.classList.add('left');
        }

        if (closestPerceptually.dimensionMatch) {
          ribbon.classList.add('dimension-match');
          ribbon.title = 'Dimension match.';
        }

        if (closestPerceptually.fileTypeMatch) {
          ribbon.classList.add('file-type-match');
          ribbon.title += ' File type match.';
          ribbon.title = ribbon.title.trim();
        }

        if (!closestPerceptually.dimensionMatch && !closestPerceptually.fileTypeMatch) {
          ribbon.classList.add('no-matches');
          ribbon.title += 'No matches.';
        }

        if (closestPerceptually.phashDistance !== undefined && closestPerceptually.phashDistance != -1) {
          if (closestPerceptually.phashDistance == 0) {
            ribbon.classList.add('perceptually-identical');
            ribbon.title += ' Perceptually identical.';
          } else if (closestPerceptually.phashDistance < 7) {
            ribbon.classList.add('perceptually-similar');
            ribbon.title += ' Perceptually similar.';
          } else {
            ribbon.classList.add('perceptually-dissimilar');
            ribbon.title += ' Perceptually dissimilar.';
          }

          if (closestPerceptually.phashDistance > 0) {
            const pd = 100 - (closestPerceptually.phashDistance / 64 * 100);
            ribbon.title += ` Similarity: ${Math.floor(pd)}%`;
          }
        }
      }

      if (closestPerceptually.phashDistance === undefined || closestPerceptually.phashDistance == -1) {
        ribbon.classList.add('no-perceputal-hash');
        ribbon.title += ' No perceptual hash.';
      }

      bottomRibbons.appendChild(ribbon);

      ribbons?.after(bottomRibbons);
    }
  }
}

export async function addKemonoData(url: string | undefined) {
  if (!url) return;

  const kemonoData = await getKemonoDataFromUrl(url);

  if (kemonoData?.posts) {
    const first = kemonoData.posts[0];
    const container = document.querySelector('.source-links');

    if (!first || !container) return;

    if (container.firstChild?.nodeName == '#text') {
      const span = document.createElement('span');
      span.style.display = 'inline-flex';
      span.innerText = container.firstChild.textContent!;
      container.firstChild.remove();
      container.insertBefore(span, container.firstElementChild);
    }

    const a = document.createElement('a');
    a.href = `https://kemono.cr/${first.service}/user/${first.user}/post/${first.id}`;
    a.target = '_blank';

    const kemonoIconClone = kemonoIcon.cloneNode(true) as HTMLImageElement;
    a.appendChild(kemonoIconClone);

    container.firstElementChild?.appendChild(a);
    return;
  }
}

let sourcesToAdd: string[] = [];
let timeout;

async function sendSourcesToVerifier() {
  timeout = null;
  await sendSources(sourcesToAdd);
  sourcesToAdd = [];
}

function addSource(result: { url: string }, immediate: boolean, event: PointerEvent) {
  event.stopImmediatePropagation();
  event.preventDefault();

  if (sourcesToAdd.includes(result.url)) return;

  sourcesToAdd.push(result.url);
  if (immediate) {
    sendSourcesToVerifier();
    return;
  }

  if (!timeout) {
    timeout = setTimeout(sendSourcesToVerifier, 500);
  } else {
    clearTimeout(timeout);
    timeout = setTimeout(sendSourcesToVerifier, 500);
  }
}

export function createSidebarList(id: string, title: string): HTMLUListElement {
  const list = document.createElement('ul');
  list.id = id;
  list.classList.add('post-sidebar-info');

  const listItem = document.createElement('li');
  listItem.classList.add('source-links');
  listItem.append(title);

  list.appendChild(listItem);

  return list;
}

export async function createSourceItem(result: { url: string }, immediate: boolean = false) {
  const div = document.createElement('div');
  div.classList.add('source-link');

  const wrappedAnchor = document.createElement('a');

  wrappedAnchor.onclick = addSource.bind(null, result, immediate);

  wrappedAnchor.title = 'Add source';
  wrappedAnchor.appendChild(addSourceSign.cloneNode(true));
  div.appendChild(wrappedAnchor);

  const normalizedURL = await normalizeURL(result.url, getBlueskyDid);

  if (!normalizedURL) throw new Error('Error normalizing source. Cannot create source link.');

  const url = new URL(normalizedURL);

  const a = document.createElement('a');
  a.classList.add('decorated');
  a.target = '_blank';
  a.rel = 'nofollow noreferrer noopener';
  a.href = normalizedURL;

  const icon = document.createElement('img');
  icon.classList.add('link-decoration');
  icon.alt = url.hostname;
  icon.width = 16;
  icon.height = 16;
  icon.setAttribute('data-hostname', url.hostname);
  icon.src = await blobToBase64(await getFaviconBlob(url.hostname.replace('www.', '')));
  a.appendChild(icon);

  const span = document.createElement('span');
  span.innerText = normalizedURL;
  a.appendChild(span);

  div.appendChild(a);

  return div;
}

export async function normalizeSourceLinks(a: HTMLElement): Promise<string | null> {
  let url;
  if (a.tagName == 'S') {
    try {
      url = new URL(a.innerText);
    } catch (e) {
      return '';
    }
  } else {
    const asAnchor = a as HTMLAnchorElement;
    if (!asAnchor.href) return '';
    url = new URL(asAnchor.href);
  }

  return await normalizeURL(url, getBlueskyDid);
}