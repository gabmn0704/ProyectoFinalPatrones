import {
  Activity, BookOpenCheck, CalendarDays, ChartNoAxesCombined, HeartHandshake,
  LayoutDashboard, LifeBuoy, ShieldCheck,
} from "lucide-react";
import type { AppSection } from "../types";

const navigation: Array<{ id: AppSection; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "daily-log", label: "Daily check-in", icon: BookOpenCheck },
  { id: "history", label: "Seizure history", icon: CalendarDays },
  { id: "insights", label: "My patterns", icon: ChartNoAxesCombined },
  { id: "care-team", label: "Care circle", icon: HeartHandshake },
];

interface SidebarProps {
  active: AppSection;
  onNavigate: (section: AppSection) => void;
  onEmergency: () => void;
  demoMode: boolean;
}

export function Sidebar({ active, onNavigate, onEmergency, demoMode }: SidebarProps) {
  return (
    <aside className="sidebar">
      <a className="brand" href="/" aria-label="EpiSafe AI home">
        <span className="brand-mark"><Activity size={21} strokeWidth={2.5} /></span>
        <span className="brand-copy"><strong>EpiSafe</strong><small>YOUR CARE, IN FOCUS</small></span>
      </a>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="side-nav" aria-label="Main navigation">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button
            className={`nav-item${active === id ? " active" : ""}`}
            key={id}
            onClick={() => onNavigate(id)}
            type="button"
          >
            <Icon size={19} strokeWidth={1.9} />
            <span>{label}</span>
            {id === "overview" && <span className="nav-indicator" />}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="privacy-note">
          <span className="privacy-icon"><ShieldCheck size={17} /></span>
          <div><strong>Your data, protected</strong><p>Only you and your care circle have access.</p></div>
        </div>
        <button className="help-link" type="button" onClick={onEmergency}>
          <LifeBuoy size={18} /> Emergency help
        </button>
        <div className="mode-badge"><span className="status-dot" />{demoMode ? "Interactive demo" : "Secure cloud mode"}</div>
      </div>
    </aside>
  );
}
