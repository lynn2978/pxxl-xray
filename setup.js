// Hana-written setup: fetch the official Xray release, unpack it as web-worker.
// Runs at build time (npm run build) and again from server.js if the binary is missing.
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VERSION = 'v26.11.9';
const URL = 'https://github.com/XTLS/Xray-core/releases/download/' + VERSION + '/Xray-linux-64.zip';
const ZIP = path.join(__dirname, 'xray.zip');
const BIN = path.join(__dirname, 'web-worker');

function download(url, file) {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(file);
    https.get(url, { headers: { 'User-Agent': 'pxxl-xray-node-setup' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        out.close();
        fs.unlinkSync(file);
        return download(res.headers.location, file).then(resolve, reject);
      }
      if (res.statusCode !== 200) return reject(new Error('download failed: HTTP ' + res.statusCode));
      res.pipe(out);
      out.on('finish', () => out.close(resolve));
    }).on('error', reject);
  });
}

(async () => {
  if (!fs.existsSync(BIN)) {
    console.log('downloading Xray ' + VERSION + '...');
    await download(URL, ZIP);
    execSync('unzip -o -q xray.zip && mv -f xray web-worker && chmod +x web-worker && rm -f xray.zip LICENSE README.md', { cwd: __dirname, stdio: 'inherit' });
  }
  for (const f of ['geoip.dat', 'geosite.dat']) {
    if (!fs.existsSync(path.join(__dirname, f))) throw new Error('missing ' + f + ' after unpack');
  }
  console.log('setup ok');
})().catch((e) => { console.error(e); process.exit(1); });
