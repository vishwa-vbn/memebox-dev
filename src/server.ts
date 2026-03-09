import app from './app';

const port = parseInt(process.env.PORT || '3000');

// Only run app.listen if we are NOT on Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen({ port }, (err) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
    console.log(`Server running on port ${port}`);
  });
}

// CRITICAL: Export for Vercel
export default async (req: any, res: any) => {
  await app.ready();
  app.server.emit('request', req, res);
};