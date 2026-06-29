import { Router, Request, Response, NextFunction } from 'express';
import { uploadMiddleware } from '../middleware/upload';
import { uploadLimiter } from '../middleware/rateLimits';
import { uploadFeed, getFeeds, getFeedById, deleteFeed } from '../controllers/feed.controller';

const router = Router();

const asyncWrap = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

router.post('/', uploadLimiter, uploadMiddleware.single('file'), asyncWrap(uploadFeed));
router.get('/', getFeeds);
router.get('/:id', getFeedById);
router.delete('/:id', deleteFeed);

export default router;
