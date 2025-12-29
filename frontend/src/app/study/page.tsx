"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RatingScale from "@/components/RatingScale";
import {
  createSession,
  getScenarioExplanations,
  submitRating,
  submitFinalSurvey,
  ScenarioExplanations,
  RatingInput,
  ExplanationResult,
} from "@/lib/api";

type StudyPhase = "loading" | "analyzing" | "scenario" | "rating" | "final" | "complete";

interface Ratings {
  clarity: number | null;
  confidence: number | null;
  trust: number | null;
  actionability: number | null;
}

const methodInfo: Record<string, { icon: string; label: string; color: string; bgColor: string }> = {
  gpe: { icon: "🎯", label: "GPE (Greedy-Prune-Explain)", color: "text-emerald-400", bgColor: "bg-emerald-500/10 border-emerald-500/30" },
  lime: { icon: "📊", label: "LIME (Feature Importance)", color: "text-orange-400", bgColor: "bg-orange-500/10 border-orange-500/30" },
  anchors: { icon: "⚓", label: "Anchors (Rule-based)", color: "text-purple-400", bgColor: "bg-purple-500/10 border-purple-500/30" },
};

export default function StudyPage() {
  const router = useRouter();
  
  const [sessionId, setSessionId] = useState<string>("");
  const [phase, setPhase] = useState<StudyPhase>("loading");
  const [currentScenario, setCurrentScenario] = useState(1);
  const [currentMethod, setCurrentMethod] = useState(0);
  const [analysisStep, setAnalysisStep] = useState("");
  
  const [scenarioData, setScenarioData] = useState<ScenarioExplanations | null>(null);
  const [methodOrder, setMethodOrder] = useState<string[]>([]);
  
  const [ratings, setRatings] = useState<Ratings>({
    clarity: null,
    confidence: null,
    trust: null,
    actionability: null,
  });
  
  const [finalSurvey, setFinalSurvey] = useState({
    gpe_rank: 0,
    lime_rank: 0,
    anchors_rank: 0,
    preferred_method: "",
    ml_familiarity: null as number | null,
    feedback: "",
  });
  
  const [allRatings, setAllRatings] = useState<RatingInput[]>([]);

  // Initialize session and load first scenario
  useEffect(() => {
    const init = async () => {
      try {
        setPhase("loading");
        setAnalysisStep("🔄 Creating study session...");
        
        const session = await createSession(navigator.userAgent);
        setSessionId(session.session_id);
        
        await loadScenario(1);
      } catch (error) {
        console.error("Failed to initialize:", error);
        setAnalysisStep("❌ Failed to connect to server. Make sure backend is running!");
      }
    };
    init();
  }, []);

  const loadScenario = async (scenarioId: number) => {
    setPhase("analyzing");
    
    // Show analysis steps
    setAnalysisStep("🔮 Loading credit application data...");
    await new Promise(r => setTimeout(r, 500));
    
    setAnalysisStep("🤖 Running Decision Tree model...");
    await new Promise(r => setTimeout(r, 400));
    
    setAnalysisStep("🎯 Running GPE (Greedy-Prune-Explain)...");
    await new Promise(r => setTimeout(r, 300));
    
    setAnalysisStep("📊 Running LIME explanation...");
    await new Promise(r => setTimeout(r, 300));
    
    setAnalysisStep("⚓ Running Anchors explanation...");
    
    try {
      const data = await getScenarioExplanations(scenarioId);
      setScenarioData(data);
      
      // Get method order from mapping
      const methods = Object.entries(data.method_mapping).map(([key, method]) => ({
        key,
        method: method as string
      }));
      setMethodOrder(methods.map(m => m.method));
      
      setAnalysisStep("✅ Analysis complete!");
      await new Promise(r => setTimeout(r, 500));
      
      setPhase("scenario");
    } catch (error) {
      console.error("Failed to load scenario:", error);
      setAnalysisStep("❌ Failed to analyze. Is the backend running on localhost:8000?");
    }
  };

  const handleRatingComplete = () => {
    if (!scenarioData || !sessionId) return;
    
    const actualMethod = methodOrder[currentMethod];
    
    const rating: RatingInput = {
      session_id: sessionId,
      scenario_id: currentScenario,
      method: actualMethod,
      clarity: ratings.clarity!,
      confidence: ratings.confidence!,
      trust: ratings.trust!,
      actionability: ratings.actionability!,
    };
    
    setAllRatings([...allRatings, rating]);
    setRatings({ clarity: null, confidence: null, trust: null, actionability: null });
    
    if (currentMethod < methodOrder.length - 1) {
      setCurrentMethod(currentMethod + 1);
    } else if (currentScenario < 3) {
      setCurrentScenario(currentScenario + 1);
      setCurrentMethod(0);
      loadScenario(currentScenario + 1);
    } else {
      setPhase("final");
    }
  };

  const handleFinalSubmit = async () => {
    try {
      for (const rating of allRatings) {
        await submitRating(rating);
      }
      
      await submitFinalSurvey({
        session_id: sessionId,
        gpe_rank: finalSurvey.gpe_rank,
        lime_rank: finalSurvey.lime_rank,
        anchors_rank: finalSurvey.anchors_rank,
        preferred_method: finalSurvey.preferred_method,
        ml_familiarity: finalSurvey.ml_familiarity || undefined,
        feedback: finalSurvey.feedback || undefined,
      });
      
      setPhase("complete");
    } catch (error) {
      console.error("Failed to submit:", error);
    }
  };

  const isRatingComplete = ratings.clarity && ratings.confidence && ratings.trust && ratings.actionability;
  const isFinalComplete = finalSurvey.gpe_rank > 0 && finalSurvey.lime_rank > 0 && finalSurvey.anchors_rank > 0 && finalSurvey.preferred_method;

  const totalSteps = 3 * 3 + 1;
  const currentStep = (currentScenario - 1) * 3 + currentMethod + 1;

  // Get current explanation for rating phase
  const getCurrentExplanation = (): ExplanationResult | null => {
    if (!scenarioData) return null;
    const method = methodOrder[currentMethod];
    // Find the explanation that matches this method
    for (const exp of Object.values(scenarioData.explanations)) {
      if (exp.method === method) return exp;
    }
    return null;
  };

  // LOADING / ANALYZING
  if (phase === "loading" || phase === "analyzing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
              <div className="absolute inset-2 bg-blue-500/40 rounded-full animate-pulse"></div>
              <div className="absolute inset-4 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔬</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              {phase === "loading" ? "Setting Up Study..." : "Analyzing Scenario..."}
            </h2>
          </div>
          
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="text-blue-300 font-mono text-sm animate-pulse">
              {analysisStep}
            </div>
            
            {phase === "analyzing" && (
              <div className="mt-4 flex gap-1 justify-center">
                {["GPE", "LIME", "Anchors"].map((name, i) => (
                  <div 
                    key={name}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-500 ${
                      analysisStep.includes(name) || analysisStep.includes("complete")
                        ? "bg-green-500/20 text-green-400"
                        : "bg-white/10 text-gray-500"
                    }`}
                  >
                    {analysisStep.includes(name) && !analysisStep.includes("complete") ? "⚡" : 
                     analysisStep.includes("complete") ? "✓" : "○"} {name}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <p className="text-gray-500 text-sm mt-6">
            Real AI frameworks are analyzing the credit application...
          </p>
        </div>
      </div>
    );
  }

  // COMPLETE
  if (phase === "complete") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full text-center">
          <div className="text-8xl mb-6">🎉</div>
          <h1 className="text-4xl font-bold text-white mb-4">Thank You!</h1>
          <p className="text-xl text-gray-300 mb-8">
            Your responses have been recorded and will help improve explainable AI systems.
          </p>
          <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
            <p className="text-gray-400">
              You evaluated <span className="text-white font-bold">{allRatings.length}</span> explanations 
              from <span className="text-emerald-400 font-bold">GPE</span>, 
              <span className="text-orange-400 font-bold"> LIME</span>, and 
              <span className="text-purple-400 font-bold"> Anchors</span>.
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold hover:shadow-lg transition"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Scenario {currentScenario} of 3</span>
            <span>{phase === "final" ? totalSteps : currentStep} / {totalSteps}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${((phase === "final" ? totalSteps : currentStep) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* SCENARIO PHASE */}
        {phase === "scenario" && scenarioData && (
          <div className="animate-fade-in">
            {/* Scenario Header */}
            <div className="bg-white/5 backdrop-blur rounded-2xl p-6 mb-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-2">
                Scenario {currentScenario}: {scenarioData.scenario.name}
              </h2>
              <p className="text-gray-400 mb-6">{scenarioData.scenario.description}</p>
              
              {/* Application Data - WITH ACTUAL VALUES */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-sm text-gray-500">Annual Income</div>
                  <div className="text-xl font-bold text-white">
                    ${scenarioData.scenario.application.annual_income.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-sm text-gray-500">Employment</div>
                  <div className="text-xl font-bold text-white">
                    {scenarioData.scenario.application.employment_years} years
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-sm text-gray-500">Debt-to-Income</div>
                  <div className="text-xl font-bold text-white">
                    {(scenarioData.scenario.application.debt_to_income * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-sm text-gray-500">Credit Score</div>
                  <div className="text-xl font-bold text-white">
                    {scenarioData.scenario.application.credit_score}
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-sm text-gray-500">Loan Amount</div>
                  <div className="text-xl font-bold text-white">
                    ${scenarioData.scenario.application.loan_amount.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-sm text-gray-500">Purpose</div>
                  <div className="text-xl font-bold text-white capitalize">
                    {scenarioData.scenario.application.loan_purpose.replace("_", " ")}
                  </div>
                </div>
              </div>

              {/* Decision */}
              <div className={`
                inline-flex items-center gap-3 px-6 py-3 rounded-xl font-bold text-xl
                ${scenarioData.prediction.decision === "approved" 
                  ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                  : "bg-red-500/20 text-red-400 border border-red-500/30"}
              `}>
                {scenarioData.prediction.decision === "approved" ? "✓" : "✗"}
                Decision: {scenarioData.prediction.decision.toUpperCase()}
                <span className="text-sm font-normal opacity-75">
                  ({(scenarioData.prediction.probability * 100).toFixed(0)}% confidence)
                </span>
              </div>
            </div>

            {/* Explanations */}
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              🔍 Compare explanations from 3 different AI methods:
            </h3>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {Object.entries(scenarioData.explanations).map(([key, exp]) => {
                const info = methodInfo[exp.method] || methodInfo.gpe;
                const isRule = exp.method === "gpe" || exp.method === "anchors";
                
                return (
                  <div key={key} className={`rounded-2xl p-5 border ${info.bgColor}`}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{info.icon}</span>
                        <span className={`font-bold ${info.color}`}>{info.label}</span>
                      </div>
                      <span className="text-xs text-gray-400 font-mono bg-black/20 px-2 py-1 rounded">
                        {exp.time_ms.toFixed(1)}ms
                      </span>
                    </div>
                    
                    {/* Content */}
                    {isRule ? (
                      <div className="font-mono text-sm bg-black/20 rounded-xl p-4 mb-3">
                        <span className={`font-bold ${info.color}`}>IF</span>
                        <div className="ml-2 mt-2 space-y-1">
                          {exp.conditions.slice(0, 4).map((cond, idx) => (
                            <div key={idx} className="text-gray-300 text-xs">
                              {idx > 0 && <span className={`font-bold ${info.color}`}>AND </span>}
                              <span className="bg-white/10 px-2 py-0.5 rounded">{cond}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2">
                          <span className={`font-bold ${info.color}`}>THEN </span>
                          <span className="text-white font-semibold">
                            {scenarioData.prediction.decision === "approved" ? "✓ Approved" : "✗ Denied"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 mb-3">
                        {exp.conditions.slice(0, 4).map((cond, idx) => {
                          const match = cond.match(/([+-]?\d+\.\d+)/);
                          const weight = match ? parseFloat(match[1]) : 0;
                          const isPositive = weight > 0;
                          
                          return (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              <div className="w-24 text-gray-400 truncate">{cond.split(":")[0]}</div>
                              <div className={`h-2 rounded ${isPositive ? "bg-green-500" : "bg-red-500"}`}
                                   style={{ width: `${Math.min(Math.abs(weight) * 100, 60)}px` }} />
                              <span className={isPositive ? "text-green-400" : "text-red-400"}>
                                {weight > 0 ? "+" : ""}{weight.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Metrics */}
                    <div className="text-xs text-gray-400 flex gap-3">
                      <span>Complexity: <span className="text-white">{exp.complexity}</span></span>
                      {exp.precision && (
                        <span>Precision: <span className={info.color}>{(exp.precision * 100).toFixed(0)}%</span></span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setPhase("rating")}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-blue-500/25 transition"
            >
              Rate These Explanations →
            </button>
          </div>
        )}

        {/* RATING PHASE */}
        {phase === "rating" && scenarioData && (
          <div className="animate-fade-in">
            <div className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-white/10">
              {(() => {
                const currentExp = getCurrentExplanation();
                const info = currentExp ? (methodInfo[currentExp.method] || methodInfo.gpe) : methodInfo.gpe;
                
                return (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                      <span className="text-3xl">{info.icon}</span>
                      Rate: {info.label}
                    </h2>
                    <p className="text-gray-400 mb-6">
                      Method {currentMethod + 1} of {methodOrder.length} for Scenario {currentScenario}
                    </p>
                    
                    {/* Show the explanation being rated */}
                    {currentExp && (
                      <div className={`rounded-xl p-4 mb-8 border ${info.bgColor}`}>
                        {currentExp.method === "gpe" || currentExp.method === "anchors" ? (
                          <div className="font-mono text-sm">
                            <span className={`font-bold ${info.color}`}>IF </span>
                            {currentExp.conditions.join(" AND ")}
                            <span className={`font-bold ${info.color}`}> THEN </span>
                            {scenarioData.prediction.decision}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-300">
                            {currentExp.conditions.slice(0, 4).join(" | ")}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}

              <div className="space-y-6">
                <RatingScale
                  label="Clarity"
                  description="How clear and easy to understand is this explanation?"
                  value={ratings.clarity}
                  onChange={(v) => setRatings({ ...ratings, clarity: v })}
                  minLabel="Very Unclear"
                  maxLabel="Very Clear"
                />
                <RatingScale
                  label="Confidence"
                  description="How confident are you that you understand the decision?"
                  value={ratings.confidence}
                  onChange={(v) => setRatings({ ...ratings, confidence: v })}
                  minLabel="Not Confident"
                  maxLabel="Very Confident"
                />
                <RatingScale
                  label="Trust"
                  description="How much do you trust this explanation?"
                  value={ratings.trust}
                  onChange={(v) => setRatings({ ...ratings, trust: v })}
                  minLabel="No Trust"
                  maxLabel="Full Trust"
                />
                <RatingScale
                  label="Actionability"
                  description="Does it help you understand what to change?"
                  value={ratings.actionability}
                  onChange={(v) => setRatings({ ...ratings, actionability: v })}
                  minLabel="Not Helpful"
                  maxLabel="Very Helpful"
                />
              </div>

              <button
                onClick={handleRatingComplete}
                disabled={!isRatingComplete}
                className={`
                  mt-8 w-full py-4 rounded-xl font-bold text-lg transition
                  ${isRatingComplete
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"}
                `}
              >
                {currentMethod < methodOrder.length - 1 ? "Next Method →" :
                 currentScenario < 3 ? "Next Scenario →" : "Final Survey →"}
              </button>
            </div>
          </div>
        )}

        {/* FINAL SURVEY */}
        {phase === "final" && (
          <div className="animate-fade-in">
            <div className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Final Survey</h2>
              
              <div className="mb-8">
                <h3 className="font-semibold text-white mb-4">
                  Rank the explanation methods (1 = Best, 3 = Worst):
                </h3>
                {[
                  { key: "gpe", label: "🎯 GPE (Rule-based)" },
                  { key: "lime", label: "📊 LIME (Feature weights)" },
                  { key: "anchors", label: "⚓ Anchors (Rule-based)" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-4 mb-3">
                    <span className="w-48 text-gray-300">{label}</span>
                    <div className="flex gap-2">
                      {[1, 2, 3].map((rank) => (
                        <button
                          key={rank}
                          onClick={() => setFinalSurvey({ ...finalSurvey, [`${key}_rank`]: rank })}
                          className={`w-10 h-10 rounded-full border-2 font-bold transition ${
                            finalSurvey[`${key}_rank` as keyof typeof finalSurvey] === rank
                              ? "bg-blue-500 border-blue-500 text-white"
                              : "border-gray-600 text-gray-400 hover:border-blue-400"
                          }`}
                        >
                          {rank}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-8">
                <h3 className="font-semibold text-white mb-4">Overall preference:</h3>
                <div className="flex flex-wrap gap-3">
                  {[
                    { key: "gpe", label: "🎯 GPE" },
                    { key: "lime", label: "📊 LIME" },
                    { key: "anchors", label: "⚓ Anchors" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setFinalSurvey({ ...finalSurvey, preferred_method: key })}
                      className={`px-6 py-3 rounded-xl font-medium transition ${
                        finalSurvey.preferred_method === key
                          ? "bg-blue-500 text-white"
                          : "bg-white/10 text-gray-300 hover:bg-white/20"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <label className="font-semibold text-white block mb-2">Feedback (optional):</label>
                <textarea
                  value={finalSurvey.feedback}
                  onChange={(e) => setFinalSurvey({ ...finalSurvey, feedback: e.target.value })}
                  className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Any thoughts about the explanations?"
                />
              </div>

              <button
                onClick={handleFinalSubmit}
                disabled={!isFinalComplete}
                className={`w-full py-4 rounded-xl font-bold text-lg transition ${
                  isFinalComplete
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                Submit Survey ✓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
