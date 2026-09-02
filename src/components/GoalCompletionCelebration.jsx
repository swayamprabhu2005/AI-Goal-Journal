/**
 * src/components/GoalCompletionCelebration.jsx
 *
 * Celebration overlay shown the moment a user marks a goal Completed
 * (Active -> Completed). Dependency-free canvas confetti + message + Continue.
 * Triggered purely via in-memory React state in Goals.jsx, so it never replays
 * on load/refresh or on backend fetch of already-completed goals.
 */
import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";

const CONFETTI_COLORS = ["#4F46E5", "#4338CA", "#8B5CF6", "#10B981", "#F59E0B", "#EC4899"];
const SHAPES = ["rect", "circle", "diamond"];

function useConfetti(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let rafId;
    const dims = () => ({ w: window.innerWidth, h: window.innerHeight });
    const layout = () => {
      const { w, h } = dims();
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    };
    layout();

    const count = window.innerWidth < 640 ? 90 : 160;
    const particles = [];
    for (let i = 0; i < count; i++) {
      const { w, h } = dims();
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h - h / 2,
        size: Math.random() * 9 + 5,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        vx: (Math.random() - 0.5) * 1.2,
        vy: Math.random() * 1.8 + 0.6,
        rot: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.35,
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        drift: (Math.random() - 0.5) * 0.3,
        life: 1,
        decay: Math.random() * 0.0015 + 0.0008,
        grav: 0.06 + Math.random() * 0.04,
      });
    }

    const drawShape = (p) => {
      const s = p.size;
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
      } else {
        ctx.fillRect(-s / 2, -s / 2, s, s);
      }
    };

    const resetParticle = () => {
      const { w, h } = dims();
      return {
        x: Math.random() * w,
        y: -30,
        vx: (Math.random() - 0.5) * 1.2,
        vy: Math.random() * 1.6 + 0.6,
        life: 1,
        rot: Math.random() * Math.PI,
      };
    };

    const animate = () => {
      const { w, h } = dims();
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.vx += p.drift * 0.02;
        p.vy += p.grav;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        p.life -= p.decay;
        if (p.life < 0) p.life = 0;
        if (p.y > h + 40 || p.x < -40 || p.x > w + 40 || p.life <= 0) {
          const rp = resetParticle();
          p.x = rp.x; p.y = rp.y; p.vx = rp.vx; p.vy = rp.vy; p.life = rp.life; p.rot = rp.rot;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        drawShape(p);
        ctx.restore();
      }

      ctx.restore();
      rafId = requestAnimationFrame(animate);
    };
    animate();

    const onResize = layout;
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [canvasRef]);
}

function GoalCompletionModal({ goal, onClose }) {
  const canvasRef = useRef(null);
  const continueRef = useRef(null);

  useConfetti(canvasRef);

  // Focus management + Escape handling + lock background scroll.
  useEffect(() => {
    const focusTimer = setTimeout(() => continueRef.current?.focus(), 60);
    const onKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    const prevOverflow = document.body.style.overflow;
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const title = goal?.title || "Your Goal";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Goal completed"
      onClick={onClose}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="relative mx-4 w-full max-w-md animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel flex flex-col items-center gap-5 p-8 text-center shadow-xl rounded-3xl border-2 border-emerald-200 bg-white">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 shadow-md">
            <Sparkles className="h-10 w-10 animate-sparkle-spin text-emerald-500" />
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <h2 className="flex items-center justify-center gap-2 text-3xl font-bold text-slate-900">
              🎉 Goal Completed!
            </h2>
            <p className="break-words rounded-lg bg-indigo-50 px-3 py-1.5 text-lg font-semibold text-indigo-700 border border-indigo-100">
              {title}
            </p>
          </div>

          <p className="text-sm font-medium text-slate-500">
            You successfully completed your goal!
          </p>

          <button
            type="button"
            ref={continueRef}
            onClick={onClose}
            className="primary-button text-sm"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GoalCompletionCelebration({ goal, onClose }) {
  if (!goal) return null;
  return <GoalCompletionModal goal={goal} onClose={onClose} />;
}