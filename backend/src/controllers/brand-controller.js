export function createBrandController(service) {
  return {
    async list(req, res) {
      const result = await service.list(req.user.id, req.validated.query);
      res.json({ data: result.items, pagination: result.pagination });
    },
    async get(req, res) { res.json({ data: await service.get(req.user.id, req.validated.params.brandId) }); },
    async create(req, res) { res.status(201).json({ data: await service.create(req.user.id, req.validated.body) }); },
    async update(req, res) {
      res.json({ data: await service.update(req.user.id, req.validated.params.brandId, req.validated.body) });
    },
    async remove(req, res) {
      await service.remove(req.user.id, req.validated.params.brandId);
      res.status(204).end();
    },
  };
}
