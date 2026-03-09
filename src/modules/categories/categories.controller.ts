import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './categories.service.js';

export async function getAllCategories(req: FastifyRequest, reply: FastifyReply) {
  const categories = await service.getAllCategories();
  reply.send(categories);
}

export async function createCategory(
  req: FastifyRequest<{ Body: { name: string; slug?: string; description?: string; icon?: string } }>,
  reply: FastifyReply
) {
  const category = await service.createCategory(req.body);
  reply.code(201).send(category);
}

export async function updateCategory(
  req: FastifyRequest<{ Params: { id: string }; Body: { name?: string; slug?: string; description?: string; icon?: string } }>,
  reply: FastifyReply
) {
  const category = await service.updateCategory(BigInt(req.params.id), req.body);
  reply.send(category);
}

export async function deleteCategory(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  await service.deleteCategory(BigInt(req.params.id));
  reply.send({ success: true });
}