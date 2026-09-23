import { useEffect, useState, useRef } from 'react';
import { PartyPopper, Trophy, Sparkles, X, CheckCircle2, ArrowRight } from 'lucide-react';

/**
 * Dispatch a global custom event whenever a goal is newly completed.
 */
export function notifyGoalCompleted(goal) {
  if (typeof window !== 'undefined' && goal) {
    const event = new CustomEvent('goal:completed', {
      detail: {
        goal,
        timestamp: new Date().toISOString(),
      },
    });
    window.dispatchEvent(event);
  }
}

const CONFETTI_COLORS = [
  "#4F46E5", "#10B981", "#F59E0B", "#8B5CF6", 
  "#EF4444", "#EC4899", "#3B82F6", "#F43F5E", "#EAB308"
];
const SHAPES = ["rect", "circle", "diamond", "star"];

function useEpicConfetti(canvasRef, visible) {
  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let animationId;
    const dims = () => ({ w: window.innerWidth, h: window.innerHeight });

    const resize = () => {
      const { w, h } = dims();
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const { w, h } = dims();
    const particleCount = w < 640 ? 180 : 380;
    const particles = [];

    // 1. Dual Cannon Explosions (Bottom-Left and Bottom-Right bursts)
    for (let i = 0; i < particleCount; i++) {
      const isLeftCannon = i % 2 === 0;
      const originX = isLeftCannon ? w * 0.15 : w * 0.85;
      const originY = h * 0.85;
      const baseAngle = isLeftCannon ? -Math.PI / 3 : (-2 * Math.PI) / 3;
      const angle = baseAngle + (Math.random() - 0.5) * 0.8;
      const speed = Math.random() * 22 + 12;

      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 11 + 6,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.4,
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        drift: (Math.random() - 0.5) * 0.4,
        grav: 0.38 + Math.random() * 0.2,
        opacity: 1,
      });
    }

    const drawParticle = (p) => {
      const s = p.size;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);

      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === "diamond") {
        ctx.beginPath();
        ctx.moveTo(0, -s / 2);
        ctx.lineTo(s / 2, 0);
        ctx.lineTo(0, s / 2);
        ctx.lineTo(-s / 2, 0);
        ctx.closePath();
        ctx.fill();
      } else if (p.shape === "star") {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(Math.cos(((18 + i * 72) * Math.PI) / 180) * (s / 2), -Math.sin(((18 + i * 72) * Math.PI) / 180) * (s / 2));
          ctx.lineTo(Math.cos(((54 + i * 72) * Math.PI) / 180) * (s / 4), -Math.sin(((54 + i * 72) * Math.PI) / 180) * (s / 4));
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(-s / 2, -s / 2, s, s * 0.6);
      }

      ctx.restore();
    };

    const render = () => {
      const { w, h } = dims();
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.vx += p.drift * 0.05;
        p.vy += p.grav;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotSpeed;

        // Recycle off-screen falling particles to maintain continuous shower
        if (p.y > h + 50) {
          p.x = Math.random() * w;
          p.y = -20;
          p.vx = (Math.random() - 0.5) * 2;
          p.vy = Math.random() * 4 + 2;
          p.opacity = 1;
        }

        drawParticle(p);
      }

      ctx.restore();
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [visible]);
}

export default function GoalCelebration({ goal, onClose }) {
  const [visible, setVisible] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (goal) {
      setVisible(true);
    }
  }, [goal]);

  useEpicConfetti(canvasRef, visible);

  if (!goal || !visible) return null;

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-md p-4 animate-fade-in">
      {/* High-Density Interactive Canvas Confetti */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-10 h-full w-full"
      />

      {/* Ambient Radial Glow Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-amber-400/25 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-emerald-400/25 rounded-full blur-3xl animate-pulse delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4B5D3C]/20 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative z-20 panel w-full max-w-md p-7 shadow-2xl border border-emerald-200/80 bg-white/95 backdrop-blur-xl rounded-3xl text-center overflow-hidden animate-scale-up">
        {/* Top Banner Gradient Accent */}
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-amber-400 via-emerald-500 via-indigo-500 to-[#4B5D3C]" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
        >
          <X size={18} />
        </button>

        {/* Celebratory Icon Header */}
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-100 via-amber-100 to-emerald-50 text-emerald-600 shadow-md ring-8 ring-emerald-50/50">
          <Trophy size={40} className="text-amber-500 animate-bounce" />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 border border-emerald-200 mb-3 shadow-sm">
          <Sparkles size={14} className="text-amber-500" /> GOAL ACHIEVED! <PartyPopper size={14} className="text-emerald-600" />
        </div>

        <h3 className="text-2xl font-bold text-slate-900 leading-tight">
          Congratulations! 🎉
        </h3>

        <p className="mt-2 text-sm text-slate-600 font-medium">
          You've successfully crossed the finish line on:
        </p>

        {/* Goal Card Container */}
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/40 p-4 border border-emerald-100 shadow-sm text-left">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                {goal.category || 'Milestone'}
              </span>
              <h4 className="mt-1.5 text-base font-bold text-slate-900 leading-snug">
                {goal.title}
              </h4>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-600 text-white font-bold text-xs px-2.5 py-1 shadow-sm flex items-center gap-1">
              <CheckCircle2 size={13} /> 100%
            </span>
          </div>

          {goal.description && (
            <p className="mt-2 text-xs text-slate-600 font-medium line-clamp-2">
              {goal.description}
            </p>
          )}
        </div>

        <p className="mt-4 text-xs italic text-slate-500 font-medium">
          “Success is the sum of small efforts repeated day in and day out.” Keep up the amazing momentum!
        </p>

        <button
          onClick={handleClose}
          className="mt-6 primary-button w-full py-3 text-sm font-bold shadow-md hover:shadow-emerald-200 bg-[#4B5D3C] hover:bg-[#3A492E] text-white rounded-xl flex items-center justify-center gap-2"
        >
          Keep Crushing Goals <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
