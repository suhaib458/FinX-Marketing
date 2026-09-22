export function createAssetController(service) {
  return {
    async upload(req, res) {
      const asset = await service.uploadAsset(req.user, {
        file: req.file,
        type: req.validated.body.type,
        brandId: req.validated.body.brandId,
      });
      res.status(201).json({ data: asset });
    },

    async get(req, res) {
      const asset = await service.getAsset(req.user.id, req.validated.params.assetId);
      res.json({ data: asset });
    },

    async list(req, res) {
      const result = await service.listAssets(req.user.id, req.validated.query);
      res.json({ data: result.items, pagination: result.pagination });
    },

    async remove(req, res) {
      await service.deleteAsset(req.user.id, req.validated.params.assetId);
      res.status(204).end();
    },
  };
}
