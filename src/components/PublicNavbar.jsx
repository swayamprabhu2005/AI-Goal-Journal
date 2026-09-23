import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Menu, X, Compass, Layers, Flag } from 'lucide-react';

export default function PublicNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  // Handle scroll detection for glassmorphism header & section tracking
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Track active section for highlight in page order
      const sections = ['how-it-works', 'journey', 'features'];
      const scrollPos = window.scrollY + 120;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll handler for anchor links
  const handleNavClick = (e, sectionId) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (location.pathname !== '/') {
      navigate('/#' + sectionId);
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      const navOffset = 90;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#EEF3EC]/90 backdrop-blur-xl border-b border-[#E2E9DF] shadow-sm py-3.5'
          : 'bg-transparent border-b border-transparent py-5'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 md:px-8">
        {/* BRAND & LOGO */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white border border-[#E2E9DF] shadow-xs p-1 overflow-hidden transition-transform duration-300 group-hover:scale-105 group-hover:border-[#4B5D3C]">
            <img src="/logo.png" alt="AI Journal Logo" className="h-full w-full object-contain rounded-xl" />
            <span className="absolute inset-0 bg-[#4B5D3C]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-[#26261F] font-serif leading-none">
              AI JOURNAL
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#4B5D3C] font-extrabold mt-1">
              Growth Workspace
            </p>
          </div>
        </Link>

        {/* DESKTOP NAVIGATION LINKS (In Page Order: How It Works -> Goal Journey -> Features) */}
        <nav className="hidden md:flex items-center gap-1.5 rounded-full bg-white/70 backdrop-blur-md p-1.5 border border-[#E2E9DF] shadow-xs">
          <a
            href="#how-it-works"
            onClick={(e) => handleNavClick(e, 'how-it-works')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
              activeSection === 'how-it-works'
                ? 'bg-[#4B5D3C] text-white shadow-xs'
                : 'text-[#26261F] hover:text-[#4B5D3C] hover:bg-[#E2E9DF]/50'
            }`}
          >
            <Compass size={14} /> How It Works
          </a>
          <a
            href="#journey"
            onClick={(e) => handleNavClick(e, 'journey')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
              activeSection === 'journey'
                ? 'bg-[#4B5D3C] text-white shadow-xs'
                : 'text-[#26261F] hover:text-[#4B5D3C] hover:bg-[#E2E9DF]/50'
            }`}
          >
            <Flag size={14} /> Goal Journey
          </a>
          <a
            href="#features"
            onClick={(e) => handleNavClick(e, 'features')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
              activeSection === 'features'
                ? 'bg-[#4B5D3C] text-white shadow-xs'
                : 'text-[#26261F] hover:text-[#4B5D3C] hover:bg-[#E2E9DF]/50'
            }`}
          >
            <Layers size={14} /> Features
          </a>
        </nav>

        {/* AUTH ACTION BUTTONS */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-[#26261F] border border-[#E2E9DF] hover:border-[#4B5D3C]/40 hover:bg-[#E2E9DF]/40 active:scale-95 transition-all shadow-xs"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="group relative flex items-center gap-2 rounded-full bg-[#4B5D3C] hover:bg-[#3A492E] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-[#4B5D3C]/20 active:scale-95 transition-all overflow-hidden"
          >
            <span>Start Free</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* MOBILE MENU TOGGLE BUTTON */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E9DF] bg-white text-[#26261F] shadow-xs transition-colors hover:border-[#4B5D3C] md:hidden"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* MOBILE NAV DRAWER */}
      {mobileMenuOpen && (
        <div className="animate-fade-in border-b border-[#E2E9DF] bg-[#EEF3EC] px-6 py-6 shadow-xl md:hidden">
          <nav className="flex flex-col gap-3">
            <a
              href="#how-it-works"
              onClick={(e) => handleNavClick(e, 'how-it-works')}
              className="flex items-center gap-3 rounded-xl bg-white p-3 text-sm font-bold text-[#26261F] border border-[#E2E9DF] hover:border-[#4B5D3C] transition"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E2E9DF]/60 text-[#3A492E]">
                <Compass size={16} />
              </div>
              <span>How Gemini AI Works</span>
            </a>
            <a
              href="#journey"
              onClick={(e) => handleNavClick(e, 'journey')}
              className="flex items-center gap-3 rounded-xl bg-white p-3 text-sm font-bold text-[#26261F] border border-[#E2E9DF] hover:border-[#4B5D3C] transition"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E2E9DF]/60 text-[#3A492E]">
                <Flag size={16} />
              </div>
              <span>Milestone Goal Journey</span>
            </a>
            <a
              href="#features"
              onClick={(e) => handleNavClick(e, 'features')}
              className="flex items-center gap-3 rounded-xl bg-white p-3 text-sm font-bold text-[#26261F] border border-[#E2E9DF] hover:border-[#4B5D3C] transition"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E2E9DF]/60 text-[#3A492E]">
                <Layers size={16} />
              </div>
              <span>Features Overview</span>
            </a>

            <div className="mt-4 pt-4 border-t border-[#E2E9DF] flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/register');
                }}
                className="w-full rounded-xl bg-[#4B5D3C] py-3 text-sm font-bold text-white shadow-md text-center flex items-center justify-center gap-2"
              >
                <span>Create Free Account</span>
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/login');
                }}
                className="w-full rounded-xl bg-white py-3 text-sm font-bold text-[#26261F] border border-[#E2E9DF] text-center"
              >
                Sign In to Workspace
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
