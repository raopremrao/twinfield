# QuILA: Quantum-Secured Logistics Relay Architecture
**Author:** Prem
**Event:** Quant-A-Thon'26

---

## 🎯 Executive Summary
The QuILA (Quantum-Secured Logistics Relay Architecture) is an industry-grade Quantum Network simulation designed to secure Multi-Party Logistics Data Sharing. Built on top of Argonne National Laboratory's **SeQUeNCe** (Simulator of QUantum Network Communication), it implements a Hub-and-Spoke Measurement-Device-Independent (MDI) Bell State Measurement (BSM) relay, closely inspired by India's MAQAN/QuILA topologies.

By leveraging Conference Key Agreement (CKA) via multi-partite entanglement, the system enables secure, post-quantum data sharing between untrusted logistics hubs, utilizing AES-256-GCM encryption seeded by quantum-derived keys.

---

## 🏗️ Architecture & Topology

### The Physics Layer (SeQUeNCe)
- **Spokes (Logistics Hubs):** 3 nodes (Mumbai, Delhi, Chennai) acting as `QuantumRouter`s equipped with `QuantumMemory` and `LightSource`.
- **Untrusted Relay (Hub):** A central `BSMNode` (Bell State Measurement Node) that fuses photons into a multi-partite entangled state.
- **Channels:** Realistic fiber attenuation (0.2 dB/km) and propagation delays over `QuantumChannel` and `ClassicalChannel` links.

### The Application Layer
- **Entanglement Engine:** Executes discrete-event protocol for entanglement generation and purification between spokes and the relay.
- **Key Derivation:** The central relay performs BSM, triggering shared Conference Key generation without exposing or reading the payload.
- **Payload Encryption:** Utilizes AES-256-GCM from Python's `cryptography` library for post-quantum classical payload encryption using the generated CKA key.

---

## 💻 Tech Stack
- **Quantum Simulation:** `SeQUeNCe` (Argonne National Lab)
- **Backend Orchestrator:** Python `FastAPI` + `uvicorn`
- **Cryptography:** Python `cryptography` (AES-256-GCM)
- **Frontend NOC Dashboard:** `React` (Vite) + `Tailwind CSS` + `Recharts` + `Lucide React`

---

## 🛡️ Security Validation (Eavesdropper Simulation)
The platform features an interactive "Eavesdropping Attack" simulation that demonstrates quantum state collapse.
- **Normal Operation:** Fidelity > 0.85, QBER < 11% (Secure).
- **Intercept-Resend Attack:** Degrades polarization fidelity, spikes QBER > 11%.
- **Detection:** The system automatically halts key derivation and alerts the Network Operations Center (NOC) of the breach.

---

## 🚀 Future Roadmap
- Integration with live QKD hardware nodes.
- Expansion to a meshed multi-relay topology.
- Real-time satellite-based free-space quantum channels.

*Built autonomously for Quant-A-Thon'26.*
