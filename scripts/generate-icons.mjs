import fs from 'fs';
import zlib from 'zlib';

// Simple CRC32 implementation
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    for (let j = 0; j < 8; j++) {
      if ((crc ^ byte) & 1) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc = crc >>> 1;
      }
      byte = byte >>> 1;
    }
  }
  return (crc ^ -1) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const toCrc = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(toCrc);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generateIconPNG(size, isMaskable = false) {
  // Create RGBA image buffer
  // Size x Size
  const scanlineLength = 1 + size * 4;
  const rawData = Buffer.alloc(size * scanlineLength);

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.30;
  const strokeW = size * 0.07;
  const innerR = size * 0.095;
  const cornerR = isMaskable ? 0 : size * 0.22; // rounded squircle if regular, full bleed if maskable

  // Colors
  const bgR = 0x4e, bgG = 0x7a, bgB = 0x5d; // #4E7A5D

  for (let y = 0; y < size; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < size; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Distance from center
      const dx = x - cx;
      const dy = y - cy;
      const distFromCenter = Math.sqrt(dx * dx + dy * dy);

      // Check rounded rect background
      let inBackground = true;
      if (cornerR > 0) {
        const qx = Math.max(0, Math.abs(dx) - (cx - cornerR));
        const qy = Math.max(0, Math.abs(dy) - (cy - cornerR));
        if (Math.sqrt(qx * qx + qy * qy) > cornerR) {
          inBackground = false;
        }
      }

      if (!inBackground) {
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0; // transparent
        continue;
      }

      // Default: Background green
      let r = bgR, g = bgG, b = bgB, a = 255;

      // Center dot
      if (distFromCenter <= innerR) {
        r = 255; g = 255; b = 255;
      }
      // Ring
      else if (Math.abs(distFromCenter - outerR) <= strokeW / 2) {
        // Angle in radians (-PI to PI)
        const angle = Math.atan2(dy, dx);
        // Arc opening gap at top-right (approx 0.2 to 1.1 rad)
        if (angle < 0.2 || angle > 1.1) {
          r = 255; g = 255; b = 255;
        }
      }

      // Arrow head near top-right
      const arrowTipX = cx + Math.cos(0.9) * outerR;
      const arrowTipY = cy + Math.sin(0.9) * outerR;
      const distToTip = Math.sqrt((x - arrowTipX) ** 2 + (y - arrowTipY) ** 2);
      if (distToTip <= strokeW * 0.9) {
        r = 255; g = 255; b = 255;
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk: width(4), height(4), bitDepth(1)=8, colorType(1)=6(RGBA), comp(1)=0, filter(1)=0, interlace(1)=0
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate required sizes
const pwa192 = generateIconPNG(192, false);
fs.writeFileSync('public/pwa-192x192.png', pwa192);

const pwa512 = generateIconPNG(512, false);
fs.writeFileSync('public/pwa-512x512.png', pwa512);

const pwaMaskable512 = generateIconPNG(512, true);
fs.writeFileSync('public/pwa-maskable-512x512.png', pwaMaskable512);

const appleIcon = generateIconPNG(180, false);
fs.writeFileSync('public/apple-touch-icon.png', appleIcon);

console.log('Generated PNG icons successfully!');
