const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = path.join(root, 'frontend');
const output = path.join(root, 'public');
const configuredApiBase = String(process.env.API_BASE_URL || '').trim().replace(/\/+$/, '');
const apiBase = configuredApiBase || '/api';

fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(source, output, { recursive: true });
fs.writeFileSync(path.join(output, 'config.js'), `window.API_BASE = ${JSON.stringify(apiBase)};\n`);