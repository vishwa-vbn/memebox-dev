import app from './app';

// For local development
if (process.env.NODE_ENV !== 'production') {
  const port = parseInt(process.env.PORT || '3000');
  app.listen({ port, host: '0.0.0.0' }, (err) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
    console.log(`Server running on port ${port}`);
  });
}

// CRITICAL: Vercel Serverless Function Handler
export default async (req: any, res: any) => {
  await app.ready();
  app.server.emit('request', req, res);
};