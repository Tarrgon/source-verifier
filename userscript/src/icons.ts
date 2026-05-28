const PLUS_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z"/></svg>';
const DOUBLE_CHECK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M377.9 130.8C388.3 116.5 385.1 96.5 370.8 86.1C356.5 75.7 336.5 78.9 326.1 93.2L220.1 238.9L182.6 201.4C170.1 188.9 149.8 188.9 137.3 201.4C124.8 213.9 124.8 234.2 137.3 246.7L201.3 310.7C207.9 317.3 217.1 320.7 226.4 320C235.7 319.3 244.3 314.5 249.8 306.9L377.8 130.9zM505.9 266.8C516.3 252.5 513.1 232.5 498.8 222.1C484.5 211.7 464.5 214.9 454.1 229.2L284.1 462.9L214.6 393.4C202.1 380.9 181.8 380.9 169.3 393.4C156.8 405.9 156.8 426.2 169.3 438.7L265.3 534.7C271.9 541.3 281.1 544.7 290.4 544C299.7 543.3 308.3 538.5 313.8 530.9L505.8 266.9z"/></svg>';
const CHECK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M530.8 134.1C545.1 144.5 548.3 164.5 537.9 178.8L281.9 530.8C276.4 538.4 267.9 543.1 258.5 543.9C249.1 544.7 240 541.2 233.4 534.6L105.4 406.6C92.9 394.1 92.9 373.8 105.4 361.3C117.9 348.8 138.2 348.8 150.7 361.3L252.2 462.8L486.2 141.1C496.6 126.8 516.6 123.6 530.9 134z"/></svg>';
const SQUARE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M160 96L480 96C515.3 96 544 124.7 544 160L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 160C96 124.7 124.7 96 160 96z"/></svg>';
const XMARK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z"/></svg>';
const SPINNER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M272 112C272 85.5 293.5 64 320 64C346.5 64 368 85.5 368 112C368 138.5 346.5 160 320 160C293.5 160 272 138.5 272 112zM272 528C272 501.5 293.5 480 320 480C346.5 480 368 501.5 368 528C368 554.5 346.5 576 320 576C293.5 576 272 554.5 272 528zM112 272C138.5 272 160 293.5 160 320C160 346.5 138.5 368 112 368C85.5 368 64 346.5 64 320C64 293.5 85.5 272 112 272zM480 320C480 293.5 501.5 272 528 272C554.5 272 576 293.5 576 320C576 346.5 554.5 368 528 368C501.5 368 480 346.5 480 320zM139 433.1C157.8 414.3 188.1 414.3 206.9 433.1C225.7 451.9 225.7 482.2 206.9 501C188.1 519.8 157.8 519.8 139 501C120.2 482.2 120.2 451.9 139 433.1zM139 139C157.8 120.2 188.1 120.2 206.9 139C225.7 157.8 225.7 188.1 206.9 206.9C188.1 225.7 157.8 225.7 139 206.9C120.2 188.1 120.2 157.8 139 139zM501 433.1C519.8 451.9 519.8 482.2 501 501C482.2 519.8 451.9 519.8 433.1 501C414.3 482.2 414.3 451.9 433.1 433.1C451.9 414.3 482.2 414.3 501 433.1z"/></svg>';
const QUESTION_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M224 224C224 171 267 128 320 128C373 128 416 171 416 224C416 266.7 388.1 302.9 349.5 315.4C321.1 324.6 288 350.7 288 392L288 416C288 433.7 302.3 448 320 448C337.7 448 352 433.7 352 416L352 392C352 390.3 352.6 387.9 355.5 384.7C358.5 381.4 363.4 378.2 369.2 376.3C433.5 355.6 480 295.3 480 224C480 135.6 408.4 64 320 64C231.6 64 160 135.6 160 224C160 241.7 174.3 256 192 256C209.7 256 224 241.7 224 224zM320 576C342.1 576 360 558.1 360 536C360 513.9 342.1 496 320 496C297.9 496 280 513.9 280 536C280 558.1 297.9 576 320 576z"/></svg>';
const EXCLAMATION_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M320 496C342.1 496 360 513.9 360 536C360 558.1 342.1 576 320 576C297.9 576 280 558.1 280 536C280 513.9 297.9 496 320 496zM320 64C346.5 64 368 85.5 368 112C368 112.6 368 113.1 368 113.7L352 417.7C351.1 434.7 337 448 320 448C303 448 289 434.7 288 417.7L272 113.7C272 113.1 272 112.6 272 112C272 85.5 293.5 64 320 64z"/></svg>';
const INFO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM288 224C288 206.3 302.3 192 320 192C337.7 192 352 206.3 352 224C352 241.7 337.7 256 320 256C302.3 256 288 241.7 288 224zM280 288L328 288C341.3 288 352 298.7 352 312L352 400L360 400C373.3 400 384 410.7 384 424C384 437.3 373.3 448 360 448L280 448C266.7 448 256 437.3 256 424C256 410.7 266.7 400 280 400L304 400L304 336L280 336C266.7 336 256 325.3 256 312C256 298.7 266.7 288 280 288z"/></svg>';
const FORCE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M342.6 534.6C330.1 547.1 309.8 547.1 297.3 534.6L137.3 374.6C124.8 362.1 124.8 341.8 137.3 329.3C149.8 316.8 170.1 316.8 182.6 329.3L320 466.7L457.4 329.4C469.9 316.9 490.2 316.9 502.7 329.4C515.2 341.9 515.2 362.2 502.7 374.7L342.7 534.7zM502.6 182.6L342.6 342.6C330.1 355.1 309.8 355.1 297.3 342.6L137.3 182.6C124.8 170.1 124.8 149.8 137.3 137.3C149.8 124.8 170.1 124.8 182.6 137.3L320 274.7L457.4 137.4C469.9 124.9 490.2 124.9 502.7 137.4C515.2 149.9 515.2 170.2 502.7 182.7z"/></svg>';
const RELOAD_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M544.1 256L552 256C565.3 256 576 245.3 576 232L576 88C576 78.3 570.2 69.5 561.2 65.8C552.2 62.1 541.9 64.2 535 71L483.3 122.8C439 86.1 382 64 320 64C191 64 84.3 159.4 66.6 283.5C64.1 301 76.2 317.2 93.7 319.7C111.2 322.2 127.4 310 129.9 292.6C143.2 199.5 223.3 128 320 128C364.4 128 405.2 143 437.7 168.3L391 215C384.1 221.9 382.1 232.2 385.8 241.2C389.5 250.2 398.3 256 408 256L544.1 256zM573.5 356.5C576 339 563.8 322.8 546.4 320.3C529 317.8 512.7 330 510.2 347.4C496.9 440.4 416.8 511.9 320.1 511.9C275.7 511.9 234.9 496.9 202.4 471.6L249 425C255.9 418.1 257.9 407.8 254.2 398.8C250.5 389.8 241.7 384 232 384L88 384C74.7 384 64 394.7 64 408L64 552C64 561.7 69.8 570.5 78.8 574.2C87.8 577.9 98.1 575.8 105 569L156.8 517.2C201 553.9 258 576 320 576C449 576 555.7 480.6 573.4 356.5z"/></svg>';

