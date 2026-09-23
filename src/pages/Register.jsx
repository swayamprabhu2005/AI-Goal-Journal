import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Target } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
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
      await register(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6 overflow-hidden bg-gradient-to-br from-[#E2E9DF] via-[#EEF3EC] to-[#D6E0D3]">
      {/* Dynamic Ambient Glowing Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#4B5D3C]/15 blur-[120px] pointer-events-none animate-bg-orb-1" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full bg-[#C1622C]/10 blur-[130px] pointer-events-none animate-bg-orb-2" />
      <div className="absolute top-[30%] right-[20%] w-[350px] h-[350px] rounded-full bg-[#95B08A]/20 blur-[100px] pointer-events-none animate-pulse" />

      {/* Main Glass Card Container with Entrance Animation */}
      <div className="relative z-10 w-full max-w-[980px] min-h-[560px] bg-white/90 backdrop-blur-xl border border-white/60 rounded-[36px] shadow-[0_25px_60px_-15px_rgba(38,38,31,0.12)] overflow-hidden grid grid-cols-1 md:grid-cols-2 animate-rise">
        
        {/* Left Side - Cozy 3D Illustration with Subtle Hover Zoom */}
        <div className="relative hidden md:block bg-[#8B9D83] overflow-hidden group">
          <img
            src="/login_workspace.jpg"
            alt="Workspace Illustration"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60" />
        </div>

        {/* Right Side - Form */}
        <div className="flex flex-col justify-center px-8 sm:px-14 py-10 bg-white/80">
          {/* Header / Brand */}
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#4B5D3C] shadow-md shadow-[#4B5D3C]/20">
              <Target size={17} className="text-white" />
            </div>
            <span className="text-sm font-extrabold tracking-widest text-[#26261F] uppercase">
              AI JOURNAL
            </span>
          </div>

          <h1 className="text-3xl font-bold text-[#26261F] text-center mb-2 font-serif tracking-tight">
            Create account
          </h1>
          <p className="text-xs text-center text-slate-500 font-medium mb-6">
            Start tracking your daily goals and habit streaks
          </p>

          <form onSubmit={handleSubmit} className="space-y-3.5 max-w-sm mx-auto w-full">
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full px-5 py-3.5 text-sm rounded-full border border-slate-200 bg-white/90 focus:border-[#4B5D3C] focus:ring-2 focus:ring-[#4B5D3C]/20 outline-none transition-all placeholder:text-slate-400 text-slate-800 shadow-sm"
                required
              />
            </div>

            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-5 py-3.5 text-sm rounded-full border border-slate-200 bg-white/90 focus:border-[#4B5D3C] focus:ring-2 focus:ring-[#4B5D3C]/20 outline-none transition-all placeholder:text-slate-400 text-slate-800 shadow-sm"
                required
              />
            </div>

            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-5 py-3.5 pr-12 text-sm rounded-full border border-slate-200 bg-white/90 focus:border-[#4B5D3C] focus:ring-2 focus:ring-[#4B5D3C]/20 outline-none transition-all placeholder:text-slate-400 text-slate-800 shadow-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-2.5 text-xs text-red-600 text-center font-medium animate-shake">
                {error}
              </div>
            )}

            {/* Custom Animated .cta Submit Button */}
            <div className="pt-2">
              <button className="cta" type="submit" disabled={loading}>
                <span>{loading ? "Creating..." : "Sign Up"}</span>
                <svg width="15px" height="10px" viewBox="0 0 13 10">
                  <path d="M1,5 L11,5"></path>
                  <polyline points="8 1 12 5 8 9"></polyline>
                </svg>
              </button>
            </div>
          </form>

          {/* Social login divider */}
          <div className="mt-6 text-center max-w-sm mx-auto w-full">
            <p className="text-xs text-slate-400 font-medium mb-3">or sign up with</p>
            <div className="flex justify-center items-center gap-3">
              {/* Google */}
              <button className="w-10 h-10 rounded-full border border-slate-200/80 bg-white flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 hover:scale-105 active:scale-95 transition-all shadow-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.1 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                  />
                </svg>
              </button>
              {/* Github */}
              <button className="w-10 h-10 rounded-full border border-slate-200/80 bg-white flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 hover:scale-105 active:scale-95 transition-all shadow-sm">
                <svg className="w-4 h-4 fill-slate-800" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </button>
              {/* Facebook */}
              <button className="w-10 h-10 rounded-full border border-slate-200/80 bg-white flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 hover:scale-105 active:scale-95 transition-all shadow-sm">
                <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Footer link */}
          <p className="text-center text-xs text-slate-500 font-medium mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-[#4B5D3C] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}