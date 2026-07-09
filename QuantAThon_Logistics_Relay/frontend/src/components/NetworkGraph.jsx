import { useState, useEffect, useRef } from 'react';
import { Shield, Radio, Zap, AlertTriangle } from 'lucide-react';

const SPOKE_POSITIONS = [
  { x: 140, y: 80, label: 'Mumbai', color: '#00f0ff' },
  { x: 380, y: 80, label: 'Delhi', color: '#8b5cf6' },
  { x: 260, y: 340, label: 'Chennai', color: '#00ff87' },
];

const RELAY_POS = { x: 260, y: 190 };

export default function NetworkGraph({ simulationData, isAttackMode }) {
  const [animPhase, setAnimPhase] = useState(0);
  const svgRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimPhase(p => (p + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const links = simulationData?.topology?.links || [];

  return (
    <div className="glass-panel p-6 relative overflow-hidden">
      {/* Scan line effect */}
      <div className="scan-line" />

      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="section-title mb-1">Quantum Network Topology</p>
          <p className="text-xs text-slate-500">Hub-and-Spoke MDI-QKD Relay — MAQAN Architecture</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
          isAttackMode 
            ? 'bg-neon-red/10 text-neon-red border border-neon-red/20' 
            : 'bg-neon-green/10 text-neon-green border border-neon-green/20'
        }`}>
          <div className={`status-dot ${isAttackMode ? 'status-dot-danger' : 'status-dot-active'}`} />
          {isAttackMode ? 'UNDER ATTACK' : 'SECURE'}
        </div>
      </div>

      <div className="flex justify-center">
        <svg 
          ref={svgRef}
          viewBox="0 0 520 420" 
          className="w-full max-w-[520px]"
          style={{ filter: 'drop-shadow(0 0 1px rgba(0,240,255,0.1))' }}
        >
          <defs>
            {/* Gradients */}
            <radialGradient id="relayGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={isAttackMode ? '#ff3b5c' : '#00f0ff'} stopOpacity="0.3" />
              <stop offset="100%" stopColor={isAttackMode ? '#ff3b5c' : '#00f0ff'} stopOpacity="0" />
            </radialGradient>

            <radialGradient id="nodeGlowCyan" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="nodeGlowViolet" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="nodeGlowGreen" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00ff87" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00ff87" stopOpacity="0" />
            </radialGradient>

            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Photon particle */}
            <circle id="photon" r="3" fill="#00f0ff">
              <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
            </circle>
          </defs>

          {/* Background grid */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,240,255,0.03)" strokeWidth="0.5" />
          </pattern>
          <rect width="520" height="420" fill="url(#grid)" rx="16" />

          {/* Quantum Channels (fiber links) */}
          {SPOKE_POSITIONS.map((spoke, i) => {
            const linkData = links[i];
            const distLabel = linkData ? `${linkData.distance_km} km` : '';

            return (
              <g key={`link-${i}`}>
                {/* Channel line */}
                <line
                  x1={spoke.x} y1={spoke.y}
                  x2={RELAY_POS.x} y2={RELAY_POS.y}
                  stroke={isAttackMode ? '#ff3b5c' : spoke.color}
                  strokeWidth="2"
                  strokeOpacity="0.4"
                  className={isAttackMode ? 'channel-line-alert' : 'channel-line'}
                />

                {/* Glow line underneath */}
                <line
                  x1={spoke.x} y1={spoke.y}
                  x2={RELAY_POS.x} y2={RELAY_POS.y}
                  stroke={isAttackMode ? '#ff3b5c' : spoke.color}
                  strokeWidth="6"
                  strokeOpacity="0.08"
                />

                {/* Distance label */}
                <text
                  x={(spoke.x + RELAY_POS.x) / 2 + (i === 2 ? -35 : i === 0 ? -30 : 15)}
                  y={(spoke.y + RELAY_POS.y) / 2 + (i === 2 ? 10 : -8)}
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="middle"
                >
                  {distLabel}
                </text>

                {/* Animated photon traveling along the channel */}
                <circle r="3" fill={isAttackMode ? '#ff3b5c' : spoke.color} filter="url(#glow)">
                  <animateMotion
                    dur={`${2 + i * 0.5}s`}
                    repeatCount="indefinite"
                    path={`M${spoke.x},${spoke.y} L${RELAY_POS.x},${RELAY_POS.y}`}
                  />
                  <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1s" repeatCount="indefinite" />
                </circle>

                {/* Return photon */}
                <circle r="2" fill={isAttackMode ? '#ff3b5c' : spoke.color} opacity="0.5">
                  <animateMotion
                    dur={`${2.5 + i * 0.5}s`}
                    repeatCount="indefinite"
                    path={`M${RELAY_POS.x},${RELAY_POS.y} L${spoke.x},${spoke.y}`}
                  />
                </circle>
              </g>
            );
          })}

          {/* Central MDI Relay Node */}
          <g className="topology-node" style={{ cursor: 'pointer' }}>
            {/* Outer glow */}
            <circle cx={RELAY_POS.x} cy={RELAY_POS.y} r="50" fill="url(#relayGlow)" />

            {/* Pulsing ring */}
            <circle
              cx={RELAY_POS.x} cy={RELAY_POS.y} r="32"
              fill="none"
              stroke={isAttackMode ? '#ff3b5c' : '#00f0ff'}
              strokeWidth="1"
              strokeOpacity="0.3"
            >
              <animate attributeName="r" values="32;38;32" dur="2s" repeatCount="indefinite" />
              <animate attributeName="stroke-opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
            </circle>

            {/* Main node circle */}
            <circle
              cx={RELAY_POS.x} cy={RELAY_POS.y} r="28"
              fill="#0a0f1e"
              stroke={isAttackMode ? '#ff3b5c' : '#00f0ff'}
              strokeWidth="2"
              filter="url(#glow)"
            />

            {/* BSM icon */}
            <text
              x={RELAY_POS.x} y={RELAY_POS.y + 1}
              fill={isAttackMode ? '#ff3b5c' : '#00f0ff'}
              fontSize="11"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="JetBrains Mono, monospace"
            >
              BSM
            </text>

            {/* Label */}
            <text
              x={RELAY_POS.x} y={RELAY_POS.y + 52}
              fill="#94a3b8"
              fontSize="10"
              fontWeight="500"
              textAnchor="middle"
              fontFamily="Inter, sans-serif"
            >
              MDI Relay (Untrusted)
            </text>

            {/* Sublabel */}
            <text
              x={RELAY_POS.x} y={RELAY_POS.y + 65}
              fill="#475569"
              fontSize="8"
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
            >
              Bell State Measurement
            </text>
          </g>

          {/* Spoke Nodes (Logistics Hubs) */}
          {SPOKE_POSITIONS.map((spoke, i) => {
            const glowIds = ['nodeGlowCyan', 'nodeGlowViolet', 'nodeGlowGreen'];
            return (
              <g key={`spoke-${i}`} className="topology-node" style={{ cursor: 'pointer' }}>
                {/* Outer glow */}
                <circle cx={spoke.x} cy={spoke.y} r="40" fill={`url(#${glowIds[i]})`} />

                {/* Main node */}
                <circle
                  cx={spoke.x} cy={spoke.y} r="22"
                  fill="#0a0f1e"
                  stroke={spoke.color}
                  strokeWidth="2"
                  filter="url(#glow)"
                />

                {/* Hub icon text */}
                <text
                  x={spoke.x} y={spoke.y - 2}
                  fill={spoke.color}
                  fontSize="12"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  ◈
                </text>
                <text
                  x={spoke.x} y={spoke.y + 10}
                  fill={spoke.color}
                  fontSize="7"
                  fontWeight="600"
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                >
                  QR
                </text>

                {/* Label */}
                <text
                  x={spoke.x} y={spoke.y + (i === 2 ? 38 : -32)}
                  fill="#e2e8f0"
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                >
                  {spoke.label}
                </text>
                <text
                  x={spoke.x} y={spoke.y + (i === 2 ? 50 : -44)}
                  fill="#64748b"
                  fontSize="8"
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                >
                  QuantumRouter
                </text>
              </g>
            );
          })}

          {/* Attack indicator */}
          {isAttackMode && (
            <g>
              <text x="260" y="400" fill="#ff3b5c" fontSize="10" fontWeight="600" textAnchor="middle" opacity="0.8">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />
                ⚠ EAVESDROPPER DETECTED — QUANTUM STATE DISTURBED
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Radio size={12} className="text-neon-cyan" />
          <span>QuantumRouter</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield size={12} className="text-neon-cyan" />
          <span>BSM Node</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap size={12} className="text-neon-violet" />
          <span>Fiber Channel</span>
        </div>
        {isAttackMode && (
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-neon-red" />
            <span>Attack Vector</span>
          </div>
        )}
      </div>
    </div>
  );
}
