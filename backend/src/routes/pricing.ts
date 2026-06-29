import { Router } from 'express';
import { searchPricing, getPricingById, updatePricing, getPricingStats, getAuditLog } from '../controllers/pricing.controller';

const router = Router();

router.get('/stats', getPricingStats);
router.get('/', searchPricing);
router.get('/:id', getPricingById);
router.put('/:id', updatePricing);
router.get('/:id/audit', getAuditLog);

export default router;
