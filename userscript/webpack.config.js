import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: './tmp-dist/index.js',
  output: {
    filename: 'source-verifier-userscript.user.js',
    path: path.resolve(__dirname, 'dist'),
  },
};