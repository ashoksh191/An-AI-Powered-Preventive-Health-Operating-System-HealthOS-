import React, { useState, useEffect } from 'react';
import { Activity, Heart, Shield, PlusCircle, Check, Info, RefreshCw, ChevronRight, Sparkles, Plus, Minus, DollarSign, Clock, Dumbbell, Utensils } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileFormProps {
  initialProfile: any;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

export default function ProfileForm({ initialProfile, onSubmit, isLoading }: ProfileFormProps) {
  const [activeTab, setActiveTab] = useState<'physical' | 'lifestyle' | 'history' | 'constraints'>('physical');
  
  // Physical Metrics State
  const [age, setAge] = useState<number>(35);
  const [gender, setGender] = useState<string>('Male');
  const [height, setHeight] = useState<number>(175); // in cm
  const [weight, setWeight] = useState<number>(78); // in kg
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft-in'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');

  // Feet & Inches temporary inputs
  const [feet, setFeet] = useState<number>(5);
  const [inches, setInches] = useState<number>(9);
  const [lbs, setLbs] = useState<number>(172);

  // Lifestyle State
  const [sleep, setSleep] = useState<number>(7);
  const [exercise, setExercise] = useState<number>(30);
  const [smoking, setSmoking] = useState<boolean>(false);
  const [alcohol, setAlcohol] = useState<string>('Occasional');
  const [waterIntake, setWaterIntake] = useState<number>(2.0);
  const [stress, setStress] = useState<string>('Medium');

  // History & Goals State
  const [familyHistory, setFamilyHistory] = useState<string>('');
  const [existingConditions, setExistingConditions] = useState<string>('');
  const [goals, setGoals] = useState<string>('');

  // Personal Constraints State
  const [cuisine, setCuisine] = useState<string>('Indian/South Asian');
  const [budget, setBudget] = useState<string>('Budget-Friendly');
  const [prepTime, setPrepTime] = useState<string>('Quick (< 15 mins)');
  const [equipment, setEquipment] = useState<string[]>(['Bodyweight Only']);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(['Vegetarian']);

  // Sync with initial profile if loaded
  useEffect(() => {
    if (initialProfile) {
      setAge(initialProfile.age || 35);
      setGender(initialProfile.gender || 'Male');
      const h = initialProfile.height || 175;
      setHeight(h);
      const ftVal = Math.floor(h / 30.48);
      const inchVal = Math.round((h % 30.48) / 2.54);
      setFeet(ftVal);
      setInches(inchVal);

      const w = initialProfile.weight || 78;
      setWeight(w);
      setLbs(Math.round(w * 2.20462));

      setSleep(initialProfile.sleep || 7);
      setExercise(initialProfile.exercise || 30);
      setSmoking(initialProfile.smoking || false);
      setAlcohol(initialProfile.alcohol || 'Occasional');
      setWaterIntake(initialProfile.waterIntake || 2.0);
      setStress(initialProfile.stress || 'Medium');
      setFamilyHistory(initialProfile.familyHistory || '');
      setExistingConditions(initialProfile.existingConditions || '');
      setGoals(initialProfile.goals || '');

      if (initialProfile.cuisine) setCuisine(initialProfile.cuisine);
      if (initialProfile.budget) setBudget(initialProfile.budget);
      if (initialProfile.prepTime) setPrepTime(initialProfile.prepTime);
      if (Array.isArray(initialProfile.equipment)) setEquipment(initialProfile.equipment);
      if (Array.isArray(initialProfile.dietaryRestrictions)) setDietaryRestrictions(initialProfile.dietaryRestrictions);
    }
  }, [initialProfile]);

  // Unit Converters
  const updateHeightCm = (newCm: number) => {
    const validCm = Math.max(100, Math.min(250, newCm));
    setHeight(validCm);
    setFeet(Math.floor(validCm / 30.48));
    setInches(Math.round((validCm % 30.48) / 2.54));
  };

  const updateHeightFtIn = (newFeet: number, newInches: number) => {
    setFeet(newFeet);
    setInches(newInches);
    const cmVal = Math.round((newFeet * 30.48) + (newInches * 2.54));
    setHeight(cmVal);
  };

  const updateWeightKg = (newKg: number) => {
    const validKg = Math.max(30, Math.min(250, newKg));
    setWeight(validKg);
    setLbs(Math.round(validKg * 2.20462));
  };

  const updateWeightLbs = (newLbs: number) => {
    setLbs(newLbs);
    const kgVal = Math.round(newLbs / 2.20462);
    setWeight(kgVal);
  };

  // Calculate BMI
  const bmi = weight / Math.pow(height / 100, 2);
  
  const getBmiCategory = (value: number) => {
    if (value < 18.5) return { label: 'Underweight', color: 'text-amber-400' };
    if (value < 25) return { label: 'Normal weight', color: 'text-emerald-400' };
    if (value < 30) return { label: 'Overweight', color: 'text-orange-400' };
    return { label: 'Obese', color: 'text-rose-400' };
  };

  const bmiInfo = getBmiCategory(bmi);

  const toggleEquipment = (item: string) => {
    if (equipment.includes(item)) {
      if (equipment.length > 1) {
        setEquipment(equipment.filter(e => e !== item));
      }
    } else {
      setEquipment([...equipment, item]);
    }
  };

  const toggleDietaryRestriction = (item: string) => {
    if (item === 'None') {
      setDietaryRestrictions(['None']);
      return;
    }
    const filtered = dietaryRestrictions.filter(d => d !== 'None');
    if (filtered.includes(item)) {
      const next = filtered.filter(d => d !== item);
      setDietaryRestrictions(next.length === 0 ? ['None'] : next);
    } else {
      setDietaryRestrictions([...filtered, item]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      age,
      gender,
      height,
      weight,
      sleep,
      exercise,
      smoking,
      alcohol,
      waterIntake,
      stress,
      familyHistory,
      existingConditions,
      goals,
      cuisine,
      budget,
      prepTime,
      equipment,
      dietaryRestrictions,
    });
  };

  return (
    <form id="health-profiler-form" onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
      
      {/* Title */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-emerald-400 fill-emerald-400/15" />
            Health Profiler & Protocol Assessment
          </h2>
          <p className="text-xs text-slate-400">Log physical vitals, lifestyle habits, and personal constraints for your AI Protocol</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Current BMI</span>
          <p className="text-sm font-semibold text-slate-200">
            {bmi.toFixed(1)} <span className={`text-[11px] font-medium ${bmiInfo.color}`}>({bmiInfo.label})</span>
          </p>
        </div>
      </div>

      {/* Tabs (4 Steps) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-850 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('physical')}
          className={`py-2 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'physical'
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          1. Physical Metrics
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('lifestyle')}
          className={`py-2 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'lifestyle'
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          2. Lifestyle Habits
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`py-2 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'history'
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          3. Medical History
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('constraints')}
          className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === 'constraints'
              ? 'bg-indigo-600 text-white shadow shadow-indigo-600/30'
              : 'text-indigo-400 hover:text-indigo-200'
          }`}
        >
          <Sparkles className="w-3 h-3 text-indigo-300" />
          4. Personal Constraints
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-5 min-h-[300px]">
        {/* STEP 1: PHYSICAL METRICS */}
        {activeTab === 'physical' && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Age Input with Stepper */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Age (Years)</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAge(Math.max(18, age - 1))}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all border border-slate-700"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="18"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(Math.max(18, Number(e.target.value)))}
                  className="flex-grow bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-center text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setAge(Math.min(100, age + 1))}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all border border-slate-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Gender Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">Gender</label>
              <div className="grid grid-cols-3 gap-2.5">
                {['Male', 'Female', 'Non-binary'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-2 px-3 border rounded-xl text-xs font-medium transition-all ${
                      gender === g
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-sm'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Height & Weight with Stepper Controls and Metric/Imperial Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Height Field */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-300">Height</label>
                  {/* Unit Toggle */}
                  <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setHeightUnit('cm')}
                      className={`px-2 py-0.5 rounded ${heightUnit === 'cm' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                    >
                      cm
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeightUnit('ft-in')}
                      className={`px-2 py-0.5 rounded ${heightUnit === 'ft-in' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                    >
                      ft-in
                    </button>
                  </div>
                </div>

                {heightUnit === 'cm' ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateHeightCm(height - 1)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 shrink-0"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => updateHeightCm(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-center text-sm font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => updateHeightCm(height + 1)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block">Feet</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateHeightFtIn(Math.max(3, feet - 1), inches)}
                          className="p-1.5 bg-slate-800 text-slate-200 rounded border border-slate-700"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          value={feet}
                          onChange={(e) => updateHeightFtIn(Number(e.target.value), inches)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center text-xs font-bold text-emerald-400 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => updateHeightFtIn(Math.min(8, feet + 1), inches)}
                          className="p-1.5 bg-slate-800 text-slate-200 rounded border border-slate-700"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block">Inches</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateHeightFtIn(feet, Math.max(0, inches - 1))}
                          className="p-1.5 bg-slate-800 text-slate-200 rounded border border-slate-700"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          value={inches}
                          onChange={(e) => updateHeightFtIn(feet, Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center text-xs font-bold text-emerald-400 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => updateHeightFtIn(feet, Math.min(11, inches + 1))}
                          className="p-1.5 bg-slate-800 text-slate-200 rounded border border-slate-700"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <span className="text-[10px] text-slate-500 font-mono block text-right">Computed: {height} cm</span>
              </div>

              {/* Weight Field */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-300">Weight</label>
                  {/* Unit Toggle */}
                  <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setWeightUnit('kg')}
                      className={`px-2 py-0.5 rounded ${weightUnit === 'kg' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                    >
                      kg
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeightUnit('lbs')}
                      className={`px-2 py-0.5 rounded ${weightUnit === 'lbs' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                    >
                      lbs
                    </button>
                  </div>
                </div>

                {weightUnit === 'kg' ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateWeightKg(weight - 1)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 shrink-0"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => updateWeightKg(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-center text-sm font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => updateWeightKg(weight + 1)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateWeightLbs(lbs - 1)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 shrink-0"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      value={lbs}
                      onChange={(e) => updateWeightLbs(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-center text-sm font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => updateWeightLbs(lbs + 1)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <span className="text-[10px] text-slate-500 font-mono block text-right">Computed: {weight} kg ({lbs} lbs)</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-850 text-xs text-slate-400 flex gap-2.5 mt-2">
              <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Body Mass Index (BMI) is computed dynamically. Your current value of <span className="font-semibold text-white">{bmi.toFixed(1)}</span> falls within the <span className={`font-semibold ${bmiInfo.color}`}>{bmiInfo.label.toLowerCase()}</span> range.
              </p>
            </div>
          </motion.div>
        )}

        {/* STEP 2: LIFESTYLE HABITS */}
        {activeTab === 'lifestyle' && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Sleep & Exercise Inputs with Steppers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Sleep (Hours/Day)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSleep(Math.max(4, Number((sleep - 0.5).toFixed(1))))}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 shrink-0"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    step="0.5"
                    value={sleep}
                    onChange={(e) => setSleep(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-center text-sm font-bold text-indigo-400 font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setSleep(Math.min(12, Number((sleep + 0.5).toFixed(1))))}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Daily Exercise (Mins)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExercise(Math.max(0, exercise - 5))}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 shrink-0"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    step="5"
                    value={exercise}
                    onChange={(e) => setExercise(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-center text-sm font-bold text-indigo-400 font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setExercise(Math.min(180, exercise + 5))}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Water Intake Input with Stepper */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Water Intake (Liters/Day)</label>
              <div className="flex items-center gap-2 max-w-xs">
                <button
                  type="button"
                  onClick={() => setWaterIntake(Math.max(0.5, Number((waterIntake - 0.1).toFixed(1))))}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 shrink-0"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  step="0.1"
                  value={waterIntake}
                  onChange={(e) => setWaterIntake(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-center text-sm font-bold text-sky-400 font-mono focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setWaterIntake(Math.min(6.0, Number((waterIntake + 0.1).toFixed(1))))}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Stress Level Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">Stress Level</label>
              <div className="grid grid-cols-3 gap-2.5">
                {['Low', 'Medium', 'High'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStress(s)}
                    className={`py-2 px-3 border rounded-xl text-xs font-medium transition-all ${
                      stress === s
                        ? s === 'Low'
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-sm'
                          : s === 'Medium'
                          ? 'border-amber-500/50 bg-amber-500/10 text-amber-400 shadow-sm'
                          : 'border-rose-500/50 bg-rose-500/10 text-rose-400 shadow-sm'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Smoking Status & Alcohol Intake */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">Tobacco/Smoking Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSmoking(true)}
                    className={`py-2 px-3 border rounded-xl text-xs font-medium transition-all ${
                      smoking === true
                        ? 'border-rose-500/50 bg-rose-500/10 text-rose-400 shadow-sm'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Active Smoker
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmoking(false)}
                    className={`py-2 px-3 border rounded-xl text-xs font-medium transition-all ${
                      smoking === false
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-sm'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Non-Smoker
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">Alcohol Intake</label>
                <select
                  value={alcohol}
                  onChange={(e) => setAlcohol(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-800 rounded-xl bg-slate-950 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="None">None (Sober)</option>
                  <option value="Occasional">Occasional (1-2 drinks/wk)</option>
                  <option value="Moderate">Moderate (3-7 drinks/wk)</option>
                  <option value="Heavy">Heavy (8+ drinks/wk)</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: PREFERENCES & MEDICAL HISTORY */}
        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Family History */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Family Medical History</label>
              <input
                type="text"
                value={familyHistory}
                onChange={(e) => setFamilyHistory(e.target.value)}
                placeholder="e.g. Father has diabetes, Mother had hypertension"
                className="w-full p-2.5 border border-slate-800 rounded-xl bg-slate-950 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Existing Medical Conditions */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Your Medical Conditions</label>
              <input
                type="text"
                value={existingConditions}
                onChange={(e) => setExistingConditions(e.target.value)}
                placeholder="e.g. Asthma, mild thyroid, high cholesterol, none"
                className="w-full p-2.5 border border-slate-800 rounded-xl bg-slate-950 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Health Goals */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Personal Fitness & Lifestyle Goals</label>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={3}
                placeholder="Describe your health goals (e.g. Reduce cholesterol levels, tone leg muscles, train for half marathon, cut down sugar snacks)"
                className="w-full p-2.5 border border-slate-800 rounded-xl bg-slate-950 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
              />
            </div>
          </motion.div>
        )}

        {/* STEP 4: PERSONAL CONSTRAINTS (NEW) */}
        {activeTab === 'constraints' && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Region & Cuisine Preferences */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-indigo-400" />
                Region & Cuisine Preferences
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  'Indian/South Asian',
                  'Mediterranean',
                  'Western',
                  'East Asian',
                  'Local Pantry Staples'
                ].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCuisine(c)}
                    className={`py-2 px-3 border rounded-xl text-xs font-medium transition-all text-left truncate ${
                      cuisine === c
                        ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300 font-bold shadow-sm'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {c === 'Indian/South Asian' ? '🇮🇳 Indian / South Asian' : c === 'Mediterranean' ? '🥗 Mediterranean' : c === 'Western' ? '🥪 Western' : c === 'East Asian' ? '🍜 East Asian' : '🌾 Local Staples'}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget & Prep Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Budget Level */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Budget Level
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: 'Budget-Friendly', label: '💰 Budget-Friendly / Affordable' },
                    { id: 'Moderate', label: '💳 Moderate' },
                    { id: 'Premium', label: '💎 Premium / High-Yield' }
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBudget(b.id)}
                      className={`w-full py-2 px-3 border rounded-xl text-xs font-medium transition-all text-left ${
                        budget === b.id
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 font-bold'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prep Time */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Preparation Time / Effort
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: 'Quick (< 15 mins)', label: '⚡ Quick (< 15 mins)' },
                    { id: 'Moderate (15-30 mins)', label: '🍳 Moderate (15-30 mins)' },
                    { id: 'Batch Cooking', label: '🍲 Batch Prep / Slow Cook' }
                  ].map((pt) => (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => setPrepTime(pt.id)}
                      className={`w-full py-2 px-3 border rounded-xl text-xs font-medium transition-all text-left ${
                        prepTime === pt.id
                          ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-bold'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {pt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Available Equipment (Checkboxes) */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-rose-400" />
                Available Workout Equipment (Check all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Bodyweight Only',
                  'Resistance Bands',
                  'Dumbbells / Home Gym',
                  'Full Commercial Gym'
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleEquipment(item)}
                    className={`py-2 px-3 border rounded-xl text-xs font-medium transition-all text-left flex items-center gap-2 ${
                      equipment.includes(item)
                        ? 'border-rose-500/50 bg-rose-500/10 text-rose-300 font-bold'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${equipment.includes(item) ? 'bg-rose-500 text-white' : 'border border-slate-700'}`}>
                      {equipment.includes(item) && '✓'}
                    </div>
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dietary Restrictions (Checkboxes) */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Dietary Restrictions</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  'Vegetarian',
                  'Vegan',
                  'Eggetarian',
                  'Halal',
                  'Lactose-Free',
                  'Gluten-Free',
                  'None'
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleDietaryRestriction(item)}
                    className={`py-2 px-2.5 border rounded-xl text-xs font-medium transition-all text-left flex items-center gap-1.5 ${
                      dietaryRestrictions.includes(item)
                        ? 'border-teal-500/50 bg-teal-500/10 text-teal-300 font-bold'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded flex items-center justify-center text-[9px] ${dietaryRestrictions.includes(item) ? 'bg-teal-500 text-white' : 'border border-slate-700'}`}>
                      {dietaryRestrictions.includes(item) && '✓'}
                    </div>
                    <span className="truncate">{item}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Button Controls */}
      <div className="flex items-center gap-3 mt-6 border-t border-slate-800 pt-5">
        {activeTab !== 'constraints' && (
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'physical') setActiveTab('lifestyle');
              else if (activeTab === 'lifestyle') setActiveTab('history');
              else if (activeTab === 'history') setActiveTab('constraints');
            }}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 shrink-0"
          >
            Next Section
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Saving Profile & Recalculating Risks...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 fill-slate-950/20 text-slate-950" />
              Save & Generate Constraint-Aware Action Plan
            </>
          )}
        </button>
      </div>
    </form>
  );
}
