import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import * as controller from './media.controller.js';

export default async function mediaRoutes(app: FastifyInstance) {
  app.get('/trending', controller.getTrending);
  app.get('/category/:slug', controller.getByCategory);
  app.get('/:id/similar', controller.getSimilar); // 👈 ADD HERE
  app.get('/:id', controller.getMediaById);
  app.post<{ Params: { id: string } }>('/:id/like', { preHandler: [checkAuth] }, controller.likeMedia);
  app.get('/:id/download', controller.trackDownload);
}


async function checkAuth(req: FastifyRequest<any>, reply: FastifyReply) {

  if (!req.user) {
    return reply.code(401).send({ error: "Unauthorized" });
  }

}