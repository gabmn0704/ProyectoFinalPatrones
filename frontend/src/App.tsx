import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity, ArrowDownToLine, ArrowRight, Check, ChevronRight, CircleHelp, HeartPulse,
  LockKeyhole, ShieldAlert, Sparkles, Sunrise,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { ContactPanel } from "./components/ContactPanel";
import { AssistantPanel } from "./components/AssistantPanel";
import { EmergencyModal } from "./components/EmergencyModal";
import { InsightPanel } from "./components/InsightPanel";
import { LogForm, type LogFormValues } from "./components/LogForm";
import { RiskCard } from "./components/RiskCard";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { createDemoDashboard, getDemoUserName, saveDemoUserName } from "./data/demoData";
import { Stack } from "./lib/dataStructures";
import { loadDashboard, reportSeizure, saveContact, saveDailyLog } from "./lib/api";
import { isCloudConfigured, supabase } from "./lib/supabase";
import type { AppSection, ColorTheme, DashboardData, DailyLog, EmergencyContact, EmergencyReportResult } from "./types";

const sectionTitles: Record<AppSection, { title: string; subtitle: string }> = {
  overview: { title: "A little more in tune.", subtitle: "Your wellbeing is a journey. We’re here for every step." },
  "daily-log": { title: "Check in with yourself.", subtitle: "Small moments of reflection can reveal meaningful patterns." },
  history: { title: "Your story, thoughtfully kept.", subtitle: "A clear, private record to share with your care team when you choose." },
  insights: { title: "Getting to know your patterns.", subtitle: "Observations from your own history, never a diagnosis." },
  "care-team": { title: "You don’t have to go it alone.", subtitle: "The people you trust, close at hand when it matters." },
  assistant: { title: "A thoughtful space to talk.", subtitle: "Reflect, find gentle routines, and prepare questions for your care team." },
};

const DEMO_MODE = true;

interface AuthScreenProps {
  demoMode: boolean;
  onDemoContinue: (name: string) => void;
  oauthError: string;
}

function getOAuthErrorMessage(error: string): string {
  if (/unable to exchange external code/i.test(error)) {
    return "Google sign-in reached Supabase, but Supabase could not exchange Google's authorization code. Verify that the Google Client ID and current Client Secret in Supabase belong to the same Web OAuth client. The Google Cloud authorized redirect URI must be https://devtfvejnrtphnlymrmq.supabase.co/auth/v1/callback. The displayed code prefix is not the cause.";
  }
  return error;
}

