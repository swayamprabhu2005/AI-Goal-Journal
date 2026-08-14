import { useNavigate } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import Button from '../components/Button';
import Card from '../components/Card';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-white">
      {/* Public Header */}
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-20 md:pt-24 md:pb-32 px-4 sm:px-6">
        {/* Subtle background glow effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[200px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative mx-auto max-w-5xl text-center">
          {/* Tagline Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-secondary/70 px-4 py-1.5 text-xs font-semibold text-secondary-foreground shadow-soft backdrop-blur-md mb-6">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span>AI Goal Journal & Accountability Coach</span>
          </div>

          {/* Main Headline in Fraunces */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.12] max-w-4xl mx-auto">
            Turn daily reflections into structured momentum.
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed font-normal">
            Speak or write naturally about your day. Google Gemini and local Whisper AI extract completed activities, identify blockers, track goals, and deliver weekly accountability coaching.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-7 py-3.5 text-base shadow-glow-primary"
            >
              Start Journaling Free →
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-7 py-3.5 text-base"
            >
              Sign In to Workspace
            </Button>
          </div>

          <p className="mt-3.5 text-xs text-muted-foreground">
            No credit card required • Local CPU Whisper speech-to-text • Zero cloud audio fees
          </p>

          {/* Visual Interactive Preview of the AI Pipeline */}
          <div className="mt-14 mx-auto max-w-4xl rounded-2xl border border-card-border bg-card/90 p-4 sm:p-6 shadow-soft text-left backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-card-border pb-3.5 mb-5">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-status-error/80" />
                <span className="h-3 w-3 rounded-full bg-status-warning/80" />
                <span className="h-3 w-3 rounded-full bg-status-success/80" />
                <span className="ml-2 text-xs font-semibold text-secondary-foreground">Interactive AI Extraction Pipeline Preview</span>
              </div>
              <span className="rounded bg-accent/15 px-2.5 py-0.5 text-[11px] font-bold text-accent border border-accent/30">
                Live Engine • Gemini Flash-Lite
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Raw Journal Input Box */}
              <div className="flex flex-col justify-between rounded-card bg-muted p-4 border border-card-border">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                    <span className="flex items-center gap-1.5 text-secondary-foreground">
                      <span>✍️</span> Daily Reflection (Voice or Text)
                    </span>
                    <span className="text-[10px] bg-secondary px-2 py-0.5 rounded border border-card-border text-secondary-foreground">Raw Input</span>
                  </div>
                  <p className="text-xs text-foreground/90 italic leading-relaxed bg-background/60 p-3.5 rounded-card border border-card-border/60">
                    "Finished implementing the backend routing and in-memory repositories today. Currently writing the automated unit test suite. Was delayed for 20 minutes by CORS headers. Tomorrow I will connect the voice recorder."
                  </p>
                </div>
                <div className="mt-3.5 pt-2.5 border-t border-card-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>🎙️ Transcribed locally via faster-whisper Tiny</span>
                  <span className="font-mono">42 words</span>
                </div>
              </div>

              {/* Structured AI Analysis Box */}
              <div className="flex flex-col justify-between rounded-card bg-secondary/80 p-4 border border-primary/40 shadow-soft">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-secondary-foreground mb-2.5">
                    <span className="flex items-center gap-1.5 text-foreground">
                      <span className="text-accent">✨</span> Structured AI Breakdown
                    </span>
                    <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] text-accent font-bold border border-accent/40">
                      Mood: Motivated (95%)
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="rounded bg-muted/90 p-2.5 border border-card-border text-[11px] flex items-center gap-2">
                      <span className="font-bold text-status-success uppercase text-[9px] bg-status-success-bg px-1.5 py-0.5 rounded border border-status-success/30 shrink-0">
                        Completed
                      </span>
                      <span className="text-foreground">FastAPI routes & in-memory repositories</span>
                    </div>

                    <div className="rounded bg-muted/90 p-2.5 border border-card-border text-[11px] flex items-center gap-2">
                      <span className="font-bold text-accent uppercase text-[9px] bg-accent/15 px-1.5 py-0.5 rounded border border-accent/30 shrink-0">
                        Ongoing
                      </span>
                      <span className="text-foreground">Writing automated unit test suite</span>
                    </div>

                    <div className="rounded bg-muted/90 p-2.5 border border-card-border text-[11px] flex items-center gap-2">
                      <span className="font-bold text-status-error uppercase text-[9px] bg-status-error-bg px-1.5 py-0.5 rounded border border-status-error/30 shrink-0">
                        Blocker
                      </span>
                      <span className="text-status-error font-medium">CORS headers configuration (20m)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-card-border text-[11px] text-secondary-foreground">
                  <strong className="text-accent">Coach Insight:</strong> Great momentum. Timebox configuration spikes to 30m to maintain creative energy.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars Section */}
      <section id="features" className="py-20 px-4 sm:px-6 bg-secondary/40 border-y border-card-border relative">
        <div className="mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-accent">Core Capabilities</span>
            <h2 className="mt-1.5 font-display text-3xl sm:text-4xl font-bold text-foreground">
              Designed to eliminate manual productivity friction.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Traditional goal apps require manual status logging and rigid checkboxes. Goal Journal lets you speak naturally and uses AI to organize the rest.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Pillar 1 */}
            <Card className="bg-card-grad p-6 border-card-border hover:border-primary/50 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-2xl text-accent border border-card-border mb-4">
                🎙️
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">
                Voice Reflection (faster-whisper Tiny)
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Speak your stream of consciousness after work or study. Transcribed locally on CPU using INT8 quantization with zero cloud audio fees and full reviewable transcript editing.
              </p>
            </Card>

            {/* Pillar 2 */}
            <Card className="bg-card-grad p-6 border-card-border hover:border-primary/50 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-2xl text-accent border border-card-border mb-4">
                🧠
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">
                Gemini Semantic Extraction
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Google Gemini Flash-Lite extracts what you completed today versus what you plan for tomorrow, categorizing blockers (technical, time, distraction) and tracking mood confidence.
              </p>
            </Card>

            {/* Pillar 3 */}
            <Card className="bg-card-grad p-6 border-card-border hover:border-primary/50 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-2xl text-accent border border-card-border mb-4">
                🎯
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">
                Deterministic Goal Progress
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Define milestones with target dates. The system automatically links daily journal activities to your active goals using deterministic matching without cluttering your board with duplicate tags.
              </p>
            </Card>

            {/* Pillar 4 */}
            <Card className="bg-card-grad p-6 border-card-border hover:border-primary/50 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-2xl text-accent border border-card-border mb-4">
                🛡️
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">
                Weekly AI Accountability Coach
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                On-demand weekly reviews that synthesize your week's accomplishments, surface recurring blocker patterns, and provide personalized coaching guidance to unlock your next level.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary-foreground">Workflow</span>
            <h2 className="mt-1 font-display text-3xl font-bold text-foreground">
              Simple 3-step daily routine
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
              Spend less than 2 minutes at the end of each day.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-card bg-card p-6 border border-card-border shadow-soft">
              <span className="text-2xl font-bold text-accent font-display">01</span>
              <h4 className="mt-2 font-bold text-foreground text-base">Speak or Write</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Record a 60-second voice reflection or type out what happened during your day.
              </p>
            </div>

            <div className="rounded-card bg-card p-6 border border-card-border shadow-soft">
              <span className="text-2xl font-bold text-primary-light font-display">02</span>
              <h4 className="mt-2 font-bold text-foreground text-base">AI Structures Your Day</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Gemini identifies completed tasks, ongoing milestones, blockers, and goal alignments.
              </p>
            </div>

            <div className="rounded-card bg-card p-6 border border-card-border shadow-soft">
              <span className="text-2xl font-bold text-accent font-display">03</span>
              <h4 className="mt-2 font-bold text-foreground text-base">Coach & Accelerate</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Review your weekly accountability report and conquer recurring obstacles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Hardware Architecture Section */}
      <section id="privacy" className="py-14 px-4 sm:px-6 bg-secondary/30 border-t border-card-border">
        <div className="mx-auto max-w-4xl rounded-2xl bg-card p-8 border border-card-border shadow-soft">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-secondary text-3xl text-accent border border-card-border">
              🔒
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-accent">Privacy & Hardware Philosophy</span>
              <h3 className="font-display text-2xl font-bold text-foreground mt-0.5">
                Engineered for lightweight privacy
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Speech transcription runs locally via `faster-whisper` Tiny on CPU with INT8 quantization (~320 MB RAM footprint). Temporary audio is immediately deleted after transcription, keeping your private voice logs strictly under your control.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-3xl bg-primary-grad p-8 sm:p-12 text-center text-white shadow-glow-primary border border-primary-light/40">
          <h2 className="font-display text-3xl sm:text-4xl font-bold">
            Ready to turn reflection into real progress?
          </h2>
          <p className="mt-3 text-sm text-white/80 max-w-xl mx-auto leading-relaxed">
            Create your account in seconds and experience effortless AI goal journaling.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-7 py-3.5 text-sm font-bold text-foreground bg-secondary hover:bg-secondary-hover border-white/20"
            >
              Get Started Free →
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-7 py-3.5 text-sm font-semibold text-white/90 hover:bg-white/10"
            >
              Already have an account? Sign in
            </Button>
          </div>
        </div>
      </section>

      {/* Public Footer */}
      <PublicFooter />
    </div>
  );
}
