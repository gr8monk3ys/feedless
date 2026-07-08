import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
  <rect width="128" height="128" rx="28" fill="#1c1c1e"/>
  <rect x="30" y="34" width="68" height="10" rx="5" fill="#30d158"/>
  <rect x="30" y="59" width="48" height="10" rx="5" fill="#30d158"/>
  <rect x="30" y="84" width="28" height="10" rx="5" fill="#30d158"/>
</svg>`;

mkdirSync('public/icon', { recursive: true });
for (const size of [16, 32, 48, 96, 128]) {
  await sharp(Buffer.from(svg)).resize(size, size).png()
    .toFile(`public/icon/${size}.png`);
}
console.log('Icons written to public/icon/');
