import type { FastifyInstance } from 'fastify';
import * as controller from './media.controller';

export default async function mediaRoutes(app: FastifyInstance) {
  app.get('/trending', controller.getTrending);
  app.get('/:id', controller.getMediaById);
  app.get('/category/:slug', controller.getByCategory);
  app.post('/:id/like', controller.likeMedia);
  app.get('/:id/download', controller.trackDownload);
}