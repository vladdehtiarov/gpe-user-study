"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ExplanationCard from "@/components/ExplanationCard";
import RatingScale from "@/components/RatingScale";
import ProgressBar from "@/components/ProgressBar";
import {
  createSession,
  getScenarioExplanations,
  submitRating,
  submitFinalSurvey,
  ScenarioExplanations,
  RatingInput,
} from "@/lib/api";

type StudyPhase = "loading" | "scenario" | "rating" | "final" | "complete";

interface Ratings {
  clarity: number | null;
  confidence: number | null;
  trust: number | null;
  actionability: number | null;
}

export default function StudyPage() {
  const router = useRouter();
  
  // Session state
  const [sessionId, setSessionId] = useState<string>("");
  const [phase, setPhase] = useState<StudyPhase>("loading");
  const [currentScenario, setCurrentScenario] = useState(1);
  const [currentMethod, setCurrentMethod] = useState(0);
  
  // Data
  const [scenarioData, setScenarioData] = useState<ScenarioExplanations | null>(null);
  const [methodOrder, setMethodOrder] = useState<string[]>([]);
  
  // Ratings
  const [ratings, setRatings] = useState<Ratings>({
    clarity: null,
    confidence: null,
    trust: null,
    actionability: null,
  });
  
  // Final survey
  const [finalSurvey, setFinalSurvey] = useState({
    gpe_rank: 0,
    lime_rank: 0,
    anchors_rank: 0,
    preferred_method: "",
    ml_familiarity: null as number | null,
    feedback: "",
  });
  
  // Collected data
  const [allRatings, setAllRatings] = useState<RatingInput[]>([]);

  // Initialize session
  useEffect(() => {
    const init = async () => {
      try {
        const session = await createSession(navigator.userAgent);
        setSessionId(session.session_id);
        await loadScenario(1);
        setPhase("scenario");
      } catch (error) {
        console.error("Failed to initialize:", error);
      }
    };
    init();
  }, []);

  // Load scenario
  const loadScenario = async (scenarioId: number) => {
    try {
      const data = await getScenarioExplanations(scenarioId);
      setScenarioData(data);
      setMethodOrder(Object.keys(data.explanations));
      setCurrentMethod(0);
    } catch (error) {
      console.error("Failed to load scenario:", error);
    }
  };

  // Handle rating submission
  const handleRatingComplete = () => {
    if (!scenarioData || !sessionId) return;
    
    // Get actual method name
    const methodKey = methodOrder[currentMethod];
    const actualMethod = scenarioData.method_mapping[methodKey];
    
    // Save rating
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
    
    // Reset ratings
    setRatings({
      clarity: null,
      confidence: null,
      trust: null,
      actionability: null,
    });
    
    // Move to next
    if (currentMethod < methodOrder.length - 1) {
      setCurrentMethod(currentMethod + 1);
    } else if (currentScenario < 3) {
      setCurrentScenario(currentScenario + 1);
      loadScenario(currentScenario + 1);
      setPhase("scenario");
    } else {
      setPhase("final");
    }
  };

  // Check if current ratings are complete
  const isRatingComplete = 
    ratings.clarity !== null &&
    ratings.confidence !== null &&
    ratings.trust !== null &&
    ratings.actionability !== null;

  // Submit final survey
  const handleFinalSubmit = async () => {
    try {
      // Submit all ratings
      for (const rating of allRatings) {
        await submitRating(rating);
      }
      
      // Submit final survey
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

  // Check if final survey is complete
  const isFinalComplete = 
    finalSurvey.gpe_rank > 0 &&
    finalSurvey.lime_rank > 0 &&
    finalSurvey.anchors_rank > 0 &&
    finalSurvey.preferred_method !== "";

  // Calculate progress
  const totalSteps = 3 * 3 + 1; // 3 scenarios × 3 methods + final
  const currentStep = (currentScenario - 1) * 3 + currentMethod + 1;

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading study...</p>
        </div>
      </div>
    );
  }

  if (phase === "complete") {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-2xl w-full text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Thank You for Participating!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your responses have been recorded and will help improve 
            explainable AI systems for credit decisions.
          </p>
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="font-semibold text-gray-900 mb-2">Study Complete</h2>
            <p className="text-gray-600">
              You evaluated {allRatings.length} explanations across 3 scenarios.
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <ProgressBar
            current={phase === "final" ? totalSteps : currentStep}
            total={totalSteps}
            label={phase === "final" ? "Final Survey" : `Scenario ${currentScenario} of 3`}
          />
        </div>

        {phase === "scenario" && scenarioData && (
          <div className="animate-fade-in">
            {/* Scenario info */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Scenario {currentScenario}: {scenarioData.scenario.name}
              </h2>
              <p className="text-gray-600 mb-6">{scenarioData.scenario.description}</p>
              
              {/* Application details */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500">Annual Income</div>
                  <div className="font-semibold">${scenarioData.scenario.application.annual_income.toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500">Employment</div>
                  <div className="font-semibold">{scenarioData.scenario.application.employment_years} years</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500">Debt-to-Income</div>
                  <div className="font-semibold">{(scenarioData.scenario.application.debt_to_income * 100).toFixed(0)}%</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500">Credit Score</div>
                  <div className="font-semibold">{scenarioData.scenario.application.credit_score}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500">Loan Amount</div>
                  <div className="font-semibold">${scenarioData.scenario.application.loan_amount.toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500">Purpose</div>
                  <div className="font-semibold capitalize">{scenarioData.scenario.application.loan_purpose.replace("_", " ")}</div>
                </div>
              </div>

              {/* Decision */}
              <div className={`
                inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-lg
                ${scenarioData.prediction.decision === "approved" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"}
              `}>
                {scenarioData.prediction.decision === "approved" ? "✓" : "✗"}
                Decision: {scenarioData.prediction.decision.toUpperCase()}
              </div>
            </div>

            {/* Explanations comparison */}
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Compare the explanations below:
            </h3>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {methodOrder.map((key, idx) => (
                <ExplanationCard
                  key={key}
                  explanation={scenarioData.explanations[key]}
                  label={String.fromCharCode(65 + idx)}
                />
              ))}
            </div>

            <button
              onClick={() => setPhase("rating")}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg"
            >
              Rate These Explanations →
            </button>
          </div>
        )}

        {phase === "rating" && scenarioData && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Rate Method {String.fromCharCode(65 + currentMethod)}
              </h2>
              <p className="text-gray-600 mb-8">
                Method {currentMethod + 1} of {methodOrder.length} for Scenario {currentScenario}
              </p>

              {/* Show the explanation being rated */}
              <div className="mb-8">
                <ExplanationCard
                  explanation={scenarioData.explanations[methodOrder[currentMethod]]}
                  label={String.fromCharCode(65 + currentMethod)}
                />
              </div>

              {/* Rating questions */}
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
                  description="How confident are you that you understand why this decision was made?"
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
                  description="How well does this explanation help you understand what could be changed to get a different decision?"
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
                  mt-8 w-full py-4 rounded-xl font-semibold transition
                  ${isRatingComplete
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"}
                `}
              >
                {currentMethod < methodOrder.length - 1
                  ? "Next Method →"
                  : currentScenario < 3
                  ? "Next Scenario →"
                  : "Final Survey →"}
              </button>
            </div>
          </div>
        )}

        {phase === "final" && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Final Survey
              </h2>
              <p className="text-gray-600 mb-8">
                Please rank the explanation methods and share your overall preference.
              </p>

              {/* Ranking */}
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Rank the explanation methods (1 = Best, 3 = Worst):
                </h3>
                
                <div className="space-y-4">
                  {["Method A (Rule-based, IF-THEN)", "Method B (Another rule-based)", "Method C (Feature weights/bars)"].map((method, idx) => {
                    const methodKey = idx === 0 ? "gpe" : idx === 1 ? "anchors" : "lime";
                    const currentRank = finalSurvey[`${methodKey}_rank` as keyof typeof finalSurvey] as number;
                    
                    return (
                      <div key={idx} className="flex items-center gap-4">
                        <span className="w-64 text-gray-700">{method}</span>
                        <div className="flex gap-2">
                          {[1, 2, 3].map((rank) => (
                            <button
                              key={rank}
                              onClick={() => setFinalSurvey({ 
                                ...finalSurvey, 
                                [`${methodKey}_rank`]: rank 
                              })}
                              className={`
                                w-10 h-10 rounded-full border-2 font-medium transition
                                ${currentRank === rank
                                  ? "bg-blue-500 border-blue-500 text-white"
                                  : "border-gray-300 hover:border-blue-400"}
                              `}
                            >
                              {rank}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Overall preference */}
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Which explanation method do you prefer overall?
                </h3>
                <div className="flex flex-wrap gap-3">
                  {[
                    { key: "gpe", label: "Method A (Rule-based)" },
                    { key: "anchors", label: "Method B (Another rule-based)" },
                    { key: "lime", label: "Method C (Feature weights)" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setFinalSurvey({ ...finalSurvey, preferred_method: key })}
                      className={`
                        px-6 py-3 rounded-lg border-2 font-medium transition
                        ${finalSurvey.preferred_method === key
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "border-gray-300 hover:border-blue-400"}
                      `}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ML Familiarity */}
              <div className="mb-8">
                <RatingScale
                  label="How familiar are you with machine learning?"
                  value={finalSurvey.ml_familiarity}
                  onChange={(v) => setFinalSurvey({ ...finalSurvey, ml_familiarity: v })}
                  minLabel="Not at all"
                  maxLabel="Expert"
                />
              </div>

              {/* Feedback */}
              <div className="mb-8">
                <label className="font-semibold text-gray-900 block mb-2">
                  Any additional feedback? (Optional)
                </label>
                <textarea
                  value={finalSurvey.feedback}
                  onChange={(e) => setFinalSurvey({ ...finalSurvey, feedback: e.target.value })}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Share your thoughts about the explanations..."
                />
              </div>

              <button
                onClick={handleFinalSubmit}
                disabled={!isFinalComplete}
                className={`
                  w-full py-4 rounded-xl font-semibold transition
                  ${isFinalComplete
                    ? "bg-green-600 text-white hover:bg-green-700 shadow-lg"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"}
                `}
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

