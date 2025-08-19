import path from 'node:path';
import { pathToFileURL } from 'node:url';

(async () => {
  try {
    const target = path.resolve(
      process.cwd(),
      'src/backend/config/monitoring.js'
    );
    const href = pathToFileURL(target).href;
    await import(href);
    console.log('✅ Monitoring import successful');
  } catch (err: any) {
    console.error('❌ Import failed:', err?.message || err);
    process.exit(1);
  }
})();
