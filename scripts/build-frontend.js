const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = path.join(root, 'frontend');
const output = path.join(root, 'public');
const configuredApiBase = String(process.env.API_BASE_URL || '').trim().replace(/\/+$/, '');

if (process.env.VERCEL && !configuredApiBase) {
    throw new Error('API_BASE_URL must be configured in Vercel before building the frontend');
}

fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(source, output, { recursive: true });
fs.writeFileSync(path.join(output, 'config.js'), `window.API_BASE = ${JSON.stringify(configuredApiBase || 'http://localhost:5002/api')};\n`);