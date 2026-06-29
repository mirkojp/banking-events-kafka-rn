// orchestrator.js - CORREGIDO
const { kafka, TOPICS } = require('./config');
const { v4: uuidv4 } = require('uuid');

const consumer = kafka.consumer({ groupId: 'orchestrator-group' });
const producer = kafka.producer();

// Guardamos los IDs de comandos ya procesados para evitar duplicados
const processedCommandIds = new Set();

const emitEvent = async (type, transactionId, userId, payload) => {
    const event = {
        id: uuidv4(),
        type,
        transactionId,
        userId,
        payload,
        ts: new Date().toISOString()
    };
    await producer.send({
        topic: TOPICS.EVENTS,
        messages: [{ key: transactionId, value: JSON.stringify(event) }]
    });
    console.log(`[EVENTO]: ${type} -> ${transactionId}`);
};

const run = async () => {
    await Promise.all([consumer.connect(), producer.connect()]);
    await consumer.subscribe({ topic: TOPICS.COMMANDS });

    await consumer.run({
        eachMessage: async ({ message }) => {
            const commandText = message.value.toString();
            const command = JSON.parse(commandText);
            const { id: commandId, transactionId, userId, payload } = command;

            // 🛡️ Lógica de Idempotencia al INICIO: Si ya lo vimos, lo pateamos
            if (processedCommandIds.has(commandId)) {
                console.warn(`[SKIP] Comando duplicado detectado y mitigado: ${commandId}`);
                return;
            }

            // 🔴 AGREGAR INMEDIATAMENTE al Set para bloquear reintentos concurrentes de Kafka
            processedCommandIds.add(commandId);
            if (processedCommandIds.size > 5000) processedCommandIds.clear();

            try {
                // Simulación de fallo crítico no recuperable (10% de probabilidad)
                if (Math.random() < 0.10) {
                    throw new Error("Fallo crítico e irrecuperable de base de datos o cuenta bloqueada.");
                }

                // 1. Reservar Fondos
                await emitEvent('Funds Reserved', transactionId, userId, { ok: true, amount: payload.amount });

                // 2. Simular Antifraude 
                // Reducimos el delay artificial para no colgar el timeout del consumidor de Kafka
                await new Promise(r => setTimeout(r, 200));

                const risk = Math.random() > 0.15 ? 'LOW' : 'HIGH';
                await emitEvent('FraudChecked', transactionId, userId, { risk });

                // 3. Resultado Final
                if (risk === 'LOW') {
                    await emitEvent('Committed', transactionId, userId, { ledgerTxId: uuidv4() });
                } else {
                    await emitEvent('Reversed', transactionId, userId, { reason: 'Riesgo de fraude detectado' });
                }

            } catch (err) {
                console.error(" Error en Orchestrator, enviando a DLQ:", err.message);
                await producer.send({
                    topic: TOPICS.DLQ,
                    messages: [{
                        key: transactionId,
                        value: JSON.stringify({ error: err.message, originalCommand: command })
                    }]
                });

                // Emitir evento de fallo al cliente
                await emitEvent('Failed', transactionId, userId, { error: err.message });
            }
        },
    });
};

run();