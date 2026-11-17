#!/usr/bin/env node
// Combine the evidence screenshots into one annotated PDF. Bitbucket takes one
// dropped file far more easily than several images, and its CLI can't attach
// anything, so the PDF is the deliverable.
//
//   node build-pdf.mjs <dir>/evidence.json [out.pdf]
//
// evidence.json, with paths relative to the JSON file:
//
//   {
//     "title": "GROOV-3322 | Ask gender in onboarding",
//     "summary": "One line on what the change is.",
//     "shots": [
//       {
//         "file": "01-gender-answered.png",
//         "title": "Details form, gender answered",
//         "caption": "What this shot proves.",
//         "scale": 2,
//         "zoom": { "y": 640, "h": 280 },
//         "highlights": [
//           { "x": 20, "y": 860, "w": 460, "h": 270, "label": "New: gender question" }
//         ]
//       }
//     ]
//   }
//
// Highlight boxes are in CSS pixels of the captured page, which is what
// getBoundingClientRect and page.rect() return. "scale" is the capture's device
// scale factor (default 2) and maps them onto the image's real pixels.
// "zoom" is optional: the area (CSS pixels; "x" and "w" default to the full
// width) to enlarge, when the padding around the boxes would cut a question
// in half.
//
// Same rule as capture-headless.mjs: no dependencies. Chrome renders the page
// and prints it, so there is no PDF library to install.

