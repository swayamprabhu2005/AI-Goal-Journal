import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Target } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ToastNotification from "../components/ToastNotification";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, loginWithGoogle, loginWithMicrosoft } = useAuth();

  // Determine initial mode based on current URL path
  const isRegisterPath = location.pathname === "/register";
  const [isSignUp, setIsSignUp] = useState(isRegisterPath);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Toast state: { type: 'warning' | 'error' | 'success', message: '' }
  const [toast, setToast] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  // Keep state in sync if path changes externally
  useEffect(() => {
    setIsSignUp(location.pathname === "/register");
  }, [location.pathname]);

  const toggleMode = (targetIsSignUp) => {
    setToast({ type: "", message: "" });
    setIsSignUp(targetIsSignUp);
    window.history.replaceState(null, "", targetIsSignUp ? "/register" : "/login");
  };

  async function handleGoogleSignIn() {
    setToast({ type: "", message: "" });
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        navigate("/dashboard");
      }
    } catch (err) {
      setToast({ type: "error", message: err.message || "Google sign-in failed. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  async function handleMicrosoftSignIn() {
    setToast({ type: "", message: "" });
    setLoading(true);
    try {
      const user = await loginWithMicrosoft();
      if (user) {
        navigate("/dashboard");
      }
    } catch (err) {
      setToast({ type: "error", message: err.message || "Microsoft sign-in failed. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setToast({ type: "", message: "" });

    // Custom Validation to avoid HTML5 default tooltips
    if (!email.trim()) {
      setToast({ type: "warning", message: "Please enter your email address." });
      return;
    }
    if (!password) {
      setToast({ type: "warning", message: "Please enter your password." });
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setToast({ type: "error", message: err.message || "Unable to sign in." });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setToast({ type: "", message: "" });

    // Custom Validation
    if (!name.trim()) {
      setToast({ type: "warning", message: "Please fill out your full name." });
      return;
    }
    if (!email.trim()) {
      setToast({ type: "warning", message: "Please enter a valid email address." });
      return;
    }
    if (!password || password.length < 6) {
      setToast({ type: "warning", message: "Password must be at least 6 characters long." });
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
      navigate("/dashboard");
    } catch (err) {
      setToast({ type: "error", message: err.message || "Unable to create account." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-gradient-to-br from-[#E2E9DF] via-[#EEF3EC] to-[#D6E0D3]">
      {/* Toast Notification Container */}
      <ToastNotification
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ type: "", message: "" })}
      />

      {/* Dynamic Ambient Background Orbs */}
      <div className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#4B5D3C]/15 blur-[120px] pointer-events-none transition-all duration-1000 ${isSignUp ? 'translate-x-20 scale-110 bg-[#C1622C]/15' : 'animate-bg-orb-1'}`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full bg-[#C1622C]/10 blur-[130px] pointer-events-none transition-all duration-1000 ${isSignUp ? '-translate-y-16 scale-90 bg-[#4B5D3C]/20' : 'animate-bg-orb-2'}`} />
      <div className="absolute top-[30%] right-[20%] w-[350px] h-[350px] rounded-full bg-[#95B08A]/20 blur-[100px] pointer-events-none animate-pulse" />

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-[960px] min-h-[580px] bg-white/90 backdrop-blur-xl border border-white/70 rounded-[36px] shadow-[0_30px_70px_-15px_rgba(38,38,31,0.14)] overflow-hidden animate-rise">
        
        {/* ------------------------------------------------------------- */}
        {/* FORM PANEL 1: SIGN IN (Left Half when active) */}
        {/* ------------------------------------------------------------- */}
        <div
          className={`absolute top-0 left-0 h-full w-full md:w-1/2 flex flex-col justify-center px-8 sm:px-12 py-10 transition-all duration-700 ease-[cubic-bezier(0.77,0,0.175,1)] ${
            !isSignUp
              ? "opacity-100 z-10 translate-x-0 scale-100 pointer-events-auto"
              : "opacity-0 z-0 -translate-x-12 scale-95 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-center md:justify-start gap-2.5 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#4B5D3C] shadow-md shadow-[#4B5D3C]/20">
              <Target size={17} className="text-white" />
            </div>
            <span className="text-sm font-extrabold tracking-widest text-[#26261F] uppercase">
              AI JOURNAL
            </span>
          </div>

          <h1 className="text-3xl font-bold text-[#26261F] text-center md:text-left mb-1 font-serif tracking-tight">
            Welcome back
          </h1>
          <p className="text-xs text-center md:text-left text-slate-500 font-medium mb-6">
            Log in to pick up your streak & goal progress
          </p>

          <form onSubmit={handleSignIn} noValidate className="space-y-4 w-full">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-5 py-3.5 text-sm rounded-full border border-slate-200 bg-white/90 focus:border-[#4B5D3C] focus:ring-2 focus:ring-[#4B5D3C]/20 outline-none transition-all placeholder:text-slate-400 text-slate-800 shadow-sm"
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

            {/* Custom Animated Continue Application Button */}
            <div className="pt-2">
              <button className="continue-application" type="submit" disabled={loading}>
                <div>
                  <div className="pencil"></div>
                  <div className="folder">
                    <div className="top">
                      <svg viewBox="0 0 24 27">
                        <path d="M1,0 L23,0 C23.5522847,0 24,0.44771525 24,1 L24,8.17157288 C24,8.70200585 23.7892863,9.21071368 23.4142136,9.58578644 L20.5857864,12.4142136 Q20.2107137,13.2979941 20,13.8284271 L20,26 C20,26.5522847 19.5522847,27 19,27 L1,27 C0.44771525,27 0,26.5522847 0,26 L0,1 C0,0.44771525 0.44771525,0 1,0 Z"></path>
                      </svg>
                    </div>
                    <div className="paper"></div>
                  </div>
                </div>
                {loading ? "Signing in..." : "Log In"}
              </button>
            </div>
          </form>

          {/* Social Row */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400 font-medium mb-3">or log in with</p>
            <div className="flex justify-center items-center gap-3">
              <SocialButton
                icon="google"
                title="Sign in with Google"
                onClick={handleGoogleSignIn}
                disabled={loading}
              />
              <SocialButton
                icon="microsoft"
                title="Sign in with Microsoft"
                onClick={handleMicrosoftSignIn}
                disabled={loading}
              />
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 font-medium mt-6 md:hidden">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => toggleMode(true)}
              className="font-bold text-[#4B5D3C] underline"
            >
              Sign up
            </button>
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* FORM PANEL 2: SIGN UP (Right Half when active) */}
        {/* ------------------------------------------------------------- */}
        <div
          className={`absolute top-0 right-0 h-full w-full md:w-1/2 flex flex-col justify-center px-8 sm:px-12 py-10 transition-all duration-700 ease-[cubic-bezier(0.77,0,0.175,1)] ${
            isSignUp
              ? "opacity-100 z-10 translate-x-0 scale-100 pointer-events-auto"
              : "opacity-0 z-0 translate-x-12 scale-95 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-center md:justify-start gap-2.5 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#4B5D3C] shadow-md shadow-[#4B5D3C]/20">
              <Target size={17} className="text-white" />
            </div>
            <span className="text-sm font-extrabold tracking-widest text-[#26261F] uppercase">
              AI JOURNAL
            </span>
          </div>

          <h1 className="text-3xl font-bold text-[#26261F] text-center md:text-left mb-1 font-serif tracking-tight">
            Create account
          </h1>
          <p className="text-xs text-center md:text-left text-slate-500 font-medium mb-5">
            Start tracking your daily reflections and habit streaks
          </p>

          <form onSubmit={handleSignUp} noValidate className="space-y-3 w-full">
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full px-5 py-3 text-sm rounded-full border border-slate-200 bg-white/90 focus:border-[#4B5D3C] focus:ring-2 focus:ring-[#4B5D3C]/20 outline-none transition-all placeholder:text-slate-400 text-slate-800 shadow-sm"
              />
            </div>

            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-5 py-3 text-sm rounded-full border border-slate-200 bg-white/90 focus:border-[#4B5D3C] focus:ring-2 focus:ring-[#4B5D3C]/20 outline-none transition-all placeholder:text-slate-400 text-slate-800 shadow-sm"
              />
            </div>

            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-5 py-3 pr-12 text-sm rounded-full border border-slate-200 bg-white/90 focus:border-[#4B5D3C] focus:ring-2 focus:ring-[#4B5D3C]/20 outline-none transition-all placeholder:text-slate-400 text-slate-800 shadow-sm"
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

            {/* Custom Animated Continue Application Button */}
            <div className="pt-1">
              <button className="continue-application" type="submit" disabled={loading}>
                <div>
                  <div className="pencil"></div>
                  <div className="folder">
                    <div className="top">
                      <svg viewBox="0 0 24 27">
                        <path d="M1,0 L23,0 C23.5522847,0 24,0.44771525 24,1 L24,8.17157288 C24,8.70200585 23.7892863,9.21071368 23.4142136,9.58578644 L20.5857864,12.4142136 Q20.2107137,13.2979941 20,13.8284271 L20,26 C20,26.5522847 19.5522847,27 19,27 L1,27 C0.44771525,27 0,26.5522847 0,26 L0,1 C0,0.44771525 0.44771525,0 1,0 Z"></path>
                      </svg>
                    </div>
                    <div className="paper"></div>
                  </div>
                </div>
                {loading ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>

          {/* Social Row */}
          <div className="mt-5 text-center">
            <p className="text-xs text-slate-400 font-medium mb-2.5">or register with</p>
            <div className="flex justify-center items-center gap-3">
              <SocialButton
                icon="google"
                title="Register with Google"
                onClick={handleGoogleSignIn}
                disabled={loading}
              />
              <SocialButton
                icon="microsoft"
                title="Register with Microsoft"
                onClick={handleMicrosoftSignIn}
                disabled={loading}
              />
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 font-medium mt-5 md:hidden">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => toggleMode(false)}
              className="font-bold text-[#4B5D3C] underline"
            >
              Log in
            </button>
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* HEAVY ANIMATED SLIDING COVER PANEL (3D Illustration + Dynamic Text) */}
        {/* ------------------------------------------------------------- */}
        <div
          className="hidden md:flex absolute top-0 h-full w-1/2 flex-col justify-between p-10 transition-all duration-700 ease-[cubic-bezier(0.77,0,0.175,1)] z-20 overflow-hidden shadow-2xl"
          style={{
            left: isSignUp ? "0%" : "50%",
          }}
        >
          {/* Background 3D Render Image with smooth zoom & shift */}
          <img
            src="/login_workspace.jpg"
            alt="Workspace Illustration"
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out ${
              isSignUp ? "scale-110 rotate-1" : "scale-100 rotate-0"
            }`}
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#26261F]/60 via-[#4B5D3C]/40 to-[#26261F]/80 backdrop-blur-[2px]" />

          {/* Top text branding in sliding overlay */}
          <div className="relative z-10 text-white">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-semibold tracking-wide">
              <span>🌱</span> AI Coach
            </div>
          </div>

          {/* Center Dynamic Content */}
          <div className="relative z-10 text-white text-center px-4 py-6">
            <h2 className="text-3xl font-bold font-serif mb-3 leading-tight tracking-tight drop-shadow-md">
              {isSignUp ? "Already tracking goals?" : "New to AI Coach?"}
            </h2>
            <p className="text-sm text-slate-100/90 leading-relaxed max-w-xs mx-auto mb-8 font-medium">
              {isSignUp
                ? "Sign in to see your daily progress, habit streaks, and personalized AI coaching notes."
                : "Create an account and let the AI turn your everyday reflections into structured achievement."}
            </p>

            {/* Sliding Toggle Action Button */}
            <button
              onClick={() => toggleMode(!isSignUp)}
              type="button"
              className="group relative inline-flex items-center justify-center px-8 py-3 rounded-full border-2 border-white/80 text-white text-sm font-bold tracking-wider uppercase overflow-hidden hover:border-white transition-all shadow-lg active:scale-95"
            >
              <span className="absolute inset-0 bg-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10 transition-colors duration-300 group-hover:text-[#4B5D3C]">
                {isSignUp ? "Sign In Instead" : "Create Account"}
              </span>
            </button>
          </div>

          {/* Bottom indicator dots */}
          <div className="relative z-10 flex justify-center gap-2">
            <span className={`h-2 rounded-full transition-all duration-500 ${!isSignUp ? 'w-6 bg-white' : 'w-2 bg-white/40'}`} />
            <span className={`h-2 rounded-full transition-all duration-500 ${isSignUp ? 'w-6 bg-white' : 'w-2 bg-white/40'}`} />
          </div>
        </div>

      </div>
    </div>
  );
}

function SocialButton({ icon, onClick, disabled, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-10 h-10 rounded-full border border-slate-200/80 bg-white flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 hover:scale-110 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
    >
      {icon === "google" && (
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
      )}
      {icon === "microsoft" && (
        <svg className="w-4 h-4" viewBox="0 0 23 23">
          <path fill="#f35325" d="M1 1h10v10H1z" />
          <path fill="#81bc06" d="M12 1h10v10H12z" />
          <path fill="#05a6f0" d="M1 12h10v10H1z" />
          <path fill="#ffba08" d="M12 12h10v10H12z" />
        </svg>
      )}
    </button>
  );
}
