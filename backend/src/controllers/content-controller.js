export function createContentController(service) {
  return {
    async list(req, res) {
      const result = await service.list(req.user.id, req.validated.query);
      res.json({ data: result.items, pagination: result.pagination });
    },
    async get(req, res) { res.json({ data: await service.get(req.user.id, req.validated.params.contentId) }); },
    async update(req, res) {
      res.json({ data: await service.update(req.user.id, req.validated.params.contentId, req.validated.body) });
    },
    async remove(req, res) {
      await service.remove(req.user.id, req.validated.params.contentId);
      res.status(204).end();
    },
  };
}
