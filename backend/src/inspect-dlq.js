const { kafka, TOPICS } = require('./config');

const consumer = kafka.consumer({ groupId: 'dlq-inspector-group-' + Math.random().toString(36).substring(7) });

const run = async () => {
    await consumer.connect();
    // Nos suscribimos a txn.dlq desde el inicio de la cola
    await consumer.subscribe({ topic: TOPICS.DLQ, fromBeginning: true });

    console.log('🔍 Iniciando inspección de la cola de descarte (DLQ - txn.dlq)...');
    console.log('Pulse Ctrl+C para salir.\n');

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log('================================================================');
            console.log(` Clave (Tx ID): ${message.key ? message.key.toString() : 'N/A'}`);
            console.log(` Fecha del Fallo: ${new Date(parseInt(message.timestamp)).toLocaleString()}`);
            
            try {
                const data = JSON.parse(message.value.toString());
                console.log(` Mensaje de Error: ${data.error}`);
                console.log(' Comando Original Completo:');
                console.log(JSON.stringify(data.originalCommand, null, 2));
            } catch (e) {
                console.log(` Contenido (Texto plano): ${message.value.toString()}`);
            }
            console.log('================================================================\n');
        },
    });
};

run().catch((error) => {
    console.error('❌ Error al inspeccionar la DLQ:', error);
});
