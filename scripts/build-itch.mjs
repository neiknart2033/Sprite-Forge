import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'out');
const itchDir = path.join(rootDir, 'out-itch');
const zipOutputFile = path.join(rootDir, 'sprite-forge-itch.zip');

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

// 2. Add .nojekyll to ensure itch.io and Jekyll servers do not ignore _next directory
fs.writeFileSync(path.join(itchDir, '.nojekyll'), '', 'utf8');
console.log('✅ Created .nojekyll');

// 3. Find and read compiled CSS to inline into index.html
const chunksDir = path.join(itchDir, '_next', 'static', 'chunks');
let combinedCss = '';

if (fs.existsSync(chunksDir)) {
  const cssFiles = fs.readdirSync(chunksDir).filter((file) => file.endsWith('.css'));
  for (const cssFile of cssFiles) {
    const cssPath = path.join(chunksDir, cssFile);
    let cssContent = fs.readFileSync(cssPath, 'utf8');

    // In CSS, font URLs are ../media/... relative to _next/static/chunks/
    // For inlining directly into index.html (at root /), font URLs must be ./_next/static/media/...
    const inlinedCss = cssContent.replaceAll('url(../media/', 'url(./_next/static/media/');
    combinedCss += inlinedCss + '\n';
    console.log(`✅ Loaded and adjusted CSS for inlining: ${cssFile} (${cssContent.length} bytes)`);
  }
}

// 4. Process all files to convert absolute paths (/_next/) to relative (./_next/)
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

      // If we have compiled CSS, inline it directly inside <head> so the page NEVER loses styling
      if (combinedCss && content.includes('</head>') && !content.includes('id="sprite-forge-inlined-css"')) {
        const styleTag = `\n<style id="sprite-forge-inlined-css">\n${combinedCss}</style>\n`;
        content = content.replace('</head>', `${styleTag}</head>`);
        console.log(`  🎨 Inlined ${combinedCss.length} bytes of CSS into ${entry.name}`);
      }

      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`  Updated HTML: ${entry.name}`);
    } else if (entry.name.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');

      // Next.js client runtime uses getAssetPrefix to inspect document.currentScript.src.
      // In iframes or async scripts, document.currentScript can fail or cause InvariantError E783/E784.
      // Make getAssetPrefix 100% resilient so React hydration never crashes.
      if (content.includes('Expected document.currentScript')) {
        const start = content.indexOf('function l(){let e=document.currentScript');
        if (start !== -1) {
          const end = content.indexOf('return t.slice(0,n)}', start) + 'return t.slice(0,n)}'.length;
          const safeL = 'function l(){try{let e=document.currentScript;if(e instanceof HTMLScriptElement){let{pathname:t}=new URL(e.src),n=t.indexOf(\"/_next/\");if(n!==-1)return t.slice(0,n)}}catch(x){}return \"\"}';
          content = content.slice(0, start) + safeL + content.slice(end);
          console.log(`  🛡️ Patched getAssetPrefix in ${entry.name} to ensure flawless React hydration`);
        }
      }

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

// 5. Package into sprite-forge-itch.zip using JSZip
// This guarantees 100% POSIX forward slashes ('/') in ZIP headers, avoiding Windows backslash issues on Linux/itch.io
console.log('📦 Creating sprite-forge-itch.zip with JSZip (POSIX forward slash entries)...');
const zip = new JSZip();

function addFilesToZip(dirPath, zipFolder = '') {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const entryZipPath = zipFolder ? `${zipFolder}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      addFilesToZip(fullPath, entryZipPath);
    } else {
      const fileData = fs.readFileSync(fullPath);
      zip.file(entryZipPath, fileData);
    }
  }
}

addFilesToZip(itchDir);

const zipBuffer = await zip.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 9 },
});

fs.writeFileSync(zipOutputFile, zipBuffer);
const zipStats = fs.statSync(zipOutputFile);

console.log(`🎉 SUCCESS: Created ${zipOutputFile} (${(zipStats.size / 1024).toFixed(1)} KB)`);
console.log('✨ All CSS is inlined directly in index.html and all ZIP entries use Unix-compatible forward slashes!');
