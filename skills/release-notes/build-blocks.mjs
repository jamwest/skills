#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";

const COLORS = { live: "#1a7a61", inProgress: "#9aa0a6", behindTheScenes: "#d0d4d8" };

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("usage: build-blocks.mjs <notes.json> <message.json>");
  process.exit(2);
}

const notes = JSON.parse(readFileSync(input, "utf8"));

const section = (text) => ({ type: "section", text: { type: "mrkdwn", text } });
const context = (text) => ({ type: "context", elements: [{ type: "mrkdwn", text }] });
const code = (s) => `\`${s}\``;
const bullets = (items) => items.map((b) => `• ${b}`).join("\n");

function tag(feature) {
  if (feature.note) return `_${feature.note}_`;
  if (!feature.flags?.length) return "";
  const needs = feature.needs?.length ? ` _needs_ ${feature.needs.map(code).join(" ")}` : "";
  return `🏁 ${feature.flags.map(code).join(" ")}${needs}`;
}

const feature = (f) => {
  const t = tag(f);
  return section(`*${f.title}*${t ? `   ${t}` : ""}\n${bullets(f.bullets)}`);
};

function pair(color, heading, subtitle, body) {
  const head = { color, fallback: heading, blocks: [section(heading)] };
  if (subtitle) head.blocks.push(context(subtitle));
  return [head, { fallback: heading, blocks: body }];
}

const attachments = [];
if (notes.live?.length) {
  attachments.push(
    ...pair(COLORS.live, ":white_check_mark:  *Live for everyone*", null, notes.live.map(feature)),
  );
}
if (notes.inProgress?.length) {
  attachments.push(
    ...pair(
      COLORS.inProgress,
      ":construction:  *In progress, behind feature flags*",
      "Progress on features that are not switched on for everyone yet",
      notes.inProgress.map(feature),
    ),
  );
}
const tail = [];
if (notes.behindTheScenes?.length) tail.push(section(bullets(notes.behindTheScenes)));
if (notes.prUrl) {
  tail.push({
    type: "actions",
    elements: [{ type: "button", text: { type: "plain_text", text: "View release PR" }, url: notes.prUrl }],
  });
}
if (tail.length) {
  attachments.push(...pair(COLORS.behindTheScenes, ":gear:  *Behind the scenes*", null, tail));
}

const status = notes.status ?? "Deploying :hourglass_flowing_sand:";
const message = {
  text: `Release Notes — ${notes.date} (${status.replace(/\s*:[a-z_]+:\s*/g, "").trim()}): ${notes.summary}`,
  blocks: [
    { type: "header", text: { type: "plain_text", text: `:rocket: Release Notes — ${notes.date}`, emoji: true } },
    context(`*Status:* ${status}`),
  ],
  attachments,
};

writeFileSync(output, `${JSON.stringify(message, null, 2)}\n`);
