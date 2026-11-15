'use strict';

/**
 * Sec-MS-GEC token generation for Microsoft Edge's online text-to-speech
 * service (the endpoint behind Edge's Read Aloud feature).
 *
 * This is a JavaScript port of the token algorithm in edge-tts
 * (rany2/edge-tts, drm.py, MIT-licensed reference implementation): a v2
 * token "<CS64 hex>-<SHA-256 hex>" derived from the current time in
 * Windows file-time ticks (rounded down to 5 minutes) plus the public
 * trusted-client token. The SHA-256 used here is a MODIFIED variant
 * (different initial state, one adjusted round constant, adjusted message
 * schedule) — Node's crypto SHA-256 will NOT produce the same digest, so
 * the compression function is implemented by hand below.
 *
 * Verified against the Python reference with fixed timestamps (see
 * test-voice.js, group "Edge DRM"): identical tokens for identical
 * inputs. If Microsoft changes the token scheme, this module is the only
 * file that needs to change; the rest of the voice stack is unaffected.
 *
 * Clock skew: the service rejects tokens when the client clock is too far
 * off (HTTP 403). edge-tts corrects skew from the server Date header and
 * retries once; edge-tts.js does the same via adjustClockSkew().
 */

var TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
var WIN_EPOCH = 11644473600; // seconds between 1601-01-01 and 1970-01-01
var S_TO_NS = 1e9;

var SHA256_INITIAL = [
  0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
  0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19
];
var SHA256_STATE = [
  0xFD9FBEA2, 0x91243CE7, 0xBE499094, 0xCD2E1E0A,
  0x6C006F49, 0x04BD35AB, 0xFEB0A7E4, 0x03EFFBD2
];
var SHA256_SCHEDULE = [
  0xEB24BF9E, 0x1558691F, 0xA0C09EE2, 0x0CFA32BA,
  0xA622EE8C, 0xD1DD9491, 0xC0DD25A0, 0xF9E70AB6,
  0xF0C31573, 0x7058CE4E, 0x7188E606, 0x00E5AB33,
  0xD258B060, 0x72766564
];
var SHA256_ROUND_CONSTANTS = [
  0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
  0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
  0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
  0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
  0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
  0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
  0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
  0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
  0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
  0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
  0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
  0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
  0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
  0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
  0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
  0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2
];
var SHA256_ADJUSTMENT = 0xC9DC06A7;
var SHA256_BLOCK_CONSTANTS = SHA256_ROUND_CONSTANTS.slice(0, 14)
  .concat([SHA256_ADJUSTMENT])
  .concat(SHA256_ROUND_CONSTANTS.slice(15));
var SHA256_SIGMA0_ADJUSTMENT = 0x059C0B80;
var SHA256_SIGMA1_ADJUSTMENT = 0x000B92C0;

var CS64_COEFFICIENTS = [
  [0xE82E91B1, 0xB32700D0], [0x44DE24C6, 0x88DFF51D],
  [0x3BEB65BC, 0x29514038], [0xC89C5933, 0xB328CBDF],
  [0x8D1EC211, 0xD405B4D5], [0x314EF5D5, 0x26E55F3C],
  [0xE92491B1, 0x607801C6], [0xF0A5B9D5, 0x82B2C1FB],
  [0x06064CF3, 0xFA51A3DA], [0xDA79FA60, 0x207CC464],
  [0xBED20560, 0x3C3C74F3], [0x89F9C9F8, 0xD2D14B61],
  [0x35FA38C6, 0xBB04A2C1], [0xCB49E3C6, 0xC5626167]
];
var CS64_FACTOR = 0x82893933;
var CS64_ADJUSTMENT0 = 0xF2F90B1A;
var CS64_ADJUSTMENT1 = 0x0B1A0000;

function rotr(x, n) {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

function rol16(x) {
  return (((x << 16) | (x >>> 16)) >>> 0);
}

function sigma0(x) {
  return (rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3)) >>> 0;
}

function sigma1(x) {
  return (rotr(x, 17) ^ rotr(x, 19) ^ (x >>> 10)) >>> 0;
}

