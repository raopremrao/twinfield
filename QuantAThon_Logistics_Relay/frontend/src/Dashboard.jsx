import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import {
  Atom, Shield, ShieldAlert, Play, Skull, Loader2,
  Lock, FileKey, Clock, Cpu, Network, Waves,
  ChevronDown, ChevronUp, ExternalLink, KeyRound, Settings2, Sliders
} from 'lucide-react';
import NetworkGraph from './components/NetworkGraph';
import MetricsPanel from './components/MetricsPanel';

const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : `http://${window.location.hostname}:8000`);
import { Link } from 'react-router-dom';

function Dashboard() {
  const [simulationData, setSimulationData] = useState(null);
  const [networkVersion, setNetworkVersion] = useState(0);
  const [encryptedData, setEncryptedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isAttackMode, setIsAttackMode] = useState(false);
  const [error, setError] = useState(null);
  const [showManifest, setShowManifest] = useState(false);
  const [simHistory, setSimHistory] = useState([]);
  const [networkCode, setNetworkCode] = useState(null);
  const [joinedHubs, setJoinedHubs] = useState([]);
  const [networkStatus, setNetworkStatus] = useState(null);
  const [protocol, setProtocol] = useState('CKA'); // 'CKA' or 'QSS'

  // Simulation Parameters
  const [attenuation, setAttenuation] = useState(0.0002);
  const [distanceMultiplier, setDistanceMultiplier] = useState(1.0);
  const [targetFidelity, setTargetFidelity] = useState('0.85');
  const [memoSize, setMemoSize] = useState('50');
  const [keySize, setKeySize] = useState(256);
  const [showSettings, setShowSettings] = useState(false);

  const runSimulation = useCallback(async (eavesdropperActive) => {
    setIsLoading(true);
    setError(null);
    setIsAttackMode(eavesdropperActive);
    setEncryptedData(null);

    try {
      const res = await axios.post(`${API_BASE}/api/simulate`, {
        eavesdropper_active: eavesdropperActive,
        attenuation: parseFloat(attenuation),
        distance_multiplier: parseFloat(distanceMultiplier),
        target_fidelity: parseFloat(targetFidelity),
        memo_size: parseInt(memoSize, 10),
        network_code: networkCode,
        protocol: protocol,
        key_size: parseInt(keySize)
      });
      setSimulationData(res.data);
      setSimHistory(prev => [
        {
          timestamp: new Date().toLocaleTimeString(),
          mode: eavesdropperActive ? 'Attack' : 'Normal',
          fidelity: res.data.summary.avg_fidelity,
          qber: res.data.summary.avg_qber,
          detected: res.data.eavesdropper_detected,
        },
        ...prev.slice(0, 9),
      ]);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Simulation failed');
    } finally {
      setIsLoading(false);
    }
  }, [attenuation, distanceMultiplier, targetFidelity, memoSize, networkCode, protocol, keySize]);

  const createNetwork = async () => {
    try {
      const res = await axios.post(`${API_BASE}/api/network/create`);
      setNetworkCode(res.data.network_code);
    } catch (err) {
      setError("Failed to create network.");
    }
  };

  useEffect(() => {
    if (!networkCode) return;
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/network/${networkCode}/status`);
        setJoinedHubs(res.data.hubs);
        setNetworkStatus(res.data);
        
        if (res.data.has_result) {
          if (!simulationData || res.data.version !== networkVersion) {
            const resultRes = await axios.get(`${API_BASE}/api/network/${networkCode}/result`);
            setSimulationData(resultRes.data);
            setNetworkVersion(res.data.version);
          }
        } else {
          setSimulationData(null);
        }
      } catch (e) {
        console.error(e);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [networkCode, simulationData]);

  const fetchEncryptedData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const res = await axios.get(`${API_BASE}/api/data`);
      setEncryptedData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-quantum-mesh bg-grid">
      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-50 glass-panel !rounded-none border-x-0 border-t-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
              <Atom size={18} className="text-neon-cyan" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                TwinField
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neon-violet/10 text-neon-violet border border-neon-violet/20">
                  Quant-A-Thon'26
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 tracking-wide">
                Quantum Logistics Relay — Network Operations Center
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500">
            <Link to="/hub/Join" className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 hover:bg-neon-cyan/20 cursor-pointer transition-colors">
              <Network size={12} />
              <span>Join as Hub</span>
            </Link>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-700/50">
              <Cpu size={12} />
              <span>SeQUeNCe v1.0</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-700/50">
              <Network size={12} />
              <span>MDI-QKD</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-700/50">
              <Lock size={12} />
              <span>AES-256-GCM</span>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ Main Content ═══ */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {!networkCode ? (
          <>
            {/* Control Bar */}
            <div className="glass-panel p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Waves size={16} className="text-neon-cyan" />
                Simulation Control
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Execute SeQUeNCe discrete-event quantum simulation
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
              <div className="flex w-full sm:w-auto bg-surface-900 rounded-xl p-1 border border-white/5">
                <button
                  onClick={() => setProtocol('CKA')}
                  className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    protocol === 'CKA' 
                      ? 'bg-neon-cyan/20 text-neon-cyan' 
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  CKA
                </button>
                <button
                  onClick={() => setProtocol('QSS')}
                  className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    protocol === 'QSS' 
                      ? 'bg-neon-amber/20 text-neon-amber' 
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  QSS
                </button>
              </div>

              {!networkCode && (
                <button
                  onClick={createNetwork}
                  className="btn-quantum w-full sm:w-auto justify-center bg-neon-violet/10 text-neon-violet border-neon-violet/30 hover:bg-neon-violet/20 flex items-center gap-2"
                >
                  <Network size={16} />
                  Create Multiplayer Network
                </button>
              )}
              <button
                id="btn-run-normal"
                onClick={() => runSimulation(false)}
                disabled={isLoading}
                className="btn-primary w-full sm:w-auto justify-center flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoading && !isAttackMode ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Play size={16} />
                )}
                Run Simulation
              </button>

              <button
                id="btn-run-attack"
                onClick={() => runSimulation(true)}
                disabled={isLoading}
                className="btn-danger w-full sm:w-auto justify-center flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoading && isAttackMode ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Skull size={16} />
                )}
                Simulate Eavesdropping Attack
              </button>

              {simulationData && (
                <button
                  id="btn-fetch-data"
                  onClick={fetchEncryptedData}
                  disabled={isLoadingData}
                  className="btn-quantum w-full sm:w-auto justify-center bg-neon-violet/10 text-neon-violet border-neon-violet/30 hover:bg-neon-violet/20 hover:border-neon-violet/50 flex items-center gap-2 disabled:opacity-40"
                >
                  {isLoadingData ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <FileKey size={16} />
                  )}
                  Fetch Encrypted Manifest
                </button>
              )}

              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`w-full sm:w-auto p-3 flex justify-center rounded-xl border transition-colors ${showSettings ? 'bg-slate-800 border-slate-600 text-white' : 'bg-surface-700/50 border-white/5 text-slate-400 hover:text-white'}`}
                title="Tweak Parameters"
              >
                <Settings2 size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Tweak Options Panel */}
        {showSettings && (
          <div className="glass-panel p-5 mb-6 animate-in slide-in-from-top-4 fade-in">
            <div className="flex items-center gap-2 mb-4 text-neon-cyan">
              <Sliders size={18} />
              <h3 className="text-sm font-semibold">Simulation Parameters</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-xs text-slate-400 flex justify-between">
                  <span>Fiber Attenuation (dB/m)</span>
                  <span className="font-mono text-neon-cyan">{attenuation}</span>
                </label>
                <input 
                  type="range" min="0.0001" max="0.001" step="0.0001"
                  value={attenuation}
                  onChange={(e) => setAttenuation(e.target.value)}
                  className="w-full accent-neon-cyan"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 flex justify-between">
                  <span>Distance Multiplier</span>
                  <span className="font-mono text-neon-cyan">{distanceMultiplier}x</span>
                </label>
                <input 
                  type="range" min="0.1" max="5.0" step="0.1"
                  value={distanceMultiplier}
                  onChange={(e) => setDistanceMultiplier(e.target.value)}
                  className="w-full accent-neon-cyan"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 flex justify-between">
                  <span>Target Fidelity</span>
                  <span className="font-mono text-neon-cyan">{targetFidelity}</span>
                </label>
                <input 
                  type="range" min="0.5" max="0.99" step="0.01"
                  value={targetFidelity}
                  onChange={(e) => setTargetFidelity(e.target.value)}
                  className="w-full accent-neon-cyan"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 flex justify-between">
                  <span>Memories per Node</span>
                  <span className="font-mono text-neon-cyan">{memoSize}</span>
                </label>
                <input 
                  type="range" min="10" max="200" step="10"
                  value={memoSize}
                  onChange={(e) => setMemoSize(e.target.value)}
                  className="w-full accent-neon-cyan"
                />
              </div>
            </div>
          </div>
        )}
        </>
        ) : (
          <div className="glass-panel p-4 sm:p-8 mb-6 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-amber"></div>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">Quantum Network Operations Center</h2>
            <p className="text-xs sm:text-sm text-slate-400 mb-6 sm:mb-8">Multi-Party Key Generation Lobby</p>
            
            <div className="bg-surface-900 border border-neon-cyan/30 inline-block px-6 py-4 sm:px-12 sm:py-5 rounded-3xl mb-8 sm:mb-10 shadow-[0_0_30px_rgba(0,240,255,0.1)]">
               <p className="text-[10px] sm:text-xs text-neon-cyan mb-1 sm:mb-2 uppercase tracking-widest font-semibold">Terminal Access Code</p>
               <p className="text-5xl sm:text-6xl font-mono font-bold text-white tracking-[0.2em]">{networkCode}</p>
            </div>
            
            <div className="text-left max-w-3xl mx-auto">
               <h3 className="text-sm font-bold text-white mb-4 border-b border-white/10 pb-3 flex items-center justify-between">
                  <span className="uppercase tracking-wider">Connected Terminals</span>
                  <span className="bg-neon-violet/20 text-neon-violet px-3 py-1 rounded-full text-xs">{joinedHubs.length} Joined</span>
               </h3>
               
               <div className="grid gap-3 mb-8 min-h-[150px]">
                 {joinedHubs.map(hub => (
                    <div key={hub.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface-800 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors gap-3">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-surface-900 flex items-center justify-center border border-white/5 shrink-0">
                          <Network size={20} className="text-neon-cyan" />
                        </div>
                        <span className="font-mono text-white text-base sm:text-lg font-semibold break-all">{hub.id}</span>
                      </div>
                      <span className="text-[10px] sm:text-xs text-slate-400 bg-black/20 px-3 py-1.5 rounded-lg whitespace-nowrap">
                        Joined at {new Date(hub.joined_at * 1000).toLocaleTimeString()}
                      </span>
                    </div>
                 ))}
                 {joinedHubs.length === 0 && (
                   <div className="flex flex-col items-center justify-center text-slate-500 py-10 border border-dashed border-white/10 rounded-xl bg-surface-800/50">
                     <Loader2 size={24} className="animate-spin mb-3 opacity-50" />
                     <p className="text-sm">Waiting for edge terminals to pair...</p>
                   </div>
                 )}
               </div>
               
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-surface-900 border border-white/5 rounded-2xl gap-4">
                 <div className="w-full sm:w-auto">
                   <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Network Status</p>
                   <p className="text-sm sm:text-base font-semibold text-white">{networkStatus?.status || "Lobby Open"}</p>
                   {networkStatus?.started_by && (
                     <p className="text-xs sm:text-sm text-neon-violet mt-1">
                       Generation initiated by: <span className="font-bold">{networkStatus.started_by}</span>
                     </p>
                   )}
                 </div>
                 
                 <div className="flex gap-2 w-full sm:w-auto">
                   {!simulationData && !networkStatus?.status?.includes("Generating") && joinedHubs.length >= 2 && (
                     <button
                       onClick={() => runSimulation(false)}
                       disabled={isLoading}
                       className="btn-quantum w-full sm:w-auto bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 hover:bg-neon-cyan/30 flex items-center justify-center gap-2 py-3 px-6"
                     >
                       {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} 
                       Force Start Generation
                     </button>
                   )}
                 </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Bit Size</label>
                  <select
                    value={keySize}
                    onChange={(e) => setKeySize(e.target.value)}
                    className="w-full bg-surface-900 border border-white/10 rounded-xl p-2 text-white text-sm focus:border-neon-cyan"
                  >
                    <option value={128}>128-bit AES</option>
                    <option value={256}>256-bit AES</option>
                    <option value={512}>512-bit AES</option>
                  </select>
                </div>
               </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="glass-panel p-4 mb-6 border-neon-red/30 bg-neon-red/5">
            <div className="flex items-center gap-2 text-neon-red text-sm">
              <ShieldAlert size={16} />
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="glass-panel p-16 mb-6 flex flex-col items-center justify-center gap-4">
            <div className="quantum-spinner" />
            <div className="text-center">
              <p className="text-sm text-white font-medium">
                {isAttackMode
                  ? 'Simulating Eavesdropping Attack…'
                  : 'Running Quantum Network Simulation…'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                SeQUeNCe discrete-event engine processing {isAttackMode ? 'degraded' : 'entanglement'} channels
              </p>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {simulationData && !isLoading && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* Left Column — Topology + Encrypted Data */}
            <div className="xl:col-span-5 space-y-5">
              <NetworkGraph simulationData={simulationData} isAttackMode={isAttackMode} />

              {/* Simulation Summary */}
              <div className="glass-panel p-5">
                <p className="section-title">Simulation Summary</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Routers', value: simulationData.summary.num_routers, icon: Network },
                    { label: 'BSM Nodes', value: simulationData.summary.num_bsm_nodes, icon: Shield },
                    { label: 'Requests', value: simulationData.summary.entanglement_requests, icon: Waves },
                    { label: 'Wall Clock', value: `${simulationData.summary.wall_clock_ms} ms`, icon: Clock },
                    { label: 'Key Bits', value: simulationData.summary.key_bits, icon: KeyRound },
                    { label: 'Sim Time', value: `${(simulationData.summary.simulation_time_ps / 1e12).toFixed(1)} μs`, icon: Cpu },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-2.5 py-2 px-3 rounded-lg bg-surface-700/30">
                      <Icon size={14} className="text-slate-500 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
                        <p className="text-sm font-mono font-semibold text-slate-200">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Encrypted Manifest */}
              {encryptedData && (
                <div className="glass-panel p-5">
                  <p className="section-title">AES-256-GCM Encrypted Logistics Manifest</p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Algorithm</span>
                      <span className="text-xs font-mono text-neon-cyan">{encryptedData.encrypted_manifest.algorithm}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Key Fingerprint</span>
                      <span className="text-xs font-mono text-neon-violet">{encryptedData.encrypted_manifest.key_fingerprint}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Plaintext Size</span>
                      <span className="text-xs font-mono text-slate-300">{encryptedData.encrypted_manifest.plaintext_size_bytes} bytes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Ciphertext Size</span>
                      <span className="text-xs font-mono text-slate-300">{encryptedData.encrypted_manifest.ciphertext_size_bytes} bytes</span>
                    </div>

                    {/* Ciphertext preview */}
                    <div className="mt-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Ciphertext (truncated)</p>
                      <div className="bg-surface-900 rounded-lg p-3 border border-white/5">
                        <code className="text-[10px] text-neon-amber/70 font-mono break-all leading-relaxed">
                          {encryptedData.encrypted_manifest.ciphertext?.slice(0, 200)}…
                        </code>
                      </div>
                    </div>

                    {/* Toggle manifest view */}
                    <button
                      onClick={() => setShowManifest(prev => !prev)}
                      className="flex items-center gap-1.5 text-xs text-neon-cyan hover:text-neon-cyan/80 transition-colors mt-2"
                    >
                      {showManifest ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {showManifest ? 'Hide' : 'Show'} Decrypted Manifest
                    </button>

                    {showManifest && encryptedData.encrypted_manifest.manifest && (
                      <div className="bg-surface-900 rounded-lg p-3 border border-white/5 mt-2 max-h-[300px] overflow-y-auto">
                        <pre className="text-[10px] text-slate-300 font-mono whitespace-pre-wrap">
                          {JSON.stringify(encryptedData.encrypted_manifest.manifest, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column — Metrics & Charts */}
            <div className="xl:col-span-7">
              <MetricsPanel simulationData={simulationData} isAttackMode={isAttackMode} />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!simulationData && !isLoading && (
          <div className="glass-panel p-16 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-neon-cyan/5 border border-neon-cyan/10 flex items-center justify-center mb-6 animate-float">
              <Atom size={36} className="text-neon-cyan/50" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Quantum Network Operations Center
            </h3>
            <p className="text-sm text-slate-400 max-w-md mb-1">
              Hub-and-Spoke MDI-QKD Relay — MAQAN / TwinField Architecture
            </p>
            <p className="text-xs text-slate-500 max-w-lg mb-6">
              Powered by SeQUeNCe (Argonne National Lab) discrete-event quantum network simulator.
              3 QuantumRouter spokes connected via an untrusted BSM relay for Conference Key Agreement.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => runSimulation(false)}
                className="btn-primary flex items-center gap-2"
              >
                <Play size={16} />
                Launch Simulation
              </button>
              <button
                onClick={() => runSimulation(true)}
                className="btn-danger flex items-center gap-2"
              >
                <Skull size={16} />
                Simulate Attack
              </button>
            </div>
          </div>
        )}

        {/* Simulation History */}
        {simHistory.length > 0 && (
          <div className="glass-panel p-5 mt-6">
            <p className="section-title">Simulation History</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-white/5">
                    <th className="text-left py-2 px-3 font-medium">Time</th>
                    <th className="text-left py-2 px-3 font-medium">Mode</th>
                    <th className="text-right py-2 px-3 font-medium">Fidelity</th>
                    <th className="text-right py-2 px-3 font-medium">QBER</th>
                    <th className="text-center py-2 px-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {simHistory.map((h, i) => (
                    <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                      <td className="py-2 px-3 font-mono text-slate-400">{h.timestamp}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          h.mode === 'Attack'
                            ? 'bg-neon-red/10 text-neon-red'
                            : 'bg-neon-green/10 text-neon-green'
                        }`}>
                          {h.mode}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-slate-200">
                        {h.fidelity.toFixed(4)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-slate-200">
                        {(h.qber * 100).toFixed(2)}%
                      </td>
                      <td className="py-2 px-3 text-center">
                        {h.detected ? (
                          <span className="text-neon-red flex items-center justify-center gap-1">
                            <ShieldAlert size={12} /> Detected
                          </span>
                        ) : (
                          <span className="text-neon-green flex items-center justify-center gap-1">
                            <Shield size={12} /> Secure
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-10 pb-6 text-center">
          <p className="text-xs text-slate-600">
            Built by <span className="text-slate-400 font-medium">Prem</span> for Quant-A-Thon'26
            <span className="mx-2 text-slate-700">|</span>
            SeQUeNCe × FastAPI × React
            <span className="mx-2 text-slate-700">|</span>
            MAQAN / QuILA Architecture
          </p>
        </footer>
      </main>
    </div>
  );
}

export default Dashboard;
