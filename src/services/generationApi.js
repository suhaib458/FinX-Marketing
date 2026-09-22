import { authenticatedRequest, ApiError } from './authenticatedApi.js';

export class GenerationApiError extends ApiError {}

export function createGenerationApi() {
  async function generate(firebaseUser, { tool, params, brand }) {
    try {
      const payload = await authenticatedRequest(firebaseUser, '/ai/generate', {
        method: 'POST',
        body: {
          tool,
          params,
          brandId: brand?.id || null,
          brand: brand || {},
          idempotencyKey: crypto.randomUUID(),
        },
        timeoutMs: 75_000,
      });
      return payload.data;
    } catch (error) {
      if (error instanceof ApiError) throw new GenerationApiError(error.status, error.code, error.message, error.details);
      throw error;
    }
  }
  return { generate };
}

export const generationApi = createGenerationApi();
export default generationApi;
