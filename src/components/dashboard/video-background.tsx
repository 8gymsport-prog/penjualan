'use client';

import { useEffect, useState } from "react";

export function VideoBackground() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      className="video-background"
    >
      <source
        src="https://cdn.pixabay.com/vimeo/891893348/space-197472.mp4?width=1280&hash=8504e76974955746777b1050a41753c153724c3e"
        type="video/mp4"
      />
      Your browser does not support the video tag.
    </video>
  );
}
