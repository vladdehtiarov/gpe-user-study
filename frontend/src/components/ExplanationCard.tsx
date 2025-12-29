"use client";

import { ExplanationResult } from "@/lib/api";

interface ExplanationCardProps {
  explanation: ExplanationResult;
  methodName?: string;
  showMethodName?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

const methodInfo: Record<string, { icon: string; label: string; color: string; bgColor: string; borderColor: string }> = {
  gpe: { 
    icon: "🎯", 
    label: "GPE (Greedy-Prune-Explain)", 
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30"
  },
  lime: { 
    icon: "📊", 
    label: "LIME (Feature Importance)", 
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30"
  },
  anchors: { 
    icon: "⚓", 
    label: "Anchors (Rule-based)", 
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30"
  },
};

export default function ExplanationCard({
  explanation,
  methodName,
  showMethodName = true,
  isSelected = false,
  onClick,
}: ExplanationCardProps) {
  const method = methodName || explanation.method;
  const info = methodInfo[method] || methodInfo.gpe;
  const isRule = method === "gpe" || method === "anchors";
  
  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl p-6 border-2 backdrop-blur-lg transition-all cursor-pointer
        ${info.bgColor} ${info.borderColor}
        ${isSelected ? "ring-2 ring-blue-500 scale-[1.02]" : "hover:scale-[1.01]"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{info.icon}</span>
          {showMethodName && (
            <span className={`font-bold ${info.color}`}>
              {info.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-mono bg-black/20 px-2 py-1 rounded">
            {explanation.time_ms.toFixed(1)}ms
          </span>
          {isSelected && (
            <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
              ✓ Selected
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {isRule ? (
        <div className="space-y-3">
          <div className="font-mono text-sm bg-black/20 rounded-xl p-4">
            <span className={`font-bold ${info.color}`}>IF</span>
            <div className="ml-4 mt-2 space-y-1">
              {explanation.conditions.map((cond, idx) => (
                <div key={idx} className="text-gray-300">
                  {idx > 0 && <span className={`font-bold ${info.color}`}>AND </span>}
                  <span className="bg-white/10 px-2 py-1 rounded text-sm">{cond}</span>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <span className={`font-bold ${info.color}`}>THEN </span>
              <span className="text-white font-semibold">
                {explanation.explanation_text.includes("Approved") ? "✓ Approved" : "✗ Denied"}
              </span>
            </div>
          </div>
          
          {/* Metrics */}
          {explanation.precision !== null && (
            <div className="flex gap-4 text-sm">
              <span className="text-gray-400">
                Precision: <span className={`font-semibold ${info.color}`}>
                  {(explanation.precision * 100).toFixed(1)}%
                </span>
              </span>
              {explanation.coverage !== null && (
                <span className="text-gray-400">
                  Coverage: <span className={`font-semibold ${info.color}`}>
                    {(explanation.coverage * 100).toFixed(1)}%
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        /* LIME-style feature importance */
        <div className="space-y-2">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">
            Feature Contributions:
          </div>
          {explanation.conditions.slice(0, 6).map((condition, idx) => {
            const match = condition.match(/: ([↑↓]) \(([+-]?\d+\.\d+)\)/);
            const direction = match?.[1];
            const weight = match ? parseFloat(match[2]) : 0;
            const isPositive = direction === "↑" || weight > 0;
            const barWidth = Math.min(Math.abs(weight) * 150, 100);
            
            return (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-36 text-sm text-gray-300 truncate">
                  {condition.split(":")[0]}
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div 
                    className={`h-3 rounded transition-all ${isPositive ? "bg-green-500" : "bg-red-500"}`}
                    style={{ width: `${barWidth}%` }}
                  />
                  <span className={`text-xs font-mono ${isPositive ? "text-green-400" : "text-red-400"}`}>
                    {weight > 0 ? "+" : ""}{weight.toFixed(3)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-sm">
        <span className="text-gray-400">
          Complexity: <span className="text-white font-semibold">{explanation.complexity}</span>
        </span>
      </div>
    </div>
  );
}
