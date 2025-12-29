"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface CreditApplication {
  annual_income: number;
  employment_years: number;
  debt_to_income: number;
  credit_score: number;
  loan_amount: number;
  loan_purpose: string;
}

interface ExplanationResult {
  method: string;
  explanation_text: string;
  conditions: string[];
  complexity: number;
  precision: number | null;
  coverage: number | null;
  time_ms: number;
}

interface AnalysisResult {
  prediction: {
    decision: string;
    probability: number;
    risk_level: string;
  };
  explanations: Record<string, ExplanationResult>;
}

export default function DemoPage() {
  const router = useRouter();
  
  const [form, setForm] = useState<CreditApplication>({
    annual_income: 55000,
    employment_years: 3,
    debt_to_income: 0.35,
    credit_score: 680,
    loan_amount: 15000,
    loan_purpose: "debt_consolidation",
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [totalTime, setTotalTime] = useState(0);

  const analyze = async () => {
    setIsAnalyzing(true);
    setResult(null);
    
    const startTime = Date.now();
    
    try {
      // Step 1: Predicting
      setAnalysisStep("🔮 Making prediction with Decision Tree model...");
      await new Promise(r => setTimeout(r, 500));
      
      // Step 2: GPE
      setAnalysisStep("🎯 Running GPE (Greedy-Prune-Explain)...");
      await new Promise(r => setTimeout(r, 300));
      
      // Step 3: LIME
      setAnalysisStep("📊 Running LIME (Local Interpretable Model-agnostic Explanations)...");
      await new Promise(r => setTimeout(r, 300));
      
      // Step 4: Anchors
      setAnalysisStep("⚓ Running Anchors explanation...");
      
      const response = await fetch(`${API_URL}/api/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, scenario_id: 0 }),
      });
      
      if (!response.ok) throw new Error("Analysis failed");
      
      const data = await response.json();
      
      setAnalysisStep("✅ Analysis complete!");
      setTotalTime(Date.now() - startTime);
      setResult(data);
      
    } catch (error) {
      console.error(error);
      setAnalysisStep("❌ Error during analysis");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const methodColors: Record<string, { bg: string; text: string; border: string }> = {
    gpe: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/50" },
    lime: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/50" },
    anchors: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/50" },
  };

  const methodLabels: Record<string, string> = {
    gpe: "🎯 GPE (Greedy-Prune-Explain)",
    lime: "📊 LIME (Feature Importance)",
    anchors: "⚓ Anchors (Rule-based)",
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.push("/")}
              className="text-gray-400 hover:text-white transition mb-2 flex items-center gap-2"
            >
              ← Back to Home
            </button>
            <h1 className="text-3xl font-bold text-white">
              🔬 Interactive Demo
            </h1>
            <p className="text-gray-400 mt-1">
              Enter your own credit application and see real-time AI explanations
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Powered by</div>
            <div className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              GPE Framework
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              📝 Credit Application
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Annual Income ($)
                </label>
                <input
                  type="number"
                  value={form.annual_income}
                  onChange={(e) => setForm({ ...form, annual_income: Number(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="55000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Years of Employment
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={form.employment_years}
                  onChange={(e) => setForm({ ...form, employment_years: Number(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Debt-to-Income Ratio: {(form.debt_to_income * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={form.debt_to_income}
                  onChange={(e) => setForm({ ...form, debt_to_income: Number(e.target.value) })}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Credit Score: {form.credit_score}
                </label>
                <input
                  type="range"
                  min="300"
                  max="850"
                  value={form.credit_score}
                  onChange={(e) => setForm({ ...form, credit_score: Number(e.target.value) })}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>300 (Poor)</span>
                  <span>650</span>
                  <span>850 (Excellent)</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Loan Amount ($)
                </label>
                <input
                  type="number"
                  value={form.loan_amount}
                  onChange={(e) => setForm({ ...form, loan_amount: Number(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="15000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Loan Purpose
                </label>
                <select
                  value={form.loan_purpose}
                  onChange={(e) => setForm({ ...form, loan_purpose: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="debt_consolidation">Debt Consolidation</option>
                  <option value="home_improvement">Home Improvement</option>
                  <option value="major_purchase">Major Purchase</option>
                  <option value="medical">Medical Expenses</option>
                  <option value="car">Car Purchase</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <button
              onClick={analyze}
              disabled={isAnalyzing}
              className={`
                w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3
                ${isAnalyzing 
                  ? "bg-blue-500/50 text-white/50 cursor-wait" 
                  : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/25"}
              `}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  🚀 Analyze with AI
                </>
              )}
            </button>

            {/* Analysis Progress */}
            {isAnalyzing && (
              <div className="mt-4 p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
                <div className="text-blue-300 text-sm font-mono animate-pulse">
                  {analysisStep}
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="space-y-6">
            {result ? (
              <>
                {/* Decision */}
                <div className={`
                  rounded-2xl p-6 border-2 backdrop-blur-lg
                  ${result.prediction.decision === "approved" 
                    ? "bg-green-500/10 border-green-500/50" 
                    : "bg-red-500/10 border-red-500/50"}
                `}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-400 uppercase tracking-wide">AI Decision</div>
                      <div className={`text-3xl font-bold ${
                        result.prediction.decision === "approved" ? "text-green-400" : "text-red-400"
                      }`}>
                        {result.prediction.decision === "approved" ? "✓ APPROVED" : "✗ DENIED"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Confidence</div>
                      <div className="text-2xl font-bold text-white">
                        {(result.prediction.probability * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      Risk Level: <span className={`font-semibold ${
                        result.prediction.risk_level === "low" ? "text-green-400" :
                        result.prediction.risk_level === "medium" ? "text-yellow-400" : "text-red-400"
                      }`}>{result.prediction.risk_level.toUpperCase()}</span>
                    </span>
                    <span className="text-gray-500">
                      Total time: {totalTime}ms
                    </span>
                  </div>
                </div>

                {/* Explanations */}
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  🔍 Explanations from 3 Methods
                </h3>
                
                {Object.entries(result.explanations).map(([method, exp]) => {
                  const colors = methodColors[exp.method] || methodColors.gpe;
                  const label = methodLabels[exp.method] || exp.method;
                  const isRule = exp.method === "gpe" || exp.method === "anchors";
                  
                  return (
                    <div
                      key={method}
                      className={`rounded-2xl p-6 border backdrop-blur-lg ${colors.bg} ${colors.border}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className={`text-lg font-bold ${colors.text}`}>
                          {label}
                        </h4>
                        <span className="text-xs text-gray-400 font-mono bg-white/10 px-2 py-1 rounded">
                          {exp.time_ms.toFixed(1)}ms
                        </span>
                      </div>
                      
                      {isRule ? (
                        <div className="space-y-3">
                          <div className="font-mono text-sm bg-black/20 rounded-xl p-4">
                            <span className={`font-bold ${colors.text}`}>IF</span>
                            <div className="ml-4 mt-2 space-y-1">
                              {exp.conditions.map((cond, idx) => (
                                <div key={idx} className="text-gray-300">
                                  {idx > 0 && <span className={`font-bold ${colors.text}`}>AND </span>}
                                  <span className="bg-white/10 px-2 py-1 rounded">{cond}</span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3">
                              <span className={`font-bold ${colors.text}`}>THEN </span>
                              <span className="text-white font-semibold">
                                {result.prediction.decision === "approved" ? "Approved" : "Denied"}
                              </span>
                            </div>
                          </div>
                          
                          {exp.precision !== null && (
                            <div className="flex gap-4 text-sm">
                              <span className="text-gray-400">
                                Precision: <span className={`font-semibold ${colors.text}`}>
                                  {(exp.precision * 100).toFixed(1)}%
                                </span>
                              </span>
                              {exp.coverage !== null && (
                                <span className="text-gray-400">
                                  Coverage: <span className={`font-semibold ${colors.text}`}>
                                    {(exp.coverage * 100).toFixed(1)}%
                                  </span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {exp.conditions.slice(0, 6).map((cond, idx) => {
                            const match = cond.match(/: ([↑↓]) \(([+-]?\d+\.\d+)\)/);
                            const direction = match?.[1];
                            const weight = match ? parseFloat(match[2]) : 0;
                            const isPositive = direction === "↑" || weight > 0;
                            const barWidth = Math.min(Math.abs(weight) * 150, 100);
                            
                            return (
                              <div key={idx} className="flex items-center gap-3">
                                <div className="w-40 text-sm text-gray-300 truncate">
                                  {cond.split(":")[0]}
                                </div>
                                <div className="flex-1 flex items-center gap-2">
                                  <div 
                                    className={`h-3 rounded ${isPositive ? "bg-green-500" : "bg-red-500"}`}
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
                      
                      <div className="mt-4 pt-4 border-t border-white/10 text-sm text-gray-400">
                        Complexity: <span className="font-semibold text-white">{exp.complexity} features/conditions</span>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">👆</div>
                  <p className="text-lg">Fill in the form and click &quot;Analyze with AI&quot;</p>
                  <p className="text-sm mt-2">to see real-time explanations from GPE, LIME, and Anchors</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

