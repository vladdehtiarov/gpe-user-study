/**
 * API client for GPE User Study backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface CreditApplication {
  annual_income: number;
  employment_years: number;
  debt_to_income: number;
  credit_score: number;
  loan_amount: number;
  loan_purpose: string;
}

export interface PredictionResult {
  decision: 'approved' | 'denied';
  probability: number;
  risk_level: 'low' | 'medium' | 'high';
}

export interface ExplanationResult {
  method: string;
  explanation_text: string;
  explanation_html: string;
  conditions: string[];
  complexity: number;
  precision: number | null;
  coverage: number | null;
  time_ms: number;
}

export interface ScenarioExplanations {
  scenario: {
    id: number;
    name: string;
    description: string;
    application: CreditApplication;
  };
  prediction: PredictionResult;
  explanations: Record<string, ExplanationResult>;
  method_mapping: Record<string, string>;
}

export interface SessionResponse {
  session_id: string;
  created_at: string;
}

export interface RatingInput {
  session_id: string;
  scenario_id: number;
  method: string;
  clarity: number;
  confidence: number;
  trust: number;
  actionability: number;
  view_time_ms?: number;
}

export interface FinalSurveyInput {
  session_id: string;
  gpe_rank: number;
  lime_rank: number;
  anchors_rank: number;
  preferred_method: string;
  age_group?: string;
  education?: string;
  ml_familiarity?: number;
  feedback?: string;
}

// API Functions
export async function createSession(userAgent?: string): Promise<SessionResponse> {
  const response = await fetch(`${API_URL}/api/survey/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_agent: userAgent }),
  });
  if (!response.ok) throw new Error('Failed to create session');
  return response.json();
}

export async function getScenarios(): Promise<{ scenarios: any[] }> {
  const response = await fetch(`${API_URL}/api/scenarios`);
  if (!response.ok) throw new Error('Failed to fetch scenarios');
  return response.json();
}

export async function getScenarioExplanations(scenarioId: number): Promise<ScenarioExplanations> {
  const response = await fetch(`${API_URL}/api/scenario/${scenarioId}/explain`);
  if (!response.ok) throw new Error('Failed to fetch explanations');
  return response.json();
}

export async function submitRating(rating: RatingInput): Promise<void> {
  const response = await fetch(`${API_URL}/api/survey/rating`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rating),
  });
  if (!response.ok) throw new Error('Failed to submit rating');
}

export async function submitFinalSurvey(survey: FinalSurveyInput): Promise<void> {
  const response = await fetch(`${API_URL}/api/survey/final`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(survey),
  });
  if (!response.ok) throw new Error('Failed to submit survey');
}

export async function getStudyResults(): Promise<any> {
  const response = await fetch(`${API_URL}/api/survey/results`);
  if (!response.ok) throw new Error('Failed to fetch results');
  return response.json();
}

