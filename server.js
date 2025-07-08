const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Root route for Render health checks and browser access
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Store connected users
const users = new Map();

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle user joining
  socket.on('join', (username) => {
    users.set(socket.id, username);
    socket.username = username;

    // Notify all users about the new user
    socket.broadcast.emit('userJoined', {
      username: username,
      message: `${username} joined the chat`,
      timestamp: new Date().toISOString(),
    });

    // Send current users list to the new user
    socket.emit('usersList', Array.from(users.values()));

    // Update users list for all clients
    io.emit('updateUsersList', Array.from(users.values()));
  });

  // Handle new messages
  socket.on('message', (data) => {
    const messageData = {
      id: Date.now() + Math.random(),
      username: socket.username || 'Anonymous',
      message: data.message,
      timestamp: new Date().toISOString(),
    };

    // Broadcast message to all connected clients
    io.emit('message', messageData);
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    socket.broadcast.emit('userTyping', {
      username: socket.username,
      isTyping: data.isTyping,
    });
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    if (socket.username) {
      users.delete(socket.id);

      // Notify all users about user leaving
      socket.broadcast.emit('userLeft', {
        username: socket.username,
        message: `${socket.username} left the chat`,
        timestamp: new Date().toISOString(),
      });

      // Update users list for all clients
      io.emit('updateUsersList', Array.from(users.values()));
    }

    console.log('User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Chat server is running on port ${PORT}`);
});
