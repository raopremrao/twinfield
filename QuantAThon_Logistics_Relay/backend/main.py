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
import secrets

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
    contact={"name": "Prem", "url": "https://github.com/raopremrao"},
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
networks = {}  # Format: { "1234": { "hubs": [{"id": "Hub_1", "joined_at": float}], "status": str, "started_by": str, "last_simulation": dict } }


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
    protocol: str = Field(
        default="CKA",
        description="Quantum cryptography protocol: 'CKA' (Conference Key Agreement) or 'QSS' (Quantum Secret Sharing)"
    )
    started_by: Optional[str] = Field(
        default=None,
        description="Which hub started the simulation"
    )


class SimulateResponse(BaseModel):
    topology: dict
    fidelity_data: list
    qber_data: list
    conference_key_hex: str
    secret_shares: dict
    protocol: str
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
    
    networks[code] = {
        "hubs": [], 
        "status": "Waiting for hubs to join...",
        "started_by": None,
        "last_simulation": None
    }
    return {"network_code": code}

@app.post("/api/network/{code}/join", tags=["Network"])
async def join_network(code: str, req: JoinNetworkRequest):
    """Joins a specific network by code."""
    if code not in networks:
        raise HTTPException(status_code=404, detail="Network code not found.")
    
    hub_id = f"Hub_{req.hub_name}"
    if not any(h["id"] == hub_id for h in networks[code]["hubs"]):
        networks[code]["hubs"].append({
            "id": hub_id,
            "joined_at": time.time(),
            "last_seen": time.time()
        })
        
    return {"hub_id": hub_id, "status": "joined"}

@app.post("/api/network/{code}/leave", tags=["Network"])
async def leave_network(code: str, req: JoinNetworkRequest):
    """Explicitly leave a network."""
    if code in networks:
        hub_id = f"Hub_{req.hub_name}"
        networks[code]["hubs"] = [h for h in networks[code]["hubs"] if h["id"] != hub_id]
    return {"status": "left"}

@app.get("/api/network/{code}/status", tags=["Network"])
async def get_network_status(code: str, hub_id: str = None):
    """Gets the current status and joined hubs of a network. Uses hub_id for heartbeat."""
    if code not in networks:
        raise HTTPException(status_code=404, detail="Network code not found.")
    
    net = networks[code]
    current_time = time.time()
    
    # Update heartbeat
    if hub_id:
        for h in net["hubs"]:
            if h["id"] == hub_id:
                h["last_seen"] = current_time
                break
                
    # Remove hubs that haven't sent a heartbeat in 10 seconds
    net["hubs"] = [h for h in net["hubs"] if current_time - h.get("last_seen", current_time) < 10]
    
    return {
        "hubs": net["hubs"],
        "status": net["status"],
        "started_by": net["started_by"],
        "has_result": net["last_simulation"] is not None
    }

@app.get("/api/network/{code}/result", tags=["Network"], response_model=SimulateResponse)
async def get_network_result(code: str):
    """Gets the simulation result for a network."""
    if code not in networks or networks[code]["last_simulation"] is None:
        raise HTTPException(status_code=404, detail="Result not ready or network not found.")
    
    return SimulateResponse(**networks[code]["last_simulation"])


import asyncio
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=4)

@app.post("/api/simulate", response_model=SimulateResponse, tags=["Simulation"])
async def simulate(request: SimulateRequest):
    """
    Trigger the SeQUeNCe quantum network simulation.
    """
    global _last_simulation_result

    spoke_names = None
    if request.network_code and request.network_code in networks:
        net = networks[request.network_code]
        spoke_names = [h["id"] for h in net["hubs"]]
        net["status"] = "Generating Quantum Keys via SeQUeNCe..."
        net["started_by"] = request.started_by or "NOC Supervisor"

    loop = asyncio.get_running_loop()
    try:
        # Run synchronous SeQUeNCe engine in a thread pool so we don't block the API
        result = await loop.run_in_executor(
            executor,
            lambda: run_simulation(
                spoke_names=spoke_names,
                protocol=request.protocol,
                eavesdropper_active=request.eavesdropper_active,
                attenuation=request.attenuation,
                distance_multiplier=request.distance_multiplier,
                target_fidelity=request.target_fidelity,
                memo_size=request.memo_size
            )
        )
        
        _last_simulation_result = result
        
        if request.network_code and request.network_code in networks:
            networks[request.network_code]["last_simulation"] = result
            networks[request.network_code]["status"] = "Key Distribution Complete"
            
        return SimulateResponse(**result)
    except Exception as e:
        if request.network_code and request.network_code in networks:
            networks[request.network_code]["status"] = f"Simulation Failed: {str(e)}"
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
