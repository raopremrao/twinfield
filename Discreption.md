# TwinField: Quantum Logistics Relay
## Comprehensive Architecture, Physics, and Implementation Guide

This document serves as the absolute technical foundation and extensive manual for the **TwinField** (QuantAThon '26) project. It thoroughly details the underlying quantum physics, the software engineering architecture, the specific frameworks utilized, and the exhaustive roadmap for translating this simulation into physical reality.

---

## 1. Why "Relay Architecture"? (The Core Topology)
TwinField is defined as a "Relay Architecture" because of its Hub-and-Spoke Measurement-Device-Independent (MDI) topology. 
- In traditional networks, computers connect directly to each other. In quantum networks, fiber attenuation destroys photons over long distances, making direct connections impossible.
- **The Relay Solution:** TwinField places an untrusted Bell State Measurement (BSM) node at the center of the network. The logistics hubs (the spokes) do not send photons to each other; they send photons to the central BSM node (the relay). 
- The relay performs a joint quantum measurement that instantly *entangles* the distant hubs, acting as a secure "relay" for quantum states without ever learning the actual cryptographic keys.

---

## 2. The Physics: Quantum Mechanics & Photonics (In-Depth)

TwinField simulates a **Multi-Party Quantum Key Distribution (QKD)** network. Instead of relying on computational complexity (like RSA or Elliptic Curve Cryptography), it relies on the fundamental, unbreakable laws of quantum physics to guarantee absolute security. 

### 2.1 Photonics & The Quantum Channel
The network models **photons** traveling through physical fiber-optic cables, referred to as the Quantum Channel.
- **Fiber Attenuation:** Real optical fiber absorbs photons over long distances. We mathematically model this at a standard telecom rate of `0.2 dB/km`. Over 100km, the vast majority of photons are lost to the environment.
- **Polarization Encoding:** Data is encoded in the quantum polarization state of individual photons. In the BB84 protocol, we use two non-orthogonal bases: Rectilinear (Horizontal 0°, Vertical 90°) and Diagonal (Diagonal 45°, Anti-Diagonal 135°). 
- **Decoherence:** Photons lose their quantum state over time due to interaction with the environment. Our simulation models quantum memory lifetimes, meaning if a photon waits too long in a node, its quantum information degrades.

### 2.2 Entanglement & Bell State Measurement (BSM)
Because photons are lost over distance, the system utilizes **Entanglement Swapping**.
- Instead of Hub A sending a photon directly to Hub B (which would likely be lost), both Hub A and Hub B send entangled photons to the central **BSM Node relay**.
- The BSM node performs a joint quantum measurement (Bell State Measurement). This physically destroys the original two photons but instantaneously entangles the remaining photons held locally by Hub A and B. 

### 2.3 The No-Cloning Theorem & Absolute Security
The core security guarantee is derived from the **No-Cloning Theorem** of quantum mechanics. 
- It is mathematically and physically impossible to perfectly copy an unknown quantum state.
- If an eavesdropper (Eve) attempts to intercept and read the photons traveling through the fiber, the act of measuring them forces the quantum superposition to collapse into a classical state.
- This collapse introduces massive errors into the photon stream when it finally reaches the legitimate receiver. 
- The system calculates the **Quantum Bit Error Rate (QBER)**. If the QBER exceeds the theoretical BB84 security threshold of **11%**, the system mathematically proves the channel is compromised and aborts key generation.

---

## 3. Cryptographic Protocols Explained

TwinField allows users to toggle between different cryptographic methods to secure their logistics manifest data:

### 3.1 CKA (Conference Key Agreement)
- **What it is:** A protocol where all *N* legitimate parties in the network derive the exact same identical master key.
- **How it works:** The central relay entangles all the hubs. The hubs measure their photons and publicly announce their bases. After sifting and error correction, they all distill the identical symmetric key. 
- **Use Case:** Perfect for broadcasting a highly classified encrypted logistics manifest that every trusted hub in the network needs to decrypt and read simultaneously.

### 3.2 QSS (Quantum Secret Sharing)
- **What it is:** A protocol where the master key is mathematically split into *N* different pieces (shares), and distributed across the network. 
- **How it works:** Each hub receives a completely unique, randomized hex string. The actual master key does not exist in any single location. The only way to decrypt the logistics manifest is if *all N hubs combine their physical shares together* (using XOR logic).
- **Use Case:** Perfect for zero-trust environments (like nuclear transport or high-value asset logistics) where no single rogue hub driver should be able to decrypt the route manifest alone.

### 3.3 AES-256-GCM (Advanced Encryption Standard - Galois/Counter Mode)
- **What it is:** A classical, military-grade symmetric encryption algorithm. 
- **How it works:** While the quantum network (CKA/QSS) securely *distributes* the key, AES is what actually *uses* the key to encrypt the payload. TwinField uses the 256-bit variant (the strongest available) in GCM mode. GCM not only encrypts the data but also provides authenticated integrity, ensuring that Eve hasn't tampered with or flipped bits in the ciphertext.

---

## 4. Frameworks & Tech Stack (The "Why" and "How")

### 4.1 Backend: FastAPI (Python)
- **Why Python?** Python is mandatory for quantum simulation libraries.
- **Why FastAPI?** Traditional Python frameworks are synchronous. FastAPI uses `asyncio`, allowing it to handle hundreds of concurrent API requests (hubs polling for status) without blocking the heavy physics simulations.
- **How it's used:** It acts as the orchestration bridge. It accepts REST API calls, safely dispatches the heavy SeQUeNCe physics engine to a background ThreadPool (using `run_in_executor`), and returns the cryptographic keys.

### 4.2 Frontend: React + Vite + TailwindCSS (JavaScript)
- **Why React?** React provides state-driven UI updates, essential for a real-time monitoring dashboard where QBER graphs and active Hub counts constantly change.
- **Why Vite & Tailwind?** Vite provides lightning-fast hot reloading. Tailwind allows for the rapid creation of a highly aesthetic "Cyberpunk / NOC" UI with glowing borders and conditional coloring.

### 4.3 Physics Engine: SeQUeNCe
- **Why SeQUeNCe?** Developed by Argonne National Laboratory, SeQUeNCe is a premier discrete-event quantum network simulator. It tracks individual photons down to the picosecond (ps), modeling actual hardware timing and fiber attenuation.
- **How it's used:** We use SeQUeNCe to build the dynamic N-Party star topology relay and measure exact physical fidelities.

---

## 5. Working Process: Step-by-Step

```mermaid
sequenceDiagram
    participant NOC as NOC Supervisor (Dashboard)
    participant Hub as Logistics Hub (Mobile App)
    participant Server as FastAPI Backend
    participant QEngine as SeQUeNCe Physics Engine
    
    NOC->>Server: Click "Create Network" (Generates 4-digit code)
    Hub->>Server: Input code & Join Network
    Server-->>NOC: Lobby UI Updates via Polling
    Hub->>Server: Select Protocol (CKA/QSS) & Click "Generate"
    Note right of Server: Server clears previous keys & sets status to "Generating"
    Server->>QEngine: Initialize N-Party Relay Topology
    QEngine->>QEngine: Fire photons, calculate BSM & Attenuation (Picosecond level)
    QEngine->>QEngine: Measure Entanglement Fidelity & QBER
    QEngine-->>Server: Return Physical Entropy (Fidelity Array)
    Server->>Server: Derive Keys via HKDF (SHA-256)
    Note right of Server: Increments Network Version to prevent race conditions
    Server-->>Hub: Send Conference Key / QSS Share
    Server-->>NOC: Send Simulation Metrics (QBER, Attack Status)
```

---

## 6. Codebase Mapping: Purpose of Every File

### Backend (`/backend`)
- **`main.py`**: The central nervous system of the backend. 
  - Handles all FastAPI routes (`/api/simulate`, `/api/network/join`).
  - Manages the in-memory state of active lobbies (the `networks` dictionary).
  - Implements an automated **heartbeat timeout**, purging Hubs that haven't pinged the server in 10 seconds.
  - Implements **Versioning** to ensure frontends don't suffer from race conditions when physics simulations finish rapidly.
- **`quantum_engine.py`**: The absolute core of the physics simulation. 
  - Contains the SeQUeNCe simulator logic. 
  - Constructs the fiber network topologies based on the number of joined hubs.
  - Runs the timeline, tracks photon fidelity, and handles Eavesdropper logic.
  - Uses the `cryptography` library (`HKDF`) to mathematically expand raw quantum noise into AES-grade keys.
- **`crypto_utils.py`**: Handles classical post-processing encryption using **AES-256-GCM** to encrypt the JSON Logistics Manifest payload using the derived quantum keys.

### Frontend (`/frontend/src`)
- **`Dashboard.jsx`**: The Network Operations Center (NOC). Built for desktop command-center displays. Allows the supervisor to create networks, tweak physical parameters (fiber attenuation, memory fidelity), and launch simulated Eavesdropping attacks.
- **`HubView.jsx`**: The Edge Terminal. Built for mobile/tablet usage. Allows truck drivers to join a network via a 4-digit code. Features dropdowns to select the protocol (CKA vs QSS) and Bit Size, and displays the final cryptographic keys.
- **`App.jsx` & `main.jsx`**: Standard React routers and entry points.
- **`index.css`**: The design system containing custom Tailwind utilities and keyframe animations for the "breathing" quantum UI elements.

---

## 7. Real-World Translation & Future Enhancements

TwinField is architecturally designed to mirror real-world Quantum Key Distribution implementations. To transition from a simulator to a physical product, the following real-world algorithms and enhancements must be implemented:

### 7.1 Information Reconciliation (Cascade / LDPC)
- **The Concept:** In the real world, photons received by detectors are never perfect due to sensor noise (dark counts) and fiber interference. The raw bit strings at Hub A and Hub B will always have slight mismatches (e.g., 2% errors).
- **The Fix:** We must implement the **Cascade Protocol** or Low-Density Parity-Check (LDPC) codes. Hubs communicate classical parity bits over a public internet channel, compare parity blocks, and correct flipped bits until their strings match 100%. Because they only share parities, the hacker learns nothing useful.

### 7.2 Privacy Amplification
- **The Concept:** During Information Reconciliation, an eavesdropper might learn a tiny fraction of information from intercepting the public parity bits. 
- **The Fix:** We must implement **Privacy Amplification**. This passes the reconciled key (which might be 10,000 bits long) through a Universal Hash Function to compress it down to a secure 256-bit AES key. This mathematically erases any partial information the eavesdropper obtained.

### 7.3 API-as-a-Service (Future Enterprise Offering)
- **Future Enhancement:** Instead of merely offering a web dashboard, TwinField will be packaged as an Enterprise **API-as-a-Service**. Logistics corporations (like Amazon or Maersk) can integrate TwinField's Quantum API directly into their existing fleet management software, automatically fetching quantum-secured AES keys programmatically without needing human interaction on our website.

### 7.4 Hardware Integration (The Physical Layer)
- The Python backend can be modified to interface directly with physical QKD hardware (like ID Quantique commercial devices, or custom ESP32/FPGA photon counters) via serial communication. 
- In this architecture, the `quantum_engine.py` software simulator would be completely replaced by a hardware driver script that reads raw, live photon counts off the physical pins.

### 7.5 Redis / Database Persistence (Production Scaling)
- **Future Enhancement:** To deploy TwinField on a massive scale, we must transition the active lobbies dictionary to a **Redis** in-memory cache. This allows the FastAPI backend to be distributed across multiple physical server nodes, ensuring load-balancing and fault tolerance.

### 7.6 Dynamic Path Routing
- **Future Enhancement:** Implement Entanglement Routing algorithms (like Dijkstra's for quantum links) to allow multi-hop entanglement swapping. This allows Hub A to establish a secure link with Hub Z by swapping entanglement through intermediate repeater nodes (Hub B, C, and D) across entire continents.
