import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { LinksDataSchema } from '../src/data/schema.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const jsonPath = resolve(__dirname, '../src/data/links.json');

try {
  const raw = readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(raw);
  LinksDataSchema.parse(data);
  console.log('links.json valid');
  process.exit(0);
} catch (err) {
  if (err instanceof SyntaxError) {
    console.error('Invalid JSON:', err.message);
  } else if (err && typeof err === 'object' && 'errors' in err && Array.isArray(err.errors)) {
    console.error('Schema validation failed:');
    for (const e of err.errors) {
      console.error(`  ${e.path.join('.')}: ${e.message}`);
    }
  } else if (err instanceof Error) {
    console.error(err.message);
  } else {
    console.error(err);
  }
  process.exit(1);
}
