
import http from 'http';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';
import { initSocket } from './sockets/index.js';

const startServer = async () => {
  try {
    await connectDB();

    const httpServer = http.createServer(app);

    const io = initSocket(httpServer);
    app.set('io', io);

    const PORT = env.PORT || 5000;

    httpServer.listen(PORT, () => {
      console.log(`🚀 CodeMentor Live Server running on port ${PORT}`);
      console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`⚡ Socket.io is active`);
    });

    const shutdown = () => {
      console.log('\n🛑 Gracefully shutting down...');

      io.close(() => {
        httpServer.close(() => {
          console.log('💤 Server closed successfully.');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

startServer();
