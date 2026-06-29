import { useState, useEffect } from 'react';

export const useTransactionSocket = (userId, serverIp) => {
    const [events, setEvents] = useState([]);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!userId || !serverIp) return;

        console.log(`Abriendo conexión WebSocket para el usuario: ${userId}`);
        const ws = new WebSocket(`ws://${serverIp}:8080`);

        ws.onopen = () => {
            console.log('Conectado al Gateway');
            setConnected(true);
            ws.send(JSON.stringify({ type: 'subscribe', userId }));
        };

        ws.onmessage = (e) => {
            try {
                const event = JSON.parse(e.data);

                // 🛡️ FILTRO DE SEGURIDAD: Evita duplicar si el evento ya existe en la lista por ID
                setEvents((prev) => {
                    const exists = prev.some((e) => e.id === event.id);
                    if (exists) return prev; // Si ya existe, ignora el duplicado
                    return [event, ...prev]; // Si es nuevo, lo agrega al inicio
                });
            } catch (err) {
                console.error("Error parseando evento de WebSocket:", err);
            }
        };

        ws.onerror = (e) => {
            console.error('Error Socket:', e.message);
            setConnected(false);
        };

        ws.onclose = (e) => {
            console.log('Conexión cerrada con el Gateway:', e.reason);
            setConnected(false);
        };

        // Función de limpieza al desmontar o cambiar dependencias
        return () => {
            console.log('Limpiando conexión WebSocket anterior...');
            // Forzamos el cierre inmediato removiendo los listeners primero
            ws.onopen = null;
            ws.onmessage = null;
            ws.onerror = null;
            ws.onclose = null;
            ws.close();
        };
    }, [userId, serverIp]); // Se ejecuta solo si cambia el ID de usuario o la IP del servidor

    return { events, setEvents, connected };
};