function AuthScreen({ demoMode, onDemoContinue, oauthError }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const signInWithGoogle = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const { error: signInError } = await supabase!.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (signInError) throw signInError;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not start Google sign-in.");
      setLoading(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      if (name.trim().length < 2) throw new Error("Enter your name so EpiSafe can personalize your care space.");
      if (isSignUp) {
        const result = await supabase!.auth.signUp({ email, password, options: { data: { full_name: name.trim() } } });
        if (result.error) throw result.error;
        if (!result.data.session) {
          setMessage("Account created. Check your email to confirm your address, then sign in with your name.");
        }
      } else {
        const result = await supabase!.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        if (!result.data.user.user_metadata.full_name) {
          const { error: profileError } = await supabase!.auth.updateUser({ data: { full_name: name.trim() } });
          if (profileError) throw profileError;
        }
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not complete sign-in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <a className="brand auth-brand" href="/"><span className="brand-mark"><Activity size={21} /></span><span className="brand-copy"><strong>EpiSafe</strong><small>YOUR CARE, IN FOCUS</small></span></a>
        <span className="auth-icon"><LockKeyhole size={21} /></span>
        <div className="eyebrow">{demoMode ? "A PERSONALIZED PREVIEW" : "A SPACE THAT’S YOURS"}</div>
        <h1>{demoMode ? "Your care, your way." : isSignUp ? "Create your account." : "Welcome back."}</h1>
        <p className="auth-description">{demoMode ? "Choose the name you’d like to see in your demo. Your preview stays in this browser until you connect Supabase." : isSignUp ? "Create your private account to keep your care history in sync across sessions." : "Sign in to your private care space. Your name personalizes your dashboard."}</p>
        {oauthError && <p className="form-message error-message" role="alert">{getOAuthErrorMessage(oauthError)}</p>}
        {demoMode ? (
          <form className="auth-form" onSubmit={(event) => {
            event.preventDefault();
            const displayName = name.trim();
            if (displayName.length < 2) {
              setError("Enter at least two characters for your name.");
              return;
            }
            saveDemoUserName(displayName);
            onDemoContinue(displayName);
          }}>
            <label className="field-label">What should we call you?<input autoComplete="name" maxLength={80} required minLength={2} value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label>
            {error && <p className="form-message error-message" role="alert">{error}</p>}
            <button className="primary-button auth-submit" type="submit">Explore the interactive demo<ArrowRight size={17} /></button>
            <p className="demo-auth-note"><ShieldAlert size={15} />Demo mode is not a secure account. Add your Supabase project to turn on real sign-in and cloud storage.</p>
          </form>
        ) : (
        <>
        <button className="google-auth-button" disabled={loading} type="button" onClick={() => void signInWithGoogle()}>
          <span className="google-mark" aria-hidden="true">G</span>
          Continue with Google
        </button>
        <div className="auth-divider"><span>or continue with email</span></div>
        <form className="auth-form" onSubmit={submit}>
          <label className="field-label">Your name<input autoComplete="name" maxLength={80} minLength={2} required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your first and last name" /></label>
          <label className="field-label">Email address<input autoComplete="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label className="field-label">Password<input autoComplete={isSignUp ? "new-password" : "current-password"} type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error && <p className="form-message error-message" role="alert">{error}</p>}
          {message && <p className="form-message success-message"><Check size={15} />{message}</p>}
          <button className="primary-button auth-submit" disabled={loading} type="submit">{loading ? "Please wait…" : isSignUp ? "Create a private account" : "Sign in"}<ArrowRight size={17} /></button>
        </form>
        </>
        )}
        {!demoMode && (
        <button className="auth-switch" type="button" onClick={() => { setIsSignUp((value) => !value); setError(""); setMessage(""); }}>
          {isSignUp ? "Already have an account? Sign in" : "New to EpiSafe? Create an account"}
        </button>
        )}
        <div className="auth-privacy"><ShieldAlert size={15} />This tool supports your care; it does not replace professional medical advice.</div>
      </div>
    </main>
  );
}

function WeekChart({ logs }: { logs: DailyLog[] }) {
  const data = useMemo(() => {
    const recent = [...logs].sort((first, second) => first.date.localeCompare(second.date)).slice(-7);
    return recent.map((log) => ({
      day: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(new Date(`${log.date}T12:00:00`)),
      hours: log.sleep_hours,
      sleep: `${log.sleep_hours} hours`,
    }));
  }, [logs]);

  return (
    <section className="panel chart-panel">
      <div className="panel-heading"><div><div className="eyebrow">YOUR LAST SEVEN CHECK-INS</div><h2>Rest & recovery</h2></div><span className="chart-legend"><i /> Sleep</span></div>
      {data.length ? (
        <div className="week-chart" role="img" aria-label="Sleep hours from your most recent daily check-ins">
          {data.map((entry, index) => (
            <div className="chart-column" key={`${entry.day}-${index}`} title={`${entry.day}: ${entry.sleep}`}>
              <span className="chart-value">{entry.hours}h</span>
              <div className="chart-bar-track"><div className="chart-bar" style={{ height: `${Math.max(5, (entry.hours / 12) * 100)}%` }} /></div>
              <span className="chart-day">{entry.day}</span>
            </div>
          ))}
        </div>
      ) : <div className="empty-state">Your chart will appear after your first daily check-in.</div>}
      <p className="chart-caption">Sleep is one part of the picture. Everyone’s experience is unique.</p>
    </section>
  );
}

function RecentEvents({ events, onViewAll }: { events: DashboardData["events"]; onViewAll: () => void }) {
  return (
    <section className="panel events-panel">
      <div className="panel-heading"><div><div className="eyebrow">YOUR CARE JOURNAL</div><h2>Recent events</h2></div><button className="subtle-link" type="button" onClick={onViewAll}>View history <ChevronRight size={16} /></button></div>
      {events.length ? <div className="event-list">
        {events.slice(0, 3).map((event) => (
          <article className="event-row" key={event.id}>
            <span className={`event-dot event-${event.severity}`}><HeartPulse size={16} /></span>
            <div className="event-info"><strong>{event.severity[0].toUpperCase() + event.severity.slice(1)} event</strong><span>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.occurred_at))}</span></div>
            <span className="event-duration">{event.duration_minutes} min</span>
          </article>
        ))}
      </div> : <div className="empty-state">No events recorded. Your history will be here if you need it.</div>}
    </section>
  );
}

