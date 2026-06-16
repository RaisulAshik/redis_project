import { createClient, RedisClientType, RESP_TYPES } from 'redis';
import redisConfig from './redisConfig';

type RedisClientWithBuffer = RedisClientType & {
  getBuffer(key: string): Promise<Buffer | null>;
};

let client: RedisClientWithBuffer;

async function getRedisClient(): Promise<RedisClientWithBuffer> {
  if (client) return client;

  const baseClient = createClient({ url: redisConfig.url });

  baseClient.on('error',(err: Error)=> console.error('[Redis] Error:', err.message));
  baseClient.on('connect', ()=> console.log('[Redis] Connected'));

  await baseClient.connect();

  const bufferClient = baseClient.withTypeMapping({ [RESP_TYPES.BLOB_STRING]: Buffer });

  (baseClient as RedisClientWithBuffer).getBuffer = (key: string): Promise<Buffer | null> =>
    bufferClient.get(key);

  client = baseClient as RedisClientWithBuffer;
  return client;
}

export default getRedisClient;