import { Activity, Coffee, Moon, Pill, Sparkles } from "lucide-react";
import type { PatternInsight } from "../types";

const icons = { moon: Moon, pill: Pill, activity: Activity, coffee: Coffee };

interface InsightPanelProps {
  insights: PatternInsight[];
  compact?: boolean;
}

export function InsightPanel({ insights, compact = false }: InsightPanelProps) {
  return (
    <section className={`panel insight-panel${compact ? " compact" : ""}`}>
      <div className="panel-heading">
        <div><div className="eyebrow"><Sparkles size={14} /> PERSONAL PATTERNS</div><h2>What your data is telling you</h2></div>
        <span className="ai-tag">YOUR DATA, YOUR INSIGHTS</span>
      </div>
      <p className="panel-description">A privacy-first, explainable analysis of your records. Nothing is sent to an AI provider.</p>
      <div className="insight-list">
        {insights.map((insight) => {
          const Icon = icons[insight.icon];
          return (
            <article className="insight-row" key={insight.id}>
              <span className={`insight-icon ${insight.icon}`}><Icon size={18} /></span>
              <div className="insight-copy"><strong>{insight.title}</strong><p>{insight.description}</p><span className={`confidence confidence-${insight.confidence}`}>{insight.confidence} signal</span></div>
              <span className="insight-metric">{insight.metric}</span>
            </article>
          );
        })}
      </div>
      <div className="insight-footnote">Patterns describe recorded history only. They are not medical advice or predictions.</div>
    </section>
  );
}
