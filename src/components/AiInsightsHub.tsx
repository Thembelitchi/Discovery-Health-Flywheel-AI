import React, { useState, useEffect } from 'react';
import { Sparkles, Send, RefreshCw, Layers } from 'lucide-react';

interface Props {
  triggerRefreshToggle: boolean;
}

const PRESET_QUERIES = [
  "How can we maximize Sarah Lene's diabetic pathway using the current savings pool?",
  "Analyze cardiovascular hospitalization risks for Sipho Dlamini.",
  "What is the system's economic optimization rate for V004 duplicates?"
];

export default function AiInsightsHub({ triggerRefreshToggle }: Props) {
  const [insight, setInsight] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchInsights = async (customPrompt?: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/synthesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: customPrompt || prompt })
      });
      const data = await response.json();
      if (data.text) {
        setInsight(data.text);
      } else {
        setInsight("Error obtaining diagnostic insights. Please ensure GEMINI_API_KEY is configured.");
      }
    } catch (err) {
      console.error(err);
      setInsight("Network error occurred during clinical pathway synthesis. Ensure server.ts is compiling.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [triggerRefreshToggle]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    fetchInsights(prompt);
  };

  const handlePresetClick = (q: string) => {
    setPrompt(q);
    fetchInsights(q);
  };

  return (
    <div className="p-6 border border-white/10 bg-white/5 rounded-none h-full flex flex-col justify-between" id="ai-insights-hub-card">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-flywheel flex items-center gap-2">
            <Sparkles size={12} className="animate-spin" /> AI Synthesis Hub
          </div>
          <button
            onClick={() => fetchInsights()}
            disabled={loading}
            className="p-1 border border-white/10 hover:border-flywheel hover:text-flywheel transition-all"
            title="Re-analyze metrics"
          >
            <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Dynamic markdown rendering block */}
        <div className="space-y-4 mb-6">
          <h2 className="text-2xl font-black font-display italic leading-tight text-white normal-case">
            Optimization Protocol Beta-9
          </h2>

          <div className="text-white/70 text-xs leading-relaxed max-h-[360px] overflow-y-auto pr-1 space-y-3" id="ai-synthesis-stream-output">
            {loading ? (
              <div className="space-y-3 py-4">
                <div className="h-3 bg-white/10 animate-pulse w-3/4"></div>
                <div className="h-3 bg-white/10 animate-pulse w-5/6"></div>
                <div className="h-3 bg-white/10 animate-pulse w-2/3"></div>
                <div className="h-3 bg-white/10 animate-pulse w-1/2"></div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-flywheel animate-pulse mt-2">Scanning clinical CDP ledger...</div>
              </div>
            ) : (
              <div className="whitespace-pre-line font-sans" id="ai-insights-text">
                {insight}
              </div>
            )}
          </div>
        </div>

        {/* Prediction Accuracy Meter */}
        <div className="p-4 border border-white/15 bg-black/40 rounded-none space-y-2 mb-6" id="accuracy-meter-container">
          <div className="flex justify-between items-center text-[9px] uppercase font-mono tracking-wider">
            <span className="text-white/40 font-bold">Prediction Accuracy</span>
            <span className="text-flywheel font-black">98.4%</span>
          </div>
          <div className="w-full h-[3px] bg-white/10">
            <div className="w-[98%] h-full bg-flywheel transition-all duration-1000"></div>
          </div>
        </div>

        {/* Quick query presets */}
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-2 flex items-center gap-1">
            <Layers size={8} /> Fast Clinical Pathway Diagnosis
          </div>
          <div className="space-y-2" id="preset-queries-block">
            {PRESET_QUERIES.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handlePresetClick(q)}
                className="w-full text-left p-2 border border-white/5 bg-black/30 hover:bg-white/5 hover:border-flywheel/50 text-[11px] text-white/60 hover:text-white transition-all rounded-none line-clamp-1"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input box */}
      <form onSubmit={handleCustomSubmit} className="mt-6 pt-4 border-t border-white/10 flex gap-2" id="ai-custom-prompt-form">
        <input
          type="text"
          placeholder="Ask Gemini for pathways audit advice..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          disabled={loading}
          className="flex-1 p-2 bg-black border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-flywheel"
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="p-2 border border-flywheel bg-flywheel text-black hover:bg-black hover:text-flywheel transition-all flex-shrink-0"
        >
          <Send size={12} />
        </button>
      </form>
    </div>
  );
}
