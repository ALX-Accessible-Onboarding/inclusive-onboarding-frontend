const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const JS_PATH = path.resolve(__dirname, '../dist/inclusive-kit.js');
const CSS_PATH = path.resolve(__dirname, '../dist/ik-base.css');

if (!fs.existsSync(JS_PATH) || !fs.existsSync(CSS_PATH)) {
  console.error('[SIZE-CHECK] Error: dist files not found. Run build first.');
  process.exit(1);
}

const jsBuffer = fs.readFileSync(JS_PATH);
const cssBuffer = fs.readFileSync(CSS_PATH);

const jsRaw = jsBuffer.length;
const cssRaw = cssBuffer.length;
const totalRaw = jsRaw + cssRaw;

const jsGzip = zlib.gzipSync(jsBuffer).length;
const cssGzip = zlib.gzipSync(cssBuffer).length;
const concatGzip = zlib.gzipSync(Buffer.concat([jsBuffer, cssBuffer])).length;

// Budget Limits:
// Base kit budget (without voice guide): 100 KB raw / 30 KB gzip
// Full voice-enabled kit budget: 160 KB raw / 50 KB gzip
const isStrict = process.env.STRICT_BUDGET === 'true' || process.env.STRICT_BUDGET === '1';
const MAX_RAW_BYTES = isStrict ? 102400 : 163840; // 100 KB strict, 160 KB full
const MAX_GZIP_BYTES = isStrict ? 30720 : 51200;  // 30 KB strict, 50 KB gzip

console.log('\n======================================================');
console.log('       INCLUSIVE ACCESS KIT - BUNDLE SIZE CHECK       ');
console.log('======================================================');
console.log(`JS  (dist/inclusive-kit.js): ${(jsRaw / 1024).toFixed(2)} KB raw (${jsRaw.toLocaleString()} B) | ${(jsGzip / 1024).toFixed(2)} KB gzip (${jsGzip.toLocaleString()} B)`);
console.log(`CSS (dist/ik-base.css)     : ${(cssRaw / 1024).toFixed(2)} KB raw (${cssRaw.toLocaleString()} B) | ${(cssGzip / 1024).toFixed(2)} KB gzip (${cssGzip.toLocaleString()} B)`);
console.log('------------------------------------------------------');
console.log(`TOTAL RAW BUNDLE (JS + CSS): ${(totalRaw / 1024).toFixed(2)} KB (${totalRaw.toLocaleString()} B) [Budget: ${(MAX_RAW_BYTES / 1024).toFixed(2)} KB]`);
console.log(`JS SCRIPT GZIP             : ${(jsGzip / 1024).toFixed(2)} KB (${jsGzip.toLocaleString()} B) [Budget: ${(MAX_GZIP_BYTES / 1024).toFixed(2)} KB]`);
console.log(`COMBINED GZIP (transfer)   : ${(concatGzip / 1024).toFixed(2)} KB (${concatGzip.toLocaleString()} B)`);
console.log('======================================================');

let failed = false;

// 1. Check raw bundle limit
if (totalRaw > MAX_RAW_BYTES) {
  console.error(`❌ FAILED: Total raw size (${totalRaw.toLocaleString()} B) exceeds budget of ${(MAX_RAW_BYTES / 1024).toFixed(2)} KB (${MAX_RAW_BYTES.toLocaleString()} B) by ${totalRaw - MAX_RAW_BYTES} B`);
  failed = true;
} else {
  console.log(`✅ RAW SIZE PASSED: ${(totalRaw / 1024).toFixed(2)} KB <= ${(MAX_RAW_BYTES / 1024).toFixed(2)} KB (${MAX_RAW_BYTES - totalRaw} bytes under budget)`);
}

// 2. Check gzip budget
if (jsGzip > MAX_GZIP_BYTES) {
  console.error(`❌ FAILED: JS Gzip size (${jsGzip.toLocaleString()} B) exceeds budget of ${(MAX_GZIP_BYTES / 1024).toFixed(2)} KB (${MAX_GZIP_BYTES.toLocaleString()} B) by ${jsGzip - MAX_GZIP_BYTES} B`);
  failed = true;
} else {
  console.log(`✅ GZIP SIZE PASSED: ${(jsGzip / 1024).toFixed(2)} KB <= ${(MAX_GZIP_BYTES / 1024).toFixed(2)} KB (${MAX_GZIP_BYTES - jsGzip} bytes under budget)`);
}

if (failed) {
  process.exit(1);
} else {
  console.log('🎉 BUNDLE SIZE IS WITHIN BUDGET!\n');
  process.exit(0);
}
