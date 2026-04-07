

import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './auth.service.js';

export async function register(
  req: FastifyRequest<{
    Body: {
      email: string;
      password: string;
    }
  }>,
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

export async function getMe(req: FastifyRequest, reply: FastifyReply) {
  const user = await service.getCurrentUser(BigInt(req.user.id));
  reply.send(user);
}

export async function updateMe(
  req: FastifyRequest<{ Body: { email?: string; password?: string } }>,
  reply: FastifyReply
) {
  const updated = await service.updateOwnProfile(BigInt(req.user.id), req.body);
  reply.send(updated);
}

export async function getMyLikes(req: FastifyRequest, reply: FastifyReply) {
  const likes = await service.getUserLikes(BigInt(req.user.id));
  reply.send(likes);
}

export async function getMySubmissions(req: FastifyRequest, reply: FastifyReply) {
  const submissions = await service.getUserSubmissions(BigInt(req.user.id));
  reply.send(submissions);
}


export async function sendVerificationOtpController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  if (!req.user) {
    return reply.code(401).send({ error: "Unauthorized" });
  }

  const result = await service.sendVerificationOtp(
    BigInt(req.user.id) // ✅ ONLY pass userId
  );

  reply.send(result);
}

export async function verifyOtpController(
  req: FastifyRequest<{ Body: { otp: string } }>,
  reply: FastifyReply
) {
  if (!req.user) return reply.code(401).send({ error: "Unauthorized" });

  const result = await service.verifyOtp(BigInt(req.user.id), req.body.otp);
  reply.send(result);
}

export async function requestPasswordResetController(
  req: FastifyRequest<{ Body: { email: string } }>,
  reply: FastifyReply
) {
  const result = await service.requestPasswordReset(req.body.email);
  reply.send(result);
}

export async function resetPasswordController(
  req: FastifyRequest<{
    Body: { token: string; email: string; newPassword: string }
  }>,
  reply: FastifyReply
) {
  const result = await service.resetPasswordWithToken(req.body);
  reply.send(result);
}