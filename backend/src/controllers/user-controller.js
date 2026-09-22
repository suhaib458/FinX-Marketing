export function createUserController(service) {
  return {
    me(req, res) { res.json({ data: service.getMe(req.user) }); },
  };
}
