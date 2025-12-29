"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtem0wLTZ2LTRoLTJ2NGgyek0zMCAzNGgtMnYtNGgydjR6bTAtNnYtNGgtMnY0aDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="relative max-w-6xl mx-auto px-6 py-20">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              PhD Research Study
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Explainable AI for
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400"> Credit Decisions</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Compare how different AI explanation methods help you understand 
              why a credit application was approved or denied
            </p>
          </div>

          {/* Methods Preview */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">GPE</h3>
              <p className="text-gray-400 text-sm">
                Greedy-Prune-Explain — Novel method producing minimal IF-THEN rules
              </p>
              <div className="mt-4 text-xs text-green-400 font-mono bg-green-500/10 px-3 py-2 rounded-lg">
                IF debt_ratio &gt; 0.4 THEN denied
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">LIME</h3>
              <p className="text-gray-400 text-sm">
                Feature importance weights showing how each factor contributes
              </p>
              <div className="mt-4 text-xs text-orange-400 font-mono bg-orange-500/10 px-3 py-2 rounded-lg">
                income: -0.3, debt: +0.5
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">⚓</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Anchors</h3>
              <p className="text-gray-400 text-sm">
                High-precision rules that anchor the prediction
              </p>
              <div className="mt-4 text-xs text-purple-400 font-mono bg-purple-500/10 px-3 py-2 rounded-lg">
                IF score &lt; 650 THEN denied (99%)
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-3xl">📋</span>
              How This Study Works
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shrink-0">1</div>
                  <div>
                    <h4 className="text-white font-medium">Enter Credit Application</h4>
                    <p className="text-gray-400 text-sm">Fill in income, debt, credit score, etc.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shrink-0">2</div>
                  <div>
                    <h4 className="text-white font-medium">AI Makes Decision</h4>
                    <p className="text-gray-400 text-sm">See if the application is approved or denied</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shrink-0">3</div>
                  <div>
                    <h4 className="text-white font-medium">Compare Explanations</h4>
                    <p className="text-gray-400 text-sm">See GPE, LIME, and Anchors explanations side-by-side</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shrink-0">4</div>
                  <div>
                    <h4 className="text-white font-medium">Rate & Feedback</h4>
                    <p className="text-gray-400 text-sm">Tell us which explanation you find most helpful</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-2xl p-6">
                <div className="flex items-center gap-2 text-gray-300 mb-4">
                  <span>⏱️</span>
                  <span className="font-medium">Duration: 5-10 minutes</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300 mb-4">
                  <span>🔒</span>
                  <span className="font-medium">All responses are anonymous</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300 mb-4">
                  <span>🎓</span>
                  <span className="font-medium">Part of PhD research at SSU</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span>🔬</span>
                  <span className="font-medium">Real AI analysis in real-time</span>
                </div>
              </div>
            </div>

            {/* Consent */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <label className="flex items-start gap-4 cursor-pointer group">
                <div className="relative mt-1">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-6 h-6 rounded-lg border-2 transition-all ${
                    agreed 
                      ? "bg-blue-500 border-blue-500" 
                      : "border-gray-500 group-hover:border-blue-400"
                  }`}>
                    {agreed && (
                      <svg className="w-full h-full text-white p-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-gray-300">
                  I understand this is a research study and consent to participate. 
                  My responses will be used for academic research only.
                </span>
              </label>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push("/study")}
                disabled={!agreed}
                className={`
                  flex-1 py-4 px-8 rounded-xl font-bold text-lg transition-all
                  ${agreed 
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02]" 
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"}
                `}
              >
                Start Study →
              </button>
              <button
                onClick={() => router.push("/demo")}
                className="flex-1 py-4 px-8 rounded-xl font-bold text-lg bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20"
              >
                Try Demo First
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm">
            <p>Research by <span className="text-gray-400">Vladyslav Dehtiarov</span></p>
            <p className="mt-1">Sumy State University • 2025</p>
          </div>
        </div>
      </div>
    </main>
  );
}
