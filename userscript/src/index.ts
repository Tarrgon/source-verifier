import type { ServerResponse, CompleteResponse, IncompleteResponse } from '../../shared';

function isCompleteResponse(response: ServerResponse): response is CompleteResponse {
  const incompleteResponse = response as IncompleteResponse;
  const completeResponse = response as CompleteResponse;
  if (incompleteResponse.notPending || incompleteResponse.unsupported || incompleteResponse.queued || incompleteResponse.notIndexed || !completeResponse.sources) return false;

  return true;
}

function addCSS() {
  document.head.append(Object.assign(document.createElement('style'), {
    type: 'text/css',
    textContent: `
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
`
  }));
}

async function main() {
  addCSS();
}

main();