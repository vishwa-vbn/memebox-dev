import type{ FastifyInstance } from 'fastify';
import * as controller from './upload.controller.js';

export default async function uploadRoutes(app: FastifyInstance) {
  app.post('/', controller.uploadMedia);
}