export interface HealthScoreInput {
  sleep: number;      // in hours
  exercise: number;   // in minutes/day
  diet: string;       // "Poor", "Average", "Good", "Excellent" or general text description
  water: number;      // water intake in Liters
  stress: string;     // "Low", "Medium", "High"
  bmi: number;        // Body Mass Index
}

export interface HealthScoreComponentBreakdown {
  score: number;
  maxScore: number;
  feedback: string;
}

export interface HealthScoreResults {
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

/**
 * Calculates a comprehensive health score out of 100 based on standard health metrics.
 */
export function calculateHealthScore(input: HealthScoreInput): HealthScoreResults {
  const { sleep, exercise, diet, water, stress, bmi } = input;

  // 1. Sleep Score (Max 20)
  let sleepScore = 5;
  let sleepFeedback = 'Inadequate sleep. Focus on achieving 7-9 hours of restful sleep daily.';
  if (sleep >= 7 && sleep <= 9) {
    sleepScore = 20;
    sleepFeedback = 'Excellent sleep duration (7-9 hours). Optimal for physical and mental recovery.';
  } else if ((sleep >= 6 && sleep < 7) || (sleep > 9 && sleep <= 10)) {
    sleepScore = 15;
    sleepFeedback = 'Sub-optimal sleep duration. Target a consistent window closer to 7-8 hours.';
  } else if ((sleep >= 5 && sleep < 6) || (sleep > 10 && sleep <= 11)) {
    sleepScore = 10;
    sleepFeedback = 'Borderline sleep deprivation or oversleeping. Consider adjusting sleep hygiene habits.';
  }

  // 2. Exercise Score (Max 20)
  let exerciseScore = 5;
  let exerciseFeedback = 'Highly sedentary level. Introduce simple activities like regular walking to begin.';
  if (exercise >= 60) {
    exerciseScore = 20;
    exerciseFeedback = 'Outstanding daily physical activity level (60+ minutes). Superb vascular benefit.';
  } else if (exercise >= 30) {
    exerciseScore = 15;
    exerciseFeedback = 'Meets daily moderate exercise guidelines (30-59 minutes). Good fitness base.';
  } else if (exercise >= 15) {
    exerciseScore = 10;
    exerciseFeedback = 'Mild physical activity. Aim to increase your sessions above 30 minutes.';
  }

  // 3. Diet Score (Max 20)
  let dietScore = 10;
  let dietFeedback = 'Average nutrition balance. Add more whole foods and reduce processed sugars.';
  const dietLower = diet.toLowerCase().trim();

  if (dietLower === 'excellent' || dietLower === 'very good') {
    dietScore = 20;
    dietFeedback = 'Excellent nutrition choices! Rich in fiber, micronutrients, and high-quality proteins.';
  } else if (dietLower === 'good' || dietLower === 'healthy') {
    dietScore = 16;
    dietFeedback = 'Good, balanced eating habits. Keep prioritizing whole foods and clean hydration.';
  } else if (dietLower === 'poor' || dietLower === 'unhealthy') {
    dietScore = 5;
    dietFeedback = 'High processed food or sugar intake. Plan transitions to whole grains, lean proteins, and greens.';
  } else {
    // If a generic description is provided, search keywords to score
    let positiveHits = 0;
    let negativeHits = 0;

    const positiveKeywords = ['healthy', 'balanced', 'keto', 'vegan', 'mediterranean', 'vegetable', 'fruit', 'clean', 'protein', 'whole grain', 'fiber', 'salad', 'organic'];
    const negativeKeywords = ['fast food', 'junk', 'sugar', 'fried', 'soda', 'unhealthy', 'processed', 'sweet', 'candy', 'greasy'];

    positiveKeywords.forEach(kw => {
      if (dietLower.includes(kw)) positiveHits++;
    });
    negativeKeywords.forEach(kw => {
      if (dietLower.includes(kw)) negativeHits++;
    });

    if (positiveHits > negativeHits) {
      dietScore = Math.min(12 + positiveHits * 2, 20);
      dietFeedback = 'Your diet contains healthy food choices. Continue building balanced meal habits.';
    } else if (negativeHits > positiveHits) {
      dietScore = Math.max(12 - negativeHits * 2, 5);
      dietFeedback = 'Identified frequent processed or high-glycemic foods. Seek whole food substitutions.';
    } else {
      dietScore = 12; // Baseline
    }
  }

  // 4. Water Score (Max 15)
  let waterScore = 3;
  let waterFeedback = 'Low hydration level. Aim to consume at least 2 liters of water daily.';
  if (water >= 3.0) {
    waterScore = 15;
    waterFeedback = 'Excellent hydration (3.0+ L). Promotes cellular health and optimal physical performance.';
  } else if (water >= 2.0) {
    waterScore = 12;
    waterFeedback = 'Sufficient hydration level (2.0-2.9 L). Good maintenance of fluid balance.';
  } else if (water >= 1.0) {
    waterScore = 8;
    waterFeedback = 'Moderate hydration. Try carrying a reusable bottle to increase your daily intake.';
  }

  // 5. Stress Score (Max 15)
  let stressScore = 5;
  let stressFeedback = 'High stress levels. Highly recommend integrating regular mindfulness, therapy, or breathing exercises.';
  const stressLower = stress.toLowerCase().trim();

  if (stressLower === 'low' || stressLower === 'minimal') {
    stressScore = 15;
    stressFeedback = 'Low stress exposure. Excellent emotional balance and mental clarity.';
  } else if (stressLower === 'medium' || stressLower === 'moderate' || stressLower === 'average') {
    stressScore = 10;
    stressFeedback = 'Moderate stress level. Monitor triggers and allocate daily relaxation time.';
  } else if (stressLower === 'critical' || stressLower === 'extreme') {
    stressScore = 2;
    stressFeedback = 'Critical daily stress. Prioritize emotional self-care and professional guidance.';
  }

  // 6. BMI Score (Max 10)
  let bmiScore = 3;
  let bmiFeedback = 'BMI is outside the recommended range. Focus on sustainable activity and balanced nutrition.';
  if (bmi >= 18.5 && bmi < 25.0) {
    bmiScore = 10;
    bmiFeedback = 'BMI is in the normal range (18.5-24.9). Associated with minimal chronic disease risk.';
  } else if ((bmi >= 25.0 && bmi < 30.0) || (bmi >= 15.0 && bmi < 18.5)) {
    bmiScore = 6;
    bmiFeedback = 'BMI indicates slightly overweight or underweight. Monitor metrics over time.';
  }

  // Calculate Overall Score
  const overallScore = sleepScore + exerciseScore + dietScore + waterScore + stressScore + bmiScore;

  // Map Category
  let category: 'Needs Attention' | 'Fair' | 'Good' | 'Excellent' = 'Needs Attention';
  if (overallScore >= 85) {
    category = 'Excellent';
  } else if (overallScore >= 70) {
    category = 'Good';
  } else if (overallScore >= 50) {
    category = 'Fair';
  }

  return {
    overallScore,
    category,
    breakdown: {
      sleep: { score: sleepScore, maxScore: 20, feedback: sleepFeedback },
      exercise: { score: exerciseScore, maxScore: 20, feedback: exerciseFeedback },
      diet: { score: dietScore, maxScore: 20, feedback: dietFeedback },
      water: { score: waterScore, maxScore: 15, feedback: waterFeedback },
      stress: { score: stressScore, maxScore: 15, feedback: stressFeedback },
      bmi: { score: bmiScore, maxScore: 10, feedback: bmiFeedback },
    },
  };
}
