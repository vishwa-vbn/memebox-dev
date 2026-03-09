import app from './app';

const port = parseInt(process.env.PORT || '3000');

app.listen({ port }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`Server running on port ${port}`);
});