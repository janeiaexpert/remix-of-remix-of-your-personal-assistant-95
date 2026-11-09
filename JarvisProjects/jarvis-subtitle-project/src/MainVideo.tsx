import {AbsoluteFill, Video, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';
import React from 'react';

const subtitles = [
  { text: "Olá, senhor.", start: 0, end: 30 },
  { text: "Processando as legendas", start: 35, end: 90 },
  { text: "exatamente onde solicitado.", start: 95, end: 150 }
];

export const MainVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <Video src={staticFile("input.mp4")} />
      
      {subtitles.map((sub, i) => {
        if (frame >= sub.start && frame <= sub.end) {
          return (
            <AbsoluteFill 
              key={i}
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                top: '25%', // Altura do peito
                padding: '0 50px'
              }}
            >
              <div style={{
                fontSize: 60,
                color: 'white',
                fontWeight: 'bold',
                textShadow: '2px 2px 10px rgba(0,0,0,0.8)',
                textAlign: 'center',
                backgroundColor: 'rgba(0,0,0,0.3)',
                padding: '10px 20px',
                borderRadius: 15
              }}>
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
