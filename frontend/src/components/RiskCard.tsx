import { ArrowDownRight, ArrowUpRight, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";
import type { RiskReport } from "../types";

interface RiskCardProps {
  report: RiskReport;
  onCheckIn: () => void;
}

export function RiskCard({ report, onCheckIn }: RiskCardProps) {
  const tone = report.level === "high" ? "danger" : report.level === "moderate" ? "warning" : "safe";
  const Icon = report.level === "high" ? ShieldAlert : report.level === "moderate" ? ArrowUpRight : CheckCircle2;
  const circumference = 2 * Math.PI * 47;

  return (
    <section className={`risk-card risk-${tone}`}>
      <div className="risk-card-heading">
        <div className="eyebrow"><Sparkles size={15} /> YOUR DAILY WELLNESS SIGNAL</div>
        <span className="updated-label">Updated just now</span>
      </div>
      <div className="risk-card-content">
        <div className="risk-score-wrap">
          <svg viewBox="0 0 112 112" className="risk-ring" role="img" aria-label={`Wellness signal ${report.score} out of 100`}>
            <circle className="ring-track" cx="56" cy="56" r="47" />
            <circle
              className="ring-progress"
              cx="56" cy="56" r="47"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - report.score / 100)}
            />
          </svg>
          <span className="ring-score">{report.score}<small>/100</small></span>
        </div>
        <div className="risk-summary">
          <span className={`risk-pill ${tone}`}><Icon size={14} /> {report.level} signal</span>
          <h2>{report.level === "high" ? "Let’s take extra care today." : report.level === "moderate" ? "A gentle check-in could help." : "A steady day starts with you."}</h2>
          <p>
            {report.factors.length
              ? `${report.factors.length} personal ${report.factors.length === 1 ? "factor is" : "factors are"} shaping today’s signal.`
              : "Your recent check-ins look steady. Keep listening to your body."}
          </p>
        </div>
        <button className="risk-action" type="button" onClick={onCheckIn}>
          <span>Complete today’s check-in</span><ArrowDownRight size={17} />
        </button>
      </div>
      <div className="risk-disclaimer"><ShieldAlert size={14} /> This wellness signal is informational only — it is not a medical prediction or diagnosis.</div>
    </section>
  );
}