// Standard SHA-256 compression rounds, optionally resuming at round 14
// with the adjusted constant block (the reference implementation's
// unrolled loop computes exactly these rounds).
function sha256Rounds(state, words, firstRound) {
  var constants = firstRound === 14 ? SHA256_BLOCK_CONSTANTS : SHA256_ROUND_CONSTANTS;
  var a = state[0]; var b = state[1]; var c = state[2]; var d = state[3];
  var e = state[4]; var f = state[5]; var g = state[6]; var h = state[7];
  for (var i = firstRound; i < 64; i++) {
    var s1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
    var ch = ((e & f) ^ (~e & g)) >>> 0;
    var t1 = (h + s1 + ch + constants[i] + words[i]) >>> 0;
    var s0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
    var maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
    var t2 = (s0 + maj) >>> 0;
    h = g; g = f; f = e; e = (d + t1) >>> 0;
    d = c; c = b; b = a; a = (t1 + t2) >>> 0;
  }
  return [a, b, c, d, e, f, g, h];
}

function expandSha256Schedule(words, firstWord) {
  for (var i = firstWord; i < 64; i++) {
    words.push((sigma1(words[i - 2]) + words[i - 7] + sigma0(words[i - 15]) + words[i - 16]) >>> 0);
  }
}

function sha256Init(data) {
  // data: Buffer of exactly 7 bytes.
  var words = [];
  for (var z = 0; z < 14; z++) words.push(0);
  words.push(data.readUIntBE(0, 3));
  words.push(data.readUIntBE(3, 4));
  for (var index = 16; index < 30; index++) {
    var value = SHA256_SCHEDULE[index - 16];
    if (index - 2 >= 14) {
      value += index === 16
        ? ((sigma1(words[index - 2]) ^ SHA256_SIGMA1_ADJUSTMENT) >>> 0)
        : sigma1(words[index - 2]);
    }
    if (index - 7 >= 14) value += words[index - 7];
    if (index - 15 >= 14) {
      value += index === 29
        ? ((sigma0(words[index - 15]) ^ SHA256_SIGMA0_ADJUSTMENT) >>> 0)
        : sigma0(words[index - 15]);
    }
    words.push(value >>> 0);
  }
  words.push((sigma1(words[28]) + words[23] + sigma0(words[15]) + words[14]
    + SHA256_ADJUSTMENT - SHA256_ROUND_CONSTANTS[14]) >>> 0);
  expandSha256Schedule(words, 31);
  var working = sha256Rounds(SHA256_STATE, words, 14);
  return SHA256_INITIAL.map(function (x, i) { return (x + working[i]) >>> 0; });
}

function sha256Digest(data) {
  if (data.length < 7) throw new Error('Token salt must contain at least seven bytes');
  var length = 57 + data.length;
  var zeroCount = (((55 - length) % 64) + 64) % 64;
  var lengthBuf = Buffer.alloc(8);
  lengthBuf.writeBigUInt64BE(BigInt(length) * 8n);
  var padded = Buffer.concat([
    data.subarray(7),
    Buffer.from([0x80]),
    Buffer.alloc(zeroCount),
    lengthBuf
  ]);
  var state = sha256Init(data.subarray(0, 7));
  for (var off = 0; off < padded.length; off += 64) {
    var words = [];
    for (var i = 0; i < 16; i++) words.push(padded.readUInt32BE(off + i * 4));
    expandSha256Schedule(words, 16);
    var working = sha256Rounds(state, words, 0);
    state = state.map(function (x, i) { return (x + working[i]) >>> 0; });
  }
  var out = Buffer.alloc(32);
  state.forEach(function (w, i) { out.writeUInt32BE(w, i * 4); });
  return out;
}

function wordsLe4Even(data) {
  var padded = Buffer.alloc(Math.ceil(data.length / 4) * 4);
  data.copy(padded);
  var words = [];
  for (var i = 0; i < padded.length; i += 4) words.push(padded.readUInt32LE(i));
  if (words.length % 2) words.push(0);
  return words;
}

