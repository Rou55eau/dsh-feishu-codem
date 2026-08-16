#!/usr/bin/env bash
# dsh-feishu-codem — 一键安装到原生 DSH
# 用法：bash scripts/install.sh [profile]
#   profile 默认 web；headless 等其他 profile 可传参，如：bash scripts/install.sh headless
set -e

PROFILE="${1:-web}"
PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ---------- 0. 检查 dsh ----------
if ! command -v dsh >/dev/null 2>&1; then
  echo "错误：未找到 dsh 命令。"
  echo "请先安装 DeepSeek Harness：npm install -g @deepseek-ai/dsh"
  exit 1
fi

# ---------- 1. 把插件装进 profile（作为 bundle 层） ----------
echo "==> [1/2] 安装插件到 profile '$PROFILE' ..."
dsh plugin --profile "$PROFILE" add "file:$PLUGIN_DIR"

# ---------- 2. 同步飞书 CodeM 凭证 ----------
echo "==> [2/2] 同步飞书 CodeM 凭证 ..."
node "$PLUGIN_DIR/scripts/sync-credentials.mjs"

echo ""
echo "=============================================="
echo "  安装完成！启动 DSH 即可使用飞书 CodeM 模型："
echo "    dsh $PROFILE"
echo "  默认模型已设为 codem-router/auto（走飞书 CodeM 额度）。"
echo "=============================================="
