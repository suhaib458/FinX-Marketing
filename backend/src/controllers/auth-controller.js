export function createAuthController(userService) {
  return {
    async session(req, res) {
      const user = await userService.provisionFirebaseUser(req.auth);
      req.user = user;
      res.json({ data: { user, session: { authenticated: true } } });
    },
  };
}
