# CodeConnect

CodeConnect is a real-time collaborative code editor designed for multi-user collaboration. The platform supports shared real-time code editing, live chat, sandboxed code execution, WebRTC-based video and audio communication, and secure Google OAuth authentication. 

This repository is architected to scale horizontally across multiple application servers, utilizing Nginx for dynamic upstream load balancing and Redis Pub/Sub for state sync.

---

## 1. Overview

*   **Real-time Collaborative Editor:** Multi-user editing of the same code workspace with synchronized states.
*   **Live Chat:** Inline/room chat interface for real-time team messaging.
*   **Sandboxed Code Execution:** Ephemeral, secure code execution environment supporting JavaScript, Python, C, C++, and Java.
*   **WebRTC Video/Audio Calls:** Seamless peer-to-peer audio and video streaming directly inside rooms.
*   **Google OAuth Login:** Standardized OAuth2 flow for secure user authentication.

### Tech Stack
*   **Backend:** Node.js, Express, Socket.IO
*   **Frontend:** React (Vite), Tailwind CSS/Vanilla CSS, Socket.IO Client
*   **Databases & Caching:** MongoDB Atlas (Persistent Store), Redis (Pub/Sub & Event Broker)
*   **Proxy & Load Balancer:** Nginx
*   **Containerization & Orchestration:** Docker, Docker Compose, Docker-in-Docker (DinD)

---

## 2. Architecture Diagram

Below is the infrastructure flow showing the request path, load balancing, replication boundaries, and data layer singletons:

```
┌────────────────────────────────────────────────────────────────────────┐
│                            Browser Clients                             │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │ (HTTP / WebSockets)            │
                    ▼                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Nginx Reverse Proxy & Load Balancer                 │
│                              [ Singleton ]                             │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    │ (Round-Robin / Dynamic DNS)    │
                    ▼                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Backend Application Layer                      │
│                                                                        │
│  ┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐  │
│  │ backend-replica-1 │    │ backend-replica-2 │    │ backend-replica-3 │  │
│  └─────────┬─────────┘    └─────────┬─────────┘    └─────────┬─────────┘  │
│            │                        │                        │         │
│            │   (Redis Adapter Pub/Sub: Syncs socket events)  │         │
│            └────────────────────────┼────────────────────────┘         │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │
               ┌──────────────────────┴──────────────────────┐
               │                                             │
               ▼                                             ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│        Redis Service         │              │    Docker-in-Docker (DinD)   │
│         [ Singleton ]        │              │         [ Singleton ]        │
└──────────────────────────────┘              └──────────────┬───────────────┘
                                                             │
                                                             ▼ (Ephemeral Dev Containers)
                                              ┌──────────────────────────────┐
                                              │      Isolated Sandboxes      │
                                              │   [sandbox_1]  [sandbox_2]   │
                                              └──────────────────────────────┘
                                                             │
                                                             ▼ (Database connection)
                                              ┌──────────────────────────────┐
                                              │      MongoDB Atlas Cloud     │
                                              │         [ Singleton ]        │
                                              └──────────────────────────────┘
```

*Note: The Nginx container, Redis instance, DinD daemon, and MongoDB Atlas database cluster act as singletons, whereas the Node.js backend layer is horizontally scaled.*

---

## 3. How Horizontal Scaling Works

The application layer runs as multiple decoupled backend containers by scaling the `backend` service definition:

```bash
docker compose up --scale backend=3 -d
```

### The Nginx Dynamic Resolver Pattern

A standard Nginx upstream configuration resolves container hostnames (like `http://backend:5005`) exactly once at startup. If new backend container replicas are spawned or restarted during execution, their internal IP addresses change, causing Nginx to throw `502 Bad Gateway` errors as it attempts to connect to stale cache addresses.

To solve this, Nginx utilizes a dynamic DNS lookup approach within the containerized network:

1.  **Resolver Directive:** Points directly to Docker's internal DNS server (`127.0.0.11`) and overrides the default TTL cache duration (`valid=10s`).
2.  **Variable-Based Upstream:** By storing the proxy target in a variable (`$backend_upstream`), Nginx is forced to execute a fresh DNS lookup against Docker's DNS server whenever the TTL expires, rather than relying on a static configuration block.

