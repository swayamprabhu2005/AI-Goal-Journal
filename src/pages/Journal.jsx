import { useState, useEffect } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import VoiceRecorder from '../components/VoiceRecorder';
import { journalApi } from '../services/api';

export default function Journal() {
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'voice'
  const [entryText, setEntryText] = useState('');
  const [journals, setJournals] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJournal, setSelectedJournal] = useState(null);

  // Fetch journals on mount
  useEffect(() => {
    loadJournals();
  }, []);

  async function loadJournals() {
    try {
      setLoadingList(true);
      const data = await journalApi.listJournals();
      setJournals(data || []);
    } catch (err) {
      console.error('Failed to load journals:', err);
      setError('Could not load journal history.');
    } finally {
      setLoadingList(false);
    }
  }

  async function handleSave(contentToSave, source = 'text') {
    setError('');
    const content = (contentToSave || entryText).trim();

    if (!content) {
      setError('Please provide reflection text before submitting.');
      return;
    }

    setSubmitting(true);
    setLatestAnalysis(null);

    try {
      const result = await journalApi.createJournal({
        content,
        source,
      });

      // Update state
      setJournals((prev) => [result, ...prev]);
      setLatestAnalysis(result.ai_analysis);
      setEntryText('');
    } catch (err) {
      console.error('Save journal error:', err);
      setError(err.message || 'Could not save journal entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this journal entry?')) {
      return;
    }
    try {
      await journalApi.deleteJournal(id);
      setJournals((prev) => prev.filter((j) => j.id !== id));
      if (selectedJournal?.id === id) {
        setSelectedJournal(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete journal entry.');
    }
  }

  const filteredJournals = journals.filter((j) =>
    j.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const wordCount = entryText.trim() ? entryText.trim().split(/\s+/).length : 0;

  return (
    <div className="mx-auto w-full max-w-4xl pb-12">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">Journal Reflection</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Write or speak your daily reflection. AI automatically structures activities, blockers, and goal progress.
          </p>
        </div>

        {/* Input Mode Switcher */}
        <div className="inline-flex rounded-card bg-muted p-1 border border-card-border">
          <button
            onClick={() => setActiveTab('text')}
            className={`rounded-card px-4 py-1.5 text-xs font-semibold transition ${
              activeTab === 'text'
                ? 'bg-primary-grad text-white shadow-glow-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            ✍️ Text Journal
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`rounded-card px-4 py-1.5 text-xs font-semibold transition ${
              activeTab === 'voice'
                ? 'bg-primary-grad text-white shadow-glow-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🎙️ Voice Journal
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-card bg-status-error-bg p-4 text-xs text-status-error border border-status-error/30">
          <strong>Notice: </strong> {error}
        </div>
      )}

      {/* Voice Journal Tab */}
      {activeTab === 'voice' && (
        <div className="mb-8">
          <VoiceRecorder
            onTranscriptReady={(text) => {
              setEntryText((prev) => (prev ? prev + ' ' + text : text));
              setActiveTab('text');
            }}
            onDirectSubmit={(text, source) => handleSave(text, source)}
            isSubmitting={submitting}
          />
        </div>
      )}

      {/* Text Journal Tab */}
      {activeTab === 'text' && (
        <Card className="mb-8 border-card-border bg-card-grad p-6 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground font-display">New Journal Reflection</h2>
            <span className="text-xs text-muted-foreground font-mono">
              {wordCount} words | {entryText.length} chars
            </span>
          </div>

          <textarea
            value={entryText}
            onChange={(e) => setEntryText(e.target.value)}
            placeholder="What did you work on today? What was completed? What blockers or distractions slowed you down? What are your plans for tomorrow?"
            rows={7}
            disabled={submitting}
            className="w-full resize-none rounded-card border border-card-border bg-muted p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 leading-relaxed"
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-card-border/60">
            <p className="text-xs text-muted-foreground">
              💡 <em>Tip: Mention completed tasks explicitly vs. future intentions.</em>
            </p>

            <Button
              onClick={() => handleSave(entryText, 'text')}
              loading={submitting}
              disabled={submitting || !entryText.trim()}
              className="px-6 py-2.5"
            >
              {submitting ? 'Analyzing with Gemini...' : 'Save & Analyze with AI'}
            </Button>
          </div>
        </Card>
      )}

      {/* Latest AI Analysis Card */}
      {latestAnalysis && (
        <Card className="mb-8 border-primary/40 bg-secondary/80 p-6 shadow-soft animate-fade-in">
          <div className="flex items-center justify-between mb-4 border-b border-card-border pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl text-accent">✨</span>
              <h3 className="font-bold text-foreground font-display">AI Semantic Analysis (Gemini Flash-Lite)</h3>
            </div>
            {latestAnalysis.mood && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-3 py-1 text-xs font-bold text-accent border border-accent/40 capitalize">
                Mood: {latestAnalysis.mood} ({Math.round((latestAnalysis.mood_confidence || 0.8) * 100)}%)
              </span>
            )}
          </div>

          {latestAnalysis.quick_summary && (
            <p className="text-xs sm:text-sm italic text-foreground/90 mb-4 bg-muted/80 p-3.5 rounded-card border border-card-border leading-relaxed">
              "{latestAnalysis.quick_summary}"
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* Extracted Activities */}
            <div className="rounded-card bg-card p-4 border border-card-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-secondary-foreground mb-2.5 flex items-center gap-1.5">
                <span>📋</span> Extracted Activities ({latestAnalysis.activities?.length || 0})
              </h4>
              {latestAnalysis.activities?.length ? (
                <ul className="flex flex-col gap-2">
                  {latestAnalysis.activities.map((act, i) => (
                    <li key={i} className="text-xs flex items-start justify-between gap-2 border-b border-card-border/40 pb-1.5">
                      <span className="text-foreground">{act.text}</span>
                      <span
                        className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          act.status === 'completed'
                            ? 'bg-status-success-bg text-status-success border border-status-success/30'
                            : act.status === 'ongoing'
                            ? 'bg-accent/15 text-accent border border-accent/30'
                            : 'bg-secondary text-secondary-foreground border border-card-border'
                        }`}
                      >
                        {act.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No specific activities extracted.</p>
              )}
            </div>

            {/* Blockers & Obstacles */}
            <div className="rounded-card bg-card p-4 border border-card-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-secondary-foreground mb-2.5 flex items-center gap-1.5">
                <span>🚧</span> Identified Blockers ({latestAnalysis.blockers?.length || 0})
              </h4>
              {latestAnalysis.blockers?.length ? (
                <ul className="flex flex-col gap-2">
                  {latestAnalysis.blockers.map((blk, i) => (
                    <li key={i} className="text-xs flex items-start justify-between gap-2 border-b border-card-border/40 pb-1.5">
                      <span className="text-status-error font-medium">{blk.text}</span>
                      <span className="shrink-0 rounded bg-status-error-bg px-2 py-0.5 text-[10px] font-bold text-status-error border border-status-error/30 capitalize">
                        {blk.category || 'other'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Zero blockers identified. Smooth day!</p>
              )}
            </div>
          </div>

          {/* Coaching Insight */}
          {latestAnalysis.insights?.length > 0 && (
            <div className="mt-4 pt-3 border-t border-card-border text-xs text-secondary-foreground flex items-center gap-2">
              <span className="text-accent">💡</span>
              <span>
                <strong className="text-foreground">Coach Note:</strong> {latestAnalysis.insights.join(' ')}
              </span>
            </div>
          )}
        </Card>
      )}

      {/* Journal History Section */}
      <section>
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl font-bold text-foreground font-display flex items-center gap-2">
            <span>📖</span> Journal History ({filteredJournals.length})
          </h2>

          <input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-card border border-card-border bg-muted px-3.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary w-full sm:w-60"
          />
        </div>

        {loadingList ? (
          <div className="flex flex-col items-center justify-center p-12 bg-card rounded-card border border-card-border">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-secondary-foreground/30 border-t-accent mb-3" />
            <p className="text-xs text-muted-foreground font-mono">Loading journal history...</p>
          </div>
        ) : filteredJournals.length === 0 ? (
          <Card className="text-center py-10 bg-card">
            <p className="text-sm font-semibold text-foreground">
              {searchQuery ? 'No journal entries match your search.' : 'No journal entries logged yet.'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {searchQuery ? 'Try another search term.' : 'Write or record your first daily reflection above.'}
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredJournals.map((entry) => {
              const analysis = entry.ai_analysis || {};
              const mood = analysis.mood;
              const activities = analysis.activities || [];
              const blockers = analysis.blockers || [];

              return (
                <Card key={entry.id} className="transition-all hover:border-primary/40 bg-card p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-secondary-foreground border border-card-border">
                        {entry.source === 'voice' ? '🎙️ Voice' : '✍️ Text'}
                      </span>
                      {mood && (
                        <span className="rounded bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent border border-accent/30 capitalize">
                          Mood: {mood}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-xs text-muted-foreground hover:text-status-error transition p-1"
                      title="Delete entry"
                    >
                      🗑️
                    </button>
                  </div>

                  <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-foreground/90 my-2">
                    {entry.content}
                  </p>

                  {/* Summary badges */}
                  {(activities.length > 0 || blockers.length > 0) && (
                    <div className="mt-3 pt-3 border-t border-card-border flex flex-wrap items-center gap-2">
                      {activities.map((a, i) => (
                        <span
                          key={i}
                          className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                            a.status === 'completed'
                              ? 'bg-status-success-bg text-status-success border border-status-success/30'
                              : a.status === 'ongoing'
                              ? 'bg-accent/15 text-accent border border-accent/30'
                              : 'bg-muted text-secondary-foreground border border-card-border'
                          }`}
                        >
                          {a.status === 'completed' ? '✓' : a.status === 'ongoing' ? '⏳' : '📅'} {a.text}
                          {a.related_goal_title ? ` (${a.related_goal_title})` : ''}
                        </span>
                      ))}

                      {blockers.map((b, i) => (
                        <span
                          key={i}
                          className="rounded px-2 py-0.5 text-[10px] font-medium bg-status-error-bg text-status-error border border-status-error/30"
                        >
                          ⚠️ Blocker: {b.text}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}