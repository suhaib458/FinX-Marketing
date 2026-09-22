const contentSelect = {
  id: true, brandId: true, generationJobId: true, originalContentId: true,
  tool: true, language: true, platform: true, title: true, content: true,
  submittedParameters: true, savedAt: true,
  createdAt: true, updatedAt: true,
};

export class ContentRepository {
  constructor(prisma) { this.prisma = prisma; }

  async list(userId, { page, limit, tool, platform, saved }) {
    const where = {
      userId,
      deletedAt: null,
      ...(tool && { tool }),
      ...(platform && { platform }),
      ...(saved === true && { savedAt: { not: null } }),
      ...(saved === false && { savedAt: null }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.generatedContent.findMany({
        where, select: contentSelect, orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.generatedContent.count({ where }),
    ]);
    return { items, total };
  }

  findById(userId, id) {
    return this.prisma.generatedContent.findFirst({
      where: { id, userId, deletedAt: null }, select: contentSelect,
    });
  }

  async update(userId, id, data) {
    const update = {};
    if (Object.prototype.hasOwnProperty.call(data, 'saved')) update.savedAt = data.saved ? new Date() : null;
    if (data.content) update.content = data.content;
    const result = await this.prisma.generatedContent.updateMany({
      where: { id, userId, deletedAt: null }, data: update,
    });
    return result.count ? this.findById(userId, id) : null;
  }

  async softDelete(userId, id) {
    const result = await this.prisma.generatedContent.updateMany({
      where: { id, userId, deletedAt: null }, data: { deletedAt: new Date() },
    });
    return result.count > 0;
  }
}

