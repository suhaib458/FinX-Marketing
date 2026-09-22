import { notFound } from '../common/errors.js';
import { paginationMeta } from '../common/pagination.js';

export class ContentService {
  constructor(repository) { this.repository = repository; }
  async list(userId, query) {
    const result = await this.repository.list(userId, query);
    return { items: result.items, pagination: paginationMeta(query.page, query.limit, result.total) };
  }
  async get(userId, id) {
    const content = await this.repository.findById(userId, id);
    if (!content) throw notFound('Content');
    return content;
  }
  async update(userId, id, data) {
    const content = await this.repository.update(userId, id, data);
    if (!content) throw notFound('Content');
    return content;
  }
  async remove(userId, id) {
    if (!await this.repository.softDelete(userId, id)) throw notFound('Content');
  }
}
