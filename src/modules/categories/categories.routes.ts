import type { FastifyInstance } from 'fastify';
import * as controller from './categories.controller';

export default async function categoriesRoutes(app: FastifyInstance) {
  // Public
  app.get('/', controller.getAllCategories);

  // Admin only
  app.post('/', { preHandler: [checkAdmin] }, controller.createCategory);
  app.patch('/:id', { preHandler: [checkAdmin] }, controller.updateCategory);
  app.delete('/:id', { preHandler: [checkAdmin] }, controller.deleteCategory);
}

async function checkAdmin(req: any, reply: any) {
  if (!req.user || req.user.role !== "SUPREMEADMIN") {
    return reply.code(403).send({ error: "Forbidden - admin only" });
  }
}