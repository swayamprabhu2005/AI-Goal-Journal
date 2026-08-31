import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Target } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-cream">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        {/* BRAND SIDE */}
        <div className="relative hidden overflow-hidden border-r border-border lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(109,41,50,0.35),transparent_45%)]" />
          <div className="relative flex w-full flex-col justify-between p-12 xl:p-16">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-burgundy">
                <Target size={21} className="text-cream" />
              </div>
              <div>
                <p className="text-sm font-bold tracking-wide text-cream">
                  GOAL JOURNAL
                </p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-beige">
                  Personal growth system
                </p>
              </div>
            </div>

            <div className="max-w-xl">
              <p className="section-label">YOUR PROGRESS. YOUR DIRECTION.</p>
              <h1 className="mt-5 text-5xl font-semibold leading-[1.05] tracking-[-0.05em] text-cream xl:text-6xl">
                Turn intentions
                <br />
                into progress.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-beige">
                Organize your goals, reflect through journaling, and understand your personal growth in one focused workspace.
              </p>
            </div>

            <p className="text-xs text-beige/70">
              AI Goal Journal & Accountability Coach
            </p>
          </div>
        </div>

        {/* LOGIN FORM */}
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-burgundy">
                  <Target size={21} className="text-cream" />
                </div>
                <div>
                  <p className="text-sm font-bold text-cream">GOAL JOURNAL</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-beige">
                    Personal growth
                  </p>
                </div>
              </div>
            </div>

            <div className="panel p-7 shadow-card md:p-9">
              <div className="mb-8">
                <p className="section-label">WELCOME BACK</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-cream">
                  Sign in
                </h2>
                <p className="mt-2 text-sm leading-6 text-beige">
                  Continue working toward the things that matter to you.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-cream">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-beige/60"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input-dark py-3 pl-11 pr-4 text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-cream">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-beige/60"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="input-dark py-3 pl-11 pr-12 text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-beige/60 hover:text-cream"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="primary-button w-full"
                >
                  {loading ? "Signing in..." : "Sign in"}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>

              <div className="mt-7 border-t border-border pt-6">
                <p className="text-center text-sm text-beige">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="font-semibold text-cream hover:text-beige underline"
                  >
                    Create one
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}