function exportHistory(data: DashboardData): void {
  const rows = [
    ["Record type", "Date", "Sleep hours", "Stress level", "Caffeine cups", "Exercise minutes", "Medication taken", "Severity", "Duration minutes", "Notes"],
    ...data.logs.map((log) => ["Daily check-in", log.date, String(log.sleep_hours), String(log.stress_level), String(log.caffeine_cups), String(log.exercise_minutes), String(log.medication_taken), "", "", log.notes]),
    ...data.events.map((event) => ["Seizure event", event.occurred_at, "", "", "", "", "", event.severity, String(event.duration_minutes), event.notes]),
  ];
  const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "episafe-care-history.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function newestEventsFirst(events: DashboardData["events"]): DashboardData["events"] {
  const stack = new Stack<DashboardData["events"][number]>();
  [...events].sort((first, second) => first.occurred_at.localeCompare(second.occurred_at)).forEach((event) => stack.push(event));
  const newestFirst: DashboardData["events"] = [];
  while (stack.size > 0) {
    const event = stack.pop();
    if (event) newestFirst.push(event);
  }
  return newestFirst;
}

function FactorBreakdown({ logs }: { logs: DailyLog[] }) {
  const factors = [
    { label: "Rest under 5 hours", value: logs.filter((log) => log.sleep_hours < 5).length, tone: "purple" },
    { label: "Higher stress days", value: logs.filter((log) => log.stress_level >= 4).length, tone: "amber" },
    { label: "Medication not logged", value: logs.filter((log) => !log.medication_taken).length, tone: "blue" },
    { label: "3+ caffeine drinks", value: logs.filter((log) => log.caffeine_cups >= 3).length, tone: "green" },
  ];
  return (
    <section className="panel factor-panel">
      <div className="panel-heading"><div><div className="eyebrow">AT A GLANCE</div><h2>Your recent check-ins</h2></div></div>
      {factors.map((factor) => (
        <div className="factor-row" key={factor.label}>
          <div className="factor-label"><span>{factor.label}</span><strong>{factor.value} days</strong></div>
          <div className="factor-track"><span className={`factor-fill ${factor.tone}`} style={{ width: `${logs.length ? (factor.value / logs.length) * 100 : 0}%` }} /></div>
        </div>
      ))}
      <div className="factor-sample">Based on {logs.length} logged day{logs.length === 1 ? "" : "s"}. A small sample may not represent a broader pattern.</div>
    </section>
  );
}

function HistoryView({ data }: { data: DashboardData }) {
  const events = newestEventsFirst(data.events);
  return (
    <section className="panel history-panel">
      <div className="panel-heading"><div><div className="eyebrow">PRIVATE & PERSONAL</div><h2>Your event history</h2></div><button className="text-button" type="button" onClick={() => exportHistory(data)}><ArrowDownToLine size={16} /> Export care history</button></div>
      <p className="panel-description">A private timeline to help you reflect or share with your healthcare professional.</p>
      {events.length ? <div className="history-list">
        {events.map((event) => (
          <article className="history-item" key={event.id}>
            <span className={`event-dot event-${event.severity}`}><HeartPulse size={16} /></span>
            <div className="history-event-content"><div className="history-event-heading"><strong>{event.severity[0].toUpperCase() + event.severity.slice(1)} event</strong><span>{event.duration_minutes} minutes</span></div><time>{new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "short" }).format(new Date(event.occurred_at))}</time>{event.notes && <p>{event.notes}</p>}</div>
          </article>
        ))}
      </div> : <div className="empty-state history-empty"><HeartPulse size={22} /><strong>No events in your history</strong><span>When you choose to record an event, it will appear here.</span></div>}
      <div className="history-disclaimer"><CircleHelp size={16} /> This record is a personal aid, not a medical record or emergency service.</div>
    </section>
  );
}

