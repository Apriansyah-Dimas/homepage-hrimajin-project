'use client';

import { useEffect, useRef } from 'react';

export default function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const gridSize = 50;
    const primaryColor = { r: 99, g: 101, b: 185 }; // #6365b9

    const drawGrid = () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const lineWidth = 0.5;
      ctx.lineWidth = lineWidth;

      for (let x = 0; x <= canvas.width; x += gridSize) {
        for (let y = 0; y <= canvas.height; y += gridSize) {
          const distanceX = Math.abs(x - canvas.width / 2);
          const distanceY = Math.abs(y - canvas.height / 2);
          const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
          const maxDistance = Math.sqrt(Math.pow(canvas.width / 2, 2) + Math.pow(canvas.height / 2, 2));

          const wave = Math.sin(distance * 0.005 - time * 0.5) * 0.5 + 0.5;
          const alpha = wave * 0.15 * (1 - distance / maxDistance);

          ctx.strokeStyle = `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, ${alpha})`;

          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + gridSize * 0.3, y + gridSize * 0.3);
          ctx.stroke();

          // Add dots at intersections
          const dotSize = 1 + wave * 1.5;
          const dotAlpha = wave * 0.3 * (1 - distance / maxDistance);
          ctx.fillStyle = `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, ${dotAlpha})`;
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      time += 0.02;
      animationFrameId = requestAnimationFrame(drawGrid);
    };

    drawGrid();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}
