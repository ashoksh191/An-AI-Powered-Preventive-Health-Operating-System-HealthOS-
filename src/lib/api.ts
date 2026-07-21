const API_URL = (import.meta as any).env?.VITE_API_URL || "";
import { calculateDiseaseRisks } from './predictor';
import { calculateHealthScore } from './health-score';

const TOKEN_KEY = 'vitalis_jwt_token';
const SESSION_USER_KEY = 'vitalis_user_info';
const IS_DEMO_KEY = 'vitalis_is_demo';

// Standard demo database in localStorage
const LOCAL_PROFILE_KEY = 'vitalis_demo_profile';
const LOCAL_SCORES_KEY = 'vitalis_demo_scores';
const LOCAL_PREDICTIONS_KEY = 'vitalis_demo_predictions';
const LOCAL_PLAN_KEY = 'vitalis_demo_plan';

export interface UserInfo {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at?: string;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_USER_KEY);
}

export function isDemoMode(): boolean {
  return localStorage.getItem(IS_DEMO_KEY) === 'true';
}

export function setDemoMode(value: boolean) {
  localStorage.setItem(IS_DEMO_KEY, String(value));
}

// Generate unique ID for demo
function generateId(): number {
  return Math.floor(Math.random() * 1000000);
}

/**
 * Checks backend connectivity. Returns true if server is online and database is configured.
 */
export async function checkBackendStatus(): Promise<{ online: boolean; databaseConfigured: boolean }> {
  try {
    const res = await fetch(`${API_URL}/api/health`);
    if (res.status === 503) {
      return { online: true, databaseConfigured: false };
    }
    const data = await res.json();
    return { online: true, databaseConfigured: data.status === 'ok' };
  } catch {
    return { online: false, databaseConfigured: false };
  }
}

/**
 * Executes a fetch helper that automatically adds JWT authentication
 */
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuth();
    throw new Error('Unauthorized. Please log in again.');
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

// ==========================================
// DEMO FALLBACK DATA INITIALIZER
// ==========================================
function getDemoProfile() {
  const stored = localStorage.getItem(LOCAL_PROFILE_KEY);
  if (stored) return JSON.parse(stored);
  // Default demo health profile
  const defaultProfile = {
    age: 38,
    gender: 'Male',
    height: 180,
    weight: 84, // BMI: 25.9
    bmi: 25.9,
    sleep: 6.5,
    exercise: 25,
    smoking: false,
    alcohol: 'Occasional',
    waterIntake: 1.8,
    stress: 'Medium',
    familyHistory: 'Father had high blood pressure',
    existingConditions: 'None',
  };
  localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(defaultProfile));
  return defaultProfile;
}

function getDemoScores() {
  const stored = localStorage.getItem(LOCAL_SCORES_KEY);
  if (stored) return JSON.parse(stored);
  
  // Seed initial values for weight, sleep, water, and health scores to generate rich charts
  const baseScores = [
    {
      id: 1,
      sleep: 6.0,
      exercise: 15,
      diet: 'Poor',
      water: 1.2,
      stress: 'High',
      bmi: 26.5,
      score: 48,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    },
    {
      id: 2,
      sleep: 6.2,
      exercise: 20,
      diet: 'Average',
      water: 1.5,
      stress: 'Medium',
      bmi: 26.2,
      score: 56,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
    },
    {
      id: 3,
      sleep: 6.8,
      exercise: 30,
      diet: 'Good',
      water: 2.1,
      stress: 'Medium',
      bmi: 25.9,
      score: 72,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    },
    {
      id: 4,
      sleep: 7.5,
      exercise: 45,
      diet: 'Excellent',
      water: 2.8,
      stress: 'Low',
      bmi: 25.4,
      score: 88,
      createdAt: new Date().toISOString(), // Today
    }
  ].map(item => {
    const results = calculateHealthScore({
      sleep: item.sleep,
      exercise: item.exercise,
      diet: item.diet,
      water: item.water,
      stress: item.stress,
      bmi: item.bmi
    });
    return { ...item, results };
  });

  localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(baseScores));
  return baseScores;
}

function getDemoPredictions() {
  const stored = localStorage.getItem(LOCAL_PREDICTIONS_KEY);
  if (stored) return JSON.parse(stored);

  // Seed baseline predictions
  const inputs = {
    age: 38,
    bmi: 25.9,
    sleep: 6.5,
    exercise: 25,
    smoking: false,
    alcohol: 'Occasional',
    stress: 'Medium',
    familyHistory: 'Father had high blood pressure',
    existingConditions: 'None',
  };
  const results = calculateDiseaseRisks(inputs);
  const basePredictions = [
    {
      id: 1,
      ...inputs,
      results,
      createdAt: new Date().toISOString(),
    }
  ];

  localStorage.setItem(LOCAL_PREDICTIONS_KEY, JSON.stringify(basePredictions));
  return basePredictions;
}

