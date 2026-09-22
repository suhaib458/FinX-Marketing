import { AppError } from '../common/errors.js';
import { paginationMeta } from '../common/pagination.js';

export class CreditService {
  constructor(repository) { this.repository = repository; }
  async balance(userId) {
    const wallet = await this.repository.findWallet(userId);
    if (!wallet) throw new AppError(500, 'WALLET_NOT_INITIALIZED', 'Credit wallet is not initialized');
    return wallet;
  }
  async ledger(userId, query) {
    const result = await this.repository.listLedger(userId, query);
    return { items: result.items, pagination: paginationMeta(query.page, query.limit, result.total) };
  }
}
