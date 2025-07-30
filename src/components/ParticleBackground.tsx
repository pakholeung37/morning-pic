"use client";

import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container, ISourceOptions } from "@tsparticles/engine";

export default function ParticleBackground() {
  const [init, setInit] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const particlesLoaded = async (container?: Container): Promise<void> => {
    console.log("Particles container loaded", container);
  };

  const options: ISourceOptions = useMemo(
    () => ({
      background: {
        color: {
          value: "transparent",
        },
      },
      fpsLimit: 60,
      interactivity: {
        events: {
          onClick: {
            enable: true,
            mode: "push",
          },
          onHover: {
            enable: true,
            mode: "repulse",
          },
          resize: {
            enable: true,
          },
        },
        modes: {
          push: {
            quantity: isMobile ? 2 : 4,
          },
          repulse: {
            distance: isMobile ? 80 : 120,
            duration: 0.6,
            easing: "ease-out-quad",
          },
        },
      },
      particles: {
        color: {
          value: ["#F97316", "#EC4899", "#8B5CF6", "#F59E0B", "#EF4444", "#10B981"],
        },
        links: {
          color: "#F97316",
          distance: isMobile ? 120 : 150,
          enable: true,
          opacity: 0.5,
          width: 1.2,
          triangles: {
            enable: true,
            color: "#F97316",
            opacity: 0.1,
          },
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "bounce",
          },
          random: true,
          speed: isMobile ? 1.5 : 2,
          straight: false,
          attract: {
            enable: true,
            rotate: {
              x: 600,
              y: 1200,
            },
          },
        },
        number: {
          density: {
            enable: true,
            width: 1920,
            height: 1080,
          },
          value: isMobile ? 40 : 70,
        },
        opacity: {
          value: { min: 0.3, max: 0.7 },
          random: {
            enable: true,
            minimumValue: 0.3,
          },
          animation: {
            enable: true,
            speed: 1.5,
            minimumValue: 0.2,
            sync: false,
          },
        },
        shape: {
          type: ["circle", "triangle"],
          triangle: {
            sides: 3,
          },
        },
        size: {
          value: { min: isMobile ? 1.5 : 2, max: isMobile ? 4 : 6 },
          random: {
            enable: true,
            minimumValue: 1,
          },
          animation: {
            enable: true,
            speed: 3,
            minimumValue: 0.5,
            sync: false,
          },
        },
        twinkle: {
          particles: {
            enable: true,
            frequency: 0.05,
            opacity: 1,
          },
        },
      },
      detectRetina: true,
      responsive: [
        {
          maxWidth: 768,
          options: {
            particles: {
              number: {
                value: 30,
              },
              move: {
                speed: 1,
              },
            },
          },
        },
        {
          maxWidth: 480,
          options: {
            particles: {
              number: {
                value: 20,
              },
              move: {
                speed: 0.8,
              },
            },
          },
        },
      ],
    }),
    [isMobile]
  );

  if (!init) {
    return null;
  }

  return (
    <div className="absolute inset-0 -z-10 pointer-events-none">
      <Particles
        id="tsparticles"
        particlesLoaded={particlesLoaded}
        options={options}
        className="absolute inset-0 pointer-events-auto"
        style={{ 
          pointerEvents: 'auto',
          zIndex: -1,
        }}
      />
    </div>
  );
}