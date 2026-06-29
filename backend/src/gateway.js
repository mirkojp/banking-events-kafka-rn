const WebSocket = require('ws');
const http = require('http'); // Para el endpoint de métricas
const fs = require('fs');
const path = require('path');
const { kafka, TOPICS } = require('./config');

const wss = new WebSocket.Server({ port: 8080 });
const consumer = kafka.consumer({ groupId: 'gateway-group' });

const userConnections = new Map();

// PUNTO 3: OBSERVABILIDAD (Métricas)
const metrics = {
    totalEventsProcessed: 0,
    byType: {}
};

wss.on('connection', (ws) => {
    console.log('Nueva conexión WS establecida');
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'subscribe' && data.userId) {
                userConnections.set(data.userId, ws);
                console.log(`Usuario ${data.userId} suscrito.`);
            }
        } catch (e) { console.error("Error parseando mensaje WS"); }
    });

    ws.on('close', () => {
        for (let [userId, socket] of userConnections.entries()) {
            if (socket === ws) userConnections.delete(userId);
        }
    });
});

// Cargar el HTML del Dashboard desde archivo externo
const dashboardHtml = fs.readFileSync(path.join(__dirname, 'dashboard.html'), 'utf8');

// Endpoint de Métricas Simple (Puerto 8082)
http.createServer((req, res) => {
    if (req.url === '/metrics') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(dashboardHtml);
    } else if (req.url === '/metrics/data') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: "Gateway Online",
            activeConnections: userConnections.size,
            ...metrics
        }));
    } else {
        res.writeHead(404); res.end();
    }
}).listen(8082);

const run = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: TOPICS.EVENTS, fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ message }) => {
            const event = JSON.parse(message.value.toString());

            // Actualizar métricas
            metrics.totalEventsProcessed++;
            metrics.byType[event.type] = (metrics.byType[event.type] || 0) + 1;

            const targetSocket = userConnections.get(event.userId);
            if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
                targetSocket.send(JSON.stringify(event));
            }
        },
    });
};

console.log('Gateway WS en puerto 8080 | Métricas en puerto 8082 en /metrics');
run();