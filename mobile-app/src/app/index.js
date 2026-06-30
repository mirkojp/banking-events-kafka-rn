// App.js
import React, { useState, useEffect, useRef } from 'react';
import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTransactionSocket } from '../hooks/useTransactionSocket';


import styles, { getEventStyles } from '../styles/styles';

const SERVER_IP = '192.168.0.93';
const USER_ID = 'user_facu_2025';

// Componente helper para formatear los metadatos del evento de forma elegante
const renderPayloadDetails = (payload) => {
  if (!payload) return null;

  const items = [];
  if (payload.fromAccount) items.push(`Cuenta Origen: ${payload.fromAccount}`);
  if (payload.toAccount) items.push(`Cuenta Destino: ${payload.toAccount}`);
  if (payload.amount) items.push(`Monto Transferido: $${payload.amount}`);
  if (payload.risk) items.push(`Riesgo Detectado: ${payload.risk}`);
  if (payload.reason) items.push(`Motivo de Rechazo: ${payload.reason}`);
  if (payload.error) items.push(`Detalle del Error: ${payload.error}`);
  if (payload.ledgerTxId) items.push(`ID Ledger: ${payload.ledgerTxId}`);

  if (items.length > 0) {
    return (
      <View style={styles.payloadContainer}>
        {items.map((text, idx) => (
          <Text key={idx} style={styles.payloadItemText}>• {text}</Text>
        ))}
      </View>
    );
  }

  return <Text style={styles.payloadItemText}>{JSON.stringify(payload)}</Text>;
};

export default function App() {
  const { events, setEvents, connected } = useTransactionSocket(USER_ID, SERVER_IP);
  const [loading, setLoading] = useState(false);
  const [activeTxId, setActiveTxId] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const processedEventIdsRef = useRef(new Set());
  const isDispatchingRef = useRef(false); // Candado mecánico inmediato para evitar ráfagas de POSTs

  useEffect(() => {
    if (events.length === 0) return;

    // Evaluamos el evento más reciente que llegó del hook
    const latestEvent = events[0];
    const eventKey = latestEvent.id || `${latestEvent.transactionId}-${latestEvent.type}`;

    if (!processedEventIdsRef.current.has(eventKey)) {
      processedEventIdsRef.current.add(eventKey);

      // Crear la alerta para la tarjeta interna
      const notificationId = Math.random().toString(36).substring(7);
      const newNotification = {
        id: notificationId,
        type: latestEvent.type,
        payload: latestEvent.payload,
        time: latestEvent.ts ? new Date(latestEvent.ts).toLocaleTimeString() : new Date().toLocaleTimeString()
      };

      setNotifications((prev) => [...prev, newNotification]);

      // Verificar si este evento específico cierra la saga actual
      if (['Committed', 'Reversed', 'Failed'].includes(latestEvent.type) && latestEvent.transactionId === activeTxId) {
        isDispatchingRef.current = false;
        setActiveTxId(null);
        setLoading(false);
      }

      // Remover del estado visual pasados los 10 segundos
      setTimeout(() => {
        setNotifications((prev) => prev.filter(n => n.id !== notificationId));
      }, 10000);
    }
  }, [events, activeTxId]);

  const dispararTransferencia = async () => {
    // Protección estricta contra clicks concurrentes
    if (isDispatchingRef.current || loading || activeTxId !== null) {
      console.warn("Acción bloqueada: Procesamiento de saga activo.");
      return;
    }

    isDispatchingRef.current = true;
    setLoading(true);

    // Resetear contadores y limpiar timeline viejo
    processedEventIdsRef.current.clear();
    setEvents([]);
    setNotifications([]);

    try {
      const response = await fetch(`http://${SERVER_IP}:3000/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAccount: 'CA-999',
          toAccount: 'CA-111',
          amount: Math.floor(Math.random() * 5000),
          userId: USER_ID
        })
      });

      const data = await response.json();
      if (data.transactionId) {
        setActiveTxId(data.transactionId);
      } else {
        setLoading(false);
        isDispatchingRef.current = false;
      }
    } catch (err) {
      alert("Error conectando con la API");
      setLoading(false);
      isDispatchingRef.current = false;
    }
  };

  const isButtonDisabled = loading || activeTxId !== null;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >

        {/* 1. Cabecera Dinámica (Usa el estado 'connected' real) */}
        {/* <View style={styles.header}>
          <Text style={styles.headerBrand}>SagaBank</Text>
          <View style={styles.connectionStatus}>
            <View style={[styles.statusDot, { backgroundColor: connected ? '#10B981' : '#EF4444' }]} />
            <Text style={[styles.statusText, { color: connected ? '#10B981' : '#EF4444' }]}>
              {connected ? 'Conectado' : 'Sin Conexión'}
            </Text>
          </View>
        </View> */}

        {/* 2. Tarjeta del Panel de Control (Simulador) */}
        <View style={styles.controlPanel}>
          <Text style={styles.panelTitle}>Simulador de Pagos Kafka</Text>
          <Text style={styles.panelSubtitle}>
            Envía una orden al bus de datos para iniciar el flujo secuencial de la saga.
          </Text>

          <View style={styles.profileBadge}>
            <Text style={styles.profileText}>ID Usuario: {USER_ID}</Text>
          </View>

          <TouchableOpacity
            style={[styles.button, isButtonDisabled && styles.buttonDisabled]}
            onPress={dispararTransferencia} // 👈 Corregido el nombre de la función acá
            disabled={isButtonDisabled}
          >
            {isButtonDisabled ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Procesando Saga...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Simular Transferencia</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 3. Título de la Sección de Eventos */}
        <View style={styles.timelineHeader}>
          <Text style={styles.timelineTitle}>Historial del Bus (Eventos)</Text>
          <Text style={styles.timelineSubtitle}>
            Eventos procesados por los microservicios en tiempo real
          </Text>
        </View>

        {/* 4. Tarjeta Única de Alertas Temporales con scroll asegurado */}
        {notifications.length > 0 && (
          <View style={styles.inlineNotificationContainer}>
            {notifications.map((notif) => {
              const stylesInfo = getEventStyles(notif.type);
              return (
                <View
                  key={notif.id}
                  style={[
                    styles.notificationToast,
                    { borderLeftColor: stylesInfo.borderColor }
                  ]}
                >
                  <View style={styles.notifHeader}>
                    <Text style={[styles.notifTitle, { color: stylesInfo.textColor }]}>
                      ⚡ {stylesInfo.title}
                    </Text>
                    <Text style={styles.notifTime}>{notif.time}</Text>
                  </View>
                  {renderPayloadDetails(notif.payload)}
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>
    </View>
  );
}