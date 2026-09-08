#!/bin/zsh
set -e
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "需要先安装 Node.js 22 或更高版本。"
  read -r
  exit 1
fi
if [ ! -d node_modules ]; then
  npm install
fi
npm run local
