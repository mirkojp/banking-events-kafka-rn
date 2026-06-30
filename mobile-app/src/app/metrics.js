import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import styles, { getEventStyles } from '../styles/styles';
const SERVER_IP = '192.168.0.93'; 

export default function MetricsDashboard() {
    const [data, setData] = useState(null);
    const [errorState, setErrorState] = useState(false);

    useEffect(() => {
        const updateMetrics = async () => {
            try {
                const response = await fetch(`http://${SERVER_IP}:8082/metrics/data`);
                if (!response.ok) throw new Error("Gateway offline");
                const json = await response.json();
                setData(json);
                setErrorState(false);
            } catch (error) {
                console.error("Error al obtener las métricas:", error);
                setErrorState(true);
            }
        };

        // Polling idéntico al que tenías en el dashboard HTML (1.5s)
        const interval = setInterval(updateMetrics, 1500);
        updateMetrics();

        return () => clearInterval(interval);
    }, []);

    const getFriendlyEventInfo = (type) => {
        switch (type) {
            case 'Funds Reserved': return { name: '💰 Funds Reserved (Reserva de Fondos)', color: '#3B82F6' };
            case 'FraudChecked': return { name: '🔍 FraudChecked (Control de Fraude)', color: '#8B5CF6' };
            case 'Committed': return { name: '✅ Committed (Confirmadas)', color: '#10B981' };
            case 'Reversed': return { name: '⚠️ Reversed (Revertidas)', color: '#F59E0B' };
            case 'Failed': return { name: '❌ Failed (Fallos Críticos / DLQ)', color: '#EF4444' };
            default: return { name: type, color: '#94A3B8' };
        }
    };

    if (!data && !errorState) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.textMuted}>Conectando con la API de métricas...</Text>
            </View>
        );
    }

    const types = data ? Object.keys(data.byType || {}) : [];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Cabecera CORREGIDA */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Dashboard de Métricas</Text>
                    <Text style={styles.subtitle}>Monitoreo en tiempo real del bus de eventos Kafka</Text>
                </View> {/* 👈 El contenedor de los textos cierra acá limpiamente */}

                <View style={[
                    styles.badge,
                    errorState ? styles.badgeError : styles.badgeSuccess
                ]}>
                    <View style={[styles.pulse, { backgroundColor: errorState ? '#EF4444' : '#10B981' }]} />
                    <Text style={[styles.badgeText, { color: errorState ? '#EF4444' : '#10B981' }]}>
                        {errorState ? 'GATEWAY OFFLINE' : 'GATEWAY ONLINE'}
                    </Text>
                </View>
            </View>

            {/* Tarjetas de Contadores */}
            <View style={styles.grid}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Conexiones WS Activas</Text>
                    <Text style={styles.cardValue}>{errorState ? 0 : data?.activeConnections || 0}</Text>
                    <Text style={styles.cardFooter}>Clientes React Native suscritos actualmente</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Total Eventos Procesados</Text>
                    <Text style={styles.cardValue}>{errorState ? 0 : data?.totalEventsProcessed || 0}</Text>
                    <Text style={styles.cardFooter}>Eventos distribuidos por el bus de datos</Text>
                </View>
            </View>

            {/* Distribución por Tipo */}
            <Text style={styles.sectionTitle}>Distribución de Eventos por Tipo</Text>
            <View style={styles.breakdownContainer}>
                {types.length === 0 || errorState ? (
                    <Text style={styles.noEventsText}>Esperando primer evento en el bus...</Text>
                ) : (
                    types.map((type) => {
                        const count = data.byType[type];
                        const total = data.totalEventsProcessed || 1;
                        const percent = ((count / total) * 100).toFixed(0);
                        const info = getFriendlyEventInfo(type);

                        return (
                            <View key={type} style={styles.row}>
                                <View style={styles.rowInfo}>
                                    <Text style={styles.rowName}>{info.name}</Text>
                                    <Text style={styles.rowValue}>{count} ({percent}%)</Text>
                                </View>
                                <View style={styles.barContainer}>
                                    <View style={[styles.barFill, { width: `${percent}%`, backgroundColor: info.color }]} />
                                </View>
                            </View>
                        );
                    })
                )}
            </View>
        </ScrollView>
    );
}
