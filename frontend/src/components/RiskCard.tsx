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
        <div className="eyebrow"><Sparkles size={15} /> {report.model === "personal-logistic" ? "PERSONAL ASSOCIATION MODEL" : "PERSONAL WELLNESS SIGNAL"}</div>
        <span className="updated-label">
          {report.model === "personal-logistic"
            ? `Logistic regression · ${report.trainingDays} check-ins`
            : `${report.trainingDays} check-ins · ${report.seizureDays} seizure days`}
        </span>
      </div>
      <div className="risk-card-content">
        <div className="risk-score-wrap">
          <svg viewBox="0 0 112 112" className="risk-ring" role="img" aria-label={`Experimental wellness signal score ${report.score} out of 100; not a probability`}>
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
          <span className={`risk-pill ${tone}`}><Icon size={14} /> {report.level} signal · {report.score}/100</span>
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
      <div className="risk-disclaimer"><ShieldAlert size={14} />
        {report.model === "personal-logistic"
          ? `Experimental on-device logistic regression compares your ${report.trainingDays} check-ins with ${report.seizureDays} recorded seizure days. This association score is not a probability, forecast, or diagnosis.`
          : `Transparent starter rules are active. Personal logistic regression needs 30 past check-ins, including at least 5 recorded seizure days and 15 days without a recorded seizure. This score is not a probability, forecast, or medical advice.`}
      </div>
    </section>
  );
}
