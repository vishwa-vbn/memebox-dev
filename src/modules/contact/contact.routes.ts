import type { FastifyInstance } from 'fastify';
import * as controller from './contact.controller.js';

export default async function contactRoutes(app: FastifyInstance) {

  // Public
  app.post('/', controller.createContact);

  // Admin
  app.get('/', controller.getAllContacts);
  app.get('/:id', controller.getContactById);

  app.patch('/:id/status', controller.updateContactStatus);
  app.patch('/:id/note', controller.updateContactNote);
}