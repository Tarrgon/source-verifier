import fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Package from '../package.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const headerData = JSON.parse(fs.readFileSync(path.resolve(`${__dirname}/userscriptHeader.json`), { encoding: 'utf-8' }));

const header = `// ==UserScript==
// @name            Janitor Source Verifier
// @version         ${Package.version}
// @description     ${Package.description}
// @author          ${Package.author.name}
${Object.keys(headerData).map((key) => {
  const padding = 20;
  if (Array.isArray(headerData[key])) {
    return headerData[key].map((value) => {
      let header = `// @${key}`;
      while (header.length < padding) header += ' ';
      header += value;
      return header;
    }).join('\n');
  } else {
    let header = `// @${key}`;
    while (header.length < padding) header += ' ';
    header += headerData[key];
    return header;
  }
}).join('\n')}
// ==/UserScript==`;

const file = fs.readFileSync(path.resolve(`${__dirname}/../dist/source-verifier-userscript.user.js`), { encoding: 'utf-8' });

fs.writeFileSync(path.resolve(`${__dirname}/../dist/source-verifier-userscript.user.js`), `${header}\n\n${file}`);
fs.writeFileSync(path.resolve(`${__dirname}/../dist/source-verifier-userscript.meta.js`), header);