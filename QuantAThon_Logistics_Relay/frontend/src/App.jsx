import { useState, useCallback } from 'react';
import axios from 'axios';
import {
  Atom, Shield, ShieldAlert, Play, Skull, Loader2,
  Lock, FileKey, Clock, Cpu, Network, Waves,
  ChevronDown, ChevronUp, ExternalLink, KeyRound, Settings2, Sliders
} from 'lucide-react';
import NetworkGraph from './components/NetworkGraph';
import MetricsPanel from './components/MetricsPanel';

const API_BASE = 'http://localhost:8000';

function App() {
  const [simulationData, setSimulationData] = useState(null);
  const [encryptedData, setEncryptedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isAttackMode, setIsAttackMode] = useState(false);
  const [error, setError] = useState(null);
  const [showManifest, setShowManifest] = useState(false);
  const [simHistory, setSimHistory] = useState([]);

  // Simulation Parameters
  const [attenuation, setAttenuation] = useState(0.0002);
  const [distanceMultiplier, setDistanceMultiplier] = useState(1.0);
  const [targetFidelity, setTargetFidelity] = useState(0.85);
  const [memoSize, setMemoSize] = useState(50);
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
  }, [attenuation, distanceMultiplier, targetFidelity, memoSize]);

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
                QuILA
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

            <div className="flex items-center gap-3">
              <button
                id="btn-run-normal"
                onClick={() => runSimulation(false)}
                disabled={isLoading}
                className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
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
                className="btn-danger flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
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
                  className="btn-quantum bg-neon-violet/10 text-neon-violet border-neon-violet/30 hover:bg-neon-violet/20 hover:border-neon-violet/50 flex items-center gap-2 disabled:opacity-40"
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
                className={`p-3 rounded-xl border transition-colors ${showSettings ? 'bg-slate-800 border-slate-600 text-white' : 'bg-surface-700/50 border-white/5 text-slate-400 hover:text-white'}`}
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
              Hub-and-Spoke MDI-QKD Relay — MAQAN / QuILA Architecture
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

export default App;
