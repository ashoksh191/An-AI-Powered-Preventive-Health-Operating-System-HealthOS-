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

export interface PredictionInput {
  age: number;
  bmi: number;
  sleep: number;
  exercise: number;
  smoking: boolean;
  alcohol: string;
  stress: string;
  familyHistory: string;
  existingConditions: string;
}

/**
 * Calculates risk level categories based on a score percentage.
 */
function getRiskCategory(percentage: number): 'Low' | 'Moderate' | 'High' | 'Critical' {
  if (percentage < 25) return 'Low';
  if (percentage < 55) return 'Moderate';
  if (percentage < 85) return 'High';
  return 'Critical';
}

/**
 * Deterministic clinical-conceptual risk prediction engine.
 */
export function calculateDiseaseRisks(input: PredictionInput): PredictionResults {
  const {
    age,
    bmi,
    sleep,
    exercise,
    smoking,
    alcohol,
    stress,
    familyHistory,
    existingConditions,
  } = input;

  const familyHistoryLower = familyHistory.toLowerCase();
  const existingConditionsLower = existingConditions.toLowerCase();
  const alcoholLower = alcohol.toLowerCase();
  const stressLower = stress.toLowerCase();

  // ==========================================
  // 1. DIABETES RISK CALCULATOR
  // ==========================================
  let diabetesScore = 10; // Baseline risk is 10%
  const diabetesFactors: string[] = [];
  const diabetesRecs: string[] = [];

  if (bmi >= 30) {
    diabetesScore += 35;
    diabetesFactors.push('Obesity (BMI ≥ 30) causes high insulin resistance.');
  } else if (bmi >= 25) {
    diabetesScore += 15;
    diabetesFactors.push('Overweight status (BMI 25-29.9) moderately increases insulin resistance.');
  }

  if (age >= 45) {
    diabetesScore += 20;
    diabetesFactors.push('Age 45 or older naturally increases risk for Type 2 diabetes.');
  } else if (age >= 35) {
    diabetesScore += 10;
    diabetesFactors.push('Age 35-44 is associated with a gradual risk elevation.');
  }

  if (exercise < 30) {
    diabetesScore += 15;
    diabetesFactors.push('Sedentary lifestyle (less than 30 mins/day of exercise) reduces insulin sensitivity.');
  }

  if (stressLower === 'high') {
    diabetesScore += 10;
    diabetesFactors.push('Chronic high stress raises cortisol levels, which increases blood sugar.');
  }

  // Family history check
  if (
    familyHistoryLower.includes('diabetes') ||
    familyHistoryLower.includes('diabetic') ||
    familyHistoryLower.includes('sugar') ||
    familyHistoryLower.includes('father') ||
    familyHistoryLower.includes('mother') ||
    familyHistoryLower.includes('parent')
  ) {
    if (familyHistoryLower.includes('diabetes') || familyHistoryLower.includes('diabetic')) {
      diabetesScore += 25;
      diabetesFactors.push('Family history of Type 2 diabetes increases genetic predisposition.');
    }
  }

  // Existing conditions
  if (existingConditionsLower.includes('prediabetes') || existingConditionsLower.includes('borderline')) {
    diabetesScore += 30;
    diabetesFactors.push('Diagnosed pre-diabetes is the strongest precursor to Type 2 diabetes.');
  }
  if (existingConditionsLower.includes('pcos') || existingConditionsLower.includes('polycystic')) {
    diabetesScore += 15;
    diabetesFactors.push('Polycystic Ovary Syndrome (PCOS) is closely linked to insulin resistance.');
  }

  // Cap score at 100
  diabetesScore = Math.min(Math.max(diabetesScore, 5), 98);

  // Recommendations for Diabetes
  if (bmi >= 25) {
    diabetesRecs.push('Aim for modest weight reduction (5-7% of body weight) to dramatically lower risk.');
  }
  if (exercise < 30) {
    diabetesRecs.push('Incorporate at least 150 minutes of moderate-intensity aerobic exercise per week (e.g., brisk walking).');
  }
  diabetesRecs.push('Focus on a diet rich in whole grains, lean proteins, and fiber while minimizing refined carbohydrates and sugars.');
  if (familyHistoryLower.includes('diabetes') || age >= 45) {
    diabetesRecs.push('Schedule an annual HbA1c or Fasting Blood Glucose screening.');
  }

  // ==========================================
  // 2. HEART DISEASE RISK CALCULATOR
  // ==========================================
  let heartScore = 12; // Baseline
  const heartFactors: string[] = [];
  const heartRecs: string[] = [];

  if (smoking) {
    heartScore += 35;
    heartFactors.push('Active smoking is a critical risk factor, damaging blood vessels and promoting plaque.');
  }

  if (age >= 55) {
    heartScore += 25;
    heartFactors.push('Advanced age (55+) naturally leads to stiffer and narrower blood vessels.');
  } else if (age >= 40) {
    heartScore += 10;
    heartFactors.push('Middle age (40-54) is when cardiovascular risks begin to compile.');
  }

  if (bmi >= 30) {
    heartScore += 15;
    heartFactors.push('Obesity causes cardiac workload overload and systemic vascular inflammation.');
  }

  if (alcoholLower === 'daily' || alcoholLower.includes('heavy') || alcoholLower.includes('frequent')) {
    heartScore += 15;
    heartFactors.push('Frequent or heavy alcohol consumption raises cardiomyopathy and arrhythmia risks.');
  }

  if (sleep < 6) {
    heartScore += 10;
    heartFactors.push('Inadequate sleep (less than 6 hours) is associated with higher arterial calcification.');
  }

  if (exercise < 30) {
    heartScore += 10;
    heartFactors.push('Lack of cardiorespiratory exercise weakens the heart muscle over time.');
  }

  // Family history check
  if (
    familyHistoryLower.includes('heart') ||
    familyHistoryLower.includes('cardiac') ||
    familyHistoryLower.includes('stroke') ||
    familyHistoryLower.includes('attack') ||
    familyHistoryLower.includes('coronary')
  ) {
    heartScore += 20;
    heartFactors.push('First-degree family history of cardiovascular disease increases risk.');
  }

  // Existing conditions
  if (existingConditionsLower.includes('hypertension') || existingConditionsLower.includes('bp') || existingConditionsLower.includes('pressure')) {
    heartScore += 25;
    heartFactors.push('Existing high blood pressure adds constant strain to coronary arteries.');
  }
  if (existingConditionsLower.includes('cholesterol') || existingConditionsLower.includes('lipid')) {
    heartScore += 20;
    heartFactors.push('Hyperlipidemia (high cholesterol) accelerates arterial plaque buildup.');
  }

  heartScore = Math.min(Math.max(heartScore, 5), 98);

  // Recommendations for Heart Disease
  if (smoking) {
    heartRecs.push('Initiate a smoking cessation plan immediately. Your heart attack risk drops by 50% within 1 year of quitting.');
  }
  if (exercise < 30) {
    heartRecs.push('Engage in cardiovascular workouts (jogging, cycling, swimming) to strengthen heart function.');
  }
  if (alcoholLower === 'daily') {
    heartRecs.push('Limit alcohol to moderate thresholds (max 1 drink/day for women, 2 for men).');
  }
  heartRecs.push('Adopt the Mediterranean diet, focusing on healthy fats (olive oil, nuts) and avoiding trans fats.');
  if (age >= 40) {
    heartRecs.push('Request a comprehensive lipid profile panel and cardiovascular risk assessment from your physician.');
  }

  // ==========================================
  // 3. HYPERTENSION RISK CALCULATOR
  // ==========================================
  let hyperScore = 15; // Baseline
  const hyperFactors: string[] = [];
  const hyperRecs: string[] = [];

  if (age >= 60) {
    hyperScore += 30;
    hyperFactors.push('Vascular stiffening in age 60+ heavily predisposes to systolic hypertension.');
  } else if (age >= 45) {
    hyperScore += 15;
    hyperFactors.push('Vascular compliance starts to decline significantly around age 45.');
  }

  if (bmi >= 30) {
    hyperScore += 25;
    hyperFactors.push('Obesity raises sympathetic nervous activity, elevating blood pressure.');
  } else if (bmi >= 25) {
    hyperScore += 10;
    hyperFactors.push('Overweight status is highly correlated with rising blood pressure trends.');
  }

  if (stressLower === 'high') {
    hyperScore += 15;
    hyperFactors.push('Chronic stress leads to frequent spikes in blood pressure and elevated cortisol.');
  }

  if (alcoholLower === 'daily' || alcoholLower.includes('heavy')) {
    hyperScore += 15;
    hyperFactors.push('Regular heavy alcohol consumption causes arterial constriction and elevated baseline BP.');
  }

  if (sleep < 6) {
    hyperScore += 10;
    hyperFactors.push('Short sleep duration disrupts the natural blood pressure "dipping" at night.');
  }

  if (exercise < 30) {
    hyperScore += 10;
    hyperFactors.push('Lack of physical exercise reduces arterial flexibility and capacity.');
  }

  if (familyHistoryLower.includes('hypertension') || familyHistoryLower.includes('blood pressure') || familyHistoryLower.includes('stroke')) {
    hyperScore += 15;
    hyperFactors.push('Strong genetic history of hypertension among family members.');
  }

  if (existingConditionsLower.includes('kidney') || existingConditionsLower.includes('renal')) {
    hyperScore += 25;
    hyperFactors.push('Renal dysfunction directly impacts the renin-angiotensin-aldosterone system, elevating BP.');
  }

  hyperScore = Math.min(Math.max(hyperScore, 5), 98);

  // Recommendations for Hypertension
  if (bmi >= 25) {
    hyperRecs.push('Weight loss helps lower blood pressure; every kg lost can reduce systolic BP by ~1 mmHg.');
  }
  hyperRecs.push('Follow the DASH (Dietary Approaches to Stop Hypertension) eating plan, focusing on low-sodium foods.');
  hyperRecs.push('Reduce dietary sodium intake to under 1,500 - 2,000 mg per day.');
  if (stressLower === 'high') {
    hyperRecs.push('Utilize daily stress reduction techniques (mindfulness, box breathing, or yoga).');
  }
  hyperRecs.push('Measure your blood pressure at home regularly to understand your baseline readings.');

  // ==========================================
  // 4. OBESITY RISK CALCULATOR
  // ==========================================
  let obesityScore = 10; // Baseline
  const obesityFactors: string[] = [];
  const obesityRecs: string[] = [];

  // Driven intensely by current BMI, representing risk of clinical obesity (BMI >= 30)
  if (bmi >= 35) {
    obesityScore = 98;
    obesityFactors.push('Current BMI indicates Class II/III Obesity. Severe metabolic risk.');
  } else if (bmi >= 30) {
    obesityScore = 90;
    obesityFactors.push('Current BMI is in the Obese range (BMI ≥ 30).');
  } else if (bmi >= 25) {
    obesityScore = 65;
    obesityFactors.push('Current BMI is in the Overweight range (BMI 25-29.9), creating high risk of progression to clinical obesity.');
  } else {
    // Normal or low BMI, but calculate risk of developing it based on factors
    if (exercise < 20) {
      obesityScore += 20;
      obesityFactors.push('Sedentary lifestyle highly encourages positive energy balance.');
    }
    if (sleep < 6) {
      obesityScore += 15;
      obesityFactors.push('Poor sleep (<6 hrs) alters ghrelin and leptin, increasing food cravings.');
    }
    if (stressLower === 'high') {
      obesityScore += 10;
      obesityFactors.push('High stress levels often prompt stress-eating and fat retention.');
    }
    if (familyHistoryLower.includes('obese') || familyHistoryLower.includes('obesity') || familyHistoryLower.includes('weight')) {
      obesityScore += 15;
      obesityFactors.push('Genetic factors influence appetite regulation and basal metabolic rate.');
    }
  }

  obesityScore = Math.min(Math.max(obesityScore, 5), 98);

  // Recommendations for Obesity
  if (bmi >= 25) {
    obesityRecs.push('Seek support from a registered dietitian to establish a personalized daily caloric deficit (e.g., -500 kcal/day).');
    obesityRecs.push('Emphasize high-volume, low-calorie-density foods (vegetables, leafy greens, water-rich foods).');
  }
  if (exercise < 30) {
    obesityRecs.push('Aim for at least 150-300 minutes of moderate-intensity physical activity per week to support long-term weight maintenance.');
  }
  if (sleep < 7) {
    obesityRecs.push('Optimize sleep hygiene to ensure 7-8 hours of sleep, protecting metabolic rate.');
  }

  // ==========================================
  // 5. STRESS RISK CALCULATOR
  // ==========================================
  let stressRiskScore = 15; // Baseline
  const stressFactors: string[] = [];
  const stressRecs: string[] = [];

  if (stressLower === 'high') {
    stressRiskScore += 45;
    stressFactors.push('Currently reporting high baseline daily stress levels.');
  } else if (stressLower === 'medium' || stressLower === 'moderate') {
    stressRiskScore += 20;
    stressFactors.push('Currently reporting moderate baseline daily stress levels.');
  }

  if (sleep < 6) {
    stressRiskScore += 20;
    stressFactors.push('Severe sleep deprivation (<6 hours) prevents cortisol restoration, causing heightened irritability.');
  } else if (sleep < 7) {
    stressRiskScore += 10;
    stressFactors.push('Sub-optimal sleep (6-7 hours) limits mental and emotional resilience.');
  }

  if (exercise < 30) {
    stressRiskScore += 15;
    stressFactors.push('Lack of exercise limits the natural production of endorphins to buffer stress.');
  }

  if (smoking) {
    stressRiskScore += 10;
    stressFactors.push('Nicotine dependency creates withdrawal cycles that masquerade as stress.');
  }

  if (alcoholLower === 'daily' || alcoholLower.includes('heavy')) {
    stressRiskScore += 10;
    stressFactors.push('Daily alcohol consumption is a central nervous system depressant that disrupts emotional homeostasis.');
  }

  if (existingConditionsLower.includes('anxiety') || existingConditionsLower.includes('depression') || existingConditionsLower.includes('insomnia')) {
    stressRiskScore += 20;
    stressFactors.push('Existing clinical mental health diagnoses compound stress susceptibility.');
  }

  stressRiskScore = Math.min(Math.max(stressRiskScore, 5), 98);

  // Recommendations for Stress
  if (stressLower === 'high' || stressLower === 'medium') {
    stressRecs.push('Commit to 5-10 minutes of guided meditation, mindfulness practice, or deep breathing exercises daily.');
    stressRecs.push('Implement clear work-life boundaries and digital detox hours in the evening.');
  }
  if (sleep < 7) {
    stressRecs.push('Establish a strict sleep routine, eliminating screen exposure 1 hour before bedtime.');
  }
  if (exercise < 30) {
    stressRecs.push('Take a 20-minute daily outdoor walk; nature exposure significantly lowers salivary cortisol levels.');
  }
  if (existingConditionsLower.includes('anxiety') || existingConditionsLower.includes('depression')) {
    stressRecs.push('Consider consultation with a licensed therapist or mental health counselor for cognitive behavioral support.');
  }

  return {
    diabetesRisk: {
      percentage: diabetesScore,
      category: getRiskCategory(diabetesScore),
      contributingFactors: diabetesFactors.length > 0 ? diabetesFactors : ['No major risk factors detected.'],
      recommendations: diabetesRecs.length > 0 ? diabetesRecs : ['Maintain your current healthy diet and physical activity.'],
    },
    heartDiseaseRisk: {
      percentage: heartScore,
      category: getRiskCategory(heartScore),
      contributingFactors: heartFactors.length > 0 ? heartFactors : ['No major risk factors detected.'],
      recommendations: heartRecs.length > 0 ? heartRecs : ['Maintain cardiorespiratory workouts and heart-healthy nutrition.'],
    },
    hypertensionRisk: {
      percentage: hyperScore,
      category: getRiskCategory(hyperScore),
      contributingFactors: hyperFactors.length > 0 ? hyperFactors : ['No major risk factors detected.'],
      recommendations: hyperRecs.length > 0 ? hyperRecs : ['Maintain balanced cardiovascular habits and low-sodium diet.'],
    },
    obesityRisk: {
      percentage: obesityScore,
      category: getRiskCategory(obesityScore),
      contributingFactors: obesityFactors.length > 0 ? obesityFactors : ['Balanced weight and stable metabolism.'],
      recommendations: obesityRecs.length > 0 ? obesityRecs : ['Keep up your consistent nutrition plan and activity levels.'],
    },
    stressRisk: {
      percentage: stressRiskScore,
      category: getRiskCategory(stressRiskScore),
      contributingFactors: stressFactors.length > 0 ? stressFactors : ['Excellent emotional buffering and balance.'],
      recommendations: stressRecs.length > 0 ? stressRecs : ['Maintain healthy self-care and sleep habits.'],
    },
  };
}
