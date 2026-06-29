const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { kafka, TOPICS } = require('./config');

const cors = require('cors');
const app = express();
app.use(cors()); 
app.use(express.json());

const producer = kafka.producer();

app.post('/transactions', async (req, res) => {
    console.log("-----------------------------------------");
    console.log("📩 PETICIÓN RECIBIDA DESDE:", req.ip);
    console.log("BODY:", req.body);

    const { fromAccount, toAccount, amount, userId } = req.body;

    // Validación básica para evitar el 500 si falta un dato
    if (!userId) {
        console.error("ERROR: userId es undefined");
        return res.status(400).json({ error: "Falta el userId" });
    }

    const transactionId = uuidv4();
    const command = {
        id: uuidv4(),
        type: 'TransactionInitiated',
        userId,
        transactionId,
        payload: { fromAccount, toAccount, amount, currency: 'ARS' },
        ts: new Date().toISOString()
    };

    try {
        await producer.send({
            topic: TOPICS.COMMANDS,
            messages: [{ key: transactionId, value: JSON.stringify(command) }],
        });
        console.log("COMANDO ENVIADO A KAFKA:", transactionId);
        res.status(202).json({ transactionId, status: 'Procesando' });
    } catch (error) {
        console.error("ERROR EN KAFKA:", error.message);
        res.status(500).json({ error: "Error en el bus de datos" });
    }
});

const start = async () => {
    await producer.connect();
    app.listen(3000, () => console.log(' API escuchando en puerto 3000'));
};
start();