const WebSocket = require('ws');
const http = require('http');
const { kafka, TOPICS } = require('./config');

const wss = new WebSocket.Server({ port: 8080 });
const consumer = kafka.consumer({ groupId: 'gateway-group' });

const userConnections = new Map();

// OBSERVABILIDAD (Métricas puras en memoria)
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

// Endpoint de API HTTP exclusivo para Datos (Habilitamos CORS para que el frontend pueda consultar)
http.createServer((req, res) => {
    // Configuración básica de CORS para que tu frontend externo pueda consultar la API
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === '/metrics/data') {
        res.writeHead(200);
        res.end(JSON.stringify({
            status: "Gateway Online",
            activeConnections: userConnections.size,
            ...metrics
        }));
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: "Not Found" }));
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

console.log('Gateway WS en puerto 8080 | API de Métricas en puerto 8082 (/metrics/data)');
run();