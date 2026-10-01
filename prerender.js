import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function prerender() {
  console.log('1. Building client bundle...');
  execSync('npx vite build --outDir dist/client', { stdio: 'inherit' });

  console.log('2. Building SSR bundle...');
  execSync('npx vite build --ssr src/entry-server.tsx --outDir dist/server', { stdio: 'inherit' });

  console.log('3. Pre-rendering HTML...');
  const templatePath = path.resolve(__dirname, 'dist/client/index.html');
  const template = fs.readFileSync(templatePath, 'utf-8');

  // Import SSR entry
  const serverEntryPath = path.resolve(__dirname, 'dist/server/entry-server.js');
  const { render } = await import(`file://${serverEntryPath}`);

  const { html: appHtml } = render();

  // Inject rendered HTML into root
  const finalHtml = template.replace(
    /<div id="root">[\s\S]*?<\/div>/,
    `<div id="root">${appHtml}</div>`
  );

  // Copy dist/client assets to dist
  const distDir = path.resolve(__dirname, 'dist');
  const clientDir = path.resolve(__dirname, 'dist/client');

  fs.cpSync(clientDir, distDir, { recursive: true });

  // Write final pre-rendered index.html
  fs.writeFileSync(path.resolve(distDir, 'index.html'), finalHtml);
  
  // Clean up server directory and temporary client directory
  fs.rmSync(path.resolve(__dirname, 'dist/server'), { recursive: true, force: true });
  fs.rmSync(clientDir, { recursive: true, force: true });

  console.log('Pre-rendering completed! Pre-rendered HTML written to dist/index.html');
}

prerender().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
