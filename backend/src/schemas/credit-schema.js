import { z } from 'zod';
import { paginationSchema } from '../common/pagination.js';

export const ledgerQuerySchema = paginationSchema.extend({
  direction: z.enum(['CREDIT', 'DEBIT']).optional(),
  type: z.enum(['INITIAL_GRANT', 'RESERVATION', 'SETTLEMENT', 'REFUND', 'ADJUSTMENT']).optional(),
}).strict();
