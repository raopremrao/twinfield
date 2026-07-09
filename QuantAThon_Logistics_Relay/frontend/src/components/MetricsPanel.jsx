import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine
} from 'recharts';
import { Activity, ShieldAlert, TrendingDown, TrendingUp } from 'lucide-react';

const SPOKE_COLORS = {
  Hub_Mumbai: '#00f0ff',
  Hub_Delhi: '#8b5cf6',
  Hub_Chennai: '#00ff87',
};

const SPOKE_LABELS = {
  Hub_Mumbai: 'Mumbai',
  Hub_Delhi: 'Delhi',
  Hub_Chennai: 'Chennai',
};

function CustomTooltip({ active, payload, label, type }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="glass-panel p-3 !rounded-lg border-white/10 min-w-[180px]">
      <p className="text-xs text-slate-400 font-mono mb-2">
        t = {label} ms
      </p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color, boxShadow: `0 0 6px ${entry.color}` }}
            />
            <span className="text-xs text-slate-300">
              {SPOKE_LABELS[entry.dataKey] || entry.dataKey}
            </span>
          </div>
          <span className="text-xs font-mono font-semibold" style={{ color: entry.color }}>
            {type === 'qber'
              ? `${(entry.value * 100).toFixed(2)}%`
              : entry.value?.toFixed(4)
            }
          </span>
        </div>
      ))}
    </div>
  );
}

