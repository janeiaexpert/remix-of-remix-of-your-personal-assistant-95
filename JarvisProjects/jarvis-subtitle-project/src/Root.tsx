import { Composition } from 'remotion';
import { SubtitleVideo } from './SubtitleVideo';

export const Main = () => {
  return (
    <>
      <Composition
        id="Main"
        component={SubtitleVideo}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
