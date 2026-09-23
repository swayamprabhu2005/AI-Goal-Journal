import { CheckCircle2, Circle, Clock3, Sparkles, Loader2, AlertCircle, RotateCcw } from 'lucide-react';

/**
 * AI Roadmap UI (Panshobh).
 *
 * Pure presentational component. Data/state is owned by the parent
 * (pages/Roadmap.jsx) so it can later be wired directly to the backend API.
 */

function RoadmapSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading roadmap">
      {/* Goal header skeleton */}
      <div className="panel p-6 shadow-sm space-y-3">
        <div className="h-7 w-2/3 skeleton-box rounded-lg" />
        <div className="h-4 w-1/2 skeleton-box rounded-lg" />
      </div>

      {/* Progress skeleton */}
      <div className="panel p-6 shadow-sm space-y-3">
        <div className="h-4 w-40 skeleton-box rounded-lg" />
        <div className="h-2.5 w-full skeleton-box rounded-full" />
        <div className="h-3.5 w-32 skeleton-box rounded-lg" />
      </div>

      {/* Milestone skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="panel p-5 shadow-sm flex items-start gap-4">
          <div className="h-10 w-10 shrink-0 rounded-xl skeleton-box" />
          <div className="flex-1 space-y-2.5">
            <div className="h-5 w-2/3 skeleton-box rounded-lg" />
            <div className="h-3.5 w-full skeleton-box rounded-lg" />
            <div className="h-3.5 w-1/3 skeleton-box rounded-lg" />
          </div>
          <div className="h-5 w-20 shrink-0 skeleton-box rounded-full" />
        </div>
      ))}
    </div>
  );
}

function RoadmapProgress({ completedTaskCount, totalTaskCount, isMock }) {
  const percent =
    totalTaskCount > 0 ? Math.round((completedTaskCount / totalTaskCount) * 100) : 0;

  return (
    <section className="panel p-5 sm:p-6 shadow-sm" aria-label="Roadmap progress">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h3 className="section-label text-[#4B5D3C]">Roadmap Progress</h3>
        <span className="text-lg font-bold text-[#26261F] tabular-nums">{percent}%</span>
      </div>

      <div
        className="h-2.5 w-full rounded-full bg-[#E2E9DF] overflow-hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#8FA87A] to-[#4B5D3C] transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Progress is always derived from the actual task data:
          completed tasks / total tasks × 100. */}
      <p className="mt-2.5 text-xs font-semibold text-slate-600 tabular-nums">
        {completedTaskCount} of {totalTaskCount} tasks completed
      </p>

      {isMock && (
        <p className="mt-1 text-[11px] font-medium text-slate-400">
          Development preview — mock roadmap data; completion state is not saved.
        </p>
      )}
    </section>
  );
}

function RoadmapTaskCheckbox({ task, isCompleted, isUpdating, error, onToggle }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="relative mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={isCompleted}
          disabled={isUpdating}
          onChange={() => onToggle(task.id, !isCompleted)}
          className={`h-5 w-5 rounded-md border-slate-300 accent-[#4B5D3C] cursor-pointer focus:ring-2 focus:ring-[#4B5D3C]/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
            isUpdating ? 'opacity-0' : ''
          }`}
          aria-label={`Mark "${task.title}" as ${isCompleted ? 'pending' : 'completed'}`}
        />
        {/* Completion request in progress */}
        {isUpdating && (
          <Loader2
            size={18}
            aria-hidden="true"
            className="absolute inset-0 m-auto animate-spin text-[#4B5D3C]"
          />
        )}
      </span>
      <span className="min-w-0">
        <span
          className={`block text-[13px] sm:text-sm font-semibold leading-snug transition-colors duration-300 ${
            isCompleted ? 'text-slate-500 line-through' : 'text-[#26261F]'
          }`}
        >
          {task.title}
        </span>
        {error && (
          <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-600" role="alert">
            <AlertCircle size={12} />
            {error}
          </span>
        )}
      </span>
    </li>
  );
}

