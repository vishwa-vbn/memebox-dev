// import fastify from 'fastify';
// import rateLimit from '@fastify/rate-limit';
// import cors from '@fastify/cors';
// import dotenv from 'dotenv';
// import fastifyMultipart from '@fastify/multipart';

// import authRoutes from './modules/auth/auth.routes.js';
// import mediaRoutes from './modules/media/media.routes.js';
// import uploadRoutes from './modules/upload/upload.routes.js';
// import searchRoutes from './modules/search/search.routes.js';
// import adminRoutes from './modules/admin/admin.routes.js';
// import tagsRoutes from './modules/tags/tags.routes.js';
// import categoriesRoutes from './modules/categories/categories.routes.js';
// import emotionsRoutes from './modules/emotions/emotions.routes.js';

// import { authMiddleware } from './middleware/auth.middleware.js';

// dotenv.config();

// (BigInt.prototype as any).toJSON = function () {
//   return this.toString();
// };

// const app = fastify({ logger: true });

// app.register(cors, {
//   origin: true,
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin']
// });

// app.register(fastifyMultipart, {
//   limits: {
//     fileSize: 50 * 1024 * 1024
//   }
// });

// app.register(rateLimit, {
//   max: 100,
//   timeWindow: '1 minute',
// });

// app.decorateRequest('user', null);
// app.addHook('preHandler', authMiddleware);

// app.register(authRoutes, { prefix: '/auth' });
// app.register(mediaRoutes, { prefix: '/media' });
// app.register(uploadRoutes, { prefix: '/upload' });
// app.register(searchRoutes, { prefix: '/search' });
// app.register(adminRoutes, { prefix: '/admin' });
// app.register(categoriesRoutes, { prefix: '/categories' });
// app.register(tagsRoutes, { prefix: '/tags' });
// app.register(emotionsRoutes, { prefix: '/emotions' });




// export default app;

import fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import fastifyMultipart from '@fastify/multipart';

import authRoutes from './modules/auth/auth.routes.js';
import mediaRoutes from './modules/media/media.routes.js';
import uploadRoutes from './modules/upload/upload.routes.js';
import searchRoutes from './modules/search/search.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import tagsRoutes from './modules/tags/tags.routes.js';
import categoriesRoutes from './modules/categories/categories.routes.js';
import emotionsRoutes from './modules/emotions/emotions.routes.js';

import { authMiddleware } from './middleware/auth.middleware.js';
import creditRoutes from './modules/credits/credits.routes.js';
import contactRoutes from './modules/contact/contact.routes.js';
import { validateEnv } from './config/env.js';
import { prisma } from './config/database.js';

// ────────────────────────────────────────────────
// NEW: IP + Fingerprint Middleware
// ────────────────────────────────────────────────
import crypto from 'crypto';

declare module 'fastify' {
  interface FastifyRequest {
    ipInfo?: {
      ip: string;
      fingerprint: string;
      userAgent: string;
    };
  }
}

async function ipFingerprintMiddleware(req: any, reply: any) {
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.ip ||
    req.socket.remoteAddress ||
    'unknown';

  const ua = req.headers['user-agent'] || 'unknown';
  const acceptLanguage = req.headers['accept-language'] || '';

  // Simple but effective fingerprint (can be improved later)
  const fingerprint = crypto
    .createHash('md5')
    .update(ua + acceptLanguage + ip.slice(-8))
    .digest('hex');

  req.ipInfo = {
    ip,
    fingerprint,
    userAgent: ua,
  };

  // Optional: log every request with IP (you can remove or make conditional)
  req.log.info({
    ip,
    fingerprint: fingerprint.slice(0, 8) + '...',
    url: req.url,
    method: req.method,
    userId: req.user?.id || 'guest',
  });

  return;
}

// ────────────────────────────────────────────────
// Fastify App Setup
// ────────────────────────────────────────────────

dotenv.config();

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// Validate environment variables on startup
validateEnv();

const app = fastify({
  logger: true,
  trustProxy: true,           // ← CRITICAL for real client IP (Vercel, Cloudflare, etc.)
});

app.register(cors, {
  origin: [
    process.env.FRONTENDDOMAIN || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
});

app.register(fastifyMultipart, {
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// ── Attach middlewares ──
// IP fingerprint first → so it's available everywhere
app.addHook('onRequest', ipFingerprintMiddleware);

// Then authentication (public routes are skipped inside authMiddleware)
app.addHook('preHandler', authMiddleware);

// Decorate request (already there, kept)
app.decorateRequest('user', null);

// ── Global Error Handler ──
app.setErrorHandler((error: any, request, reply) => {
  request.log.error(error);

  if (error.validation) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: error.message,
    });
  }

  const isProd = process.env.NODE_ENV === 'production';
  const statusCode = error.statusCode || 500;

  reply.status(statusCode).send({
    error: isProd && statusCode === 500 ? 'Internal Server Error' : error.name,
    message:
      isProd && statusCode === 500
        ? 'An unexpected error occurred. Please try again later.'
        : error.message,
  });
});

// ── Register routes ── (unchanged)
const authRateLimit = {
  max: 5,
  timeWindow: '1 minute',
};

app.register(authRoutes, {
  prefix: '/auth',
  config: { rateLimit: authRateLimit }, // Stricter for login/register
});
app.register(mediaRoutes, { prefix: '/media' });
app.register(uploadRoutes, {
  prefix: '/upload',
  config: {
    rateLimit: {
      max: 2,
      timeWindow: '1 minute', // 🛡️ Strict for uploads (prevents spam)
    }
  }
});
app.register(searchRoutes, { prefix: '/search' });
app.register(adminRoutes, { prefix: '/admin' });
app.register(categoriesRoutes, { prefix: '/categories' });
app.register(tagsRoutes, { prefix: '/tags' });
app.register(emotionsRoutes, { prefix: '/emotions' });

app.register(creditRoutes, { prefix: '/credits' });
app.register(contactRoutes, { prefix: '/contact' });

// ── Graceful Shutdown ──
const shutDown = async () => {
  app.log.info('Shutting down...');
  try {
    await prisma.$disconnect();
    await app.close();
    process.exit(0);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);

export default app;