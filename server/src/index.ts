#!/usr/bin/env node
import { start as startServer } from './server/www';
import { Database, E621Handler } from './modules';
import SourceCheckerManager from './checkers/SourceCheckerManager';

(async () => {
  await Database.start();
  await SourceCheckerManager.start();
  E621Handler.updateRoutine();
  startServer();
})();