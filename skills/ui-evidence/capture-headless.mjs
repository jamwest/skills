#!/usr/bin/env node
// Drive a throwaway headless Chrome over CDP and write real PNGs.
//
// Why this exists alongside `capture-tab.sh`: that script shoots the user's own
// Chrome window, which is the only way in when the app sits behind a real SSO
// login you must not type past. When the app needs no such session, driving a
// private headless Chrome is better on every axis — an exact viewport instead of
// whatever size the window happens to be, no Screen Recording grant, no
// "started debugging this browser" banner to wait out, and no touching the
// user's tabs, clipboard or history.
//
// No dependencies, deliberately: Node 22+ ships a WebSocket client, which is the
// only thing CDP needs. See CONTRIBUTING.md's note on capture scripts.
//
// Used as a library, which is the normal case — states usually need setting up:
//
//   import { open } from '<skill-dir>/capture-headless.mjs';
//   const page = await open({ out: '.claude/pr/GH-12' });
//   await page.goto('http://localhost:5173/');
//   await page.type('input[type=password]', 'fixture-not-a-real-password');
//   await page.click('button');
//   await page.shot('01-signed-in');
//   await page.close();
//
// Or as a CLI for a page that needs no setup:
//
//   node capture-headless.mjs http://localhost:5173/ out/01-home.png [390x844]

import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const kChrome =
  process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// A phone, because most of what gets screenshotted is read on one. Override per call.
const kViewport = { width: 390, height: 844, deviceScaleFactor: 2 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Chrome prints the endpoint to stderr once it is listening, which is the only
// reliable signal that it is up — polling the port races the socket opening.
function listeningOn(chrome) {
  return new Promise((resolve, reject) => {
    const failed = setTimeout(() => reject(new Error('Chrome never reported a DevTools endpoint')), 20_000);
    chrome.stderr.on('data', (chunk) => {
      const found = /DevTools listening on (ws:\/\/\S+)/.exec(String(chunk));
      if (found) {
        clearTimeout(failed);
        resolve(found[1]);
      }
    });
  });
}

export async function open({ out = '.claude/ui', viewport = kViewport, chromePath = kChrome } = {}) {
  await mkdir(out, { recursive: true });
  const profile = await mkdtemp(join(tmpdir(), 'ui-evidence-'));

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    '--hide-scrollbars',
    '--no-first-run',
    '--disable-gpu',
  ]);
  const browserSocket = await listeningOn(chrome);

  // The browser endpoint can mint a page target, whose own endpoint speaks the
  // Page/Runtime domains directly — simpler than attaching a session to it.
  const port = new URL(browserSocket).port;
  const created = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
  const { webSocketDebuggerUrl, id } = await created.json();

  const socket = new WebSocket(webSocketDebuggerUrl);
  await new Promise((ok, no) => {
    socket.addEventListener('open', ok, { once: true });
    socket.addEventListener('error', () => no(new Error('could not attach to the page')), { once: true });
  });

  let nextId = 0;
  const waiting = new Map();
  const events = new Map();
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id !== undefined) {
      const pending = waiting.get(message.id);
      waiting.delete(message.id);
      if (!pending) return;
      if (message.error) pending.no(new Error(`${message.error.message} (${pending.method})`));
      else pending.ok(message.result);
      return;
    }
    events.get(message.method)?.forEach((fire) => fire());
    events.delete(message.method);
  });

  const send = (method, params = {}) =>
    new Promise((ok, no) => {
      const id = ++nextId;
      waiting.set(id, { ok, no, method });
      socket.send(JSON.stringify({ id, method, params }));
    });

  const once = (event) =>
    new Promise((fire) => events.set(event, [...(events.get(event) ?? []), fire]));

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { mobile: true, ...viewport });

  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? 'evaluate threw');
    return result.value;
  };

  const focus = async (selector) => {
    const found = await evaluate(
      `(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e) return false; e.focus(); return true; })()`,
    );
    if (!found) throw new Error(`nothing matched ${selector}`);
  };

  return {
    evaluate,

    goto: async (url) => {
      const loaded = once('Page.loadEventFired');
      await send('Page.navigate', { url });
      await loaded;
      await sleep(250);
    },

    // Real key events rather than assigning `.value`, which frameworks that
    // listen for input events do not always notice.
    type: async (selector, text) => {
      await focus(selector);
      await send('Input.insertText', { text });
    },

    click: async (selector) => {
      const clicked = await evaluate(
        `(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e) return false; e.click(); return true; })()`,
      );
      if (!clicked) throw new Error(`nothing matched ${selector}`);
      await sleep(300);
    },

    // Named for what it proves, not what it depicts — the caption rule applies
    // to filenames too, since the filename is what lands in the PR description.
    shot: async (name) => {
      await sleep(300);
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      const file = join(out, `${name}.png`);
      await writeFile(file, Buffer.from(data, 'base64'));
      console.log('shot', file);
      return file;
    },

    sleep,

    close: async () => {
      socket.close();
      await fetch(`http://127.0.0.1:${port}/json/close/${id}`).catch(() => {});
      chrome.kill();
    },
  };
}

// CLI: one page, no setup.
if (import.meta.url === `file://${process.argv[1]}`) {
  const [url, target, size] = process.argv.slice(2);
  if (!url || !target) {
    console.error('usage: capture-headless.mjs <url> <out.png> [WIDTHxHEIGHT]');
    process.exit(1);
  }
  const [width, height] = (size ?? '390x844').split('x').map(Number);
  const at = target.lastIndexOf('/');
  const page = await open({
    out: at === -1 ? '.' : target.slice(0, at),
    viewport: { width, height, deviceScaleFactor: 2 },
  });
  await page.goto(url);
  await page.shot(target.slice(at + 1).replace(/\.png$/, ''));
  await page.close();
}
