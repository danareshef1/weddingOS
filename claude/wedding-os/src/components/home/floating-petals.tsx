'use client';

import { useEffect, useRef } from 'react';

interface Petal {
  x: number;
  y: number;
  size: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  sway: number;
  swaySpeed: number;
  color: string;
}

const PETAL_COLORS = [
  'rgba(244, 163, 188, OPACITY)',  // rose
  'rgba(252, 205, 218, OPACITY)',  // pink
  'rgba(253, 186, 168, OPACITY)',  // peach
  'rgba(221, 190, 230, OPACITY)',  // lavender
  'rgba(255, 218, 185, OPACITY)',  // champagne
];

export function FloatingPetals() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const petals: Petal[] = [];
    const PETAL_COUNT = 15;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < PETAL_COUNT; i++) {
      const opacity = Math.random() * 0.25 + 0.1;
      petals.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 10 + 5,
        speed: Math.random() * 0.6 + 0.3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.015,
        opacity,
        sway: Math.random() * 1.5 - 0.75,
        swaySpeed: Math.random() * 0.015 + 0.005,
        color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)].replace('OPACITY', opacity.toString()),
      });
    }

    let time = 0;

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      time += 0.01;

      petals.forEach((petal) => {
        petal.y += petal.speed;
        petal.x += Math.sin(time * petal.swaySpeed * 10) * petal.sway;
        petal.rotation += petal.rotationSpeed;

        if (petal.y > canvas!.height + 20) {
          petal.y = -20;
          petal.x = Math.random() * canvas!.width;
        }

        ctx!.save();
        ctx!.translate(petal.x, petal.y);
        ctx!.rotate(petal.rotation);
        ctx!.globalAlpha = petal.opacity;

        // Petal shape
        ctx!.beginPath();
        ctx!.fillStyle = petal.color;
        ctx!.ellipse(0, 0, petal.size, petal.size * 0.55, 0, 0, Math.PI * 2);
        ctx!.fill();

        ctx!.restore();
      });

      animationId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-10"
      aria-hidden="true"
    />
  );
}