function getDemoPlan() {
  const stored = localStorage.getItem(LOCAL_PLAN_KEY);
  if (stored) return JSON.parse(stored);

  const defaultPlan = {
    mealPlan: `### Weekly High-Performance Nutrition Plan

**Breakfast Recommendations:**
- *Option A:* Oatmeal bowl made with unsweetened almond milk, topped with 1/2 cup blueberries, 1 tbsp chia seeds, and 1 scoop whey or pea protein.
- *Option B:* Spinach and mushroom omelet (2 whole eggs + 2 egg whites) with 1 slice of whole-grain sourdough toast.

**Lunch Ideas:**
- *Option A:* Mediterranean Quinoa Salad with grilled chicken breast (150g), mixed greens, cucumbers, cherry tomatoes, olives, and a light olive oil-lemon dressing.
- *Option B:* Lentil vegetable soup paired with a Turkey breast slice and avocado wrap in a low-carb tortilla.

**Dinner Options:**
- *Option A:* Pan-seared wild salmon filet (150g) served with roasted asparagus spears and a small sweet potato (baked).
- *Option B:* Extra-lean ground turkey stir-fry with broccoli florets, bell peppers, and snap peas over 1/2 cup brown rice.

**Snacks (Choose 1 daily):**
- 1 medium green apple with 1 tbsp unsalted almond butter.
- 150g non-fat Greek yogurt with a dash of cinnamon.
- 1 ounce of raw mixed walnuts and almonds.`,
    workoutPlan: `### Weekly Balanced Cardio & Strength Routine

**Workout Schedule (4-Day Split):**

**Day 1: Upper Body Strength & Endurance**
- Dumbbell Chest Press: 3 sets x 10-12 reps
- Dumbbell Rows (Back): 3 sets x 12 reps
- Seated Shoulder Press: 3 sets x 12 reps
- Plank Holds: 3 sets x 45 seconds
- *Cardio:* 15-minute steady brisk incline walking on treadmill.

**Day 2: Active Recovery & Cardio (Vascular conditioning)**
- 30-40 minutes of low-impact outdoor cycling or elliptical trainer. Keep heart rate in Zone 2 (conversational pace).

**Day 3: Lower Body & Core**
- Goblet Squats (with dumbbell): 3 sets x 12-15 reps
- Romanian Dumbbell Deadlifts: 3 sets x 12 reps
- Dumbbell Reverse Lunges: 3 sets x 10 reps per leg
- Bicycle Crunches: 3 sets x 20 reps
- *Cardio:* 10 minutes row machine.

**Day 4: Cardio High Intensity (HIIT)**
- 5-minute warm-up walk.
- 6 rounds of: 45 seconds sprint or high effort, followed by 75 seconds gentle recovery jog/walk.
- 5-minute cool-down stretch.`,
    waterGoal: 2.5,
    sleepSchedule: `### Sleep Optimization & Rest Schedule

**Schedule Target:**
- **Bedtime:** 10:30 PM - 11:00 PM
- **Wake Time:** 6:30 AM - 7:00 AM
- **Target Duration:** 7.5 - 8 hours per night

**Restorative Rest Habits:**
1. **Digital Sunset:** Power down all screens, smartphones, and laptops at least 45 minutes before sleep. Read a physical book or journal instead.
2. **Ambient Coolness:** Maintain your bedroom temperature between 65°F to 68°F (18°C to 20°C) to stimulate natural sleep-inducing melatonin.
3. **Consistent Rhythm:** Go to sleep and wake up at the exact same times on weekends to synchronize your circadian baseline.`,
    stressTips: `### Personalized Stress-Relief Strategies

1. **Somatic Physiological Sigh:** When feeling a sudden spike in daily tension, perform 3 consecutive "physiological sighs" (double-inhale through the nose, followed by a long, slow sigh out of the mouth). This triggers immediate vagus nerve activation, reducing heart rate.
2. **20-Minute Nature Walk:** Commit to walking outdoors for 20 minutes daily without looking at your phone. Nature exposure has been proven to significantly lower salivary cortisol.
3. **Gratitude Grounding:** Each evening before bed, write down 3 specific small wins or aspects of your day you feel grateful for. This shifts emotional focus and promotes deep restful sleep.`,
    goals: 'Improve cardiovascular endurance, lower fat percentage, and regulate cortisol levels.',
  };
  localStorage.setItem(LOCAL_PLAN_KEY, JSON.stringify(defaultPlan));
  return defaultPlan;
}

// ==========================================
// API EXPORTS
// ==========================================