function cs64Digest(data, digest) {
  var keyA = (digest.readUInt32LE(0) | 1) >>> 0;
  var keyB = (digest.readUInt32LE(4) | 1) >>> 0;
  var factors = [
    Math.imul(keyA, CS64_FACTOR) >>> 0,
    Math.imul(keyB, CS64_FACTOR) >>> 0
  ];
  var terms = CS64_COEFFICIENTS.map(function (pair, i) {
    return Math.imul(pair[0], factors[i % 2]) >>> 0;
  });
  var offsets = CS64_COEFFICIENTS.map(function (pair) { return pair[1] >>> 0; });
  var words = wordsLe4Even(Buffer.concat([Buffer.from([0]), data]));
  words.forEach(function (word, index) {
    var term = Math.imul(word, index % 2 === 0 ? keyA : keyB) >>> 0;
    var offset = Math.imul(rol16(word), index % 2 === 0 ? 0xEF0569FB : 0xC31713DB) >>> 0;
    if (index === 0) {
      term = (term + Math.imul(CS64_ADJUSTMENT0, factors[0])) >>> 0;
      offset = (offset + CS64_ADJUSTMENT1) >>> 0;
    }
    terms.push(term);
    offsets.push(offset);
  });
  var swapAcc = 0; var swapLast = 0; var state = 0; var acc = 0;
  for (var index = 0; index < terms.length; index += 2) {
    var x = terms[index]; var y = terms[index + 1];
    var t = rol16((offsets[index] + x) >>> 0);
    var q = Math.imul(t, 0x76F50F34) >>> 0;
    swapAcc = (swapAcc + ((Math.imul(rol16(q), 0xC3EFEA97) + q) >>> 0)) >>> 0;
    t = rol16((offsets[index + 1] + y) >>> 0);
    q = Math.imul(t, 0x1881CE3C) >>> 0;
    swapLast = (Math.imul(rol16(q), 0x35BD1EC9) + q) >>> 0;
    swapAcc = (swapAcc + swapLast) >>> 0;
    state = (Math.imul(state, keyA) + x) >>> 0;
    state = Math.imul(rol16(state), 0xCF98B111) >>> 0;
    state = Math.imul(rol16(state), 0x87085B9F) >>> 0;
    state = Math.imul(rol16(state), 0x12CEB96D) >>> 0;
    state = Math.imul(rol16(state), 0x257E1D83) >>> 0;
    acc = (acc + state) >>> 0;
    t = (Math.imul(state, keyB) + y) >>> 0;
    t = Math.imul(rol16(t), 0xA27416F5) >>> 0;
    t = Math.imul(rol16(t), 0xD38396FF) >>> 0;
    state = Math.imul(rol16(Math.imul(rol16(t), 0x7C932B89) >>> 0), 0xBFA49F69) >>> 0;
    acc = (acc + state) >>> 0;
  }
  return [(swapLast ^ state) >>> 0, (swapAcc ^ acc) >>> 0];
}

function tokenHash(data) {
  var digest = sha256Digest(data);
  var cs = cs64Digest(data, digest);
  var csBuf = Buffer.alloc(8);
  csBuf.writeUInt32LE(cs[0], 0);
  csBuf.writeUInt32LE(cs[1], 4);
  return [csBuf.toString('hex').toUpperCase(), digest.toString('hex').toUpperCase()];
}

// Pure: token for an explicit Unix timestamp (seconds). Mirrors
// generate_sec_ms_gec_v2 exactly, including the float arithmetic: ticks
// are rounded down to a 5-minute boundary, converted to 100ns ticks, and
// hashed together with the trusted-client token.
function generateSecMsGec(unixTimestamp) {
  var ticks = Number(unixTimestamp) + WIN_EPOCH;
  ticks -= ticks % 300;
  ticks *= S_TO_NS / 100;
  var strToHash = Buffer.from(ticks.toFixed(0) + TRUSTED_CLIENT_TOKEN, 'ascii');
  var parts = tokenHash(strToHash);
  return parts[0] + '-' + parts[1];
}

// Clock skew, adjusted from the server Date header after a 403 (see
// edge-tts.js). Process-wide, like the reference implementation.
var clockSkewSeconds = 0;

function getUnixTimestamp() {
  return Date.now() / 1000 + clockSkewSeconds;
}

function generateSecMsGecNow() {
  return generateSecMsGec(getUnixTimestamp());
}

function adjustClockSkew(skewSeconds) {
  clockSkewSeconds += skewSeconds;
}

function getClockSkew() {
  return clockSkewSeconds;
}

function resetClockSkew() {
  clockSkewSeconds = 0;
}

module.exports = {
  generateSecMsGec: generateSecMsGec,
  generateSecMsGecNow: generateSecMsGecNow,
  adjustClockSkew: adjustClockSkew,
  getClockSkew: getClockSkew,
  resetClockSkew: resetClockSkew,
  getUnixTimestamp: getUnixTimestamp,
  TRUSTED_CLIENT_TOKEN: TRUSTED_CLIENT_TOKEN
};
