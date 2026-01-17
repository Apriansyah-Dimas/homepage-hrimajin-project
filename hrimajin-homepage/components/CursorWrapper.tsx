'use client';

import { useEffect, useRef } from 'react';

interface Ripple {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

export default function CursorWrapper() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const ripples = ripplesRef.current;
    const primaryColor = { r: 99, g: 101, b: 185 }; // #6365b9

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleClick = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      // Create multiple ripples for splash effect
      for (let i = 0; i < 3; i++) {
        ripples.push({
          x,
          y,
          radius: 0,
          alpha: 1 - i * 0.2,
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Add smaller ripples on mouse move with lower probability
      if (Math.random() > 0.85) {
        ripples.push({
          x: e.clientX,
          y: e.clientY,
          radius: 0,
          alpha: 0.3,
        });
      }
    };

    window.addEventListener('click', handleClick);
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];

        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, ${ripple.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Second ring for enhanced effect
        if (ripple.radius > 10) {
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ripple.radius - 10, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, ${ripple.alpha * 0.5})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ripple.radius += 3;
        ripple.alpha -= 0.015;

        if (ripple.alpha <= 0) {
          ripples.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-50"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
