"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number; y: number;
  size: number;
  baseOpacity: number;
  driftX: number; driftY: number;
  twinkleOffset: number;
}

export function StarBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const targetMouseRef = useRef({ x: 0.5, y: 0.5 });
  const starsRef = useRef<Star[]>([]);
  const rafRef = useRef<number>();
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const parent = canvas.parentElement!;

    function resize() {
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    starsRef.current = Array.from({ length: 130 }, () => ({
      x: Math.random(), y: Math.random(),
      size: Math.random() * 1.5 + 0.2,
      baseOpacity: Math.random() * 0.5 + 0.1,
      driftX: (Math.random() - 0.5) * 5,
      driftY: (Math.random() - 0.5) * 5,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    function frame(now: number) {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      // Smooth mouse interpolation
      const lerp = 0.045;
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * lerp;
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * lerp;

      const W = canvas.width;
      const H = canvas.height;
      const mx = mouseRef.current.x - 0.5;
      const my = mouseRef.current.y - 0.5;

      ctx.clearRect(0, 0, W, H);

      const pos: [number, number][] = [];

      for (const star of starsRef.current) {
        // Slow drift
        star.x += (star.driftX * dt) / W;
        star.y += (star.driftY * dt) / H;
        if (star.x < 0) star.x += 1;
        if (star.x > 1) star.x -= 1;
        if (star.y < 0) star.y += 1;
        if (star.y > 1) star.y -= 1;

        // Subtle twinkle
        const twinkle = Math.sin(now * 0.0008 + star.twinkleOffset) * 0.1;
        const opacity = Math.max(0, star.baseOpacity + twinkle);

        // Parallax — larger stars feel closer, move more
        const px = star.x * W + mx * star.size * 14;
        const py = star.y * H + my * star.size * 10;

        pos.push([px, py]);

        ctx.beginPath();
        ctx.arc(px, py, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${opacity.toFixed(2)})`;
        ctx.fill();
      }

      // Purple constellation lines
      ctx.lineWidth = 0.5;
      const MAX_DIST = 160;
      for (let i = 0; i < pos.length; i++) {
        for (let j = i + 1; j < pos.length; j++) {
          const dx = pos[i][0] - pos[j][0];
          const dy = pos[i][1] - pos[j][1];
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < MAX_DIST) {
            const alpha = ((1 - d / MAX_DIST) * 0.18).toFixed(3);
            ctx.beginPath();
            ctx.moveTo(pos[i][0], pos[i][1]);
            ctx.lineTo(pos[j][0], pos[j][1]);
            ctx.strokeStyle = `rgba(167,139,250,${alpha})`;
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame((t) => {
      lastTimeRef.current = t;
      rafRef.current = requestAnimationFrame(frame);
    });

    function onMouseMove(e: MouseEvent) {
      targetMouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    }
    function onTouchMove(e: TouchEvent) {
      if (e.touches[0]) {
        targetMouseRef.current = {
          x: e.touches[0].clientX / window.innerWidth,
          y: e.touches[0].clientY / window.innerHeight,
        };
      }
    }

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: "none" }}
      aria-hidden
    />
  );
}
