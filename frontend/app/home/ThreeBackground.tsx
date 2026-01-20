"use client";

import { useCallback } from "react";
import Particles from "react-tsparticles";
import type { Engine } from "tsparticles-engine";
import { loadSlim } from "tsparticles-slim";

export default function ThreeBackground() {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <div className="fixed inset-0 -z-10">
      {/* ✅ Optimized Gradient Blobs */}
      <div className="absolute inset-0">
        <div
          className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-[90px] opacity-15"
          style={{
            background:
              "radial-gradient(circle, rgba(102,252,255,0.4) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute top-1/3 -right-52 h-[620px] w-[620px] rounded-full blur-[100px] opacity-10"
          style={{
            background:
              "radial-gradient(circle, rgba(110,84,200,0.45) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute -bottom-60 left-1/3 h-[620px] w-[620px] rounded-full blur-[110px] opacity-8"
          style={{
            background:
              "radial-gradient(circle, rgba(124,73,169,0.5) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ✅ Optimized Particle Constellation */}
      <Particles
        id="constellation-bg"
        init={particlesInit}
        className="absolute inset-0"
        options={{
          fullScreen: { enable: false },
          fpsLimit: 60,
          detectRetina: true,
          background: { color: "#040915" },

          particles: {
            number: {
              value: 75,
              density: { enable: true, area: 1100 },
            },

            color: { value: "#66fcff" },

            links: {
              enable: true,
              color: "#2efcff",
              distance: 160,
              opacity: 0.22,
              width: 1,
            },

            opacity: {
              value: 0.8,
            },

            size: {
              value: { min: 1.2, max: 2.6 },
            },

            move: {
              enable: true,
              speed: 0.55,
              outModes: { default: "out" },
            },
          },

          emitters: [
            {
              position: { x: 96, y: 60 },
              rate: {
                delay: 0.12,
                quantity: 5,
              },
              size: {
                width: 8,
                height: 70,
              },
              particles: {
                number: { value: 0 },
                size: { value: { min: 1.5, max: 3 } },
                opacity: { value: 1 },
                links: {
                  enable: true,
                  color: "#2efcff",
                  opacity: 0.45,
                  distance: 180,
                },
                move: {
                  speed: 1.25,
                },
              },
            },
          ],

          interactivity: {
            events: {
              onHover: { enable: true, mode: "repulse" },
              resize: true,
            },
            modes: {
              repulse: { distance: 120, duration: 0.3 },
            },
          },
        }}
      />

      {/* ✅ Dark overlay for depth */}
      <div className="absolute inset-0 bg-black/5" />
    </div>
  );
}
