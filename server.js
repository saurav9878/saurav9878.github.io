const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

let clients = new Set();
let currentTime = 0;
let isPlaying = false;
let lastUpdate = Date.now();

wss.on('connection', (ws) => {
    clients.add(ws);
    
    // Send initial state to new client
    ws.send(JSON.stringify({
        type: 'sync',
        currentTime,
        isPlaying,
        timestamp: Date.now()
    }));

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        switch (data.type) {
            case 'play':
                isPlaying = true;
                currentTime = data.currentTime;
                lastUpdate = Date.now();
                broadcastState();
                break;
            case 'pause':
                isPlaying = false;
                currentTime = data.currentTime;
                lastUpdate = Date.now();
                broadcastState();
                break;
            case 'seek':
                currentTime = data.currentTime;
                lastUpdate = Date.now();
                broadcastState();
                break;
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
    });
});

function broadcastState() {
    const state = {
        type: 'sync',
        currentTime,
        isPlaying,
        timestamp: Date.now()
    };

    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(state));
        }
    });
}

// Update current time for playing videos
setInterval(() => {
    if (isPlaying) {
        const now = Date.now();
        const delta = (now - lastUpdate) / 1000;
        currentTime += delta;
        lastUpdate = now;
        broadcastState();
    }
}, 1000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
}); 