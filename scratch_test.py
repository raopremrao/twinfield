import sys
sys.path.append("/home/prem/VS Code/Projects/TwinField/twinfield/QuantAThon_Logistics_Relay/backend")
from quantum_engine import _run_sequence_simulation

spoke_names = ["Hub_Chrome", "Hub_Brave", "Hub_Firefox"]
spoke_distances = {
    "Hub_Chrome": 50000.0,
    "Hub_Brave": 50000.0,
    "Hub_Firefox": 50000.0
}

res = _run_sequence_simulation(
    spoke_names=spoke_names,
    spoke_distances=spoke_distances,
    protocol="CKA",
    eavesdropper_active=False,
    attenuation=0.0002,
    distance_multiplier=1.0,
    target_fidelity=0.99,
    memo_size=100,
    key_size=256
)

print(f"Fidelities: {res.get('fidelity_data', [])[-1] if res.get('fidelity_data') else 'None'}")
print(f"Summary: {res['summary']}")
