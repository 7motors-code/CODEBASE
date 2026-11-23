require('dotenv').config();

// Safety guard: prevent accidental destructive tests if pointed at a live production database
if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_PROD) {
  console.error('FATAL: Refusing to run tests when NODE_ENV=production without ALLOW_TEST_PROD=1.');
  process.exit(1);
}

const Module = require('module');
const orig = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'server-only') return {};
  return orig.apply(this, arguments);
};

process.on('beforeExit', async () => {
  if (globalThis._redis) {
    try {
      await globalThis._redis.quit();
      globalThis._redis = undefined;
    } catch {}
  }
  if (globalThis._pool) {
    try {
      await globalThis._pool.end();
      globalThis._pool = undefined;
    } catch {}
  }
});
