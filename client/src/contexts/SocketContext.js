import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection - auto-detect server URL
    const getSocketUrl = () => {
      // Use environment variable if set (for production)
      if (process.env.REACT_APP_SOCKET_URL) {
        return process.env.REACT_APP_SOCKET_URL;
      }
      // In production, use same origin (server serves both API and static files)
      if (process.env.NODE_ENV === 'production') {
        return window.location.origin;
      }
      // Development fallback
      return 'http://localhost:5000';
    };

    const newSocket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnected(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  const joinRoom = (room) => {
    if (socket) {
      socket.emit('join-room', room);
    }
  };

  const leaveRoom = (room) => {
    if (socket) {
      socket.leave(room);
    }
  };

  const emitVisitorCheckin = (data) => {
    if (socket) {
      socket.emit('visitor-checkin', data);
    }
  };

  const emitVisitorCheckout = (data) => {
    if (socket) {
      socket.emit('visitor-checkout', data);
    }
  };

  const value = {
    socket,
    connected,
    joinRoom,
    leaveRoom,
    emitVisitorCheckin,
    emitVisitorCheckout
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
