import type{ FastifyInstance } from 'fastify';
import * as controller from './auth.controller.js';

export default async function authRoutes(app: FastifyInstance) {
  app.post('/register', controller.register);
  app.post('/login', controller.login);
}