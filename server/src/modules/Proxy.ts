import http from 'http';
import https from 'https';
import { config } from '../config';
import type Stream from 'stream';

const PROXY_AUTHENTICATION = 'Basic ' + Buffer.from(config.PROXY_USERNAME + ':' + config.PROXY_PASSWORD).toString('base64');
const PROXY_IP = config.PROXY_URI!.split(':')[0];
const PROXY_PORT = parseInt(config.PROXY_URI!.split(':')[1]);

let agent: https.Agent;

function connectToProxy(hostname: string, secure: boolean = true): Promise<Stream.Duplex | null> {
  return new Promise((resolve) => {
    http.request({
      host: PROXY_IP,
      port: PROXY_PORT,
      method: 'CONNECT',
      path: `${hostname}${secure ? ':443' : ''}`,
      headers: {
        'Proxy-Authorization': PROXY_AUTHENTICATION
      },
    }).on('connect', (res, socket) => {
      if (res.statusCode == 200) return resolve(socket);
      return resolve(null);
    }).on('error', (e) => {
      console.error(`Error fetching: ${hostname} (${secure}) with proxy:`);
      console.error(e);
      return resolve(null);
    });
  });
}

export function fetchProxy(url: string, options?: { headers?: { [header: string]: string } }): Promise<Response> {
  return new Promise(async (resolve, reject) => {
    const _url = new URL(url);
    const secure = _url.protocol == 'https:';

    if (!agent) {
      const socket = await connectToProxy(_url.hostname, secure);

      if (!socket) return reject('Could not connect to proxy');

      agent = new https.Agent({ socket, keepAlive: true });
    }

    const _http = secure ? https : http;

    try {
      _http.get({
        host: _url.hostname,
        path: _url.pathname,
        headers: options?.headers ? options.headers : undefined,
        agent
      }, (res) => {
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) return reject(`Fetching on proxy had non-200 status code: ${res.statusCode}`);

        const body: Buffer[] = [];

        res.on('data', (d) => {
          body.push(d);
        });

        res.on('end', () => {
          // @ts-ignore Typescript unfortunately doesn't have any idea how this works...
          const headers = res.rawHeaders.reduce((acc, cur, index, arr) => {
            if (index % 2 == 0) {
              return [...acc, [arr[index].toLowerCase(), arr[index + 1]]];
            }

            return acc;
          }, []) as [string, string][];

          const result = new Response(new Uint8Array(Buffer.concat(body).buffer), {
            status: res.statusCode,
            headers: new Headers(headers)
          });

          return resolve(result);
        });
      });
    } catch (e) {
      console.error(`Error fetching: ${url} with proxy:`);
      console.error(e);
      return reject('Error fetching with proxy...');
    }
  });
}