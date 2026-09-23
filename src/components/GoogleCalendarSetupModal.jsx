import { useState } from "react";
import { X, Check, Copy, ExternalLink, ShieldCheck, KeyRound } from "lucide-react";

export default function GoogleCalendarSetupModal({ isOpen, onClose }) {
  const [copiedKey, setCopiedKey] = useState("");

  if (!isOpen) return null;

  const redirectUri = "http://127.0.0.1:8000/api/v1/calendar/callback";

  function copyToClipboard(text, keyName) {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(""), 2500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 my-8 text-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E2E9DF]/60 text-[#3A492E] border border-[#E2E9DF]">
              <KeyRound size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                How to Set Up Google Calendar for Free
              </h2>
              <p className="text-xs font-medium text-slate-500">
                100% Free · No credit card or billing required · 5 minutes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Notice */}
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs font-medium text-emerald-900 flex items-start gap-3">
          <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Your Privacy is Protected:</strong> The app only requests permission to add events to your Google Calendar. Your journal reflections and personal entries remain locally encrypted with AES-256-GCM and are <em>never</em> shared with Google.
          </div>
        </div>

        {/* Steps */}
        <div className="mt-6 space-y-6 text-xs leading-relaxed text-slate-700">
          {/* Step 1 */}
          <div className="flex gap-3.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4B5D3C] text-white font-bold text-xs">
              1
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-slate-900">
                Go to Google Cloud Console (Free)
              </h4>
              <p className="mt-1">
                Open the Google Cloud Console with your Google account. You do NOT need to set up a billing account or credit card.
              </p>
              <a
                href="https://console.cloud.google.com/apis/dashboard"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 font-bold text-[#4B5D3C] hover:underline"
              >
                <span>Open Google Cloud Console APIs</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4B5D3C] text-white font-bold text-xs">
              2
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-slate-900">
                Enable Google Calendar API
              </h4>
              <p className="mt-1">
                Create a project (e.g. <em>"AI Goal Journal"</em>), search for <strong>Google Calendar API</strong> in the API Library, and click <strong>Enable</strong>.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4B5D3C] text-white font-bold text-xs">
              3
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-slate-900">
                Configure OAuth Consent Screen
              </h4>
              <p className="mt-1">
                Under <strong>APIs & Services &gt; OAuth consent screen</strong> (or Google Auth Platform):
              </p>
              <ul className="mt-1.5 list-disc list-inside space-y-1 text-slate-600">
                <li>Choose <strong>External</strong> user type and click Create.</li>
                <li>App name: <em>AI Goal Journal</em> (add your email as developer contact).</li>
                <li>Under <strong>Scopes</strong>, select: <code className="bg-slate-100 px-1 py-0.5 rounded text-[#4B5D3C] font-mono">.../auth/calendar.events</code></li>
                <li>Under <strong>Test users</strong> (or Audience), add your own Google email address.</li>
              </ul>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-3.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4B5D3C] text-white font-bold text-xs">
              4
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-slate-900">
                Create OAuth 2.0 Client ID Credentials
              </h4>
              <p className="mt-1">
                Go to <strong>Clients</strong> (or Credentials) &gt; <strong>Create Client</strong>.
              </p>
              <p className="mt-1">Application type: <strong>Web application</strong>.</p>
              <div className="mt-2">
                <span className="font-semibold text-slate-800">
                  Authorized redirect URIs:
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    readOnly
                    value={redirectUri}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-[11px] text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(redirectUri, "uri")}
                    className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 font-bold hover:bg-slate-200 transition"
                  >
                    {copiedKey === "uri" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    <span>{copiedKey === "uri" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex gap-3.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4B5D3C] text-white font-bold text-xs">
              5
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-slate-900">
                Add Credentials to your <code className="bg-slate-100 px-1 py-0.5 rounded text-[#4B5D3C] font-mono">.env</code> File
              </h4>
              <p className="mt-1">
                Paste your <strong>Client ID</strong> and <strong>Client Secret</strong> into your project's root <code className="font-mono font-bold">.env</code>:
              </p>
              <div className="mt-2 rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-emerald-400 border border-slate-800">
                GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com<br />
                GOOGLE_CLIENT_SECRET=your_client_secret_here
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                After saving <code className="font-mono">.env</code>, refresh the page and click <strong>Connect with Google</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-7 flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#4B5D3C] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#3A492E] transition"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
