const { RedisService } = require('./services/api/dist/redis/redis.service');

console.log('Testing Redis production requirements...');

class MockConfigService {
  get(key) {
    if (key === 'NODE_ENV') return 'production';
    if (key === 'REDIS_URL') return undefined;
    if (key === 'REDIS_HOST') return undefined;
    if (key === 'REDIS_PORT') return undefined;
    return undefined;
  }
}

const configService = new MockConfigService();
const redisService = new RedisService(configService);

try {
  redisService.onModuleInit();
  console.log('❌ FAIL: Redis validation should have failed in production');
} catch (error) {
  if (error.message.includes('MANDATORY')) {
    console.log('✅ PASS: Redis validation correctly failed in production');
    console.log('Error message:', error.message);
  } else {
    console.log('❌ FAIL: Unexpected error:', error.message);
  }
}
