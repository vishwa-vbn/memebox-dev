import fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import fastifyMultipart from '@fastify/multipart';

import authRoutes from './modules/auth/auth.routes';
import mediaRoutes from './modules/media/media.routes';
import uploadRoutes from './modules/upload/upload.routes';
import searchRoutes from './modules/search/search.routes';
import adminRoutes from './modules/admin/admin.routes';
import tagsRoutes from './modules/tags/tags.routes';
import categoriesRoutes from './modules/categories/categories.routes';
import emotionsRoutes from './modules/emotions/emotions.routes';
import { authMiddleware } from './middleware/auth.middleware';

dotenv.config();

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const app = fastify({ logger: true });

app.register(cors, {
  origin: true
});

app.register(fastifyMultipart, {
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

app.decorateRequest('user', null);
app.addHook('preHandler', authMiddleware);

app.register(authRoutes, { prefix: '/auth' });
app.register(mediaRoutes, { prefix: '/media' });
app.register(uploadRoutes, { prefix: '/upload' });
app.register(searchRoutes, { prefix: '/search' });
app.register(adminRoutes, { prefix: '/admin' });
app.register(categoriesRoutes, { prefix: '/categories' });
app.register(tagsRoutes, { prefix: '/tags' });
app.register(emotionsRoutes, { prefix: '/emotions' });

export default app;