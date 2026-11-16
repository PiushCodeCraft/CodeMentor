import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

const getMongoStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

router.get('/health', (req, res) => {
  const mongoStatus = getMongoStatus();

  res.status(200).json({
    status: 'ok',
    service: 'CodeMentor Live API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: {
      status: mongoStatus,
      name: mongoose.connection.name || null,
    },
  });
});

export default router;