Here is the exact `nginx.conf` implementation used in this setup:

```nginx
resolver 127.0.0.11 valid=10s;

log_format upstream_log '$remote_addr - [$time_local] "$request" '
                         'status=$status upstream=$upstream_addr';

server {
    listen 5005;
    access_log /dev/stdout upstream_log;

    location / {
        set $backend_upstream http://backend:5005;
        proxy_pass $backend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Load Balancing Behavior
*   **HTTP Requests:** Load-balanced per-request using Nginx's default Round-Robin algorithm.
*   **WebSockets:** Connections are sticky per-session. Once a WebSocket upgrade handshake completes, the persistent connection remains tied to the specific backend replica that accepted it. This is normal socket behavior, not a limitation.

---

## 4. How Redis Pub/Sub Keeps Instances in Sync

### The Problem
Since the node replicas run in completely isolated Node runtime environments, they do not share in-memory states. A client connected to `backend-replica-1` joining room `123` would be invisible to a client connected to `backend-replica-2` in the same room. Messages or code edits emitted by one user would never reach the other.

### The Solution
Socket.IO leverages a Redis adapter to broadcast events across nodes. Two separate connections (`pubClient` and `subClient`) are established. This separation is required because a Redis client instance placed into subscription mode (via `SUBSCRIBE`) is locked and cannot execute general publishing commands.

Here is the setup in `server.js`:

```javascript
// Redis adapter: lets multiple backend instances share Socket.IO events
const pubClient = createClient({ url: "redis://redis:6379" });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()])
  .then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Redis adapter connected - Socket.IO synced across instances");
  })
  .catch((err) => {
    console.error("Redis adapter connection failed:", err);
  });
```

### Communication Sync Flow

```
User A (backend-1) ──► Sends Event ──► backend-1 (pubClient) ──► Publish to Redis Channel
                                                                          │
                                                                          ▼
User B (backend-2) ◄── Broadcasts ◄── backend-2 (subClient) ◄── Redis Broadcasts to Nodes
```

1.  User A sends a code modification event to `backend-replica-1`.
2.  `backend-replica-1` publishes the message payload to a Redis channel via the `pubClient`.
3.  Redis broadcasts the message to all subscribed instances (including `backend-replica-2` and `backend-replica-3`).
4.  `backend-replica-2` receives the subscription event via `subClient` and pushes the socket packet to User B.

*Verification: Tested by manually connecting two active browser tabs to different backend nodes via Nginx logging, showing instant synchronization of editor and chat text.*

---

## 5. Sandboxed Code Execution (Docker-in-Docker)

Code execution needs to be safe, isolated, and bounded. The backend delegates compilation to a Docker-in-Docker (DinD) service.

### Ephemeral Execution Strategy
When a compilation request is received, the backend communicates with the `dind` host using Docker's remote API. Rather than executing code directly on the host system, the runtime constructs a secure, resource-constrained container dynamically.

The run configuration applies strict hardware and network boundaries:

*   **Memory Limit:** `--memory=256m` (prevents memory exhaustion/OOM attacks).
*   **CPU Allocation:** `--cpus=0.5` (limits CPU usage to prevent infinite loop thread locks).
*   **Process Limit:** `--pids-limit=64` (mitigates fork-bomb attacks).
*   **Isolated Networking:** `--network=none` (prevents external requests, port scanning, or server spam).
*   **Execution Timeout:** Wrapped inside a `timeout 5` CLI instruction to automatically kill processes hanging after 5 seconds.

### Cert Sharing configuration (TLS-secured Docker API)
To allow the backend to send container requests to the remote `dind` service securely, certificates are generated by the `dind` container and mounted to the backend using a shared volume `dind-certs-client`.

Relevant environment variables configured in `docker-compose.yml`:
*   `DOCKER_HOST=tcp://dind:2376` (Points the backend Docker client to the TLS socket of the dind instance)
*   `DOCKER_TLS_VERIFY=1` (Instructs the client to verify connections using TLS certificates)
*   `DOCKER_CERT_PATH=/certs/client` (Indicates where the client certificates are located)

