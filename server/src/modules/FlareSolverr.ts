const SESSION_ID = 'SourceVerifier_FlareSolverr';
const URL_BASE = 'http://localhost:8191/v1';

const OPTIONS = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

let ready = false;
let failed = false;

async function destroySession(): Promise<boolean> {
  try {
    console.log('[FlareSolverr] Destroying FlareSolverr session');

    const res = await fetch(URL_BASE, {
      ...OPTIONS,
      body: JSON.stringify({
        cmd: 'sessions.destroy',
        session: SESSION_ID
      })
    });

    return res.ok;
  } catch (e) {
    console.error('[FlareSolverr] Error destroying FlareSolverr session. Is FlareSolverr running on port 8191? Is the port exposed? (-p 8191:8191)');
    console.error(e);

    failed = true;

    return false;
  }
}

async function createSession(): Promise<boolean> {
  try {
    await destroySession();

    console.log('[FlareSolverr] Creating FlareSolverr session');

    const res = await fetch(URL_BASE, {
      ...OPTIONS,
      body: JSON.stringify({
        cmd: 'sessions.create',
        session: SESSION_ID
      })
    });

    if (!res.ok) {
      console.error('[FlareSolverr] Error creating FlareSolverr session. Is FlareSolverr running on port 8191? Is the port exposed? (-p 8191:8191)');
      console.error(await res.text());

      failed = true;
    } else {
      ready = true;
    }

    return res.ok;
  } catch (e) {
    console.error('[FlareSolverr] Error creating FlareSolverr session. Is FlareSolverr running on port 8191? Is the port exposed? (-p 8191:8191)');
    console.error(e);

    failed = true;
    return false;
  }
}

export async function getFromFlareSolverr(url: string): Promise<Response | null> {
  try {
    console.log(`[FlareSolverr] Getting ${url} from FlareSolverr`);
    if (failed) return null;

    if (!ready) {
      await createSession();
    }

    return fetch(URL_BASE, {
      ...OPTIONS,
      body: JSON.stringify({
        cmd: 'request.get',
        session: SESSION_ID,
        url: url,
        maxTimeout: 60000,
        download: true,
        returnRawFile: true
      })
    });
  } catch (e) {
    console.error(`[FlareSolverr] Error while getting ${url} from FlareSolverr:`);
    console.error(e);

    return null;
  }
}