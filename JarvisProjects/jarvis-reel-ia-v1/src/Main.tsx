import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, staticFile, Audio } from 'remotion';

const Avatar: React.FC<{ frame: number }> = ({ frame }) => {
    const mouthHeight = interpolate(Math.sin(frame * 0.5), [-1, 1], [5, 20]);
    return (
        <svg width="400" height="400" viewBox="0 0 200 200">
            <circle cx="100" cy="80" r="40" fill="none" stroke="#00ffff" strokeWidth="2" />
            <circle cx="85" cy="75" r="5" fill="#00ffff" />
            <circle cx="115" cy="75" r="5" fill="#00ffff" />
            <rect x="90" y="95" width="20" height={mouthHeight} fill="#00ffff" rx="5" />
            <path d="M60 140 Q100 120 140 140" stroke="#00ffff" fill="none" strokeWidth="2" />
        </svg>
    );
};

export const Main: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const opacity = interpolate(frame, [0, 30], [0, 1]);

    return (
        <AbsoluteFill style={{ backgroundColor: '#050505', color: '#00ffff', fontFamily: 'monospace', justifyContent: 'center', alignItems: 'center' }}>
            <Audio src={staticFile('narracao.mp3')} />
            <div style={{ opacity }}>
                <Avatar frame={frame} />
                <h1 style={{ textAlign: 'center', fontSize: '40px', marginTop: '20px' }}>
                    {frame < 150 ? "IA: MATEMÁTICA, NÃO MÁGICA" : frame < 300 ? "APRENDIZADO DE MÁQUINA" : "O FUTURO É AGORA"}
                </h1>
            </div>
        </AbsoluteFill>
    );
};