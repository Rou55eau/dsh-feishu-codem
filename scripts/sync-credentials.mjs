#!/usr/bin/env node
/**
 * dsh-feishu-codem — 同步飞书 CodeM 的 accessToken 到 DSH 凭证文件。
 *
 * 流程：读取 ~/.codem/.credentials.json（飞书 CodeM 登录凭证）
 *       → 写入 $DSH_HOME/.credentials.yaml 的 CODEM_API_KEY
 *
 * DSH 的 dsh-credentials-local 插件会热加载凭证文件（默认 watch），
 * 因此同步完成后无需重启 DSH，正在进行的会话下次请求即用新 token。
 *
 * 用法：node scripts/sync-credentials.mjs
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const codemCredFile = path.join(os.homedir(), '.codem', '.credentials.json');
const dshHome = process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
const credFile = path.join(dshHome, '.credentials.yaml');

// ---------- 1. 读取 CodeM 凭证 ----------
if (!fs.existsSync(codemCredFile)) {
  console.error(`[错误] 未找到 CodeM 凭证：${codemCredFile}`);
  console.error('请先安装并登录飞书 CodeM（访问 https://codem.feishu.cn），再运行本脚本。');
  process.exit(1);
}

let codem;
try {
  codem = JSON.parse(fs.readFileSync(codemCredFile, 'utf-8'));
} catch (e) {
  console.error(`[错误] 读取 CodeM 凭证失败：${e.message}`);
  process.exit(1);
}

const token = codem.codemAiOauth?.accessToken;
if (!token) {
  console.error('[错误] CodeM 凭证中未找到 accessToken（字段 codemAiOauth.accessToken）。');
  process.exit(1);
}

// ---------- 2. 检查过期（仅提示，不阻断） ----------
const expiresAt = codem.codemAiOauth?.expiresAt;
if (expiresAt && Date.now() > new Date(expiresAt).getTime()) {
  console.warn('[提示] CodeM accessToken 已过期，请重新登录 CodeM 后再同步。');
}

// ---------- 3. 更新或追加 CODEM_API_KEY ----------
let lines = [];
try {
  lines = fs.readFileSync(credFile, 'utf-8').split(/\r?\n/);
} catch {
  /* 文件不存在则从空开始 */
}

const entry = `CODEM_API_KEY: ${token}`;
const idx = lines.findIndex((l) => /^CODEM_API_KEY\s*:/.test(l));
if (idx >= 0) lines[idx] = entry;
else lines.push(entry);

fs.mkdirSync(dshHome, { recursive: true });
fs.writeFileSync(credFile, lines.filter((l) => l.trim() !== '').join('\n') + '\n', 'utf-8');

console.log(`[完成] 已写入 DSH 凭证：${credFile}`);
console.log('DSH 的 credentials 插件会热加载该文件，当前会话无需重启。');