import { readFile, writeFile, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { open } from './capture-headless.mjs';

function pngSize(buffer) {
  if (buffer.toString('ascii', 1, 4) !== 'PNG') throw new Error('not a PNG');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

const escape = (text = '') =>
  String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const pct = (value, of) => `${((value / of) * 100).toFixed(3)}%`;

// The highlighted part of a screen is often unreadable at full-page size, so
// the text column repeats it, cropped around every box: full width for a tall
// phone shot, the boxes plus padding for a wide one. The copy carries no
// marks, so the change can be seen exactly as it renders.
function zoomArea(highlights, scale, width, height) {
  if (highlights.length === 0) return null;
  const pad = 64 * scale;
  const top = Math.max(0, Math.min(...highlights.map((h) => h.y * scale)) - pad);
  const bottom = Math.min(height, Math.max(...highlights.map((h) => (h.y + h.h) * scale)) + pad);
  if (width < height) return { x: 0, y: top, w: width, h: bottom - top };
  const left = Math.max(0, Math.min(...highlights.map((h) => h.x * scale)) - pad);
  const right = Math.min(width, Math.max(...highlights.map((h) => (h.x + h.w) * scale)) + pad);
  return { x: left, y: top, w: right - left, h: bottom - top };
}

function zoomView(path, area, width) {
  const img = [
    `width:${pct(width, area.w)}`,
    `left:${pct(-area.x, area.w)}`,
    `top:${pct(-area.y, area.h)}`,
  ].join(';');
  return `<div class="zoom"><div class="clip" style="aspect-ratio:${area.w}/${area.h}"><img src="${pathToFileURL(path)}" style="${img}"></div></div>`;
}

async function shotPage(dir, shot, index) {
  const path = resolve(dir, shot.file);
  const { width, height } = pngSize(await readFile(path));
  const scale = shot.scale ?? 2;
  const highlights = shot.highlights ?? [];
  const boxesIn = (area) =>
    highlights
      .map((h, i) => {
        const style = [
          `left:${pct(h.x * scale - area.x, area.w)}`,
          `top:${pct(h.y * scale - area.y, area.h)}`,
          `width:${pct(h.w * scale, area.w)}`,
          `height:${pct(h.h * scale, area.h)}`,
        ].join(';');
        return `<div class="box" style="${style}"><span class="badge">${i + 1}</span></div>`;
      })
      .join('');
  const whole = { x: 0, y: 0, w: width, h: height };
  const zoom =
    shot.zoom ?
      {
        x: (shot.zoom.x ?? 0) * scale,
        y: shot.zoom.y * scale,
        w: shot.zoom.w ? shot.zoom.w * scale : width,
        h: shot.zoom.h * scale,
      }
    : zoomArea(highlights, scale, width, height);
  const legend = highlights
    .map((h, i) => `<li><span class="badge">${i + 1}</span><span>${escape(h.label)}</span></li>`)
    .join('');
  return `<section>
  <div class="text">
    <p class="step">${index + 1} of %TOTAL%</p>
    <h2>${escape(shot.title)}</h2>
    <p>${escape(shot.caption)}</p>
    ${legend ? `<ol class="legend">${legend}</ol>` : ''}
    ${zoom ? zoomView(path, zoom, width) : ''}
  </div>
  <figure><div class="frame"><img src="${pathToFileURL(path)}">${boxesIn(whole)}</div></figure>
</section>`;
}

export async function buildPdf(manifestPath, outPath) {
  const dir = dirname(resolve(manifestPath));
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const total = String(manifest.shots.length);
  const pages = (await Promise.all(manifest.shots.map((shot, i) => shotPage(dir, shot, i)))).map(
    (page) => page.replace('%TOTAL%', total),
  );
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font: 11pt/1.45 -apple-system, system-ui, sans-serif; color: #18181b; margin: 0; }
  header { break-after: page; padding-top: 25mm; }
  header h1 { font-size: 22pt; margin: 0 0 4mm; }
  header ol { padding-left: 5mm; }
  section { break-after: page; height: 185mm; display: flex; gap: 10mm; overflow: hidden; }
  section:last-child { break-after: auto; }
  section .text { flex: 0 0 90mm; }
  .step { font-size: 9pt; color: #71717a; margin: 0; }
  h2 { font-size: 15pt; margin: 1mm 0 3mm; }
  figure { margin: 0; flex: 1; min-width: 0; display: flex; justify-content: center; align-items: flex-start; }
  .frame { position: relative; display: inline-block; max-width: 100%; }
  .frame img { display: block; max-width: 100%; max-height: 183mm; width: auto; height: auto; border: 1px solid #d4d4d8; border-radius: 6px; }
  .box { position: absolute; outline: 2px solid #e11d48; outline-offset: 3px; border-radius: 6px; }
  .box .badge { position: absolute; top: -3px; left: -30px; }
  .zoom { position: relative; margin: 5mm 0 0; }
  .zoom .clip { position: relative; overflow: hidden; border: 1px solid #d4d4d8; border-radius: 6px; }
  .zoom .clip img { position: absolute; max-width: none; }
  .badge { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px;
    border-radius: 50%; background: #e11d48; color: white; font-size: 10pt; font-weight: 600; }
  .legend { list-style: none; padding: 0; margin: 4mm 0 0; }
  .legend li { display: flex; gap: 2.5mm; align-items: flex-start; margin-bottom: 2mm; }
  .legend .badge { flex: none; }
</style></head><body>
<header>
  <h1>${escape(manifest.title)}</h1>
  ${manifest.summary ? `<p>${escape(manifest.summary)}</p>` : ''}
  <ol>${manifest.shots.map((s) => `<li>${escape(s.title)}</li>`).join('')}</ol>
</header>
${pages.join('\n')}
</body></html>`;

  const htmlPath = join(dir, '.evidence.html');
  await writeFile(htmlPath, html);
  const page = await open({ out: dir, viewport: { width: 1200, height: 900, deviceScaleFactor: 1 } });
  try {
    await page.goto(pathToFileURL(htmlPath).href);
    await page.evaluate('Promise.all([...document.images].map((i) => i.decode()))');
    return await page.pdf(outPath ?? join(dir, 'evidence.pdf'));
  } finally {
    await page.close();
    await rm(htmlPath, { force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [manifest, out] = process.argv.slice(2);
  if (!manifest) {
    console.error('usage: build-pdf.mjs <evidence.json> [out.pdf]');
    process.exit(1);
  }
  await buildPdf(manifest, out);
}