### Security Tradeoff & Best Practices
Running Docker-in-Docker with `privileged: true` exposes the host kernel to container escape vulnerabilities if an attacker finds vulnerabilities inside the Docker daemon. For local development and demonstration purposes, this tradeoff is acceptable. At true production scale, a microVM-based isolation layer like **gVisor (runsc)** or **AWS Firecracker** is recommended to guarantee strict kernel segregation.

---

## 6. File Structure

This is the directory tree of the repository:

```
codeconnnect/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── Db.js
│   │   │   └── passport.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   └── room.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── compiler.js
│   │   │   ├── compiler.route.js
│   │   │   └── room.route.js
│   │   ├── services/
│   │   │   └── dockerService.js
│   │   ├── roomManager.js
│   │   ├── rooms.json
│   │   └── socketHandler.js
│   ├── .dockerignore
│   ├── .env
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
├── frontend/
│   └── my-app/
│       ├── public/
│       ├── src/
│       │   ├── assets/
│       │   ├── components/
│       │   ├── contexts/
│       │   ├── pages/
│       │   ├── services/
│       │   ├── App.css
│       │   ├── App.jsx
│       │   ├── index.css
│       │   └── main.jsx
│       ├── .dockerignore
│       ├── .env
│       ├── .env.example
│       ├── .env.local
│       ├── Dockerfile
│       ├── eslint.config.js
│       ├── index.html
│       ├── nginx.conf
│       ├── package.json
│       ├── package-lock.json
│       ├── vercel.json
│       └── vite.config.js
├── nginx/
│   ├── dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── .gitignore
├── package.json
└── package-lock.json
```

---

## 7. Running Locally

### Prerequisites
*   [Docker](https://www.docker.com/products/docker-desktop/) (v20.10+)
*   [Docker Compose](https://docs.docker.com/compose/) (v2.0+)

### Environment Variables
Configure the environment variables within `backend/.env`. A template is provided in `backend/.env.example`.

| Variable Name | Description |
| :--- | :--- |
| `PORT` | The local port the backend server listens on (default: `5005`). |
| `FRONTEND_URL` | The HTTP address of the React client (e.g., `http://localhost`). |
| `GOOGLE_CLIENT_ID` | Google Developer Console client ID for OAuth2. |
| `GOOGLE_CLIENT_SECRET` | Google Developer Console client secret for OAuth2. |
| `MONGODB_URI` | MongoDB Atlas cluster connection string. |
| `JWT_SECRET` | Secret key used to sign and verify JSON Web Tokens. |
| `GEMINI_API_KEY` | Developer API key for enabling AI code helper integrations. |
| `GOOGLE_CALLBACK_URL` | Redirect URI for Google OAuth Callback endpoint. |
| `DOCKER_HOST` | URI path to the Docker socket (typically `tcp://dind:2375` or `tcp://dind:2376`). |

### Build and Run Instructions

1.  Clone the repository and navigate to the project directory:
    ```bash
    cd codeconnnect
    ```
2.  Build the services from scratch without cached layers:
    ```bash
    docker compose build --no-cache
    ```
3.  Spin up the environment and scale the backend service to 3 instances:
    ```bash
    docker compose up --scale backend=3 -d
    ```

### Verification
To verify all services are running correctly:
```bash
docker compose ps
```
To check startup logs and ensure the Redis adapters and MongoDB instances are connected successfully:
```bash
docker compose logs
```

---

## 8. Known Limitations & Future Improvements

*   **Single Redis Instance:** Currently, Redis runs as a single container instance without failover configurations. Production setups should utilize Redis Sentinel or a Redis Cluster for resilience.
*   **Single MongoDB Cluster Connection:** Database operations depend on a single database link, lacking replica set connection tuning.
*   **Single-Machine Scaling:** Container scale-out is limited to a single host machine using Docker Compose. For multi-node scaling across physical servers or cloud instances, orchestrating via Kubernetes or ECS is required.
*   **Privileged DinD Mode Security Tradeoff:** Ephemeral runner containers require root/privileged permissions within the host daemon. Migrating execution runners to microVM environments (like AWS Firecracker or gVisor) is necessary for public production services.
*   **Lack of Metrics/Monitoring:** The cluster has no configured analytics pipelines. A future improvement would integrate Prometheus and Grafana to track resource usage and container health metrics.
