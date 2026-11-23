import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const getSocketUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:5000';
};

export const useSocket = (enabled = true) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketError, setSocketError] = useState(null);

  useEffect(() => {
    if (!enabled) return;
    const socketUrl = getSocketUrl();

    // Initialize socket connection with credentials (cookies)
    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setSocketError(null);
    });

    socket.on('connect_error', (err) => {
      // If port 5000 fails on Windows, try port 5001 fallback
      if (socketUrl.includes(':5000') && !socket.recovered) {
        socket.disconnect();
        const fallbackSocket = io('http://localhost:5001', {
          withCredentials: true,
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 3,
        });
        socketRef.current = fallbackSocket;

        fallbackSocket.on('connect', () => {
          setIsConnected(true);
          setSocketError(null);
        });

        fallbackSocket.on('connect_error', (fallbackErr) => {
          setSocketError(fallbackErr.message || 'Connection to real-time server failed');
          setIsConnected(false);
        });
        return;
      }

      setSocketError(err.message || 'Failed to connect to real-time collaboration server');
      setIsConnected(false);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    socketError,
  };
};

export default useSocket;

