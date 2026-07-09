# QuILA: Quantum-Secured Logistics Relay Architecture

This project is an industry-grade Quantum Network simulation designed to secure Multi-Party Logistics Data Sharing. It implements a Hub-and-Spoke Measurement-Device-Independent (MDI) relay architecture using the SeQUeNCe simulation engine.

## 🚀 Quick Start Guide

Follow these instructions to start the full stack from scratch.

### 1. Start the Backend (Quantum Simulation API)

The backend is a FastAPI application that runs the quantum simulation using SeQUeNCe and provides AES-256-GCM encryption.

Open a terminal and run the following commands:

```bash
# Navigate to the backend directory
cd QuantAThon_Logistics_Relay/backend

# Create a virtual environment (if you haven't already)
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate

# Install the dependencies
pip install -r requirements.txt

# Start the FastAPI server (runs on http://localhost:8000)
uvicorn main:app --port 8000 --reload
```

### 2. Start the Frontend (Network Operations Center)

The frontend is a modern React application built with Vite and Tailwind CSS. It visualizes the quantum network and real-time simulation metrics.

Open a **new terminal tab/window**, then run:

```bash
# Navigate to the frontend directory
cd QuantAThon_Logistics_Relay/frontend

# Install node modules (if you haven't already)
npm install

# Start the React development server
npm run dev
```

### 3. Launch the Dashboard

Once both servers are running:
- Open your browser and navigate to **[http://localhost:5173](http://localhost:5173)**.
- You will see the **Quantum Network Operations Center**.
- Use the **Settings icon (⚙️)** to tweak simulation parameters (Attenuation, Distance, Fidelity, Memory).
- Click **"Run Simulation"** to execute a normal quantum transmission.
- Click **"Simulate Eavesdropping Attack"** to observe state collapse and QBER spikes under an intercept-resend attack.

---

### Troubleshooting
- **Port 8000 in use:** If the backend fails to start because the port is already in use, you can kill the existing process by running `pkill -f uvicorn` and then try starting it again.
- **Port 5173 in use:** If the frontend fails, Vite might automatically switch to `localhost:5174`. Check the terminal output for the correct URL.