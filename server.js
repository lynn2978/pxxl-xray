// Hana-written server: run official Xray core as a VLESS+WS inbound.
// Pxxl edge terminates TLS on *.pxxlspace.cv:443 and forwards plain WS to $PORT.
// Env: UUID (required), WSPATH (default /api/v1/sync), PORT (platform-injected, default 8080).
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const crypto = require('crypto');

const uuid = process.env.UUID;
const wsPath = process.env.WSPATH || '/api/v1/sync';
const port = parseInt(process.env.PORT || '8080', 10);
if (!uuid) { console.error('UUID env required'); process.exit(1); }

const bin = path.join(__dirname, 'web-worker');
if (!fs.existsSync(bin)) {
  try { execSync('node setup.js', { stdio: 'inherit', cwd: __dirname }); }
  catch (e) { process.exit(1); }
}

const config = {
  log: { loglevel: 'warning' },
  inbounds: [{
    listen: '0.0.0.0',
    port: port,
    protocol: 'vless',
    settings: { clients: [{ id: uuid }], decryption: 'none' },
    streamSettings: { network: 'ws', wsSettings: { path: wsPath } },
    sniffing: { enabled: true, destOverride: ['http', 'tls', 'quic'] }
  }],
  outbounds: [
    { protocol: 'freedom', tag: 'direct', settings: { domainStrategy: 'UseIPv4' } },
    { protocol: 'blackhole', tag: 'block' }
  ],
  routing: {
    domainStrategy: 'IPIfNonMatch',
    rules: [
      { type: 'field', outboundTag: 'block', protocol: ['bittorrent'] },
      { type: 'field', outboundTag: 'block', ip: ['geoip:private'] },
      { type: 'field', outboundTag: 'block', domain: ['geosite:private'] }
    ]
  },
  dns: { servers: ['https://1.1.1.1/dns-query', 'https://8.8.8.8/dns-query'], queryStrategy: 'UseIPv4' }
};

const cfgPath = path.join('/tmp', 'xray-' + crypto.randomBytes(4).toString('hex') + '.json');
fs.writeFileSync(cfgPath, JSON.stringify(config));
const child = spawn(bin, ['run', '-c', cfgPath], { stdio: 'inherit', cwd: __dirname });
child.on('exit', (code) => process.exit(code || 0));
process.on('SIGTERM', () => child.kill('SIGTERM'));
