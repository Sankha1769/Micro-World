#!/bin/bash
# Rebuilds index.html from src/. Needs: npm install three@0.160.0 esbuild
set -e
cd "$(dirname "$0")"
cat src/core.js src/data.js src/micro.js src/bio.js src/cells.js src/app.js | sed -E 's/\bBlob\b/Amoeboid/g' > main.tmp.js
npx esbuild main.tmp.js --bundle --minify --format=iife --target=es2020 --outfile=bundle.tmp.js --log-level=warning
python3 - <<'PY'
head=open('parts/00_head.html').read()
js=open('bundle.tmp.js').read().replace('</script','<\\/script')
open('index.html','w').write(head+'\n<script>\n'+js+'\n</script>\n')
PY
rm main.tmp.js bundle.tmp.js