export const api = {
  // Authentication
  async register(email: string, password: string) {
    if (isDemoMode()) {
      const demoUser = { id: 'demo-user-id', email, created_at: new Date().toISOString() };
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(demoUser));
      return { success: true, message: 'Demo registration successful!', user: demoUser };
    }
    return apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async login(email: string, password: string) {
    if (isDemoMode()) {
      const demoUser = { id: 'demo-user-id', email, created_at: new Date().toISOString() };
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(demoUser));
      return { success: true, message: 'Demo login successful!', user: demoUser, session: { access_token: 'demo-token', refresh_token: '', expires_in: 3600 } };
    }
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async logout() {
    if (isDemoMode()) {
      clearAuth();
      localStorage.removeItem(SESSION_USER_KEY);
      return { success: true, message: 'Successfully logged out.' };
    }
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore errors on logout
    }
    clearAuth();
  },

  async getSession() {
    if (isDemoMode()) {
      const userStr = localStorage.getItem(SESSION_USER_KEY);
      if (userStr) {
        return { success: true, user: JSON.parse(userStr) };
      }
      throw new Error('No active demo session.');
    }
    return apiRequest('/api/auth/session');
  },

  // Health Profile
  async getProfile(): Promise<any> {
    if (isDemoMode()) {
      return { success: true, profile: getDemoProfile() };
    }
    const response = await apiRequest('/api/profile');
    return response;
  },

  async updateProfile(profileData: any): Promise<any> {
    const bmi = Number(profileData.weight) / Math.pow(Number(profileData.height) / 100, 2);
    const updatedData = {
      ...profileData,
      age: Number(profileData.age),
      height: Number(profileData.height),
      weight: Number(profileData.weight),
      sleep: Number(profileData.sleep),
      exercise: Number(profileData.exercise),
      waterIntake: Number(profileData.waterIntake),
      bmi,
    };

    if (isDemoMode()) {
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updatedData));
      return { success: true, message: 'Demo profile updated.', profile: updatedData };
    }
    return apiRequest('/api/profile', {
      method: 'POST', // Backend server.ts route supports POST to create or update profile
      body: JSON.stringify(updatedData),
    });
  },

  // Health Score
  async getHealthScores(): Promise<any> {
    if (isDemoMode()) {
      return { success: true, history: getDemoScores() };
    }
    return apiRequest('/api/health-score/history');
  },

  async submitHealthScore(data: {
    sleep: number;
    exercise: number;
    diet: string;
    water: number;
    stress: string;
    bmi: number;
  }): Promise<any> {
    if (isDemoMode()) {
      const scores = getDemoScores();
      const results = calculateHealthScore(data);
      const newScore = {
        id: generateId(),
        sleep: data.sleep,
        exercise: data.exercise,
        diet: data.diet,
        water: data.water,
        stress: data.stress,
        bmi: data.bmi,
        score: results.overallScore,
        results,
        createdAt: new Date().toISOString(),
      };
      scores.unshift(newScore); // Prepend to history
      localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(scores));
      return { success: true, healthScore: newScore };
    }
    return apiRequest('/api/health-score', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Disease Risk Predictor
  async getPredictions(): Promise<any> {
    if (isDemoMode()) {
      return { success: true, history: getDemoPredictions() };
    }
    return apiRequest('/api/prediction/history');
  },

  async submitPrediction(data: {
    age: number;
    bmi: number;
    sleep: number;
    exercise: number;
    smoking: boolean;
    alcohol: string;
    stress: string;
    familyHistory: string;
    existingConditions: string;
  }): Promise<any> {
    if (isDemoMode()) {
      const predictions = getDemoPredictions();
      const results = calculateDiseaseRisks(data);
      const newPrediction = {
        id: generateId(),
        ...data,
        results,
        createdAt: new Date().toISOString(),
      };
      predictions.unshift(newPrediction);
      localStorage.setItem(LOCAL_PREDICTIONS_KEY, JSON.stringify(predictions));
      return { success: true, prediction: newPrediction };
    }
    return apiRequest('/api/prediction', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // AI Lifestyle Coach
  async getCoachPlan(): Promise<any> {
    if (isDemoMode()) {
      return { success: true, plan: getDemoPlan() };
    }
    return apiRequest('/api/coach');
  },

  async generateCoachPlan(data: {
    goals: string;
    dietaryRestrictions: string;
    fitnessLevel: string;
  }): Promise<any> {
    if (isDemoMode()) {
      // Simulate slow generation delay of 1 second for higher realism
      await new Promise(resolve => setTimeout(resolve, 1200));
      const basePlan = getDemoPlan();
      const customizedPlan = {
        ...basePlan,
        goals: data.goals,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(LOCAL_PLAN_KEY, JSON.stringify(customizedPlan));
      return { success: true, plan: customizedPlan };
    }
    return apiRequest('/api/coach/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCoachPlan(data: Partial<{
    mealPlan: string;
    workoutPlan: string;
    waterGoal: number;
    sleepSchedule: string;
    stressTips: string;
    goals: string;
  }>): Promise<any> {
    if (isDemoMode()) {
      const current = getDemoPlan();
      const updated = {
        ...current,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(LOCAL_PLAN_KEY, JSON.stringify(updated));
      return { success: true, plan: updated };
    }
    return apiRequest('/api/coach', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
};
