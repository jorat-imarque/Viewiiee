const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;
const WebSocket = require('ws'); // Import the WebSocket library

// Create a WebSocket server
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
  // Handle WebSocket messages here
  ws.on('message', (message) => {
    // Broadcast the message to all connected clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

// Use express.json() middleware for parsing JSON requests
app.use(express.json());

app.use(express.static('public'));

// Serve Framework7 files from 'node_modules'

app.use('/framework7', express.static('node_modules/framework7', {
  setHeaders: (res, path, stat) => {
      res.set('Content-Type', 'text/css');
  },
}));

app.post('/saveData', (req, res) => {
  const data = req.body;
  fs.writeFileSync('data.json', JSON.stringify(data));
  
  // Broadcast the updated data to all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });

  res.sendStatus(200);
});

app.get('/readData', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync('data.json'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error reading data' });
  }
});

// Upgrade HTTP requests to WebSocket
app.server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});