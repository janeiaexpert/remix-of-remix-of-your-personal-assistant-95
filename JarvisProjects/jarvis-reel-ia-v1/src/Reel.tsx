import { AbsoluteFill, Sequence, staticFile, Audio, interpolate, useCurrentFrame, spring } from 'remotion';
import React from 'react';

const JarvisAvatar = ({ frame }: { frame: number }) => {
  const scale = spring({ frame, fps: 30, config: { stiffness: 100 } });
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{ transform: `scale(${scale})`, opacity, textAlign: 'center', marginTop: 400 }}>
      <svg width="400" height="400" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#00ffff" strokeWidth="2" strokeDasharray="10 5" />
        <circle cx="50" cy="50" r="35" fill="none" stroke="#00ffff" strokeWidth="1" opacity="0.5" />
        <path d="M30 50 Q 50 20 70 50" fill="none" stroke="#00ffff" strokeWidth="3">
          <animate attributeName="d" dur="2s" repeatCount="indefinite" values="M30 50 Q 50 20 70 50; M30 50 Q 50 80 70 50; M30 50 Q 50 20 70 50" />
        </path>
      </svg>
      <h1 style={{ color: '#00ffff', fontFamily: 'Arial', fontSize: 60, marginTop: 50 }}>J.A.R.V.I.S.</h1>
    </div>
  );
};

export const Reel = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: '#000', color: '#fff', fontFamily: 'sans-serif' }}>
      <Audio src={staticFile('narracao.mp3')} />

      <Sequence durationInFrames={150}>
        <JarvisAvatar frame={frame} />
        <div style={{ position: 'absolute', bottom: 300, width: '100%', textAlign: 'center', fontSize: 50, color: '#00ffff', padding: '0 50px' }}>
          IA não é mágica, senhora. É matemática aplicada.
        </div>
      </Sequence>

      <Sequence from={150} durationInFrames={150}>
        <AbsoluteFill style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 80, textAlign: 'center', fontSize: 60 }}>
          Máquinas processando dados para aprender e automatizar tarefas.
        </AbsoluteFill>
      </Sequence>

      <Sequence from={300} durationInFrames={150}>
        <AbsoluteFill style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#001515' }}>
          <div style={{ fontSize: 80, color: '#00ffff', fontWeight: 'bold' }}>O FUTURO É AGORA.</div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
