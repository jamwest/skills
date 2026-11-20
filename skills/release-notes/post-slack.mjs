#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";

const CONFIG_PATH = join(homedir(), ".config", "release-notes", "slack.json");

const { values } = parseArgs({
  options: {
    target: { type: "string" },
    channel: { type: "string" },
    file: { type: "string" },
    update: { type: "string" },
  },
});

const config = existsSync(CONFIG_PATH)
  ? JSON.parse(readFileSync(CONFIG_PATH, "utf8"))
  : {};

const channel =
  values.channel ?? (values.target ? config.channels?.[values.target] : undefined);
if (!channel || !values.file) {
  console.error(
    "usage: post-slack.mjs (--target <name> | --channel <id>) --file <json> [--update <ts>]",
  );
  if (values.target) {
    console.error(`No channel "${values.target}" in ${CONFIG_PATH}.`);
  }
  process.exit(2);
}

const keychainService = config.keychainService ?? "slack-release-notes-bot";
let token;
try {
  token = execFileSync(
    "/usr/bin/security",
    ["find-generic-password", "-s", keychainService, "-w"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  ).trim();
} catch {
  console.error(
    `No token in Keychain. Add it with:\n  security add-generic-password -a "$USER" -s ${keychainService} -w`,
  );
  process.exit(1);
}

const message = JSON.parse(readFileSync(values.file, "utf8"));
if (!message.text || !Array.isArray(message.blocks)) {
  console.error("The file needs a `text` fallback and a `blocks` array.");
  process.exit(2);
}
const blockCount =
  message.blocks.length +
  (message.attachments ?? []).reduce((n, a) => n + (a.blocks?.length ?? 0), 0);
if (blockCount > 50) {
  console.error(`Slack allows 50 blocks per message; this has ${blockCount}.`);
  process.exit(2);
}

const method = values.update ? "chat.update" : "chat.postMessage";
const body = {
  channel,
  text: message.text,
  blocks: message.blocks,
  ...(message.attachments ? { attachments: message.attachments } : {}),
  unfurl_links: false,
  ...(values.update ? { ts: values.update } : {}),
};

const res = await fetch(`https://slack.com/api/${method}`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json; charset=utf-8",
  },
  body: JSON.stringify(body),
});
const data = await res.json();

if (!data.ok) {
  console.error(`${method} failed: ${data.error}`);
  for (const m of data.response_metadata?.messages ?? []) console.error(`  ${m}`);
  process.exit(1);
}

console.log(JSON.stringify({ method, channel: data.channel, ts: data.ts }));
