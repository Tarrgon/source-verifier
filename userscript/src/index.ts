import { getData } from './Backend';
import { checkFluffle, hasCachedFluffleData } from './Fluffle';
import { processData, waitForSelector } from './Utilities';

function addCSS() {
  document.head.append(Object.assign(document.createElement('style'), {
    type: 'text/css',
    textContent: `
.jsv-icon {
  width: 1.25em;
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
`
  }));
}

async function main() {
  addCSS();

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

  const id = parseInt(document.querySelector('#image-container[data-id]')?.getAttribute('data-id') ?? '-1');

  if (id == -1) {
    console.error('[SourceVerifier] Post ID not found.');
    return;
  };

  try {
    const data = await getData(id);

    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.source-link')).map(a => a.href);

    const supported = await processData(data, links.length > 0);

    if (links.length == 0) {
      checkFluffle(id);
    } else if (!supported) {
      checkFluffle(id);
    } else if (await hasCachedFluffleData(id)) {
      checkFluffle(id);
    }

  } catch (e) {
    console.error(e);
  }
}

main();