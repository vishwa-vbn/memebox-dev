import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './emotions.service';

export async function getAllEmotions(req: FastifyRequest, reply: FastifyReply) {
  const emotions = await service.getAllEmotions();
  reply.send(emotions);
}

export async function getEmotionSuggestions(
  req: FastifyRequest<{ Querystring: { q: string; limit?: number } }>,
  reply: FastifyReply
) {
  const { q = '', limit = 10 } = req.query;
  if (q.length < 2) return reply.send([]);

  const suggestions = await service.getEmotionSuggestions(q, Number(limit));
  reply.send(suggestions);
}

export async function createEmotion(
  req: FastifyRequest<{ Body: { name: string; emoji?: string } }>,
  reply: FastifyReply
) {
  const emotion = await service.createEmotion(req.body);
  reply.code(201).send(emotion);
}

export async function updateEmotion(
  req: FastifyRequest<{ Params: { id: string }; Body: { name?: string; emoji?: string } }>,
  reply: FastifyReply
) {
  const emotion = await service.updateEmotion(BigInt(req.params.id), req.body);
  reply.send(emotion);
}

export async function deleteEmotion(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  await service.deleteEmotion(BigInt(req.params.id));
  reply.send({ success: true });
}