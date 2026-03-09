import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './tags.service.js';

export async function getPopularTags(req: FastifyRequest, reply: FastifyReply) {
  const tags = await service.getPopularTags();
  reply.send(tags);
}

export async function getTagSuggestions(
  req: FastifyRequest<{ Querystring: { q: string; limit?: string } }>,
  reply: FastifyReply
) {
  const { q, limit } = req.query;
  if (!q || q.length < 2) return reply.send([]);

  // Convert limit to integer and provide a default
  const take = parseInt(limit as string, 10) || 10;

  const suggestions = await service.getTagSuggestions(q, take);
  reply.send(suggestions);
}

export async function createTag(req: FastifyRequest<{ Body: { name: string; slug?: string } }>, reply: FastifyReply) {
  const tag = await service.createTag(req.body);
  reply.code(201).send(tag);
}

export async function updateTag(req: FastifyRequest<{ Params: { id: string }; Body: { name?: string; slug?: string } }>, reply: FastifyReply) {
  const tag = await service.updateTag(BigInt(req.params.id), req.body);
  reply.send(tag);
}

export async function deleteTag(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  await service.deleteTag(BigInt(req.params.id));
  reply.send({ success: true });
}