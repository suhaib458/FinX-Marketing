import { notFound } from '../common/errors.js';
import { paginationMeta } from '../common/pagination.js';

export class BrandService {
  constructor(repository) { this.repository = repository; }

  async list(userId, query) {
    const result = await this.repository.list(userId, query);
    return { items: result.items, pagination: paginationMeta(query.page, query.limit, result.total) };
  }
  async get(userId, id) {
    const brand = await this.repository.findById(userId, id);
    if (!brand) throw notFound('Brand');
    return brand;
  }
  create(userId, data) { return this.repository.create(userId, data); }
  async update(userId, id, data) {
    const brand = await this.repository.update(userId, id, data);
    if (!brand) throw notFound('Brand');
    return brand;
  }
  async remove(userId, id) {
    if (!await this.repository.softDelete(userId, id)) throw notFound('Brand');
  }
}
