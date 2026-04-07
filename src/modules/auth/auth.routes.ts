// src/routes/auth.routes.ts
import type { FastifyInstance } from 'fastify';
import * as controller from './auth.controller.js';

export default async function authRoutes(app: FastifyInstance) {
  // Public routes
  app.post('/register', controller.register);
  app.post('/login', controller.login);

  // Protected self routes
  app.get('/me', { preHandler: [checkAuth] }, controller.getMe);
  app.patch('/me', { preHandler: [checkAuth] }, controller.updateMe);

  // Protected user activity routes
app.get('/me/likes',      { preHandler: [checkAuth] }, controller.getMyLikes);
app.get('/me/submissions', { preHandler: [checkAuth] }, controller.getMySubmissions);

app.post('/verify-email/send-otp', { preHandler: [checkAuth] }, controller.sendVerificationOtpController);
  app.post('/verify-email/verify',   { preHandler: [checkAuth] }, controller.verifyOtpController);

  // Password reset (public)
  app.post('/password/reset-request', controller.requestPasswordResetController);
  app.post('/password/reset',         controller.resetPasswordController);
}



/**
 * Basic Auth Guard (used for /me)
 */
async function checkAuth(req: any, reply: any) {
  if (!req.user) {
    return reply.code(401).send({ error: "Unauthorized" });
  }
}