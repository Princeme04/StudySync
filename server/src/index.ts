import { app } from './app.ts';

const port = Number(process.env.PORT || 3001);
const server = app.listen(port, () => console.log(`StudySync API running at http://localhost:${port}`));

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the existing process before starting StudySync.`);
    process.exit(1);
  }
  throw error;
});
