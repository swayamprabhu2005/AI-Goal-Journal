import { useState } from "react";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Target } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!accepted) {
      setError("Please accept the terms before continuing.");
      return;
    }

    setLoading(true);

    try {
      await register(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 border-r border-indigo-700 lg:flex text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.15),transparent_45%)]" />
          <div className="absolute -left-8 top-20 h-52 w-52 rounded-full bg-white/10 blur-3xl animate-orb" />
          <div className="absolute bottom-12 right-6 h-36 w-36 rounded-full bg-emerald-300/15 blur-3xl animate-orb" style={{ animationDelay: "1.6s" }} />

          <div className="relative flex w-full flex-col justify-between p-12 xl:p-16 animate-rise">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                <Target size={21} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">AI JOURNAL</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-indigo-200 font-semibold">
                  Personal growth system
                </p>
              </div>
            </div>

            <div>
              <p className="section-label text-indigo-200">BUILD. REFLECT. IMPROVE.</p>
              <h1 className="mt-5 text-5xl font-bold leading-[1.05] tracking-[-0.05em] text-white xl:text-6xl">
                Your goals deserve
                <br />
                a system.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-indigo-100 font-medium">
                Keep your goals, journal entries, progress, and insights together in one focused workspace.
              </p>
            </div>

            <p className="text-xs text-indigo-200 font-medium">
              AI Goal Journal & Accountability Coach
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md animate-rise">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600">
                  <Target size={21} className="text-white" />
                </div>
                <p className="text-sm font-bold text-slate-900">AI JOURNAL</p>
              </div>
            </div>

            <div className="panel p-7 shadow-lg md:p-9 bg-white border border-slate-200 rounded-2xl">
              <div className="mb-7">
                <p className="section-label">GET STARTED</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  Create account
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 font-medium">
                  Create your personal workspace and start tracking your growth.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-700">
                    Full name
                  </label>
                  <div className="relative">
                    <User
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="input-field py-3 pl-11 pr-4 text-sm bg-white border border-slate-200 rounded-xl text-slate-900"
                      required
                    />
                  </div>
                </div>

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
                      placeholder="Create a password"
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

                <label className="flex items-start gap-3 text-sm leading-6 text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded-md accent-indigo-600 shrink-0 cursor-pointer"
                  />
                  <span>
                    I agree to the terms and understand that my journal activity will be used to generate personalized insights.
                  </span>
                </label>

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
                  {loading ? "Creating account..." : "Create account"}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>

              <div className="mt-7 border-t border-slate-100 pt-6">
                <p className="text-center text-sm text-slate-600 font-medium">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-bold text-indigo-600 hover:text-indigo-700 underline"
                  >
                    Sign in
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