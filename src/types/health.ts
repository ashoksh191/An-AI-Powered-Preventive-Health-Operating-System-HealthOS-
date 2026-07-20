export interface HealthProfile {
  id?: number;
  userId: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  bmi: number;
  sleep: number;
  exercise: number;
  smoking: boolean;
  alcohol: string;
  waterIntake: number;
  stress: string;
  familyHistory?: string | null;
  existingConditions?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface HealthScoreComponentBreakdown {
  score: number;
  maxScore: number;
  feedback: string;
}

export interface HealthScoreBreakdown {
  overallScore: number;
  category: 'Needs Attention' | 'Fair' | 'Good' | 'Excellent';
  breakdown: {
    sleep: HealthScoreComponentBreakdown;
    exercise: HealthScoreComponentBreakdown;
    diet: HealthScoreComponentBreakdown;
    water: HealthScoreComponentBreakdown;
    stress: HealthScoreComponentBreakdown;
    bmi: HealthScoreComponentBreakdown;
  };
}

export interface HealthScoreRecord {
  id: number;
  userId: string;
  sleep: number;
  exercise: number;
  diet: string;
  water: number;
  stress: string;
  bmi: number;
  score: number;
  results?: HealthScoreBreakdown | null;
  createdAt: string;
}

export interface RiskResult {
  percentage: number;
  category: 'Low' | 'Moderate' | 'High' | 'Critical';
  contributingFactors: string[];
  recommendations: string[];
}

export interface PredictionResults {
  diabetesRisk: RiskResult;
  heartDiseaseRisk: RiskResult;
  hypertensionRisk: RiskResult;
  obesityRisk: RiskResult;
  stressRisk: RiskResult;
}

export interface PredictionRecord {
  id: number;
  userId: string;
  age: number;
  bmi: number;
  sleep: number;
  exercise: number;
  smoking: boolean;
  alcohol: string;
  stress: string;
  familyHistory: string;
  existingConditions: string;
  results?: PredictionResults | null;
  createdAt: string;
}

export interface LifestylePlan {
  id: number;
  userId: string;
  mealPlan: string;
  workoutPlan: string;
  waterGoal: number;
  sleepSchedule: string;
  stressTips: string;
  goals?: string | null;
  createdAt: string;
  updatedAt: string;
}
