import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './auth.service.js';

export async function register(
  req: FastifyRequest<{ Body: { email: string; password: string } }>,
  reply: FastifyReply
) {
  const user = await service.registerUser(req.body);
  reply.code(201).send(user);
}

export async function login(
  req: FastifyRequest<{ Body: { email: string; password: string } }>,
  reply: FastifyReply
) {
  const { user, token } = await service.loginUser(req.body);
  reply.send({ user, token });
}