export const addSourceSign = (() => {
  const i = document.createElement('i');
  i.classList.add('jsv-icon');
  i.style.color = 'lime';
  i.title = 'Add source';
  i.style.marginRight = '0.25rem';
  i.style.marginLeft = '0.25rem';
  i.innerHTML = PLUS_SVG;
  return i;
})();

export const md5Match = (() => {
  const i = document.createElement('i');
  i.classList.add('jsv-icon');
  i.style.color = 'lime';
  i.title = 'MD5 match';
  i.style.marginRight = '0.25rem';
  if (window.location.pathname == '/posts') {
    i.style.lineHeight = 'inherit';
    i.style.verticalAlign = 'middle';
  }
  i.innerHTML = DOUBLE_CHECK_SVG;
  return i;
})();

export const dimensionAndFileTypeMatch = (() => {
  const i = document.createElement('i');
  i.classList.add('jsv-icon');
  i.style.color = 'lime';
  i.title = 'Dimension and file type match';
  i.style.marginRight = '0.25rem';
  if (window.location.pathname == '/posts') {
    i.style.lineHeight = 'inherit';
    i.style.verticalAlign = 'middle';
  }
  i.innerHTML = CHECK_SVG;
  return i;
})();

export const dimensionMatch = (() => {
  const i = document.createElement('i');
  i.classList.add('jsv-icon');
  i.style.color = 'yellow';
  i.title = 'Dimension match';
  i.style.marginRight = '0.25rem';
  if (window.location.pathname == '/posts') {
    i.style.lineHeight = 'inherit';
    i.style.verticalAlign = 'middle';
  }
  i.innerHTML = CHECK_SVG;
  return i;
})();

export const aspectRatioMatch = (() => {
  const i = document.createElement('i');
  i.classList.add('jsv-icon');
  i.title = 'Approx. aspect ratio match';
  i.style.marginRight = '0.25rem';
  if (window.location.pathname == '/posts') {
    i.style.lineHeight = 'inherit';
    i.style.verticalAlign = 'middle';
  }
  i.innerHTML = SQUARE_SVG;
  return i;
})();

export const fileTypeMatch = (() => {
  const i = document.createElement('i');
  i.classList.add('jsv-icon');
  i.style.color = 'yellow';
  i.title = 'File type match';
  i.style.marginRight = '0.25rem';
  if (window.location.pathname == '/posts') {
    i.style.lineHeight = 'inherit';
    i.style.verticalAlign = 'middle';
  }
  i.innerHTML = XMARK_SVG;
  return i;
})();

export const noMatches = (() => {
  const i = document.createElement('i');
  i.classList.add('jsv-icon');
  i.style.color = 'red';
  i.title = 'No matches';
  i.style.marginRight = '0.25rem';
  if (window.location.pathname == '/posts') {
    i.style.lineHeight = 'inherit';
    i.style.verticalAlign = 'middle';
  }
  i.innerHTML = XMARK_SVG;
  return i;
})();

