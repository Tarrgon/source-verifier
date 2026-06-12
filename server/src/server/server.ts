import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';
import type { Express as ExpressServer } from 'express-serve-static-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

export default async function (): Promise<ExpressServer> {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const app = express();

  app.use(cors());
  app.use(bodyParser.json({ limit: '1KB' }));
  app.use(express.static('static'));

  // routers
  for (const p of fs.readdirSync(path.join(__dirname, 'routes')).filter(file => file.endsWith('.js') || file.endsWith('.ts'))) {
    const data = (await import(pathToFileURL(path.join(__dirname, 'routes', p)).href)).default();
    app.use(data.path, data.router);
  }

  return app;
}