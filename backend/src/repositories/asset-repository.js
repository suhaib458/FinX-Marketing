const assetSelect = {
  id: true,
  userId: true,
  brandId: true,
  type: true,
  status: true,
  storageKey: true,
  publicUrl: true,
  mimeType: true,
  byteSize: true,
  width: true,
  height: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
};

export class AssetRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async list(userId, { page = 1, limit = 20, type, brandId } = {}) {
    const where = {
      userId,
      deletedAt: null,
      ...(type ? { type } : {}),
      ...(brandId ? { brandId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.asset.findMany({
        where,
        select: assetSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.asset.count({ where }),
    ]);

    return { items, total };
  }

  findById(userId, id) {
    return this.prisma.asset.findFirst({
      where: { id, userId, deletedAt: null },
      select: assetSelect,
    });
  }

  findActiveBrandAsset(userId, brandId, type) {
    return this.prisma.asset.findFirst({
      where: { userId, brandId, type, deletedAt: null },
      select: assetSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  create(userId, data) {
    return this.prisma.asset.create({
      data: {
        userId,
        brandId: data.brandId || null,
        type: data.type,
        status: data.status || 'READY',
        storageKey: data.storageKey,
        publicUrl: data.publicUrl || null,
        mimeType: data.mimeType,
        byteSize: data.byteSize,
        width: data.width || null,
        height: data.height || null,
        metadata: data.metadata || null,
      },
      select: assetSelect,
    });
  }

  async softDelete(userId, id) {
    const result = await this.prisma.asset.updateMany({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return result.count > 0;
  }
}
