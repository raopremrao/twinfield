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

  // Reset status
  useEffect(() => {
    setStatus("idle");
    setManifest("");
  }, [assignedHubId]);

  const submitManifest = async () => {
    setStatus("submitting");
    // Mocking transmission logic for UI
    setTimeout(() => {
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-quantum-mesh bg-grid flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-2xl w-full">
        {/* Header Panel */}
        <div className="glass-panel p-6 mb-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-amber"></div>
          
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-medium uppercase tracking-wider"
            >
              <ArrowLeft size={14} /> NOC Dashboard
            </button>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/20">
              <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse"></div>
              <span className="text-[10px] font-mono text-neon-cyan tracking-wider">{isJoined ? "CKA LINK SECURE" : "AWAITING PAIRING"}</span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-surface-900 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
              <Network size={28} className="text-neon-cyan" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
                {isJoined ? assignedHubId : "Join Network"}
              </h1>
              <p className="text-sm text-slate-400">Distributed Logistics Edge Terminal</p>
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
          <div className="glass-panel p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 uppercase tracking-wide">
              <Truck size={16} className="text-neon-violet" /> Local Cargo Manifest
            </h2>
            
            {/* Hub Switcher Removed For Multiplayer Mode */}
          </div>

          <div className="relative group">
            <textarea
              value={manifest}
              onChange={(e) => setManifest(e.target.value)}
              placeholder={`Enter cargo manifest data in JSON format...\n\n{\n  "terminal": "${assignedHubId}",\n  "cargo": "Medical Supplies"\n}`}
              className="w-full h-56 bg-surface-900 border border-white/10 rounded-xl p-5 text-sm font-mono text-slate-300 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 mb-6 placeholder:text-slate-600 transition-all resize-none shadow-inner"
            />
            <div className="absolute bottom-10 right-4 text-[10px] text-slate-600 font-mono flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Lock size={10} /> AES-256-GCM READY
            </div>
          </div>

          <button
            onClick={submitManifest}
            disabled={status === "submitting" || status === "success" || !manifest.trim()}
            className={`w-full py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 shadow-lg ${
              status === "success" 
                ? 'bg-neon-green/20 border border-neon-green/40 text-neon-green' 
                : 'bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/20 hover:shadow-neon-cyan/10'
            } disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-neon-cyan/10`}
          >
            {status === "submitting" ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" /> 
                Encrypting via Quantum Key...
              </span>
            ) : status === "success" ? (
              <span className="flex items-center gap-2 text-neon-green">
                <ShieldCheck size={18} /> Transmitted Securely
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send size={18} /> Transmit to Network
              </span>
            )}
          </button>
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
