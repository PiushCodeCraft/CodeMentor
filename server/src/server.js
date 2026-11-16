import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocket } from './sockets/index.js';

const startServer = async () => {
  let port = env.PORT;

  const listen = (targetPort) => {
    // Create HTTP Server wrapping Express app
    const httpServer = http.createServer(app);

    // Initialize Socket.io on the HTTP server
    const io = initSocket(httpServer);
    app.set('io', io);

    httpServer.listen(targetPort, () => {
      console.log(`🚀 CodeMentor Live Server running on port ${targetPort} in ${env.NODE_ENV} mode`);
      console.log(`🩺 Health check available at: http://localhost:${targetPort}/api/health`);
      console.log(`⚡ WebSocket Server active for real-time collaboration`);
    });

    httpServer.on('error', (err) => {
      if ((err.code === 'EADDRINUSE' || err.code === 'EACCES') && targetPort === 5000) {
        console.warn(`⚠️ Port 5000 is unavailable (reserved by Windows/Hyper-V). Falling back to port 5001...`);
        listen(5001);
      } else {
        console.error(`❌ Server failed to start on port ${targetPort}:`, err.message);
      }
    });

    const shutdown = () => {
      console.log('\n🛑 Gracefully shutting down server...');
      httpServer.close(() => {
        console.log('💤 HTTP and WebSocket servers closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  };

  listen(port);

  // Connect to MongoDB Atlas
  connectDB();
};

startServer();
