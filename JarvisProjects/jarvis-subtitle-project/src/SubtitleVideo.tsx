import { Video, staticFile, AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import React from 'react';

const subtitles = [
  { start: 0, end: 60, text: "Bem-vindos ao projeto," },
  { start: 60, end: 120, text: "onde a precisão é nossa meta." },
  { start: 120, end: 300, text: " Jarvis ao seu serviço." }
];

export const SubtitleVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const currentSubtitle = subtitles.find(s => frame >= s.start && frame < s.end);

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <Video src={staticFile("video.mp4")} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      {currentSubtitle && (
        <div style={{
          position: 'absolute',
          top: '65%', // Altura do peito
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '0 50px'
        }}>
          <span style={{
            fontSize: 70,
            color: 'white',
            fontWeight: 'bold',
            textAlign: 'center',
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: '10px 20px',
            borderRadius: '10px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            fontFamily: 'Arial, sans-serif'
          }}>
            {currentSubtitle.text}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};
