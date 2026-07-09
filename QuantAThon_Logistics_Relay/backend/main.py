"""
FastAPI Backend — Quantum Network Operations Center API
========================================================
REST API layer orchestrating the SeQUeNCe quantum simulation engine
and AES-GCM encrypted logistics data sharing.

Endpoints:
  POST /api/simulate  — Trigger quantum network simulation
  GET  /api/data      — Retrieve encrypted logistics manifest
  GET  /api/health    — Health check

Author: Prem | Quant-A-Thon'26
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import time

from quantum_engine import run_simulation
from crypto_utils import encrypt_manifest

# ─── FastAPI Application ────────────────────────────────────────────────────

app = FastAPI(
    title="QuILA Quantum Logistics Relay — NOC API",
    description=(
        "Production-grade API for MAQAN/QuILA-inspired Quantum Network simulation "
        "using SeQUeNCe (Simulator of QUantum Network Communication). "
        "Implements Hub-and-Spoke MDI-QKD with Conference Key Agreement "
        "for multi-party secure logistics data sharing."
    ),
    version="1.0.0",
    contact={"name": "Prem", "url": "https://github.com/prem"},
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── In-Memory State ────────────────────────────────────────────────────────

_last_simulation_result = None
networks = {}  # Format: { "1234": { "hubs": ["Hub_Phone1", "Hub_Phone2"], "supervisor_active": True } }


# ─── Application Startup ────────────────────────────────────────────────────

_start_time = time.time()

class SimulateRequest(BaseModel):
    eavesdropper_active: bool = Field(
        default=False,
        description="If true, simulates an eavesdropping attack on the quantum channels"
    )
    attenuation: float = Field(
        default=0.0002,
        description="Fiber attenuation in dB/m"
    )
    distance_multiplier: float = Field(
        default=1.0,
        description="Multiplier for the fiber channel distances"
    )
    target_fidelity: float = Field(
        default=0.85,
        description="Target entanglement fidelity"
    )
    memo_size: int = Field(
        default=50,
        description="Number of quantum memories per router"
    )
    network_code: Optional[str] = Field(
        default=None,
        description="Optional network code for multi-party simulation"
    )


class SimulateResponse(BaseModel):
    topology: dict
    fidelity_data: list
    qber_data: list
    conference_key_hex: str
    eavesdropper_detected: bool
    bsm_stats: list
    summary: dict


class DataResponse(BaseModel):
    encrypted_manifest: dict
    conference_key_hex: str
    eavesdropper_detected: bool
    simulation_summary: dict


class HealthResponse(BaseModel):
    status: str
    engine: str
    version: str
    uptime_ms: float


# ─── Application Startup ────────────────────────────────────────────────────

_start_time = time.time()


# ─── API Endpoints ──────────────────────────────────────────────────────────

@app.get("/api/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Health check endpoint for monitoring."""
    return HealthResponse(
        status="operational",
        engine="SeQUeNCe v1.0.0 (Argonne National Lab)",
        version="1.0.0",
        uptime_ms=round((time.time() - _start_time) * 1000, 2),
    )

class JoinNetworkRequest(BaseModel):
    hub_name: str

@app.post("/api/network/create", tags=["Network"])
async def create_network():
    """Creates a new quantum simulation network with a 4-digit code."""
    code = f"{secrets.randbelow(10000):04d}"
    while code in networks:
        code = f"{secrets.randbelow(10000):04d}"
    
    networks[code] = {"hubs": [], "supervisor_active": True}
    return {"network_code": code}

@app.post("/api/network/{code}/join", tags=["Network"])
async def join_network(code: str, req: JoinNetworkRequest):
    """Joins a specific network by code."""
    if code not in networks:
        raise HTTPException(status_code=404, detail="Network code not found.")
    
    hub_id = f"Hub_{req.hub_name}"
    if hub_id not in networks[code]["hubs"]:
        networks[code]["hubs"].append(hub_id)
        
    return {"hub_id": hub_id, "status": "joined"}

@app.get("/api/network/{code}/status", tags=["Network"])
async def get_network_status(code: str):
    """Gets the current status and joined hubs of a network."""
    if code not in networks:
        raise HTTPException(status_code=404, detail="Network code not found.")
    
    return {"hubs": networks[code]["hubs"]}


@app.post("/api/simulate", response_model=SimulateResponse, tags=["Simulation"])
async def simulate(request: SimulateRequest):
    """
    Trigger the SeQUeNCe quantum network simulation.

    Runs the full Hub-and-Spoke MDI-QKD relay simulation with:
    - 3 QuantumRouter spoke nodes (Mumbai, Delhi, Chennai)
    - 3 BSMNode relay nodes (Bell State Measurement)
    - Fiber quantum channels (0.2 dB/km attenuation)
    - Entanglement generation and Conference Key Agreement

    If eavesdropper_active=true, injects measurement disturbance
    that degrades fidelity and spikes QBER, demonstrating quantum
    state collapse under interception.
    """
    global _last_simulation_result

    spoke_names = None
    if request.network_code and request.network_code in networks:
        spoke_names = networks[request.network_code]["hubs"]

    try:
        result = run_simulation(
            spoke_names=spoke_names,
            eavesdropper_active=request.eavesdropper_active,
            attenuation=request.attenuation,
            distance_multiplier=request.distance_multiplier,
            target_fidelity=request.target_fidelity,
            memo_size=request.memo_size
        )
        _last_simulation_result = result
        return SimulateResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Simulation engine error: {str(e)}"
        )


@app.get("/api/data", response_model=DataResponse, tags=["Logistics"])
async def get_encrypted_data():
    """
    Retrieve the AES-256-GCM encrypted logistics manifest.

    Uses the conference key from the last simulation run to encrypt
    a multi-party logistics manifest. If no simulation has been run,
    triggers a default (no eavesdropper) simulation first.
    """
    global _last_simulation_result

    if _last_simulation_result is None:
        _last_simulation_result = run_simulation(eavesdropper_active=False)

    try:
        encrypted = encrypt_manifest(_last_simulation_result["conference_key_hex"])
        return DataResponse(
            encrypted_manifest=encrypted,
            conference_key_hex=_last_simulation_result["conference_key_hex"],
            eavesdropper_detected=_last_simulation_result["eavesdropper_detected"],
            simulation_summary=_last_simulation_result["summary"],
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Encryption error: {str(e)}"
        )


# ─── Entry Point ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
