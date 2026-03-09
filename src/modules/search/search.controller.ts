import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from '../../services/search.service.js';

export async function search(
  req: FastifyRequest<{ Querystring: { q: string; page?: string; limit?: string } }>,
  reply: FastifyReply
) {
  const q = req.query.q;
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);

  const results = await service.searchMedia(q, page, limit);

  reply.send(results);
}