"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  const startStudy = () => {
    if (agreed) {
      router.push("/study");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Credit Decision Explanation Study
          </h1>
          <p className="text-xl text-gray-600">
            Help us understand how people interpret AI explanations
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            About This Study
          </h2>
          
          <div className="space-y-4 text-gray-700">
            <p>
              In this study, you will evaluate different methods of explaining 
              AI-powered credit decisions. You will be shown three credit 
              application scenarios and compare how different explanation 
              methods present the reasoning behind each decision.
            </p>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">What You Will Do:</h3>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Review 3 credit application scenarios</li>
                <li>See the AI&apos;s decision (approved/denied)</li>
                <li>Compare 3 different explanation methods</li>
                <li>Rate each explanation on clarity, trust, and usefulness</li>
                <li>Complete a short final survey</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Study Details:</h3>
              <ul className="space-y-1 text-gray-600">
                <li>⏱️ <strong>Duration:</strong> Approximately 10-15 minutes</li>
                <li>🔒 <strong>Privacy:</strong> All responses are anonymous</li>
                <li>🎓 <strong>Purpose:</strong> Academic research on explainable AI</li>
              </ul>
            </div>
          </div>

          {/* Consent */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">
                I understand that this is a research study and I consent to 
                participate. I understand my responses will be used for 
                academic research purposes only.
              </span>
            </label>
          </div>

          {/* Start Button */}
          <button
            onClick={startStudy}
            disabled={!agreed}
            className={`
              mt-8 w-full py-4 rounded-xl font-semibold text-lg transition-all
              ${agreed 
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl" 
                : "bg-gray-200 text-gray-400 cursor-not-allowed"}
            `}
          >
            {agreed ? "Start Study →" : "Please agree to continue"}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>
            This study is part of PhD research by Vladyslav Dehtiarov
          </p>
          <p className="mt-1">
            Sumy State University • 2025
          </p>
        </div>
      </div>
    </main>
  );
}
