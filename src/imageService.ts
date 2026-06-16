import axios from 'axios';
import getRedisClient from './redis/redisClient';
import redisConfig from './redis/redisConfig';

export interface ImageMeta {
  contentType: string;
  sourceUrl: string;
  size: string;  
  cachedAt: string;
}

export interface CachedImage {
  buffer: Buffer;
  meta: ImageMeta;
}

export interface FetchResult {
  buffer: Buffer;
  contentType: string;
  cached: boolean;
}


function dataKey(imageId: string): string {
  return `image:data:${imageId}`;
}

function metaKey(imageId: string): string {
  return `image:meta:${imageId}`;
}


async function storeImage(
  imageId: string,
  buffer: Buffer,
  contentType: string,
  sourceUrl: string,
): Promise<void> {
  const redis = await getRedisClient();
  const ttl = redisConfig.ttlSec;

  const meta: Record<string, string> = {
    contentType,
    sourceUrl,
    size: String(buffer.length),
    cachedAt: String(Date.now()),
  };

  const pipeline = redis.multi();
  pipeline.set(dataKey(imageId), buffer as unknown as string, { EX: ttl });
  pipeline.hSet(metaKey(imageId), meta);
  pipeline.expire(metaKey(imageId), ttl);
  await pipeline.exec();
}

export async function getCachedImage(imageId: string): Promise<CachedImage | null> {
  const redis = await getRedisClient();
  const buffer = await redis.getBuffer(dataKey(imageId));

  if (!buffer) return null;

  const rawMeta = await redis.hGetAll(metaKey(imageId));

  if (!rawMeta || !rawMeta.contentType) return null;

  const meta: ImageMeta = {
    contentType: rawMeta.contentType,
    sourceUrl: rawMeta.sourceUrl   ?? '',
    size: rawMeta.size ?? '0',
    cachedAt: rawMeta.cachedAt ?? '0',
  };

  return { buffer, meta };
}


export async function fetchAndCacheImage(
  imageId: string,
  sourceUrl: string,
): Promise<FetchResult> {
  const response = await axios.get<ArrayBuffer>(sourceUrl, {
    responseType: 'arraybuffer',
    timeout: 10_000,
    // axios defaults to `Accept: application/json`; some sources (e.g. cataas.com)
    // content-negotiate and return JSON metadata instead of image bytes. Ask for an image.
    headers: { Accept: 'image/*' },
  });

  const buffer = Buffer.from(response.data);
  const contentType = (response.headers['content-type'] as string | undefined) ?? 'image/jpeg';

  await storeImage(imageId, buffer, contentType, sourceUrl);

  return { buffer, contentType, cached: true };
}
