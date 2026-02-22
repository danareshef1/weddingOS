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
}

export function FloatingPetals() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const petals: Petal[] = [];
    const PETAL_COUNT = 20;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Initialize petals
    for (let i = 0; i < PETAL_COUNT; i++) {
      petals.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 8 + 4,
        speed: Math.random() * 1 + 0.5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        opacity: Math.random() * 0.4 + 0.2,
        sway: Math.random() * 2 - 1,
        swaySpeed: Math.random() * 0.02 + 0.01,
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

        // Draw petal shape
        ctx!.beginPath();
        ctx!.fillStyle = '#e8a0bf';
        ctx!.ellipse(0, 0, petal.size, petal.size * 0.6, 0, 0, Math.PI * 2);
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
