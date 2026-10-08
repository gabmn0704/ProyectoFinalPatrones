import { useState } from "react";
import { Bell, ChevronDown, Search, ShieldAlert } from "lucide-react";

interface TopbarProps {
  onEmergency: () => void;
  userName: string;
  onSignOut?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Topbar({ onEmergency, userName, onSignOut, searchQuery, onSearchChange }: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <header className="topbar">
      <div className="topbar-date"><span className="date-label">YOUR SPACE</span><span>{today}</span></div>
      <div className="topbar-actions">
        <label className="search-box">
          <Search size={17} />
          <input aria-label="Search your care history" placeholder="Search your care..." value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} />
          <kbd>⌘ K</kbd>
        </label>
        <div className="notification-wrap">
          <button className="icon-button notification-button" aria-label="Care notifications" aria-expanded={showNotifications} type="button" onClick={() => setShowNotifications((visible) => !visible)}>
            <Bell size={19} />
          </button>
          {showNotifications && <div className="notification-popover"><span className="notification-popover-icon"><ShieldAlert size={17} /></span><div><strong>Care circle updates</strong><p>Contacts are emailed after an event only when the server email service is configured.</p><button type="button" onClick={() => { setShowNotifications(false); onEmergency(); }}>Record an event</button></div></div>}
        </div>
        <button className="profile-button" type="button" onClick={onSignOut} title={onSignOut ? "Sign out" : undefined}>
          <span className="avatar">{userName.trim().slice(0, 1).toUpperCase() || "J"}</span>
          <span className="profile-name">{userName}</span><ChevronDown size={15} />
        </button>
        <button className="emergency-topbar" type="button" onClick={onEmergency}>Emergency</button>
      </div>
    </header>
  );
}
