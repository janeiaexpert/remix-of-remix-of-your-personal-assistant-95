import React from 'react';
import { Video, useCurrentFrame, AbsoluteFill, interpolate } from 'remotion';

const subtitles = [
  { text: "Olá pessoal,", start: 0, end: 30 },
  { text: "estou aqui para mostrar", start: 30, end: 60 },
  { text: "como configurar legendas", start: 60, end: 90 },
  { text: "na altura do peito.", start: 90, end: 120 }
];

export const Main: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <Video src={require('../public/video.mp4')} />
      {subtitles.map((sub, i) => {
        if (frame >= sub.start && frame <= sub.end) {
          return (
            <AbsoluteFill
              key={i}
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                top: '20%', // Altura do peito aproximada
              }}
            >
              <div
                style={{
                  fontSize: 60,
                  color: 'yellow',
                  fontWeight: 'bold',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  textAlign: 'center',
                  padding: '0 50px',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderRadius: 10
                }}
              >
                {sub.text}
              </div>
            </AbsoluteFill>
          );
        }
        return null;
      })}
    </AbsoluteFill>
  );
};