function LoadingScreen() {
  return <main className="loading-screen"><span className="brand-mark"><Activity size={22} /></span><div className="loading-pulse">Getting your space ready…</div></main>;
}

export default function App() {
  const cloudEnabled = isCloudConfigured && !DEMO_MODE;
  const [theme, setTheme] = useState<ColorTheme>(() => {
    const savedTheme = window.localStorage.getItem("episafe.theme");
    return savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light";
  });
  const [active, setActive] = useState<AppSection>("overview");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [demoUserName, setDemoUserName] = useState(() => getDemoUserName());
  const [authReady, setAuthReady] = useState(!cloudEnabled);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [oauthError, setOAuthError] = useState("");
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("episafe.theme", theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#10131d" : "#f5f4f1");
  }, [theme]);

  useEffect(() => {
    if (!cloudEnabled) {
      if (demoUserName) setDashboard(createDemoDashboard());
      setLoading(false);
      return;
    }
    let isMounted = true;
    let authStateReceived = false;
    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return;
      authStateReceived = true;
      setSession(currentSession);
      setLoadError("");
      setAuthReady(true);
      if (currentSession) setOAuthError("");
    });

    const completeAuthentication = async () => {
      const callbackUrl = new URL(window.location.href);
      const params = new URLSearchParams(callbackUrl.search);
      const hashParams = new URLSearchParams(callbackUrl.hash.slice(1));
      hashParams.forEach((value, key) => {
        if (!params.has(key)) params.set(key, value);
      });
      const callbackError = params.get("error_description") ?? params.get("error");
      const code = params.get("code");

      if (callbackError) {
        setOAuthError(callbackError);
      } else if (code) {
        const { data, error } = await supabase!.auth.exchangeCodeForSession(code);
        if (error) throw error;
        if (isMounted) {
          setSession(data.session);
          setOAuthError("");
        }
      } else {
        const { data, error } = await supabase!.auth.getSession();
        if (error) throw error;
        if (isMounted && !authStateReceived) setSession(data.session);
      }

      if (code || callbackError) {
        params.delete("code");
        params.delete("state");
        params.delete("error");
        params.delete("error_description");
        params.delete("error_code");
        params.delete("error_uri");
        hashParams.delete("access_token");
        hashParams.delete("refresh_token");
        hashParams.delete("expires_in");
        hashParams.delete("token_type");
        hashParams.delete("type");
        const remainingSearch = params.toString();
        const remainingHash = hashParams.toString();
        window.history.replaceState(
          {},
          document.title,
          `${callbackUrl.pathname}${remainingSearch ? `?${remainingSearch}` : ""}${remainingHash ? `#${remainingHash}` : ""}`,
        );
      }
      if (isMounted) setAuthReady(true);
    };

    void completeAuthentication().catch((reason: unknown) => {
      if (!isMounted) return;
      setOAuthError(reason instanceof Error ? reason.message : "We could not finish Google sign-in. Please try again.");
      setAuthReady(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [cloudEnabled, demoUserName]);

  const refresh = useCallback(async () => {
    if (cloudEnabled && !session) return;
    setLoading(true);
    setLoadError("");
    try {
      setDashboard(await loadDashboard(cloudEnabled));
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : "Your dashboard could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [cloudEnabled, session]);

  useEffect(() => {
    if (!authReady) return;
    if (!cloudEnabled || session) void refresh();
    else setLoading(false);
  }, [authReady, cloudEnabled, refresh, session]);

  const saveLog = async (values: LogFormValues) => {
    await saveDailyLog(values, cloudEnabled);
    await refresh();
    setNotice("Your daily check-in has been saved.");
    window.setTimeout(() => setNotice(""), 3500);
  };

  const addContact = async (contact: Omit<EmergencyContact, "id" | "user_id">) => {
    await saveContact(contact, cloudEnabled);
    await refresh();
  };

  const recordEvent = async (input: { severity: "mild" | "moderate" | "severe"; duration_minutes: number; notes: string }): Promise<EmergencyReportResult> => {
    const result = await reportSeizure(input, cloudEnabled);
    await refresh();
    if (result.notificationStatus === "not_configured") {
      setNotice("Event saved. Configure Resend in Netlify to enable care-circle email notifications.");
    } else if (result.notificationStatus === "failed") {
      setNotice("Event saved, but the care-circle email could not be sent. Check your notification settings.");
    } else if (result.notificationStatus === "no_contacts") {
      setNotice("Event saved. Add a trusted person to your care circle.");
    } else {
      setNotice("Event saved and your care circle was notified.");
    }
    return result;
  };

  if (!authReady || loading && !dashboard) return <LoadingScreen />;
  if (cloudEnabled && !session) return <AuthScreen demoMode={false} onDemoContinue={() => undefined} oauthError={oauthError} />;
  if (!cloudEnabled && !demoUserName) return <AuthScreen demoMode onDemoContinue={(name) => { setDemoUserName(name); setDashboard(createDemoDashboard()); }} oauthError="" />;
  if (!dashboard) return (
    <main className="load-error-page">
      <span className="error-symbol"><ShieldAlert size={22} /></span>
      <h1>Your care space couldn’t load.</h1>
      <p role="alert">{loadError || "We couldn’t connect to your saved information."}</p>
      <button className="primary-button" type="button" onClick={() => void refresh()}>Try again</button>
      {cloudEnabled && <button className="text-button" type="button" onClick={() => void supabase!.auth.signOut()}>Sign out</button>}
    </main>
  );

  const selected = sectionTitles[active];
  const userName = session?.user.user_metadata.full_name
    ?? session?.user.user_metadata.name
    ?? session?.user.user_metadata.given_name
    ?? session?.user.email?.split("@")[0]
    ?? demoUserName;
  const onSignOut = session ? () => { void supabase!.auth.signOut(); } : () => { setDashboard(null); setDemoUserName(""); saveDemoUserName(""); };
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const searchResults = normalizedSearch ? [
    ...dashboard.logs
      .filter((log) => [log.date, log.notes, `${log.sleep_hours} hours sleep`, `stress ${log.stress_level}`, `${log.caffeine_cups} cups caffeine`, `${log.exercise_minutes} minutes exercise`, log.medication_taken ? "medication taken" : "medication missed"].join(" ").toLowerCase().includes(normalizedSearch))
      .slice(0, 4)
      .map((log) => ({ id: log.id, title: "Daily check-in", description: `${log.date} · ${log.sleep_hours}h sleep · stress ${log.stress_level}/5`, section: "daily-log" as const })),
    ...dashboard.events
      .filter((event) => [event.occurred_at, event.severity, event.notes, `${event.duration_minutes} minutes`].join(" ").toLowerCase().includes(normalizedSearch))
      .slice(0, 4)
      .map((event) => ({ id: event.id, title: `${event.severity[0].toUpperCase()}${event.severity.slice(1)} event`, description: new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(event.occurred_at)), section: "history" as const })),
  ] : [];

  return (
    <div className="app-shell">
      <Sidebar active={active} onNavigate={setActive} onEmergency={() => setEmergencyOpen(true)} demoMode={!cloudEnabled} />
      <main className="main-area">
        <Topbar onEmergency={() => setEmergencyOpen(true)} userName={userName} onSignOut={onSignOut} searchQuery={searchQuery} onSearchChange={setSearchQuery} theme={theme} onThemeChange={() => setTheme((current) => current === "light" ? "dark" : "light")} />
        <div className="page-content">
          {normalizedSearch && <div className="search-results" role="region" aria-label="Care history search results">
            <div className="search-results-heading"><strong>Search results</strong><button type="button" onClick={() => setSearchQuery("")}>Clear</button></div>
            {searchResults.length ? searchResults.map((result) => <button className="search-result" type="button" key={result.id} onClick={() => { setActive(result.section); setSearchQuery(""); }}><span><strong>{result.title}</strong><small>{result.description}</small></span><ChevronRight size={15} /></button>) : <p className="search-empty">No matches in your check-ins or event history.</p>}
          </div>}
          <div className="page-heading">
            <div><div className="eyebrow greeting-eyebrow"><Sunrise size={15} /> GOOD TO SEE YOU, {userName.split(/[ @]/)[0].toUpperCase()}</div><h1>{selected.title}</h1><p>{selected.subtitle}</p></div>
            <div className="hero-emblem" aria-hidden="true">
              <span className="hero-emblem-orbit orbit-one" />
              <span className="hero-emblem-orbit orbit-two" />
              <span className="hero-emblem-sun"><Activity size={27} strokeWidth={1.5} /></span>
              <span className="hero-emblem-caption"><strong>{dashboard.logs.length} days</strong><small>of showing up for you</small></span>
            </div>
          </div>
          {loadError && <div className="notice-banner error-message" role="alert">{loadError}<button type="button" onClick={() => void refresh()}>Retry</button></div>}
          {notice && <div className="notice-banner" role="status"><Check size={16} />{notice}<button type="button" onClick={() => setNotice("")}>Dismiss</button></div>}
          {active === "overview" && (
            <>
              <RiskCard report={dashboard.risk} onCheckIn={() => setActive("daily-log")} />
              <div className="stats-row">
                <article className="stat-card"><span className="stat-icon lavender"><Activity size={18} /></span><div><span>Check-ins this month</span><strong>{dashboard.logs.length}</strong></div><span className="stat-caption">personal reflections</span></article>
                <article className="stat-card"><span className="stat-icon mint"><MoonIcon /></span><div><span>Average sleep</span><strong>{dashboard.logs.length ? <>{(dashboard.logs.reduce((total, log) => total + log.sleep_hours, 0) / dashboard.logs.length).toFixed(1)}<small>h</small></> : "—"}</strong></div><span className="stat-caption">across logged days</span></article>
                <article className="stat-card"><span className="stat-icon peach"><HeartPulse size={18} /></span><div><span>Recorded events</span><strong>{dashboard.events.length}</strong></div><span className="stat-caption">in your care journal</span></article>
              </div>
              <div className="content-grid overview-grid"><div className="content-column"><WeekChart logs={dashboard.logs} /><RecentEvents events={dashboard.events} onViewAll={() => setActive("history")} /></div><div className="content-column"><InsightPanel insights={dashboard.insights} compact /><div className="gentle-reminder"><span><Sparkles size={17} /></span><div><strong>A gentle reminder</strong><p>Your care plan is unique to you. Reach out to your healthcare professional with questions about your wellbeing.</p></div></div></div></div>
            </>
          )}
          {active === "daily-log" && <div className="content-grid detail-grid"><LogForm onSave={saveLog} /><div className="content-column"><WeekChart logs={dashboard.logs} /><FactorBreakdown logs={dashboard.logs} /></div></div>}
          {active === "history" && <HistoryView data={dashboard} />}
          {active === "insights" && <div className="content-grid insights-grid"><InsightPanel insights={dashboard.insights} /><div className="content-column"><FactorBreakdown logs={dashboard.logs} /><div className="gentle-reminder"><span><Sparkles size={17} /></span><div><strong>Small steps, useful signals.</strong><p>The more consistently you log, the better your personal baseline becomes. Patterns describe history — not cause or future risk.</p></div></div></div></div>}
          {active === "care-team" && <div className="content-grid care-grid"><ContactPanel contacts={dashboard.contacts} onAdd={addContact} /><section className="panel care-safety"><span className="care-safety-icon"><ShieldAlert size={21} /></span><div className="eyebrow">WHEN IT MATTERS</div><h2>A safer plan starts with a conversation.</h2><p>Share your preferences with someone you trust. Emergency email alerts are sent only when a server email provider is configured.</p><button className="subtle-link" type="button" onClick={() => setEmergencyOpen(true)}>Record an event <ArrowRight size={16} /></button><div className="care-note"><LockKeyhole size={15} /> Your contact details are private to your account.</div></section></div>}
          {active === "assistant" && <AssistantPanel />}
          <footer className="page-footer"><span>© {new Date().getFullYear()} EpiSafe AI</span><span><ShieldAlert size={14} /> For personal tracking only. Not a substitute for professional medical care.</span></footer>
        </div>
      </main>
      {emergencyOpen && <EmergencyModal onClose={() => setEmergencyOpen(false)} onReport={async (input) => { await recordEvent(input); }} />}
    </div>
  );
}

function MoonIcon() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" /><path d="m16 4 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" /></svg>;
}
