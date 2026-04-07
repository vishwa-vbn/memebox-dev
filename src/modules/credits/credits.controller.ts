import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './credits.service.js';

export async function getMyCredits(req: FastifyRequest, reply: FastifyReply) {
  const data = await service.getUserCredits(BigInt(req.user.id));
  reply.send(data);
}

export async function getMyTransactions(req: FastifyRequest, reply: FastifyReply) {
  const txs = await service.getUserTransactions(BigInt(req.user.id));
  reply.send(txs);
}