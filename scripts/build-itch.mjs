import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'out');
const itchDir = path.join(rootDir, 'out-itch');

console.log('🚀 Preparing itch.io HTML5 build...');

// 1. Clean and copy out/ to out-itch/
if (fs.existsSync(itchDir)) {
  fs.rmSync(itchDir, { recursive: true, force: true });
}

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDirRecursive(outDir, itchDir);
console.log('✅ Copied out/ to out-itch/');

// 2. Process all files to convert absolute paths (/_next/) to relative (./_next/)
function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.name.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');

      // Add TURBOPACK_CHUNK_BASE_PATH in head
      if (!content.includes('TURBOPACK_CHUNK_BASE_PATH')) {
        content = content.replace(
          '<head>',
          '<head><script>window.TURBOPACK_CHUNK_BASE_PATH="./_next/";</script>'
        );
      }

      // Convert absolute paths to relative
      content = content.replaceAll('href="/_next/', 'href="./_next/');
      content = content.replaceAll('src="/_next/', 'src="./_next/');
      content = content.replaceAll('href="/favicon.ico', 'href="./favicon.ico');
      content = content.replaceAll('"\\/_next\\/', '"\\.\\/_next\\/');
      content = content.replaceAll('"/_next/', '"./_next/');

      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`  Updated HTML: ${entry.name}`);
    } else if (entry.name.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');

      // Replace chunk base path in Turbopack runtime
      content = content.replaceAll('"/_next/"', '"./_next/"');
      content = content.replaceAll('"\\/_next\\/"', '"\\.\\/_next\\/"');

      fs.writeFileSync(fullPath, content, 'utf8');
    } else if (entry.name.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      content = content.replaceAll('url(/_next/', 'url(./_next/');
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

processDirectory(itchDir);
console.log('✅ Converted all absolute paths to relative paths for itch.io iframe compatibility');
