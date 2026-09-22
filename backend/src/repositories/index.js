import { AssetRepository } from './asset-repository.js';
import { BrandRepository } from './brand-repository.js';
import { ContentRepository } from './content-repository.js';
import { CreditRepository } from './credit-repository.js';
import { UserRepository } from './user-repository.js';
import { GenerationRepository } from './generation-repository.js';

export function createRepositories(prisma) {
  if (!prisma) {
    const unavailable = new Proxy({}, { get() { throw new Error('Database is not configured'); } });
    prisma = unavailable;
  }
  return {
    users: new UserRepository(prisma),
    brands: new BrandRepository(prisma),
    credits: new CreditRepository(prisma),
    contents: new ContentRepository(prisma),
    assets: new AssetRepository(prisma),
    generations: new GenerationRepository(prisma),
  };
}
