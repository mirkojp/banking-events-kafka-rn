# 🏦 Banking Events — Kafka + React Native

Aplicación bancaria de demostración que implementa **Event-Driven Architecture** con el patrón **Saga** usando Apache Kafka como bus de mensajes y React Native (Expo) como cliente móvil.

---

## 📐 Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE MÓVIL                            │
│                  React Native (Expo)                            │
│         POST /transactions     WebSocket ws://...:8080          │
└───────────────┬───────────────────────────┬─────────────────────┘
                │                           │ eventos en tiempo real
                ▼                           │
┌──────────────────────┐          ┌─────────┴──────────┐
│      API Gateway     │          │  WebSocket Gateway  │
│    Express :3000     │          │      WS :8080       │
│                      │          │  Métricas :8082     │
│  Produce comandos en │          │                     │
│  topic txn.commands  │          │  Consume eventos de │
└──────────┬───────────┘          │  topic txn.events   │
           │                      └─────────▲───────────┘
           │                                │
           ▼                                │
┌──────────────────────────────────────────────────────┐
│                    Apache Kafka                       │
│   Topics: txn.commands │ txn.events │ txn.dlq         │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────┐
         │      Orchestrator       │
         │  Consume txn.commands   │
         │  Publica en txn.events  │
         │                         │
         │  Saga:                  │
         │  1. Funds Reserved      │
         │  2. FraudChecked        │
         │  3. Committed/Reversed  │
         │  Error → DLQ + Failed   │
         └─────────────────────────┘
```

---

## 🔄 Flujo de la Saga (Happy Path)

```
Mobile App
   │
   ├─► POST /transactions  →  API publica en txn.commands
   │
   └─► WebSocket subscribe (userId)
           │
Orchestrator consume txn.commands
   │
   ├─► Emit: Funds Reserved    → txn.events
   ├─► Emit: FraudChecked      → txn.events  (15% riesgo HIGH)
   │       ├─ [LOW]  Emit: Committed  → txn.events
   │       └─ [HIGH] Emit: Reversed   → txn.events
   │
   └─► [Error 10%] → txn.dlq + Emit: Failed
           │
WS Gateway consume txn.events → push al cliente correcto por userId
```

---

## 🧩 Estructura del Proyecto

```
banking-events-kafka-rn/
├── backend/
│   ├── docker-compose.yml        # Zookeeper + Kafka
│   ├── package.json
│   └── src/
│       ├── config.js             # Cliente Kafka y definición de topics
│       ├── api.js                # REST API (Express :3000) — produce comandos
│       ├── orchestrator.js       # Saga orchestrator — lógica de negocio
│       ├── gateway.js            # WebSocket Gateway (:8080) + Dashboard (:8082)
│       ├── dashboard.html        # UI de observabilidad
│       └── inspect-dlq.js        # Script para inspeccionar la Dead Letter Queue
│
└── mobile-app/
    ├── App.js                    # Componente raíz — UI del simulador
    ├── styles.js                 # Sistema de estilos centralizado
    ├── index.js
    ├── app.json
    └── src/
        └── hooks/
            └── useTransactionSocket.js   # Hook WebSocket — suscripción a eventos
```

---

## ⚙️ Requisitos Previos

| Herramienta | Versión recomendada |
|-------------|---------------------|
| Node.js     | ≥ 18.x              |
| Docker & Docker Compose | Cualquier versión reciente |
| Expo CLI    | `npx expo` (incluido) |
| Android/iOS emulador o dispositivo físico (mismo Wi-Fi) | — |

---

## 🚀 Puesta en Marcha

### 1. Levantar Kafka con Docker

```bash
cd backend
docker-compose up -d
```

Esto inicia:
- **Zookeeper** en el puerto `2181`
- **Kafka Broker** en el puerto `9092`

> Esperá ~10 segundos a que el broker esté completamente listo antes de continuar.

---

### 2. Iniciar el Backend (3 procesos en paralelo)

```bash
cd backend
npm install
npm run dev
```

Esto arranca con `concurrently`:

| Proceso | Puerto | Descripción |
|---------|--------|-------------|
| API REST | `:3000` | Recibe `POST /transactions` |
| Orchestrator | — | Procesa comandos y emite eventos |
| WS Gateway | `:8080` | Push de eventos al cliente móvil |
| Dashboard | `:8082` | Métricas en `/metrics` |

**Scripts disponibles:**

```bash
npm run start:api      # Solo la API REST
npm run start:orch     # Solo el Orchestrator
npm run start:gw       # Solo el Gateway WebSocket
npm run inspect-dlq    # Inspeccionar mensajes en la Dead Letter Queue
```

---

### 3. Configurar la IP del Servidor en la App Móvil

Editá el archivo `mobile-app/App.js` y reemplazá la IP con la de tu máquina en la red local:

```js
// mobile-app/App.js
const SERVER_IP = '192.168.X.XXX'; // ← Cambiá esto por tu IP local
```

> En Windows podés obtenerla con `ipconfig` (buscar "IPv4").

---

### 4. Iniciar la App Móvil

```bash
cd mobile-app
npm install
npx expo start
```

Luego escaneá el QR con la app **Expo Go** (Android/iOS) o presioná `a` para abrir en el emulador Android.

---

## 📊 Observabilidad

Una vez que el backend esté corriendo, accedé al dashboard de métricas en:

```
http://localhost:8082/metrics
```

El endpoint `/metrics/data` devuelve JSON con:
- Conexiones WebSocket activas
- Total de eventos procesados
- Conteo de eventos por tipo

---

## 🔑 Conceptos Clave Implementados

| Concepto | Implementación |
|----------|---------------|
| **Event-Driven Architecture** | Kafka como bus de mensajes desacoplado |
| **Patrón Saga** | Orquestación secuencial de transacciones bancarias |
| **CQRS** | Separación de comandos (`txn.commands`) y eventos (`txn.events`) |
| **Dead Letter Queue (DLQ)** | Errores irrecuperables enviados a `txn.dlq` |
| **Idempotencia** | El orchestrator descarta comandos duplicados por ID |
| **Real-time Push** | Gateway WebSocket entrega eventos solo al usuario correcto |
| **Detección de Fraude** | Simulación probabilística (15% riesgo HIGH → Reversed) |

---

## 🗂️ Topics de Kafka

| Topic | Descripción |
|-------|-------------|
| `txn.commands` | Comandos enviados por la API REST al Orchestrator |
| `txn.events` | Eventos de dominio publicados por el Orchestrator |
| `txn.dlq` | Dead Letter Queue — comandos que fallaron irrecuperablemente |

---

## 💡 Notas de Desarrollo

- La app y el backend deben estar en la **misma red Wi-Fi** para que el WebSocket y la API sean accesibles desde el dispositivo físico.
- El `USER_ID` hardcodeado en `App.js` (`user_facu_2025`) se usa para filtrar qué eventos recibe cada cliente en el Gateway.
- El orchestrator incluye un **fallo aleatorio del 10%** para simular errores irrecuperables y demostrar el flujo de la DLQ.
- Las notificaciones en la app se auto-eliminan después de **10 segundos**.
