const brandSelect = {
  id: true, businessName: true, businessDescription: true, category: true,
  targetAudience: true, productService: true, productDescription: true,
  price: true, currency: true, website: true, username: true,
  primaryColor: true, secondaryColor: true, createdAt: true, updatedAt: true,
};

export class BrandRepository {
  constructor(prisma) { this.prisma = prisma; }

  async list(userId, { page, limit }) {
    const where = { userId, deletedAt: null };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.brand.findMany({
        where, select: brandSelect, orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.brand.count({ where }),
    ]);
    return { items, total };
  }

  findById(userId, id) {
    return this.prisma.brand.findFirst({ where: { id, userId, deletedAt: null }, select: brandSelect });
  }

  create(userId, data) {
    return this.prisma.brand.create({ data: { ...data, userId }, select: brandSelect });
  }

  async update(userId, id, data) {
    const result = await this.prisma.brand.updateMany({ where: { id, userId, deletedAt: null }, data });
    return result.count ? this.findById(userId, id) : null;
  }

  async softDelete(userId, id) {
    const result = await this.prisma.brand.updateMany({
      where: { id, userId, deletedAt: null }, data: { deletedAt: new Date() },
    });
    return result.count > 0;
  }
}
