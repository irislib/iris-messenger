import { useEffect, useRef } from 'react';

import Embed from './index';

const Video: Embed = {
  regex: /(https?:\/\/\S+?\.(?:mp4|webm|ogg|mov)(?:\?\S*)?)/gi,
  settingsKey: 'enableVideo',
  component: ({ match }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
      const handleIntersection = (entries: IntersectionObserverEntry[]) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          videoRef.current?.play();
        } else {
          videoRef.current?.pause();
        }
      };

      const observer = new IntersectionObserver(handleIntersection, {
        threshold: 0.1,
      });

      if (videoRef.current) {
        observer.observe(videoRef.current);
      }

      return () => {
        if (videoRef.current) {
          observer.unobserve(videoRef.current);
        }
      };
    }, [match]);

    return (
      <div className="relative w-full object-contain my-2 min-h-96">
        <video
          ref={videoRef}
          className="rounded max-h-[70vh] md:max-h-96"
          src={match}
          controls
          muted
          autoPlay
          playsInline
          loop
          poster={`https://imgproxy.iris.to/thumbnail/638/${match}`}
        ></video>
      </div>
    );
  },
};

export default Video;
