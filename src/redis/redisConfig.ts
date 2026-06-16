
export interface RedisConfig {
  url: string;
  ttlSec: number;
}

const redisConfig: RedisConfig = {
  url: process.env.REDIS_URL ?? 'redis://localhost:6279/1',
  ttlSec: parseInt(process.env.IMAGE_TTL_SEC ?? '3600', 10), // default 1 hour
};

export default redisConfig;