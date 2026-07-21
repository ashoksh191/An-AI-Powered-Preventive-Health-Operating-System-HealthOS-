import React, { useState, useEffect } from 'react';
import { Activity, Heart, Shield, PlusCircle, Check, Info, RefreshCw, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileFormProps {
  initialProfile: any;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

export default function ProfileForm({ initialProfile, onSubmit, isLoading }: ProfileFormProps) {
  const [activeTab, setActiveTab] = useState<'physical' | 'lifestyle' | 'history'>('physical');
  const [age, setAge] = useState<number>(35);
  const [gender, setGender] = useState<string>('Male');
  const [height, setHeight] = useState<number>(175);
  const [weight, setWeight] = useState<number>(78);
  const [sleep, setSleep] = useState<number>(7);
  const [exercise, setExercise] = useState<number>(30);
  const [smoking, setSmoking] = useState<boolean>(false);
  const [alcohol, setAlcohol] = useState<string>('Occasional');
  const [waterIntake, setWaterIntake] = useState<number>(2.0);
  const [stress, setStress] = useState<string>('Medium');
  const [familyHistory, setFamilyHistory] = useState<string>('');
  const [existingConditions, setExistingConditions] = useState<string>('');
  const [goals, setGoals] = useState<string>('');

  // Sync with initial profile if loaded
  useEffect(() => {
    if (initialProfile) {
      setAge(initialProfile.age || 35);
      setGender(initialProfile.gender || 'Male');
      setHeight(initialProfile.height || 175);
      setWeight(initialProfile.weight || 78);
      setSleep(initialProfile.sleep || 7);
      setExercise(initialProfile.exercise || 30);
      setSmoking(initialProfile.smoking || false);
      setAlcohol(initialProfile.alcohol || 'Occasional');
      setWaterIntake(initialProfile.waterIntake || 2.0);
      setStress(initialProfile.stress || 'Medium');
      setFamilyHistory(initialProfile.familyHistory || '');
      setExistingConditions(initialProfile.existingConditions || '');
      setGoals(initialProfile.goals || '');
    }
  }, [initialProfile]);

  // Calculate BMI
  const bmi = weight / Math.pow(height / 100, 2);
  
  const getBmiCategory = (value: number) => {
    if (value < 18.5) return { label: 'Underweight', color: 'text-amber-400' };
    if (value < 25) return { label: 'Normal weight', color: 'text-emerald-400' };
    if (value < 30) return { label: 'Overweight', color: 'text-orange-400' };
    return { label: 'Obese', color: 'text-rose-400' };
  };

  const bmiInfo = getBmiCategory(bmi);

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
            Health Profiler & Assessment
          </h2>
          <p className="text-xs text-slate-400">Log physical metrics and lifestyle habits to recalculate risks & scores</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Current BMI</span>
          <p className="text-sm font-semibold text-slate-200">
            {bmi.toFixed(1)} <span className={`text-[11px] font-medium ${bmiInfo.color}`}>({bmiInfo.label})</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-850 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('physical')}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
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
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
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
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'history'
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          3. Preferences & History
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-5 min-h-[300px]">
        {activeTab === 'physical' && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Age Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">Age (Years)</label>
                <span className="text-sm font-bold text-emerald-400 font-mono">{age} yrs</span>
              </div>
              <input
                type="range"
                min="18"
                max="90"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                <span>18 yrs</span>
                <span>54 yrs</span>
                <span>90 yrs</span>
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

            {/* Height & Weight Dual Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-300">Height (cm)</label>
                  <span className="text-sm font-bold text-emerald-400 font-mono">{height} cm</span>
                </div>
                <input
                  type="range"
                  min="120"
                  max="220"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>120 cm</span>
                  <span>220 cm</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-300">Weight (kg)</label>
                  <span className="text-sm font-bold text-emerald-400 font-mono">{weight} kg</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="150"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>40 kg</span>
                  <span>150 kg</span>
                </div>
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

        {activeTab === 'lifestyle' && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Sleep & Exercise Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-300">Sleep (Hours/Day)</label>
                  <span className="text-sm font-bold text-indigo-400 font-mono">{sleep} hrs</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="11"
                  step="0.5"
                  value={sleep}
                  onChange={(e) => setSleep(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>4 hrs</span>
                  <span>11 hrs</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-300">Daily Exercise (Mins)</label>
                  <span className="text-sm font-bold text-indigo-400 font-mono">{exercise} mins</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="120"
                  step="5"
                  value={exercise}
                  onChange={(e) => setExercise(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>0 mins</span>
                  <span>120 mins</span>
                </div>
              </div>
            </div>

            {/* Water Intake Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">Water Intake (Liters/Day)</label>
                <span className="text-sm font-bold text-sky-400 font-mono">{waterIntake.toFixed(1)} L</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={waterIntake}
                onChange={(e) => setWaterIntake(Number(e.target.value))}
                className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                <span>0.5 L</span>
                <span>5.0 L</span>
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
                placeholder="e.g. Asthma, mild thyroid, none"
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
      </div>

      {/* Button Controls */}
      <div className="flex items-center gap-3 mt-6 border-t border-slate-800 pt-5">
        {activeTab !== 'history' && (
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'physical') setActiveTab('lifestyle');
              else if (activeTab === 'lifestyle') setActiveTab('history');
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
              Save & Update Health Profile
            </>
          )}
        </button>
      </div>
    </form>
  );
}
