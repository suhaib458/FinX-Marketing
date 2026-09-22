import { AssetService } from './asset-service.js';
import { BrandService } from './brand-service.js';
import { ContentService } from './content-service.js';
import { CreditService } from './credit-service.js';
import { UserService } from './user-service.js';
import { GenerationService } from './generation-service.js';

export function createServices(repositories, options = {}) {
  const { storageProvider, config, logger, aiProvider } = options;
  return {
    users: new UserService(repositories.users),
    brands: new BrandService(repositories.brands),
    credits: new CreditService(repositories.credits),
    contents: new ContentService(repositories.contents),
    generations: new GenerationService({ aiProvider, repository: repositories.generations, brandRepository: repositories.brands, contentRepository: repositories.contents }),
    assets: new AssetService({
      assetRepository: repositories.assets,
      brandRepository: repositories.brands,
      storageProvider,
      config,
      logger,
    }),
  };
}
