import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Network, ArrowLeft, Send, ShieldCheck, Truck, Lock } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : `http://${window.location.hostname}:8000`);
const HUBS = ["Mumbai", "Delhi", "Chennai"];

export default function HubView() {
  const navigate = useNavigate();
  const [manifest, setManifest] = useState("");
  const [status, setStatus] = useState("idle");
  const [networkCode, setNetworkCode] = useState("");
  const [hubName, setHubName] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [assignedHubId, setAssignedHubId] = useState("");
  const [joinError, setJoinError] = useState("");
  
  const [networkStatus, setNetworkStatus] = useState(null);
  const [simulationData, setSimulationData] = useState(null);
  const [keySize, setKeySize] = useState(256);
  const [protocol, setProtocol] = useState("CKA");

  const joinNetwork = async () => {
    if (!networkCode || !hubName) return;
    try {
      setJoinError("");
      const res = await axios.post(`${API_BASE}/api/network/${networkCode}/join`, {
        hub_name: hubName
      });
      setAssignedHubId(res.data.hub_id);
      setIsJoined(true);
    } catch (err) {
      setJoinError(err.response?.data?.detail || "Invalid code");
    }
  };

  // Polling for network status when joined
  useEffect(() => {
    if (!isJoined || !networkCode) return;
    
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/network/${networkCode}/status?hub_id=${assignedHubId}`);
        setNetworkStatus(res.data);
        
        if (res.data.has_result) {
          if (!simulationData) {
            const resultRes = await axios.get(`${API_BASE}/api/network/${networkCode}/result`);
            setSimulationData(resultRes.data);
          }
        } else {
          setSimulationData(null);
        }
      } catch (err) {
        console.error(err);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isJoined, networkCode, simulationData]);

  const startKeyGeneration = async () => {
    try {
      await axios.post(`${API_BASE}/api/simulate`, {
        eavesdropper_active: false,
        attenuation: 0.0002,
        distance_multiplier: 1.0,
        target_fidelity: 0.85,
        memo_size: 50,
        network_code: networkCode,
        protocol: protocol,
        started_by: assignedHubId,
        key_size: parseInt(keySize)
      });
    } catch (err) {
      console.error("Failed to start simulation", err);
    }
  };

  const leaveNetwork = async () => {
    if (isJoined && networkCode) {
      try {
        await axios.post(`${API_BASE}/api/network/${networkCode}/leave`, {
          hub_name: hubName
        });
      } catch (e) {
        console.error(e);
      }
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-quantum-mesh bg-grid flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-2xl w-full">
        {/* Header Panel */}
        <div className="glass-panel p-6 mb-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-amber"></div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
            <button 
              onClick={leaveNetwork}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-medium uppercase tracking-wider"
            >
              <ArrowLeft size={14} /> NOC Dashboard
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 w-full sm:w-auto justify-center">
              <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse"></div>
              <span className="text-[10px] font-mono text-neon-cyan tracking-wider">{isJoined ? "QUANTUM LINK ACTIVE" : "AWAITING PAIRING"}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
            <div className="w-16 h-16 rounded-2xl bg-surface-900 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
              <Network size={28} className="text-neon-cyan" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1 break-all">
                {isJoined ? assignedHubId : "Join Network"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">Distributed Logistics Edge Terminal</p>
            </div>
          </div>
        </div>

        {!isJoined ? (
          <div className="glass-panel p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-4">Pair with NOC Supervisor</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400">Terminal Name</label>
                <input 
                  type="text" 
                  value={hubName}
                  onChange={e => setHubName(e.target.value)}
                  placeholder="e.g. Phone1, iPad, Delhi"
                  className="w-full bg-surface-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-neon-cyan mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">4-Digit Network Code</label>
                <input 
                  type="text" 
                  maxLength={4}
                  value={networkCode}
                  onChange={e => setNetworkCode(e.target.value)}
                  placeholder="1234"
                  className="w-full bg-surface-900 border border-white/10 rounded-xl p-3 text-lg font-mono tracking-widest text-white focus:border-neon-cyan mt-1"
                />
              </div>
              {joinError && <p className="text-neon-red text-xs">{joinError}</p>}
              <button
                onClick={joinNetwork}
                className="w-full py-3 rounded-xl bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 font-semibold"
              >
                Join Quantum Network
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-panel p-6 shadow-xl text-center">
            
            <div className="mb-8 mt-4">
               <h2 className="text-xl font-bold text-white mb-2">{networkStatus?.status || "Waiting for Supervisor..."}</h2>
               {networkStatus?.started_by && !simulationData && (
                 <p className="text-sm text-neon-violet">Key generation initiated by: <span className="font-bold">{networkStatus.started_by}</span></p>
               )}
               {simulationData && (
                 <p className="text-sm text-neon-cyan font-bold">Quantum Link Synchronized</p>
               )}
            </div>

            {!simulationData ? (
              <div className="max-w-sm mx-auto">
                <div className="grid grid-cols-2 gap-4 mb-4 text-left">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Protocol</label>
                    <select 
                      value={protocol}
                      onChange={e => setProtocol(e.target.value)}
                      disabled={networkStatus?.status?.includes("Generating")}
                      className="w-full bg-surface-900 border border-white/10 rounded-xl p-3 text-white focus:border-neon-cyan"
                    >
                      <option value="CKA">CKA (Identical Keys)</option>
                      <option value="QSS">QSS (Split Shares)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Bit Size</label>
                    <select 
                      value={keySize}
                      onChange={e => setKeySize(e.target.value)}
                      disabled={networkStatus?.status?.includes("Generating")}
                      className="w-full bg-surface-900 border border-white/10 rounded-xl p-3 text-white focus:border-neon-cyan"
                    >
                      <option value={128}>128-bit AES</option>
                      <option value={256}>256-bit AES</option>
                      <option value={512}>512-bit AES</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={startKeyGeneration}
                  disabled={networkStatus?.status?.includes("Generating")}
                  className="btn-quantum w-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 hover:bg-neon-cyan/30 flex items-center justify-center gap-2 py-4 text-lg disabled:opacity-50 shadow-[0_0_20px_rgba(0,240,255,0.15)] transition-all"
                >
                  <Lock size={20} />
                  {networkStatus?.status?.includes("Generating") ? "Physics Simulation Running..." : "Start Generating Secret Key"}
                </button>
              </div>
            ) : (
              <div className="text-left bg-surface-900 border border-neon-amber/20 p-6 rounded-xl shadow-[0_0_15px_rgba(251,191,36,0.1)]">
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck size={24} className="text-neon-green shrink-0" />
                  <h3 className="text-base sm:text-lg font-bold text-white">Quantum Key Distributed</h3>
                </div>
                
                <div className="mb-4">
                  <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Protocol</p>
                  <p className="text-sm font-bold text-neon-violet tracking-widest">{simulationData.protocol}</p>
                </div>

                {simulationData.protocol === 'QSS' && simulationData.secret_shares?.[assignedHubId] && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Your Cryptographic Share (Keep Secret!)</p>
                    <p className="text-sm font-mono text-neon-amber bg-black/50 p-4 rounded-lg break-all border border-white/5 shadow-inner">
                      {simulationData.secret_shares[assignedHubId]}
                    </p>
                  </div>
                )}

                {simulationData.protocol === 'CKA' && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Global Conference Key</p>
                    <p className="text-sm font-mono text-neon-cyan bg-black/50 p-4 rounded-lg break-all border border-white/5 shadow-inner">
                      {simulationData.conference_key_hex}
                    </p>
                  </div>
                )}
                
                <button
                  onClick={startKeyGeneration}
                  className="w-full mt-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                >
                  <Lock size={16} /> Generate New Key
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Footer info */}
        <p className="text-center text-[10px] text-slate-500 mt-6 font-mono">
          NODE: {isJoined ? assignedHubId.toUpperCase() : "UNASSIGNED"} • STATUS: {isJoined ? "ONLINE" : "OFFLINE"} • PROTOCOL: MDI-QKD
        </p>
      </div>
    </div>
  );
}
