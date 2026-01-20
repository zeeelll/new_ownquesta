"use client";

export default function ThreeBackground() {
  return (
    <video
      autoPlay
      loop
      muted
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center top',
        zIndex: 0,
        pointerEvents: 'none',
        filter: 'brightness(0.6) contrast(1.5) saturate(1.4)'
      }}
    >
      <source src="https://cdn.pixabay.com/video/2022/06/16/120525-721287020_large.mp4" type="video/mp4" />
    </video>
  );
}
