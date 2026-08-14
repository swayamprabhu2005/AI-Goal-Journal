import { NavLink } from 'react-router-dom';

const links = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: '📊',
  },
  {
    to: '/journal',
    label: 'Journal',
    icon: '✍️',
  },
  {
    to: '/goals',
    label: 'Goals',
    icon: '🎯',
  },
  {
    to: '/coach',
    label: 'AI Coach',
    icon: '🛡️',
    isAi: true,
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: '👤',
  },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-card-border bg-secondary md:flex md:flex-col justify-between">
      <div className="p-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3">
          Workspace
        </span>
        <nav className="mt-2 flex flex-col gap-1.5">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-card px-3.5 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-primary-grad text-white font-semibold shadow-glow-primary border border-primary-light/30'
                    : 'text-secondary-foreground hover:bg-muted/70 hover:text-foreground'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </div>
              {link.isAi && (
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-card-border">
        <div className="rounded-card bg-muted/80 p-3 text-xs text-secondary-foreground border border-card-border">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground">AI Goal Engine</span>
            <span className="h-2 w-2 rounded-full bg-accent" />
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Local MVP • faster-whisper Tiny</div>
        </div>
      </div>
    </aside>
  );
}