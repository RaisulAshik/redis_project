import { Router, Request, Response } from 'express';
import {
  getCachedImage,
  fetchAndCacheImage,
} from './imageService';

export interface ImageSource {
  [imageId: string]: string; 
}

const router = Router();

const IMAGE_SOURCES: ImageSource = {
  'cat-1':   'https://cataas.com/cat',
  'dog-1':   'https://place.dog/300/200',
  'photo-1': 'https://picsum.photos/400/300',
};
// GET /images/:id - Fetch an image by ID
router.get('/:id', async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;
  const sourceUrl = IMAGE_SOURCES[id];

  if (!sourceUrl) {
    res.status(404).json({ error: `Image ID '${id}' not found` });
    return;
  }

  try {
    // 1. Check cache
    const cached = await getCachedImage(id);

    if (cached) {
      res.set('Content-Type',  cached.meta.contentType);
      res.set('X-Cache',       'HIT');
      res.set('X-Cache-Age',   String(Math.floor((Date.now() - parseInt(cached.meta.cachedAt, 10)) / 1000)) + 's');
      res.send(cached.buffer);
      return;
    }

    // 2. Cache miss — fetch from source
    console.log(`Cache Miss Fetching image '${id}' from source...`);
    const result = await fetchAndCacheImage(id, sourceUrl);

    res.set('Content-Type', result.contentType);
    res.set('X-Cache',      'MISS');
    res.send(result.buffer);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Error] ${id}: ${message}`);
    res.status(502).json({ error: 'Failed to fetch image', detail: message });
  }
});


export default router;