#!/bin/bash
# Concatenate sources, bundle three.js in, and assemble the single-file page.
set -e
cd /home/claude/mv
FILES="src/core.js src/new_common.js"
for f in src/new_*.js; do case $f in src/new_common.js|src/new_post.js) ;; *) FILES="$FILES $f";; esac; done
FILES="$FILES src/data.js src/new_post.js src/micro.js src/bio.js src/cells.js src/app.js"
cat $FILES | sed -E 's/\bBlob\b/Amoeboid/g' > vendor/main.js
vendor/node_modules/.bin/esbuild vendor/main.js --bundle --minify --format=iife --target=es2020 --outfile=out/bundle.js --log-level=warning
python3 - <<'PY'
head=open('/home/claude/mv/parts/00_head.html').read()
js=open('/home/claude/mv/out/bundle.js').read().replace('</script','<\\/script')
open('/home/claude/mv/out/microverse.html','w').write(head+'\n<script>\n'+js+'\n</script>\n')
PY
ls -la out/microverse.html
