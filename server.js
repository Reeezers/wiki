#!/usr/bin/env node
/**
 * Endless Space 2 Localization Wiki - Node.js Content Editor Server
 * Password: 17ExTra
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = process.env.PORT || 8000;
const ROOT_DIR = __dirname;
const JS_DIR = path.join(ROOT_DIR, 'js');
const PASSWORD = '17ExTra';

const FILE_TITLES = {
  'ES2_Localization_2023Patch_Locales.js': '2023 Patch wiki + feature map',
  'ES2_Localization_2025Patch_Locales.js': '2025 Patch wiki',
  'ES2_Localization_Assets_Locales.js': 'Assets wiki',
  'ES2_Localization_Demo_Locales.js': 'Demo wiki',
  'ES2_Localization_DLC2_Locales.js': 'Supremacy (DLC 2) wiki',
  'ES2_Localization_DLC3_Locales.js': 'Penumbra (DLC 3) wiki',
  'ES2_Localization_DLC4_Locales.js': 'Awakening (DLC 4) wiki',
  'ES2_Localization_DLC5_Locales.js': 'Dark Matter (DLC 5) wiki',
  'ES2_Localization_Locales.js': 'Base Game wiki',
  'ES2_Localization_Quest_Locales.js': 'Quests wiki',
  'ES2_Localization_Update11_Locales.js': 'Stories (Update 11) wiki',
  'ES2_Localization_Update12_Locales.js': 'Celestial Worlds (Update 12) wiki',
  'ES2_Localization_Update13_Locales.js': 'Harmonic Memories (Update 13) wiki',
  'ES2_Localization_Update14_Locales.js': 'Update 14 wiki',
  'ES2_Localization_Updates_Locales.js': 'Community Updates wiki',
  'ES2_Localization_Vaulters_Locales.js': 'Vaulters wiki',
};

const FIELD_SUFFIXES = [
  'TooltipDescription', 'ObjectiveDescription', 'TooltipEffectBis', 'ShortDescription',
  'ObjectiveTooltip', 'ObjectiveTitle', 'OutcomeFailed', 'TooltipOverride', 'EffectOverride',
  'IntroDescription', 'ShortTitle', 'SimTitle', 'TooltipEffect', 'Confirmation', 'Description',
  'IntroTitle', 'Completed', 'Objective', 'Override', 'Outcome', 'Dialogue', 'Tooltip',
  'Reward', 'Failed', 'Effect', 'Format', 'Suffix', 'Label', 'Title', 'Text', 'Name'
];

function splitKey(key) {
  if (key.includes('-')) {
    const idx = key.lastIndexOf('-');
    return [key.slice(0, idx), key.slice(idx + 1)];
  }
  for (const suf of FIELD_SUFFIXES) {
    if (key.endsWith(suf)) {
      return [key.slice(0, -suf.length), suf];
    }
  }
  return [key, 'Text'];
}

function humanise(s) {
  return s.replace(/[_\-]+/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2').trim();
}

function parseJsFile(filename) {
  if (!filename.endsWith('.js')) filename = filename.replace('.html', '') + '.js';
  const filePath = path.join(JS_DIR, filename);
  if (!fs.existsSync(filePath)) throw new Error(`File ${filename} not found`);

  const content = fs.readFileSync(filePath, 'utf8');
  const dArrMatch = content.match(/const\s+D\s*=\s*(\[[\s\S]*?\]);\s*\n/);
  const dObjMatch = content.match(/const\s+D\s*=\s*(\{[\s\S]*?\})\s*,\s*P\s*=/);

  if (dArrMatch) {
    const dRaw = JSON.parse(dArrMatch[1]);
    const cMatch = content.match(/const\s+C\s*=\s*(\[[\s\S]*?\]);\s*\n/);
    const categories = cMatch ? JSON.parse(cMatch[1]) : [];
    const strings = dRaw.map((item, i) => {
      const catIdx = item.length > 2 ? item[2] : 0;
      const catName = categories[catIdx] ? categories[catIdx][0] : 'General';
      return { id: i, key: item[0], value: item[1], category: catName, catIndex: catIdx };
    });
    return {
      filename,
      type: 'array',
      strings,
      categories: categories.map((c, i) => ({ name: c[0], count: c[1], index: i }))
    };
  } else if (dObjMatch) {
    const dRaw = JSON.parse(dObjMatch[1]);
    const strings = Object.entries(dRaw).map(([key, value], i) => ({
      id: i, key, value, category: 'General', catIndex: 0
    }));
    return {
      filename,
      type: 'dict',
      strings,
      categories: [{ name: 'General', count: strings.length, index: 0 }]
    };
  }
  throw new Error(`Could not parse D in ${filename}`);
}

function rebuildJsContent(origContent, updatedStrings) {
  const dArrMatch = origContent.match(/const\s+D\s*=\s*(\[[\s\S]*?\]);\s*\n/);
  const dObjMatch = origContent.match(/const\s+D\s*=\s*(\{[\s\S]*?\})\s*,\s*P\s*=/);

  if (dArrMatch) {
    const cMatch = origContent.match(/const\s+C\s*=\s*(\[[\s\S]*?\]);\s*\n/);
    const origC = cMatch ? JSON.parse(cMatch[1]) : [];
    const catNames = origC.map(c => c[0]);

    for (const s of updatedStrings) {
      const cname = s.category || 'General';
      if (!catNames.includes(cname)) catNames.push(cname);
    }
    const catMap = Object.fromEntries(catNames.map((name, i) => [name, i]));
    const catCounts = new Array(catNames.length).fill(0);

    const newD = updatedStrings.map((s) => {
      const cname = s.category || 'General';
      const cidx = catMap[cname];
      catCounts[cidx]++;
      return [s.key, s.value, cidx];
    });

    const newC = catNames.map((name, i) => [name, catCounts[i]]);

    const groups = {};
    newD.forEach((item, dIdx) => {
      const key = item[0];
      const cidx = item[2];
      const [base, field] = splitKey(key);
      if (!groups[base]) {
        groups[base] = {
          cidx,
          groupName: humanise(base.slice(0, 15)),
          baseKey: base,
          fields: []
        };
      }
      groups[base].fields.push([field, dIdx]);
    });

    const newE = Object.values(groups).map(g => [g.cidx, g.groupName, g.baseKey, g.fields]);

    const bMatch = origContent.match(/const\s+B\s*=\s*(\[[\s\S]*?\]);\s*\n/);
    const bStr = bMatch ? bMatch[0] : 'const B=[];\n';

    let restIdx = origContent.indexOf('const $=');
    if (restIdx === -1) restIdx = origContent.indexOf('const W=');
    if (restIdx === -1) restIdx = bMatch ? bMatch.index + bMatch[0].length : (cMatch ? cMatch.index + cMatch[0].length : 0);

    const restCode = origContent.slice(restIdx);
    return `const D=${JSON.stringify(newD)};\nconst E=${JSON.stringify(newE)};\nconst C=${JSON.stringify(newC)};\n${bStr}\n${restCode}`;
  } else if (dObjMatch) {
    const newDict = Object.fromEntries(updatedStrings.map(s => [s.key, s.value]));
    return origContent.replace(
      /const\s+D\s*=\s*\{[\s\S]*?\}\s*,\s*P\s*=/,
      () => `const D=${JSON.stringify(newDict)},P=`
    );
  }
  throw new Error('Unknown JS structure');
}

function getGitInfo() {
  let branch = 'unknown';
  let isClean = false;
  const recent = [];

  try {
    branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT_DIR }).toString().trim();
  } catch (e) {}

  try {
    const status = execSync('git status --porcelain', { cwd: ROOT_DIR }).toString().trim();
    isClean = status.length === 0;
  } catch (e) {}

  try {
    const log = execSync('git log -n 8 --pretty=format:%h|%s|%cr|%an', { cwd: ROOT_DIR }).toString().trim();
    for (const line of log.split('\n')) {
      if (!line) continue;
      const [hash, message, relativeTime, author] = line.split('|');
      recent.push({ hash, message, relativeTime, author });
    }
  } catch (e) {}

  return { branch, clean: isClean, latest: recent[0] || null, recent };
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Editor-Password');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;

  if (req.method === 'GET') {
    if (pathname === '/api/files') {
      const jsFiles = fs.readdirSync(JS_DIR).filter(f => f.startsWith('ES2_Localization_') && f.endsWith('.js')).sort();
      const list = jsFiles.map(jf => {
        let stringCount = 0, topicCount = 0;
        try {
          const parsed = parseJsFile(jf);
          stringCount = parsed.strings.length;
          topicCount = parsed.categories.length;
        } catch (e) {}
        return {
          id: jf.replace('ES2_Localization_', '').replace('_Locales.js', ''),
          filename: jf,
          html: jf.replace('.js', '.html'),
          title: FILE_TITLES[jf] || jf,
          stringCount,
          topicCount,
          sizeKB: Math.round(fs.statSync(path.join(JS_DIR, jf)).size / 1024)
        };
      });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(list));
      return;
    }

    if (pathname === '/api/file') {
      const name = parsedUrl.searchParams.get('name');
      if (!name) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Missing 'name' query param" }));
        return;
      }
      try {
        const data = parseJsFile(name);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(data));
      } catch (err) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (pathname === '/api/git-status') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(getGitInfo()));
      return;
    }

    // Static file serving
    let safePath = path.normalize(path.join(ROOT_DIR, pathname === '/' ? 'editor.html' : pathname));
    if (!safePath.startsWith(ROOT_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
      const ext = path.extname(safePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(safePath).pipe(res);
      return;
    }

    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let payload = {};
      try {
        payload = JSON.parse(body || '{}');
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        return;
      }

      if (pathname === '/api/auth') {
        const pwd = payload.password || req.headers['x-editor-password'];
        if (pwd === PASSWORD) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Authenticated' }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Incorrect password. Key in 17ExTra to edit.' }));
        }
        return;
      }

      if (pathname === '/api/save') {
        const pwd = payload.password || req.headers['x-editor-password'];
        if (pwd !== PASSWORD) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Unauthorized: Invalid password. To edit and save changes to the repository, you must key in 17ExTra.'
          }));
          return;
        }

        let filename = payload.filename || '';
        if (!filename.endsWith('.js')) filename = filename.replace('.html', '') + '.js';
        const targetPath = path.join(JS_DIR, filename);

        if (!fs.existsSync(targetPath)) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `File ${filename} not found` }));
          return;
        }

        try {
          const orig = fs.readFileSync(targetPath, 'utf8');
          const newJs = rebuildJsContent(orig, payload.strings || []);
          fs.writeFileSync(targetPath, newJs, 'utf8');

          const relPath = path.relative(ROOT_DIR, targetPath);
          execSync(`git add "${relPath}"`, { cwd: ROOT_DIR });

          const commitMsg = payload.commitMessage ||
            (payload.keyHint ? `Update '${payload.keyHint}' in ${filename} via Wiki Editor` : `Update ${filename} via Wiki Editor`);

          let commitHash = 'unchanged';
          const staged = execSync('git diff --name-only --cached', { cwd: ROOT_DIR }).toString().trim();
          if (staged) {
            execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { cwd: ROOT_DIR });
            commitHash = execSync('git rev-parse --short HEAD', { cwd: ROOT_DIR }).toString().trim();
          }

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: true,
            filename,
            commit: commitHash,
            message: `Successfully saved and committed to repository (${commitHash})`,
            timestamp: new Date().toISOString(),
            git: getGitInfo()
          }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Endpoint not found' }));
    });
  }
});

server.listen(PORT, () => {
  console.log(`Endless Space 2 Localization Wiki - Editor Server running on port ${PORT}`);
  console.log(`Editor URL: http://localhost:${PORT}/editor.html`);
  console.log(`Password: ${PASSWORD}`);
});
