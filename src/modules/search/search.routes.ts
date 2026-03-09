import type { FastifyInstance } from 'fastify';
import * as controller from './search.controller.js';

export default async function searchRoutes(app: FastifyInstance) {
  app.get('/', controller.search);
}