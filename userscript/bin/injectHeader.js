import fs from 'fs';
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageData = JSON.parse(fs.readFileSync(path.resolve(`${__dirname}/../package.json`), { encoding: 'utf-8' }));
const headerData = JSON.parse(fs.readFileSync(path.resolve(`${__dirname}/userscriptHeader.json`), { encoding: 'utf-8' }));

const header = `// ==UserScript==
// @name ${packageData.name}
// @version ${packageData.version}
// @description ${packageData.description}
// @author ${packageData.author.name}
${Object.keys(headerData).map(key => {
  if (Array.isArray(headerData[key])) {
    return headerData[key].map(value => `// @${key} ${value}`).join('\n')
  } else {
    return `// @${key} ${headerData[key]}`
  }
}).join('\n')}
// ==/UserScript==`;

const file = fs.readFileSync(path.resolve(`${__dirname}/../dist/source-verifier-userscript.user.js`), { encoding: 'utf-8' })

fs.writeFileSync(path.resolve(`${__dirname}/../dist/source-verifier-userscript.user.js`), `${header}\n\n${file}`);
fs.writeFileSync(path.resolve(`${__dirname}/../dist/source-verifier-userscript.meta.js`), header);