export const spinner = (() => {
  const i = document.createElement('i');
  i.classList.add('spin', 'jsv-icon');
  i.style.color = 'yellow';
  i.title = 'Queued';
  i.style.marginLeft = '0.25rem';
  if (window.location.pathname == '/posts') {
    i.style.lineHeight = 'inherit';
    i.style.verticalAlign = 'middle';
  }
  i.innerHTML = SPINNER_SVG;
  return i;
})();

export const unknown = (() => {
  const i = document.createElement('i');
  i.classList.add('jsv-icon');
  i.style.color = 'yellow';
  i.title = 'Unknown';
  i.style.marginRight = '0.25rem';
  if (window.location.pathname == '/posts') {
    i.style.lineHeight = 'inherit';
    i.style.verticalAlign = 'middle';
  }
  i.innerHTML = QUESTION_SVG;
  return i;
})();

export const bvas = (() => {
  const i = document.createElement('i');
  i.classList.add('jsv-icon');
  i.style.color = 'lime';
  i.style.marginRight = '0.25rem';
  if (window.location.pathname == '/posts') {
    i.style.lineHeight = 'inherit';
    i.style.verticalAlign = 'middle';
  }
  i.innerHTML = PLUS_SVG;
  return i;
})();

export const phashMatch = (() => {
  const i = document.createElement('i');
  i.classList.add('jsv-icon');
  i.style.color = 'lime';
  i.title = 'Perceptually identical';
  i.style.marginRight = '0.125rem';
  i.style.marginLeft = '-0.125rem';
  if (window.location.pathname == '/posts') {
    i.style.lineHeight = 'inherit';
    i.style.verticalAlign = 'middle';
  }
  i.innerHTML = EXCLAMATION_SVG;
  return i;
})();

export const info = (() => {
  const i = document.createElement('i');
  i.classList.add('jsv-icon');
  i.style.color = 'cyan';
  i.style.marginRight = '0.25rem';
  if (window.location.pathname == '/posts') {
    i.style.lineHeight = 'inherit';
    i.style.verticalAlign = 'middle';
  }
  i.innerHTML = INFO_SVG;
  return i;
})();

export const force = (() => {
  const i = document.createElement('i');
  i.classList.add('jsv-icon');
  i.style.color = 'green';
  i.style.cursor = 'pointer';
  i.title = 'Get source data';
  i.style.marginLeft = '0.25rem';
  if (window.location.pathname == '/posts') {
    i.style.lineHeight = 'inherit';
    i.style.verticalAlign = 'middle';
  }
  i.innerHTML = FORCE_SVG;
  return i;
})();

export const reload = (() => {
  const i = document.createElement('i');
  i.classList.add('jsv-icon');
  i.style.color = 'green';
  i.style.cursor = 'pointer';
  i.title = 'Update source data';
  i.style.marginLeft = '0.25rem';
  if (window.location.pathname == '/posts') {
    i.style.lineHeight = 'inherit';
    i.style.verticalAlign = 'middle';
  }
  i.innerHTML = RELOAD_SVG;
  return i;
})();

export const kemonoIcon = (() => {
  const img = document.createElement('img');
  img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAACTUExURQAAAAQCAAMBABQKBGUxFBUKBAAAAAEAAEgjD2MwFCsVCKJPIYdBG1YqESAPBjocDJpLH4ZBG389GUskD2cyFW41FkAfDRkMBaJOIb9cJ0IgDQMBABAHAy4WCQgEApVJHno7GQAAAKpSIrRYJMZgKNJmK+RvLl4uE5tLHxIJAyQRB4pDHOdwLwEAAOpyMN9sLf////15I3UAAAAidFJOUwBGF4GvKQlUV8s35eBtmtvzt/u5jPf+/f30SGCuzW/GoMxWg8riAAAAAWJLR0Qwrtwt5AAAAAd0SU1FB+gHERUzDxJ/xp8AAAC+SURBVBjTTY9tE4IgEIQPjMNMJS0yU8sISwXx//+7sJcZ99PNzu3Os0AorEQIBBsGgIxzhgDhNoJoFyeIqRApxWSfIWCm8g0/PHQcHnN19LFES3kq8u6pz6/y4uPBvtedHEajHy9ZIZC6f1pr1TgVw1DUBCqhnTecmaZRKVEBafrZG1afRuNUw4FeG9ktztzNZxF4KEqq29JiXZly9gUOy89LRvG3ANulZoH4i+2cm1tcrUyMiaP1bFrfg+/1Bu2eEsMGhTxDAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDI0LTA3LTE3VDIxOjUxOjE1KzAwOjAwXKO44gAAACV0RVh0ZGF0ZTptb2RpZnkAMjAyNC0wNy0xN1QyMTo1MToxNSswMDowMC3+AF4AAAAodEVYdGRhdGU6dGltZXN0YW1wADIwMjQtMDctMTdUMjE6NTE6MTUrMDA6MDB66yGBAAAAAElFTkSuQmCC';
  img.title = 'Found kemono match';
  img.style.marginLeft = '0.25rem';
  return img;
})();