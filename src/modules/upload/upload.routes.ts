import type{ FastifyInstance } from 'fastify';
import * as controller from './upload.controller';

export default async function uploadRoutes(app: FastifyInstance) {
  app.post('/', controller.uploadMedia);
}