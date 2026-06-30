// src/styles.js
import { StyleSheet } from 'react-native';

const PALETTE = {
    bgPrimary: '#0F172A',    // Fondo principal ultra oscuro
    bgSecondary: '#1E293B',  // Fondo de tarjetas y paneles
    bgCard: '#334155',       // Sub-contenedores y detalles internos
    textMain: '#F8FAFC',     // Texto principal brillante
    textMuted: '#94A3B8',    // Texto secundario / grisado
    textFooter: '#64748B',   // Gris más oscuro para pies de tarjetas
    barContainer: '#334155', // Fondo de la barra de progreso
    primary: '#3B82F6',      // Azul para Funds Reserved
    purple: '#8B5CF6',       // Púrpura para FraudChecked
    success: '#10B981',      // Verde para Committed
    warning: '#F59E0B',      // Amarillo para Reversed
    error: '#EF4444',        // Rojo para Failed / DLQ
};

// Función para obtener colores y textos amigables según el estado de la saga 
export const getEventStyles = (type) => {
    switch (type) {
        case 'Committed':
            return {
                bgColor: 'rgba(16, 185, 129, 0.1)',
                borderColor: PALETTE.success,
                textColor: PALETTE.success,
                title: 'Committed (Transacciones Confirmadas)'
            };
        case 'Reversed':
            return {
                bgColor: 'rgba(245, 158, 11, 0.1)',
                borderColor: PALETTE.warning,
                textColor: PALETTE.warning,
                title: 'Reversed (Transacciones Revertidas)'
            };
        case 'Failed':
            return {
                bgColor: 'rgba(239, 68, 68, 0.1)',
                borderColor: PALETTE.error,
                textColor: PALETTE.error,
                title: 'Failed (Fallos Críticos / DLQ)'
            };
        case 'Funds Reserved':
            return {
                bgColor: 'rgba(59, 130, 246, 0.1)',
                borderColor: PALETTE.primary,
                textColor: PALETTE.primary,
                title: 'Funds Reserved (Reserva de Fondos)'
            };
        case 'FraudChecked':
            return {
                bgColor: 'rgba(139, 92, 246, 0.1)',
                borderColor: PALETTE.purple,
                textColor: PALETTE.purple,
                title: 'FraudChecked (Control de Fraude)'
            };
        default:
            return {
                bgColor: 'rgba(148, 163, 184, 0.1)',
                borderColor: PALETTE.textMuted,
                textColor: PALETTE.textMain,
                title: type
            };
    }
};

const styles = StyleSheet.create({
    // Estructuras Base Compartidas
    container: {
        flex: 1,
        backgroundColor: PALETTE.bgPrimary,
        paddingHorizontal: 20,
        paddingTop: 60
    },
    content: {
        paddingBottom: 40
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12
    },
    textMuted: {
        color: PALETTE.textMuted,
        fontSize: 14
    },

    // Estilos de Cabecera (Compartidos / Adaptados)
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerBrand: {
        fontSize: 22,
        fontWeight: '700',
        color: PALETTE.textMain,
        letterSpacing: -0.5,
    },
    connectionStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 30,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: PALETTE.success,
    },

    // UI Específica de Metrics Dashboard
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: PALETTE.textMain
    },
    subtitle: {
        fontSize: 13,
        color: PALETTE.textMuted,
        marginTop: 4
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6
    },
    badgeSuccess: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)'
    },
    badgeError: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)'
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600'
    },
    pulse: {
        width: 8,
        height: 8,
        borderRadius: 4
    },
    grid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 30,
        flexWrap: 'wrap'
    },
    card: {
        flex: 1,
        minWidth: 240,
        backgroundColor: PALETTE.bgSecondary,
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    cardTitle: {
        fontSize: 12,
        color: PALETTE.textMuted,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 8
    },
    cardValue: {
        fontSize: 36,
        fontWeight: '700',
        color: PALETTE.textMain
    },
    cardFooter: {
        fontSize: 11,
        color: PALETTE.textFooter,
        marginTop: 8
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: PALETTE.textMuted,
        marginBottom: 16
    },
    breakdownContainer: {
        backgroundColor: PALETTE.bgSecondary,
        padding: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    noEventsText: {
        color: PALETTE.textMuted,
        textAlign: 'center',
        paddingVertical: 10
    },
    row: {
        marginBottom: 20
    },
    rowInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    rowName: {
        color: PALETTE.textMain,
        fontWeight: '500',
        fontSize: 14
    },
    rowValue: {
        color: PALETTE.textMain,
        fontWeight: '600',
        fontSize: 14
    },
    barContainer: {
        height: 10,
        backgroundColor: PALETTE.barContainer,
        borderRadius: 5,
        overflow: 'hidden'
    },
    barFill: {
        height: '100%',
        borderRadius: 5
    },

    // Tarjeta del Panel de Control (Simulador de Pagos Kafka)
    controlPanel: {
        backgroundColor: PALETTE.bgSecondary,
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 25,
        elevation: 5,
    },
    panelTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: PALETTE.textMain,
        marginBottom: 4,
    },
    panelSubtitle: {
        fontSize: 13,
        color: PALETTE.textMuted,
        marginBottom: 12,
        lineHeight: 16,
    },
    profileBadge: {
        backgroundColor: PALETTE.bgCard,
        alignSelf: 'flex-start',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        marginBottom: 16,
    },
    profileText: {
        fontSize: 11,
        color: PALETTE.textMuted,
    },
    button: {
        backgroundColor: PALETTE.primary,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        backgroundColor: PALETTE.bgCard,
        opacity: 0.5,
    },
    buttonText: {
        color: PALETTE.textMain,
        fontSize: 15,
        fontWeight: '700',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    // Encabezado de la lista (Simulador)
    timelineHeader: {
        marginBottom: 16,
    },
    timelineTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: PALETTE.textMuted,
        letterSpacing: 0.5,
    },
    timelineSubtitle: {
        fontSize: 12,
        color: PALETTE.textMuted,
        marginTop: 2,
    },

    // Contenedor de Alertas Dinámico
    inlineNotificationContainer: {
        width: '100%',
        backgroundColor: PALETTE.bgSecondary,
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 25,
        elevation: 5,
    },
    notificationToast: {
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderLeftWidth: 4,
        marginBottom: 10,
        backgroundColor: 'transparent',
    },
    notifHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    notifTitle: {
        fontWeight: '700',
        fontSize: 14,
    },
    notifTime: {
        fontSize: 11,
        color: PALETTE.textMuted,
    },

    // Contenedores internos de los payloads de transacciones
    payloadContainer: {
        backgroundColor: PALETTE.bgCard,
        borderRadius: 6,
        padding: 10,
        marginTop: 6,
    },
    payloadItemText: {
        fontSize: 12,
        color: PALETTE.textMain,
        lineHeight: 18,
    },
});

export default styles;