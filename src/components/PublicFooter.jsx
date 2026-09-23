import { Link } from 'react-router-dom';

export default function PublicFooter() {
  return (
    <footer id="privacy" className="border-t border-[#E2E9DF] bg-[#F4F1E8] py-12 px-6">
      <div className="mx-auto max-w-[1100px]">
        <div className="grid gap-8 md:grid-cols-3 pb-8 border-b border-[#E2E9DF]">
          {/* Brand Col */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-[#E2E9DF] shadow-xs p-1 overflow-hidden">
                <img src="/logo.png" alt="AI Journal Logo" className="h-full w-full object-contain rounded-lg" />
              </div>
              <div>
                <p className="text-sm font-bold tracking-tight text-[#26261F] font-serif">
                  AI JOURNAL
                </p>
                <p className="text-[9px] uppercase tracking-[0.18em] text-[#4B5D3C] font-extrabold">
                  Growth Workspace
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-600 max-w-md leading-relaxed font-medium">
              An intelligent personal reflection and goal-tracking platform. Turns conversational text and voice reflections into structured momentum, actionable blockers, and intelligent AI coaching.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#26261F] mb-3">Product</h4>
            <ul className="flex flex-col gap-2 text-xs text-slate-600 font-medium">
              <li><a href="#features" className="hover:text-[#4B5D3C] transition">Voice Reflection</a></li>
              <li><a href="#journey" className="hover:text-[#4B5D3C] transition">Gemini AI Structuring</a></li>
              <li><a href="#features" className="hover:text-[#4B5D3C] transition">10-Class Mood Analyzer</a></li>
              <li><a href="#features" className="hover:text-[#4B5D3C] transition">AI Coach</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 font-medium">
          <p>© {new Date().getFullYear()} AI Journal. All rights reserved.</p>
          <p className="italic text-[#4B5D3C] font-semibold">Powered by Google Gemini & faster-whisper.</p>
        </div>
      </div>
    </footer>
  );
}
