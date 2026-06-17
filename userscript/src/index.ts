import { getData, getDataBulk } from './Backend';
import { Version } from './Constants';
import { checkFluffle, hasCachedFluffleData } from './Fluffle';
import { normalizeURL } from './shared';
import { addKemonoData, getBlueskyDid, processData, processDataOnPostsView, waitForSelector } from './Utilities';

function addCSS() {
  document.head.append(Object.assign(document.createElement('style'), {
    type: 'text/css',
    textContent: `
.jsv-icon {
  width: 1.25em;
}

.jsv-replacement-anchor {
  display: inline-flex;
}

.loading:after {
  overflow: hidden;
  display: inline-block;
  vertical-align: bottom;
  -webkit-animation: ellipsis steps(4, end) 900ms infinite;
  animation: ellipsis steps(4, end) 900ms infinite;
  content: "\\2026";
  width: 0px;
}

@keyframes ellipsis {
  to {
    width: 16px;
  }
}

@-webkit-keyframes ellipsis {
  to {
    width: 16px;
  }
}

.spin {
  animation-name: spin;
  animation-direction: normal;
  animation-duration: 2s;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
}

@media (prefers-reduced-motion: reduce) {
  .spin {
    animation: none !important;
    transition: none !important;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.post-sidebar-info .source-links {
  display: inline-flex;
  flex-direction: column;
}

.source-link > a {
  display: inline-flex;
}

article.thumbnail .ribbon.bottom {
	top: unset;
  visibility: visible !important;
	background: linear-gradient(to right, var(--color-1) 50%, var(--color-2) 50% 100%);
	background-size: 200% 100%;
	background-position-x: var(--ribbon-bg-pos);
}

article.thumbnail .ribbon.bottom.right {
  background-position-x: calc(var(--ribbon-bg-pos) * -1);
  box-shadow: calc(var(--transform-scalar) * 5px) calc(var(--transform-scalar) * -5px) 10px 5px rgba(0,0,0,.5);
}

.md5-match {
  --color-1: lime !important;
  --color-2: lime !important;
  --ribbon-bg-pos: 0% !important;
}

.dimension-match.file-type-match {
  --color-1: #a53ac5 !important;
}

.dimension-match {
  --color-1: #c5a53a !important;
}

.file-type-match {
  --color-1: #2767d8 !important;
}

.no-matches {
  --color-1: #800 !important;
}

.perceptually-identical {
  --color-2: lime !important;
  --ribbon-bg-pos: 50% !important;
}

.perceptually-similar {
  --color-2: yellow !important;
  --ribbon-bg-pos: 50% !important;
}

.perceptually-dissimilar {
  --color-2: red !important;
  --ribbon-bg-pos: 50% !important;
}

.no-perceputal-hash {
  --color-2: black !important;
  --ribbon-bg-pos: 50% !important;
}

.bottom-ribbons {
	top: unset;
	bottom: 32px;
  z-index: 20;
}

.bottom-ribbons ribbon {
	border-top-right-radius: 0px !important;
  border-top-left-radius: 0px !important;
}

.bottom-ribbons ribbon.right > span {
	transform: rotate(135deg) !important;
	top: -0.8rem;
  background: linear-gradient(to right, var(--color-1) 57%, var(--color-2) 50% 100%);
}

.bottom-ribbons ribbon.left > span {
	transform: rotate(225deg) !important;
	top: -0.8rem;
  background: linear-gradient(to left, var(--color-1) 56%, var(--color-2) 50% 100%);
}

.search {
  z-index: 30 !important;
}
`
  }));
}

let timeOfMostRecentAddition = -1;
let additions: HTMLElement[] = [];

let interval;

