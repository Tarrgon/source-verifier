import { config } from '../config';
import http from 'http';
import https from 'https';
import fs from 'fs';
import server from './server';

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof config.PORT === 'string'
    ? 'Pipe ' + config.PORT
    : 'Port ' + config.PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening(server) {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;

  console.log('Listening on ' + bind);
}

export async function start() {
  const app = await server();

  app.set('port', config.PORT);

  const httpServer = config.SECURE ? https.createServer({
    key: fs.readFileSync(config.PRIVATE_KEY_LOCATION!, { encoding: 'utf-8' }),
    cert: fs.readFileSync(config.CERTIFICATE_LOCATION!, { encoding: 'utf-8' }),
    ca: fs.readFileSync(config.CHAIN_LOCATION!, { encoding: 'utf-8' })
  }, app)
    : http.createServer({}, app);

  httpServer.listen(config.PORT, '0.0.0.0');
  httpServer.on('error', onError);
  httpServer.on('listening', onListening.bind(null, httpServer));
}