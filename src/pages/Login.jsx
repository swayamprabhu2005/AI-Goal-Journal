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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        {/* BRAND SIDE */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 border-r border-indigo-700 lg:flex text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15),transparent_45%)]" />
          <div className="absolute -left-10 top-24 h-56 w-56 rounded-full bg-white/10 blur-3xl animate-orb" />
          <div className="absolute bottom-16 right-8 h-40 w-40 rounded-full bg-violet-300/20 blur-3xl animate-orb" style={{ animationDelay: "1.4s" }} />
          <div className="relative flex w-full flex-col justify-between p-12 xl:p-16 animate-rise">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                <Target size={21} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold tracking-wide text-white">
                  AI JOURNAL
                </p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-indigo-200 font-semibold">
                  Personal growth system
                </p>
              </div>
            </div>

            <div className="max-w-xl">
              <p className="section-label text-indigo-200">YOUR PROGRESS. YOUR DIRECTION.</p>
              <h1 className="mt-5 text-5xl font-bold leading-[1.05] tracking-[-0.05em] text-white xl:text-6xl">
                Turn intentions
                <br />
                into progress.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-indigo-100 font-medium">
                Organize your goals, reflect through journaling, and understand your personal growth in one focused workspace.
              </p>
            </div>

            <p className="text-xs text-indigo-200 font-medium">
              AI Goal Journal & Accountability Coach
            </p>
          </div>
        </div>

        {/* LOGIN FORM */}
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md animate-rise">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600">
                  <Target size={21} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">AI JOURNAL</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold">
                    Personal growth
                  </p>
                </div>
              </div>
            </div>

            <div className="panel p-7 shadow-lg md:p-9 bg-white border border-slate-200 rounded-2xl">
              <div className="mb-8">
                <p className="section-label">WELCOME BACK</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  Sign in
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 font-medium">
                  Continue working toward the things that matter to you.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-700">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input-field py-3 pl-11 pr-4 text-sm bg-white border border-slate-200 rounded-xl text-slate-900"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="input-field py-3 pl-11 pr-12 text-sm bg-white border border-slate-200 rounded-xl text-slate-900"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 font-medium">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="primary-button w-full py-3 text-sm"
                >
                  {loading ? "Signing in..." : "Sign in"}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>

              <div className="mt-7 border-t border-slate-100 pt-6">
                <p className="text-center text-sm text-slate-600 font-medium">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="font-bold text-indigo-600 hover:text-indigo-700 underline"
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