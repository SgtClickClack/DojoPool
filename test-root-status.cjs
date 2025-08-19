const url = 'http://localhost:3000/';

(async () => {
  try {
    const res = await fetch(url);
    const body = await res.text();
    console.log(`[TEST] GET / -> status ${res.status}`);
    if (res.status === 404) {
      console.error('❌ FAIL: Root returns 404');
      process.exit(1);
    }
    if (!body.toLowerCase().includes('welcome to dojopool')) {
      console.warn('⚠️  Warning: Root did not contain expected welcome text.');
    }
    console.log('✅ PASS: Root is accessible.');
  } catch (err) {
    console.error('🔥 ERROR:', err.message);
    process.exit(2);
  }
})();
