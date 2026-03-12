import type { FastifyInstance } from 'fastify';
import * as controller from './search.controller.js';

export default async function searchRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      schema: {
        description: 'Search media by text query, emotion, category, tags, and/or media type',
        tags: ['Search'],
        querystring: {
          type: 'object',
          properties: {
            q:         { type: 'string', description: 'Free-text search query' },
            emotion:   { type: 'string', description: 'Filter by emotion name (e.g. crying)' },
            category:  { type: 'string', description: 'Filter by category name (e.g. General)' },
            tag:       { type: 'string', description: 'Comma-separated list of tags (e.g. funny,cat)' },
            mediaType: { type: 'string', enum: ['GIF', 'STICKER', 'MEME'], description: 'Filter by media type' },
            page:      { type: 'string', description: 'Page number (default: 1)' },
            limit:     { type: 'string', description: 'Results per page, max 100 (default: 20)' },
            nsfw:      { type: 'string', enum: ['true', 'false'], description: 'Include NSFW content (default: false)' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: { type: 'array' },
              pagination: {
                type: 'object',
                properties: {
                  page:        { type: 'number' },
                  limit:       { type: 'number' },
                  total:       { type: 'number' },
                  pages:       { type: 'number' },
                  hasNextPage: { type: 'boolean' },
                  hasPrevPage: { type: 'boolean' }
                }
              },
              meta: { type: 'object' }
            }
          },
          400: {
            type: 'object',
            properties: {
              error:   { type: 'string' },
              message: { type: 'string' }
            }
          },
          500: {
            type: 'object',
            properties: {
              error:   { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    controller.search
  );
}