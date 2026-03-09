import type { FastifyInstance } from 'fastify';
import * as controller from './emotions.controller.js';

export default async function emotionsRoutes(app: FastifyInstance) {

  // Public
  app.get('/', controller.getAllEmotions);
  app.get('/autocomplete', controller.getEmotionSuggestions);

  // Admin only
  app.post('/create', { preHandler: [checkAdmin] }, controller.createEmotion);
  app.patch('/:id', { preHandler: [checkAdmin] }, controller.updateEmotion);
  app.delete('/:id', { preHandler: [checkAdmin] }, controller.deleteEmotion);
}

async function checkAdmin(req: any, reply: any) {
  if (!req.user || req.user.role !== "SUPREMEADMIN") {
    return reply.code(403).send({ error: "Forbidden - admin only" });
  }
}