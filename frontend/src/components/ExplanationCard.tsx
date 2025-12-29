"use client";

import { ExplanationResult } from "@/lib/api";

interface ExplanationCardProps {
  explanation: ExplanationResult;
  label: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function ExplanationCard({
  explanation,
  label,
  isSelected = false,
  onClick,
}: ExplanationCardProps) {
  const isRule = explanation.method === "gpe" || explanation.method === "anchors";
  
  return (
    <div
      onClick={onClick}
      className={`
        explanation-card cursor-pointer
        ${isSelected ? "ring-2 ring-blue-500 border-blue-500" : ""}
      `}
    >
      {/* Label */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-lg font-semibold text-gray-900">
          Method {label}
        </span>
        <span className="text-xs text-gray-400">
          {explanation.time_ms.toFixed(1)}ms
        </span>
      </div>

      {/* Explanation content */}
      {isRule ? (
        <div className="space-y-3">
          <div className="text-sm text-gray-500 uppercase tracking-wide">
            Decision Rule:
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="font-mono text-sm">
              <span className="text-blue-600 font-bold">IF</span>
              <div className="ml-4 mt-2 space-y-1">
                {explanation.conditions.map((condition, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {idx > 0 && (
                      <span className="text-orange-500 font-bold">AND</span>
                    )}
                    <span className="condition-pill">{condition}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <span className="text-blue-600 font-bold">THEN</span>
                <span className="ml-2 font-semibold">
                  {explanation.explanation_text.includes("Approved") ? "✓ Approved" : "✗ Denied"}
                </span>
              </div>
            </div>
          </div>
          
          {/* Metrics */}
          {explanation.precision !== null && (
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-gray-500">Precision:</span>
                <span className="ml-1 font-semibold text-green-600">
                  {(explanation.precision * 100).toFixed(1)}%
                </span>
              </div>
              {explanation.coverage !== null && (
                <div>
                  <span className="text-gray-500">Coverage:</span>
                  <span className="ml-1 font-semibold text-blue-600">
                    {(explanation.coverage * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* LIME-style feature importance */
        <div className="space-y-3">
          <div className="text-sm text-gray-500 uppercase tracking-wide">
            Feature Contributions:
          </div>
          <div className="space-y-2">
            {explanation.conditions.slice(0, 6).map((condition, idx) => {
              const match = condition.match(/: ([↑↓]) \(([+-]?\d+\.\d+)\)/);
              const direction = match?.[1];
              const weight = match ? parseFloat(match[2]) : 0;
              const isPositive = direction === "↑" || weight > 0;
              const barWidth = Math.min(Math.abs(weight) * 150, 100);
              
              return (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div className="w-48 truncate text-gray-700">
                    {condition.split(":")[0]}
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div 
                      className={`h-3 rounded ${isPositive ? "bg-green-500" : "bg-red-500"}`}
                      style={{ width: `${barWidth}%` }}
                    />
                    <span className={`text-xs font-mono ${isPositive ? "text-green-600" : "text-red-600"}`}>
                      {weight > 0 ? "+" : ""}{weight.toFixed(3)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Complexity indicator */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
        <span className="text-gray-500">
          Complexity: <span className="font-semibold">{explanation.complexity} features</span>
        </span>
        {isSelected && (
          <span className="text-blue-600 font-semibold">✓ Selected</span>
        )}
      </div>
    </div>
  );
}

