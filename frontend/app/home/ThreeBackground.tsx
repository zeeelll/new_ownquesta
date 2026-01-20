"use client";

export default function ThreeBackground() {
  return (
    <video
      autoPlay
      loop
      muted
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        minHeight: '100vh',
        objectFit: 'cover',
        objectPosition: 'center top',
        zIndex: -1,
        pointerEvents: 'none',
        display: 'block',
        background: 'transparent',
        filter: 'brightness(0.75) contrast(1.25) saturate(1.6)'
      }}
    >
      <source src="https://cdn.pixabay.com/video/2022/06/16/120525-721287020_large.mp4" type="video/mp4" />
    </video>
  );
}
