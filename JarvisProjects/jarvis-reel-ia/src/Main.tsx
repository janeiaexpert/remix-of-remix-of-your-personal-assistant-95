import React from 'react';
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig, Audio, staticFile } from 'remotion';

const JarvisAvatar: React.FC<{ frame: number }> = ({ frame }) => {
  const bounce = Math.sin(frame / 5) * 10;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <svg width="400" height="400" viewBox="0 0 200 200" style={{ transform: `translateY(${bounce}px)` }}>
        <circle cx="100" cy="100" r="80" stroke="#00ffff" strokeWidth="2" fill="none" opacity="0.3" />
        <circle cx="100" cy="100" r="60" stroke="#00ffff" strokeWidth="4" fill="none" />
        <path d="M70 100 Q 100 130 130 100" stroke="#00ffff" strokeWidth="4" fill="none">
           <animate attributeName="d" values="M70 100 Q 100 130 130 100; M70 100 Q 100 110 130 100; M70 100 Q 100 130 130 100" dur="0.5s" repeatCount="indefinite" />
        </path>
        <circle cx="80" cy="85" r="5" fill="#00ffff" />
        <circle cx="120" cy="85" r="5" fill="#00ffff" />
      </svg>
    </div>
  );
};

export const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#050a0f', color: '#00ffff', fontFamily: 'sans-serif' }}>
      <Audio src={staticFile('narracao.mp3')} />
      
      <Sequence durationInFrames={150}>
        <JarvisAvatar frame={frame} />
        <h1 style={{ textAlign: 'center', position: 'absolute', bottom: 400, width: '100%', fontSize: 60 }}>
          IA não é mágica, senhora.
        </h1>
      </Sequence>

      <Sequence from={150} durationInFrames={150}>
        <AbsoluteFill style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 50, padding: 50, textAlign: 'center' }}>
          É matemática avançada aplicada à resolução de problemas.
        </AbsoluteFill>
      </Sequence>

      <Sequence from={300} durationInFrames={150}>
         <AbsoluteFill style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 70, fontWeight: 'bold' }}>
          O FUTURO É AGORA.
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};