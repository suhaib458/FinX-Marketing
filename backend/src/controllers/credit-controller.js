export function createCreditController(service) {
  return {
    async balance(req, res) { res.json({ data: await service.balance(req.user.id) }); },
    async ledger(req, res) {
      const result = await service.ledger(req.user.id, req.validated.query);
      res.json({ data: result.items, pagination: result.pagination });
    },
  };
}
