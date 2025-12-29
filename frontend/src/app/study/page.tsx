"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RatingScale from "@/components/RatingScale";

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
  conditions: string[];
  complexity: number;
  precision: number | null;
  coverage: number | null;
  time_ms: number;
}

interface CaseResult {
  caseId: number;
  application: CreditApplication;
  prediction: { decision: string; probability: number };
  explanations: Record<string, ExplanationResult>;
}

type Phase = "input" | "analyzing" | "results" | "rating" | "final" | "complete";

const defaultCases: CreditApplication[] = [
  { annual_income: 85000, employment_years: 7, debt_to_income: 0.22, credit_score: 750, loan_amount: 10000, loan_purpose: "home_improvement" },
  { annual_income: 52000, employment_years: 2.5, debt_to_income: 0.38, credit_score: 650, loan_amount: 18000, loan_purpose: "debt_consolidation" },
  { annual_income: 38000, employment_years: 1, debt_to_income: 0.52, credit_score: 580, loan_amount: 25000, loan_purpose: "major_purchase" },
];

const methodInfo: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  gpe: { icon: "🎯", label: "GPE", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  lime: { icon: "📊", label: "LIME", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" },
  anchors: { icon: "⚓", label: "Anchors", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30" },
};

export default function StudyPage() {
  const router = useRouter();
  
  const [phase, setPhase] = useState<Phase>("input");
  const [cases, setCases] = useState<CreditApplication[]>(defaultCases);
  const [results, setResults] = useState<CaseResult[]>([]);
  
  // Analysis progress
  const [currentCase, setCurrentCase] = useState(0);
  const [currentMethod, setCurrentMethod] = useState("");
  const [analysisProgress, setAnalysisProgress] = useState<string[]>([]);
  
  // Rating state
  const [ratingCase, setRatingCase] = useState(0);
  const [ratingMethod, setRatingMethod] = useState(0);
  const [ratings, setRatings] = useState({ clarity: null as number | null, trust: null as number | null });
  const [allRatings, setAllRatings] = useState<any[]>([]);
  
  // Final survey
  const [finalSurvey, setFinalSurvey] = useState({
    preferred_method: "",
    feedback: "",
  });

  const updateCase = (index: number, field: keyof CreditApplication, value: number | string) => {
    const newCases = [...cases];
    newCases[index] = { ...newCases[index], [field]: value };
    setCases(newCases);
  };

  const analyzeAll = async () => {
    setPhase("analyzing");
    setAnalysisProgress([]);
    const newResults: CaseResult[] = [];
    
    for (let i = 0; i < cases.length; i++) {
      setCurrentCase(i + 1);
      
      // Show progress for each method
      setCurrentMethod("model");
      setAnalysisProgress(prev => [...prev, `Case ${i + 1}: 🤖 Running Decision Tree model...`]);
      await new Promise(r => setTimeout(r, 300));
      
      setCurrentMethod("gpe");
      setAnalysisProgress(prev => [...prev, `Case ${i + 1}: 🎯 Running GPE (Greedy-Prune-Explain)...`]);
      await new Promise(r => setTimeout(r, 200));
      
      setCurrentMethod("lime");
      setAnalysisProgress(prev => [...prev, `Case ${i + 1}: 📊 Running LIME...`]);
      await new Promise(r => setTimeout(r, 200));
      
      setCurrentMethod("anchors");
      setAnalysisProgress(prev => [...prev, `Case ${i + 1}: ⚓ Running Anchors...`]);
      
      try {
        const response = await fetch(`${API_URL}/api/explain`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...cases[i], scenario_id: i }),
        });
        
        const data = await response.json();
        
        newResults.push({
          caseId: i + 1,
          application: cases[i],
          prediction: data.prediction,
          explanations: data.explanations,
        });
        
        setAnalysisProgress(prev => [...prev, `Case ${i + 1}: ✅ Complete!`]);
      } catch (error) {
        setAnalysisProgress(prev => [...prev, `Case ${i + 1}: ❌ Error!`]);
      }
      
      await new Promise(r => setTimeout(r, 500));
    }
    
    setResults(newResults);
    setAnalysisProgress(prev => [...prev, "🎉 All cases analyzed!"]);
    await new Promise(r => setTimeout(r, 1000));
    setPhase("results");
  };

  const startRating = () => {
    setRatingCase(0);
    setRatingMethod(0);
    setPhase("rating");
  };

  const submitRating = () => {
    const result = results[ratingCase];
    const methods = Object.keys(result.explanations);
    const method = methods[ratingMethod];
    
    setAllRatings([...allRatings, {
      caseId: ratingCase + 1,
      method,
      ...ratings,
    }]);
    
    setRatings({ clarity: null, trust: null });
    
    // Move to next
    if (ratingMethod < methods.length - 1) {
      setRatingMethod(ratingMethod + 1);
    } else if (ratingCase < results.length - 1) {
      setRatingCase(ratingCase + 1);
      setRatingMethod(0);
    } else {
      setPhase("final");
    }
  };

  const submitFinal = () => {
    // In real implementation, send to backend
    console.log("Ratings:", allRatings);
    console.log("Final:", finalSurvey);
    setPhase("complete");
  };

  // ========== INPUT PHASE ==========
  if (phase === "input") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              📝 Enter 3 Credit Applications
            </h1>
            <p className="text-gray-400">
              Fill in 3 different credit scenarios to analyze
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {cases.map((c, i) => (
              <div key={i} className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm">
                    {i + 1}
                  </span>
                  Case {i + 1}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400">Annual Income ($)</label>
                    <input
                      type="number"
                      value={c.annual_income}
                      onChange={(e) => updateCase(i, "annual_income", Number(e.target.value))}
                      className="w-full mt-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400">Employment (years)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={c.employment_years}
                      onChange={(e) => updateCase(i, "employment_years", Number(e.target.value))}
                      className="w-full mt-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400">Debt-to-Income: {(c.debt_to_income * 100).toFixed(0)}%</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={c.debt_to_income}
                      onChange={(e) => updateCase(i, "debt_to_income", Number(e.target.value))}
                      className="w-full mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400">Credit Score: {c.credit_score}</label>
                    <input
                      type="range"
                      min="300"
                      max="850"
                      value={c.credit_score}
                      onChange={(e) => updateCase(i, "credit_score", Number(e.target.value))}
                      className="w-full mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400">Loan Amount ($)</label>
                    <input
                      type="number"
                      value={c.loan_amount}
                      onChange={(e) => updateCase(i, "loan_amount", Number(e.target.value))}
                      className="w-full mt-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400">Purpose</label>
                    <select
                      value={c.loan_purpose}
                      onChange={(e) => updateCase(i, "loan_purpose", e.target.value)}
                      className="w-full mt-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="debt_consolidation">Debt Consolidation</option>
                      <option value="home_improvement">Home Improvement</option>
                      <option value="major_purchase">Major Purchase</option>
                      <option value="medical">Medical</option>
                      <option value="car">Car</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={analyzeAll}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold text-xl hover:shadow-lg hover:shadow-blue-500/25 transition flex items-center justify-center gap-3"
          >
            🚀 Analyze All 3 Cases with GPE, LIME & Anchors
          </button>
        </div>
      </main>
    );
  }

  // ========== ANALYZING PHASE ==========
  if (phase === "analyzing") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
              <div className="absolute inset-2 bg-blue-500/40 rounded-full animate-pulse"></div>
              <div className="absolute inset-4 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-3xl">🔬</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Analyzing Case {currentCase} of 3
            </h2>
            <p className="text-gray-400">
              Running real AI frameworks...
            </p>
          </div>
          
          {/* Progress indicators */}
          <div className="flex justify-center gap-4 mb-8">
            {["gpe", "lime", "anchors"].map((m) => {
              const info = methodInfo[m];
              const isActive = currentMethod === m;
              const isDone = analysisProgress.some(p => p.includes("Complete") && p.includes(`Case ${currentCase}`));
              
              return (
                <div
                  key={m}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive ? `${info.bg} ${info.color} scale-110` :
                    isDone ? "bg-green-500/20 text-green-400" :
                    "bg-white/10 text-gray-500"
                  }`}
                >
                  {info.icon} {info.label}
                </div>
              );
            })}
          </div>
          
          {/* Log */}
          <div className="bg-black/30 rounded-xl p-4 font-mono text-sm max-h-64 overflow-y-auto">
            {analysisProgress.map((line, i) => (
              <div key={i} className={`mb-1 ${
                line.includes("✅") ? "text-green-400" :
                line.includes("❌") ? "text-red-400" :
                line.includes("🎉") ? "text-yellow-400" :
                "text-blue-300"
              }`}>
                {line}
              </div>
            ))}
            <div className="animate-pulse text-gray-500">▌</div>
          </div>
        </div>
      </main>
    );
  }

  // ========== RESULTS PHASE ==========
  if (phase === "results") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              🎉 Analysis Complete!
            </h1>
            <p className="text-gray-400">
              Review the results from all 3 AI explanation methods
            </p>
          </div>
          
          {results.map((result, i) => (
            <div key={i} className="mb-8 bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">
                  Case {result.caseId}: ${result.application.annual_income.toLocaleString()} income, {result.application.credit_score} score
                </h2>
                <span className={`px-4 py-2 rounded-full font-bold ${
                  result.prediction.decision === "approved" 
                    ? "bg-green-500/20 text-green-400" 
                    : "bg-red-500/20 text-red-400"
                }`}>
                  {result.prediction.decision === "approved" ? "✓ APPROVED" : "✗ DENIED"}
                </span>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                {Object.entries(result.explanations).map(([key, exp]) => {
                  const info = methodInfo[exp.method] || methodInfo.gpe;
                  
                  return (
                    <div key={key} className={`rounded-xl p-4 border ${info.bg}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`font-bold ${info.color}`}>
                          {info.icon} {info.label}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          {exp.time_ms.toFixed(1)}ms
                        </span>
                      </div>
                      
                      {exp.method === "lime" ? (
                        <div className="text-sm text-gray-300 space-y-1">
                          {exp.conditions.slice(0, 3).map((c, j) => (
                            <div key={j} className="truncate">{c}</div>
                          ))}
                        </div>
                      ) : (
                        <div className="font-mono text-xs bg-black/20 rounded-lg p-3">
                          <span className={info.color}>IF </span>
                          {exp.conditions.slice(0, 2).join(" AND ")}
                          <span className={info.color}> THEN </span>
                          {result.prediction.decision}
                        </div>
                      )}
                      
                      <div className="mt-3 text-xs text-gray-400">
                        Complexity: {exp.complexity}
                        {exp.precision && ` • Precision: ${(exp.precision * 100).toFixed(0)}%`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          <button
            onClick={startRating}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold text-xl hover:shadow-lg transition"
          >
            📊 Rate the Explanations →
          </button>
        </div>
      </main>
    );
  }

  // ========== RATING PHASE ==========
  if (phase === "rating" && results.length > 0) {
    const result = results[ratingCase];
    const methods = Object.keys(result.explanations);
    const method = methods[ratingMethod];
    const exp = result.explanations[method];
    const info = methodInfo[exp.method] || methodInfo.gpe;
    
    const progress = (ratingCase * 3 + ratingMethod + 1) / (results.length * 3);
    
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Case {ratingCase + 1}, Method {ratingMethod + 1}/3</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
              <span className="text-3xl">{info.icon}</span>
              Rate: {info.label}
            </h2>
            <p className="text-gray-400 mb-6">
              Case {ratingCase + 1}: ${result.application.annual_income.toLocaleString()} income → 
              <span className={result.prediction.decision === "approved" ? "text-green-400" : "text-red-400"}>
                {" "}{result.prediction.decision.toUpperCase()}
              </span>
            </p>
            
            {/* Explanation preview */}
            <div className={`rounded-xl p-4 mb-8 border ${info.bg}`}>
              {exp.method === "lime" ? (
                <div className="text-sm text-gray-300">
                  {exp.conditions.slice(0, 4).map((c, i) => (
                    <div key={i}>{c}</div>
                  ))}
                </div>
              ) : (
                <div className="font-mono text-sm">
                  <span className={info.color}>IF </span>
                  {exp.conditions.join(" AND ")}
                  <span className={info.color}> THEN </span>
                  {result.prediction.decision}
                </div>
              )}
            </div>
            
            <RatingScale
              label="How CLEAR is this explanation?"
              value={ratings.clarity}
              onChange={(v) => setRatings({ ...ratings, clarity: v })}
              minLabel="Very Unclear"
              maxLabel="Very Clear"
            />
            
            <RatingScale
              label="How much do you TRUST this explanation?"
              value={ratings.trust}
              onChange={(v) => setRatings({ ...ratings, trust: v })}
              minLabel="No Trust"
              maxLabel="Full Trust"
            />
            
            <button
              onClick={submitRating}
              disabled={!ratings.clarity || !ratings.trust}
              className={`w-full py-4 rounded-xl font-bold text-lg transition ${
                ratings.clarity && ratings.trust
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg"
                  : "bg-gray-700 text-gray-500 cursor-not-allowed"
              }`}
            >
              Next →
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ========== FINAL PHASE ==========
  if (phase === "final") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">🏆 Final Question</h2>
            
            <p className="text-gray-300 mb-6">Which explanation method did you find MOST helpful overall?</p>
            
            <div className="space-y-3 mb-8">
              {Object.entries(methodInfo).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => setFinalSurvey({ ...finalSurvey, preferred_method: key })}
                  className={`w-full p-4 rounded-xl border text-left transition flex items-center gap-3 ${
                    finalSurvey.preferred_method === key
                      ? `${info.bg} border-2`
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <span className="text-2xl">{info.icon}</span>
                  <span className={`font-bold ${finalSurvey.preferred_method === key ? info.color : "text-white"}`}>
                    {info.label}
                  </span>
                </button>
              ))}
            </div>
            
            <div className="mb-8">
              <label className="text-gray-300 block mb-2">Any feedback? (optional)</label>
              <textarea
                value={finalSurvey.feedback}
                onChange={(e) => setFinalSurvey({ ...finalSurvey, feedback: e.target.value })}
                className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white"
                rows={3}
                placeholder="What did you like or dislike about each method?"
              />
            </div>
            
            <button
              onClick={submitFinal}
              disabled={!finalSurvey.preferred_method}
              className={`w-full py-4 rounded-xl font-bold text-lg transition ${
                finalSurvey.preferred_method
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg"
                  : "bg-gray-700 text-gray-500 cursor-not-allowed"
              }`}
            >
              Submit ✓
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ========== COMPLETE PHASE ==========
  if (phase === "complete") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center">
          <div className="text-8xl mb-6">🎉</div>
          <h1 className="text-4xl font-bold text-white mb-4">Thank You!</h1>
          <p className="text-xl text-gray-300 mb-8">
            Your feedback will help improve explainable AI systems.
          </p>
          
          <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
            <p className="text-gray-400">
              You rated <span className="text-white font-bold">{allRatings.length}</span> explanations
              and preferred <span className={`font-bold ${methodInfo[finalSurvey.preferred_method]?.color}`}>
                {methodInfo[finalSurvey.preferred_method]?.icon} {methodInfo[finalSurvey.preferred_method]?.label}
              </span>
            </p>
          </div>
          
          <button
            onClick={() => router.push("/")}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold hover:shadow-lg transition"
          >
            Return to Home
          </button>
        </div>
      </main>
    );
  }

  return null;
}
