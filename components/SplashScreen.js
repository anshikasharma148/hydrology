"use client";

import { useEffect } from "react";

export default function SplashScreen({ videoPath, onEnd }) {
  useEffect(() => {
    const timer = setTimeout(onEnd, 4000); // 4 sec splash duration
    return () => clearTimeout(timer);
  }, [onEnd]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex justify-center items-center">
      <video
        src={videoPath}
        autoPlay
        muted
        className="max-w-full max-h-full"
      />
    </div>
  );
}