export default function MetricsPanel({ simulationData, isAttackMode }) {
  const fidelityData = simulationData?.fidelity_data || [];
  const qberData = simulationData?.qber_data || [];
  const summary = simulationData?.summary || {};
  const bsmStats = simulationData?.bsm_stats || [];

  const avgFidelity = summary.avg_fidelity || 0;
  const avgQber = summary.avg_qber || 0;
  const isDetected = simulationData?.eavesdropper_detected || false;

  return (
    <div className="space-y-5">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Avg Fidelity */}
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className={avgFidelity > 0.85 ? 'text-neon-green' : 'text-neon-red'} />
            <span className="text-xs text-slate-400 uppercase tracking-wider">Fidelity</span>
          </div>
          <p className={`text-2xl font-bold font-mono ${
            avgFidelity > 0.85 ? 'text-gradient-green' : 'text-gradient-red'
          }`}>
            {avgFidelity.toFixed(4)}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Target: ≥ 0.8500
          </p>
        </div>

        {/* Avg QBER */}
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={14} className={avgQber < 0.11 ? 'text-neon-green' : 'text-neon-red'} />
            <span className="text-xs text-slate-400 uppercase tracking-wider">QBER</span>
          </div>
          <p className={`text-2xl font-bold font-mono ${
            avgQber < 0.11 ? 'text-gradient-green' : 'text-gradient-red'
          }`}>
            {(avgQber * 100).toFixed(2)}%
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Threshold: &lt; 11.00%
          </p>
        </div>

        {/* Security Status */}
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert size={14} className={isDetected ? 'text-neon-red' : 'text-neon-green'} />
            <span className="text-xs text-slate-400 uppercase tracking-wider">Security</span>
          </div>
          <p className={`text-lg font-bold ${isDetected ? 'text-neon-red' : 'text-neon-green'}`}>
            {isDetected ? 'BREACHED' : 'SECURED'}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            {isDetected ? 'Eavesdropper Detected' : 'No Intrusion Detected'}
          </p>
        </div>

        {/* Conference Key / QSS */}
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-neon-violet" />
              <span className="text-xs text-slate-400 uppercase tracking-wider">
                {simulationData?.protocol === 'QSS' ? 'QSS Master Secret' : 'CKA Key'}
              </span>
            </div>
            {simulationData?.protocol && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white font-bold tracking-widest">{simulationData.protocol}</span>
            )}
          </div>
          <p className="text-sm font-mono text-neon-violet truncate">
            {simulationData?.conference_key_hex?.slice(0, 16) || '—'}…
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            256-bit AES-GCM {simulationData?.protocol === 'QSS' ? '(Requires N Shares)' : ''}
          </p>
        </div>
      </div>

      {/* Fidelity Chart */}
      <div className="glass-panel p-5">
        <p className="section-title">Entanglement Fidelity — Time Series</p>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fidelityData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <defs>
                {Object.entries(SPOKE_COLORS).map(([key, color]) => (
                  <linearGradient key={key} id={`fid-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10 }}
                label={{ value: 'Time (ms)', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#64748b' }}
              />
              <YAxis
                domain={[0.3, 1.05]}
                tick={{ fontSize: 10 }}
                label={{ value: 'Fidelity', angle: -90, position: 'insideLeft', offset: 20, fontSize: 10, fill: '#64748b' }}
              />
              <Tooltip content={<CustomTooltip type="fidelity" />} />
              <ReferenceLine y={0.85} stroke="#ffb800" strokeDasharray="6 3" strokeOpacity={0.5} label={{ value: 'Target', fill: '#ffb800', fontSize: 9, position: 'right' }} />
              {Object.entries(SPOKE_COLORS).map(([key, color]) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#fid-${key})`}
                  dot={false}
                  activeDot={{ r: 4, stroke: color, strokeWidth: 2, fill: '#0a0f1e' }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* QBER Chart */}
      <div className="glass-panel p-5">
        <p className="section-title">Quantum Bit Error Rate (QBER) — Time Series</p>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={qberData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <defs>
                {Object.entries(SPOKE_COLORS).map(([key, color]) => (
                  <linearGradient key={key} id={`qber-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10 }}
                label={{ value: 'Time (ms)', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#64748b' }}
              />
              <YAxis
                domain={[0, 0.4]}
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                label={{ value: 'QBER', angle: -90, position: 'insideLeft', offset: 20, fontSize: 10, fill: '#64748b' }}
              />
              <Tooltip content={<CustomTooltip type="qber" />} />
              <ReferenceLine y={0.11} stroke="#ff3b5c" strokeDasharray="6 3" strokeOpacity={0.6} label={{ value: 'BB84 Limit (11%)', fill: '#ff3b5c', fontSize: 9, position: 'right' }} />
              {Object.entries(SPOKE_COLORS).map(([key, color]) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#qber-${key})`}
                  dot={false}
                  activeDot={{ r: 4, stroke: color, strokeWidth: 2, fill: '#0a0f1e' }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BSM Stats */}
      {bsmStats.length > 0 && (
        <div className="glass-panel p-5">
          <p className="section-title">Bell State Measurement Statistics</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {bsmStats.map((bsm, i) => (
              <div key={i} className="bg-surface-700/40 rounded-xl p-3 border border-white/5">
                <p className="text-xs text-slate-400 font-mono truncate">{bsm.name}</p>
                <p className="text-xl font-bold font-mono text-gradient-cyan mt-1">
                  {bsm.measurements_performed}
                </p>
                <p className="text-[10px] text-slate-500">measurements</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QSS Shares */}
      {simulationData?.protocol === 'QSS' && simulationData?.secret_shares && (
        <div className="glass-panel p-5">
          <p className="section-title">Quantum Secret Shares (N-out-of-N Threshold)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(simulationData.secret_shares).map(([hub, share]) => (
              <div key={hub} className="bg-surface-900 rounded-xl p-4 border border-neon-amber/20 shadow-[0_0_15px_rgba(251,191,36,0.05)]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-neon-amber animate-pulse"></div>
                  <p className="text-xs text-neon-amber font-semibold uppercase tracking-wider truncate">{hub}</p>
                </div>
                <p className="text-[10px] font-mono text-slate-400 break-all leading-tight bg-surface-900/50 p-2 rounded border border-white/5">
                  {share.slice(0, 32)}<br/>{share.slice(32)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
