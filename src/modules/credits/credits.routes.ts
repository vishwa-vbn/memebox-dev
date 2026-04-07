import type { FastifyInstance } from 'fastify';
import * as controller from './credits.controller.js';

export default async function creditRoutes(app: FastifyInstance) {
  
  app.get('/me/credits', {
    preHandler: [checkAuth]
  }, controller.getMyCredits);

  app.get('/me/credits/transactions', {
    preHandler: [checkAuth]
  }, controller.getMyTransactions);
}


// Auth middleware
async function checkAuth(req: any, reply: any) {
  if (!req.user) {
    return reply.code(401).send({ error: "Unauthorized" });
  }
}