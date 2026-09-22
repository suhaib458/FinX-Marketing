import { randomUUID } from 'node:crypto';

const validRequestId = /^[A-Za-z0-9._:-]{1,100}$/;

export function requestId(req, res, next) {
  const provided = req.get('x-request-id');
  req.id = provided && validRequestId.test(provided) ? provided : randomUUID();
  res.set('x-request-id', req.id);
  next();
}
