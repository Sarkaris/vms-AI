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
    // Initialize socket connection
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket'],
      upgrade: true,
      rememberUpgrade: true
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
