import type { FastifyInstance } from 'fastify';
import * as controller from './tags.controller.js';

export default async function tagsRoutes(app: FastifyInstance) {
  app.get('/', controller.getPopularTags);
  app.get('/autocomplete', controller.getTagSuggestions);
  app.post('/create', { preHandler: [checkAdmin] }, controller.createTag);
app.patch('/:id', { preHandler: [checkAdmin] }, controller.updateTag);
app.delete('/:id', { preHandler: [checkAdmin] }, controller.deleteTag);
}

async function checkAdmin(req: any, reply: any) {
  if (!req.user || req.user.role !== "SUPREMEADMIN") {
    return reply.code(403).send({ error: "Forbidden - admin only" });
  }
}