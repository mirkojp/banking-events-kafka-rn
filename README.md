#  Banking Events — Kafka + React Native

Aplicación bancaria de demostración que implementa **Event-Driven Architecture** con el patrón **Saga** usando Apache Kafka como bus de mensajes y React Native (Expo) como cliente móvil.

##  Flujo de la Saga

```
Mobile/Web App
             │
             ├─► POST /transactions   ─►  API publica en topic: txn.commands
             │
             └─► WebSocket subscribe (userId)
                     │
       Orchestrator consume txn.commands
             │
             ├─► Emit: Funds Reserved     ─► topic: txn.events
             ├─► Emit: FraudChecked       ─► topic: txn.events (15% riesgo HIGH)
             │    ├─ [LOW]  Emit: Committed ─► topic: txn.events
             │    └─ [HIGH] Emit: Reversed  ─► topic: txn.events
             │
             └─► [Error 10%] ─► topic: txn.dlq + Emit: Failed
                     │
       WS Gateway consume txn.events ─► Push directo al cliente por userId
```

---

##  Estructura del Proyecto

```
banking-events-kafka-rn/
├── backend/
│   ├── docker-compose.yml        # Infraestructura: Zookeeper + Kafka Broker
│   ├── package.json
│   └── src/
│       ├── config.js             # Cliente Kafka y definición de tópicos
│       ├── api.js                # API REST (Express :3000) — Produce comandos
│       ├── orchestrator.js       # Saga Orchestrator — Lógica de negocio y estados
│       ├── gateway.js            
│       └── inspect-dlq.js        # Script utilitario para auditar la Dead Letter Queue
│
└── mobile-app/
    ├── package.json              # Configuración de dependencias (Entry: expo-router)
    ├── app.json                  # Configuración del ecosistema Expo
    └── src/
        ├── app/                  # ── PANTALLAS (Enrutado nativo por archivos) ──
        │   ├── index.js          # Raíz (/) — Simulador de pagos y línea de tiempo
        │   └── metrics.js        # Dashboard (/metrics) — Gráficos de distribución en tiempo real
        ├── hooks/
        │   └── useTransactionSocket.js  # Suscripción reactiva al WS Gateway
        └── styles.js             # Sistema de estilos unificado (PALETTE Slate/Tailwind)
```


##  Puesta en Marcha

### 1. Levantar Kafka con Docker

```bash
cd backend
docker-compose up -d
```

Esto inicia:
- **Zookeeper** en el puerto `2181`
- **Kafka Broker** en el puerto `9092`


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

##  Observabilidad

Una vez que el backend esté corriendo, accedé al dashboard de métricas en:

```
http://localhost:8081/
http://localhost:8081/metrics
```


---


##  Topics de Kafka

| Topic | Descripción |
|-------|-------------|
| `txn.commands` | Comandos enviados por la API REST al Orchestrator |
| `txn.events` | Eventos de dominio publicados por el Orchestrator |
| `txn.dlq` | Dead Letter Queue — comandos que fallaron irrecuperablemente |

---
