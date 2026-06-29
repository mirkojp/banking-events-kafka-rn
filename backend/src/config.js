const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'sistema-bancario',
    brokers: ['localhost:9092'], 
});

module.exports = {
    kafka,
    TOPICS: {
        COMMANDS: 'txn.commands',
        EVENTS: 'txn.events',
        DLQ: 'txn.dlq'
    }
};