function RoadmapMilestone({
  milestone,
  completedTaskIds,
  updatingTaskIds,
  taskErrors,
  onToggleTask,
}) {
  const tasks = milestone.tasks || [];
  const completedTaskCount = tasks.filter((t) => completedTaskIds.has(t.id)).length;
  // A milestone is completed when every one of its tasks is completed
  // (derived from actual task data — never tracked separately).
  const isCompleted = tasks.length > 0 && completedTaskCount === tasks.length;

  return (
    <li className="relative flex items-start gap-4 sm:gap-5 pb-6 last:pb-0">
      {/* Timeline connector */}
      <span
        aria-hidden="true"
        className="absolute left-[19px] top-11 bottom-0 w-px bg-[#E2E9DF]"
      />

      {/* Step number / timeline node */}
      <span
        aria-hidden="true"
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold border transition-colors duration-300 ${
          isCompleted
            ? 'bg-[#4B5D3C] border-[#4B5D3C] text-white'
            : 'bg-white border-[#E2E9DF] text-[#4B5D3C]'
        }`}
      >
        {String(milestone.step_number).padStart(2, '0')}
      </span>

      {/* Milestone card */}
      <div
        className={`flex-1 min-w-0 rounded-2xl border p-4 sm:p-5 transition-colors duration-300 ${
          isCompleted
            ? 'bg-[#F6F9F2] border-[#E2E9DF]'
            : 'bg-white border-slate-200 hover:border-[#4B5D3C]/40'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span
              className={`block text-sm sm:text-[15px] font-bold transition-colors duration-300 ${
                isCompleted ? 'text-slate-500 line-through' : 'text-[#26261F]'
              }`}
            >
              {milestone.title}
            </span>
            {milestone.short_description && (
              <span className="mt-1 block text-xs sm:text-[13px] text-slate-600 leading-relaxed break-words">
                {milestone.short_description}
              </span>
            )}
            {milestone.estimated_duration && (
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                <Clock3 size={12} />
                Estimated duration: {milestone.estimated_duration}
              </span>
            )}
          </div>

          <span
            className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
              isCompleted
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {isCompleted ? <CheckCircle2 size={11} /> : <Circle size={11} />}
            {isCompleted ? 'Completed' : 'Pending'}
          </span>
        </div>

        {/* Action items / tasks under this milestone */}
        {tasks.length > 0 && (
          <ul className="mt-3 space-y-2.5 border-t border-slate-100 pt-3" aria-label={`Tasks for ${milestone.title}`}>
            {tasks.map((task) => (
              <RoadmapTaskCheckbox
                key={task.id}
                task={task}
                isCompleted={completedTaskIds.has(task.id)}
                isUpdating={updatingTaskIds.has(task.id)}
                error={taskErrors[task.id]}
                onToggle={onToggleTask}
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

export default function Roadmap({
  goalTitle,
  goalDescription,
  roadmap,
  status, // 'loading' | 'ready' | 'empty' | 'error'
  isMock = false,
  completedTaskIds = new Set(),
  updatingTaskIds = new Set(),
  taskErrors = {},
  onToggleTask,
  onRetry,
  /* Swayam integration slot — pass a React node (e.g. celebration /
     positive-reinforcement component); it renders inside the reserved
     "AI Encouragement" area below. */
  celebrationSlot = null,
}) {
  if (status === 'loading') {
    return <RoadmapSkeleton />;
  }

  if (status === 'error') {
    return (
      <section className="panel px-6 py-16 text-center shadow-sm">
        <Loader2 size={36} className="mx-auto text-red-300 mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Unable to load roadmap</h3>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto font-medium">
          Something went wrong while generating your roadmap. Please try again later.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#4B5D3C] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#3A492E] transition"
          >
            <RotateCcw size={12} />
            Try again
          </button>
        )}
      </section>
    );
  }

  if (status === 'empty' || !roadmap || !roadmap.milestones?.length) {
    return (
      <section className="panel px-6 py-16 text-center shadow-sm">
        <Sparkles size={36} className="mx-auto text-slate-300 mb-3" />
        <h3 className="text-lg font-bold text-slate-900">No roadmap available yet</h3>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto font-medium">
          Your roadmap will appear here once it has been generated.
        </p>
      </section>
    );
  }

  const milestones = roadmap.milestones;
  // Overall progress is computed from the ACTUAL task data — never hard-coded.
  const allTasks = milestones.flatMap((m) => m.tasks || []);
  const completedTaskCount = allTasks.filter((t) => completedTaskIds.has(t.id)).length;
  const totalTaskCount = allTasks.length;

  return (
    <div className="space-y-6">
      {/* --- Accepted goal header --- */}
      <header className="panel p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-[#26261F] break-words">
            {goalTitle || roadmap.goal_title}
          </h1>
          {roadmap.estimated_total_duration && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#E2E9DF] border border-[#E2E9DF] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#3A492E]">
              <Clock3 size={11} />
              {roadmap.estimated_total_duration}
            </span>
          )}
        </div>
        {/* NOTE: sampleRoadmap.json has no goal_description field. The optional
            description below comes from the user's goal record (DataContext),
            never from the roadmap JSON. */}
        {goalDescription && (
          <p className="mt-1 text-sm text-slate-600 font-medium break-words">
            {goalDescription}
          </p>
        )}
      </header>

      {/* --- AI Roadmap heading --- */}
      <div>
        <h2 className="text-lg font-bold text-[#26261F] flex items-center gap-2">
          <Sparkles size={18} className="text-[#4B5D3C]" />
          AI Roadmap
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-medium max-w-2xl">
          Your goal broken down into ordered, actionable milestones and tasks. Check off each
          action item as you complete it to track your overall progress.
        </p>
      </div>

      {/* --- Overall progress (computed from actual task data) --- */}
      <RoadmapProgress
        completedTaskCount={completedTaskCount}
        totalTaskCount={totalTaskCount}
        isMock={isMock}
      />

      {/* --- Ordered milestones with tasks --- */}
      <section className="panel p-5 sm:p-6 shadow-sm" aria-label="Roadmap milestones">
        <ol className="list-none">
          {milestones.map((milestone) => (
            <RoadmapMilestone
              key={milestone.id}
              milestone={milestone}
              completedTaskIds={completedTaskIds}
              updatingTaskIds={updatingTaskIds}
              taskErrors={taskErrors}
              onToggleTask={onToggleTask}
            />
          ))}
        </ol>
      </section>

      {/* --------------------------------------------------------------- */}
      {/* Positive Reinforcement Area (Swayam integration point)           */}
      {/* The page emits onTaskComplete / onMilestoneComplete /            */}
      {/* onRoadmapComplete events; a celebration UI can be passed as the  */}
      {/* `celebrationSlot` prop and renders here.                         */}
      {/* --------------------------------------------------------------- */}
      {celebrationSlot ? (
        <section aria-label="AI Encouragement & Progress Celebration">
          {celebrationSlot}
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-[#B9CDAA] bg-[#F6F9F2] p-5 sm:p-6 text-center">
          <h3 className="section-label text-[#4B5D3C]">AI Encouragement</h3>
          <p className="mt-1.5 text-xs text-slate-500 font-medium">
            Reserved for milestone &amp; goal completion feedback.
          </p>
        </section>
      )}
    </div>
  );
}
