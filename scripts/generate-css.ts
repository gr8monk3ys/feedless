import { mkdirSync, writeFileSync } from 'node:fs';
import { generateCss } from '../src/lib/css';
import { IG_FEATURES } from '../src/features/instagram';
import { FB_FEATURES } from '../src/features/facebook';

mkdirSync('src/css', { recursive: true });
writeFileSync('src/css/instagram.generated.css', generateCss(IG_FEATURES));
writeFileSync('src/css/facebook.generated.css', generateCss(FB_FEATURES));
console.log('Generated src/css/*.generated.css');
