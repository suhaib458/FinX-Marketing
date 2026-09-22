export function createGenerationController(service) {
  return {
    async generate(req, res) {
      const result = await service.generate(req.user, req.validated.body);
      res.status(201).json({ data: result });
    },
    async variation(req, res) {
      const result = await service.variation(req.user, req.validated.params.contentId, req.validated.body);
      res.status(201).json({ data: result });
    },
  };
}