function checkForNewPosts(mutationList: MutationRecord[], observer: MutationObserver) {
  for (const mutation of mutationList) {
    if (mutation.type === 'childList') {
      for (const addedNode of mutation.addedNodes) {
        const addedElement = addedNode as HTMLElement;
        if (addedElement.tagName == 'POST-INFO' || addedElement.classList?.contains('thm-desc')) {
          timeOfMostRecentAddition = Date.now();
          additions.push(mutation.target as HTMLElement);
          if (!interval && additions.length > 0) {
            interval = setInterval(async () => {
              if (Date.now() - timeOfMostRecentAddition > 500) {
                clearInterval(interval);
                interval = null;

                const ids = additions.map((p) => {
                  if (p.tagName == 'POST') return p.id.slice(6);
                  else return p.getAttribute('data-id') ?? '-1';
                });

                additions = [];

                const datas = await getDataBulk(ids.filter(id => id != '-1'));

                for (const data of datas) {
                  processDataOnPostsView(data);
                }
              }
            }, 300);
          }
        }
      }
    }
  }
}

async function main() {
  addCSS();

  console.log(`[Janitor Source Verifier] Running on version ${Version}`);

  if (window.location.href.startsWith('https://e621.net/post_replacements/')) {
    const params = new URLSearchParams(window.location.search);

    const urlField = await waitForSelector<HTMLInputElement>("#replacement-uploader > * input[type='text']");
    const noSourceBox = await waitForSelector<HTMLInputElement>('#no_source');
    const sourceInput = await waitForSelector<HTMLInputElement>('.upload-source-row > input');
    const reasonField = await waitForSelector<HTMLInputElement>("[list='reason-datalist']");

    if (!urlField || !noSourceBox || !sourceInput || !reasonField) return;

    const url = params.get('url');
    const reason = params.get('reason');
    const source = params.get('source');

    if (!url || !reason || !source) return;

    if (params.has('url')) urlField.value = url;
    if (params.has('reason')) reasonField.value = reason;

    if (params.has('source')) {
      sourceInput.value = source;
    } else if (params.has('url')) {
      noSourceBox.checked = true;
    }

    setTimeout(() => {
      urlField.dispatchEvent(new Event('input'));
      noSourceBox.dispatchEvent(new Event('change'));
      reasonField.dispatchEvent(new Event('input'));
      sourceInput.dispatchEvent(new Event('input'));
    }, 100);

    return;
  }

  if (window.location.pathname == '/posts') {
    // await wait(100);
    const observer = new MutationObserver(checkForNewPosts);
    const targets = await Promise.all([waitForSelector('search-content', 3000), waitForSelector('.posts-container', 1500)]);

    const target = targets[0] ?? targets[1];

    if (!target) return;

    observer.observe(target, { attributes: true, childList: true, subtree: true });

    const vanillaIds = Array.from(document.querySelectorAll('.posts-container > article.thumbnail')).map(p => p.getAttribute('data-id') ?? '-1');
    const re6Ids = Array.from(document.querySelectorAll('post')).map(p => p.id.slice(6));

    const datas = await getDataBulk(vanillaIds.concat(re6Ids).filter(id => id != '-1'));

    for (const data of datas) {
      processDataOnPostsView(data);
    }
    return;
  }

  const container = document.querySelector('#image-container[data-id]');

  if (!container) return;

  const id = parseInt(container.getAttribute('data-id') ?? '-1');

  if (id == -1) {
    console.error('[SourceVerifier] Post ID not found.');
    return;
  };

  try {
    const data = await getData(id);

    const links = (await Promise.all(Array.from(document.querySelectorAll<HTMLAnchorElement>('.source-link > a[href]')).map(a => normalizeURL(a.href, getBlueskyDid)))).filter(e => e != null);

    const supported = await processData(data, links, links.length > 0);

    if (links.length == 0) {
      addKemonoData(container.getAttribute('data-file-url')!);
      checkFluffle(id);
    } else if (!supported || await hasCachedFluffleData(id)) {
      checkFluffle(id);
    }
  } catch (e) {
    console.error(e);
  }
}

main();