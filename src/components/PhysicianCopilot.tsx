import React, { useState } from 'react';
import { 
  Stethoscope, Activity, FileText, AlertTriangle, ShieldCheck, Sparkles, 
  Upload, Copy, Download, ChevronRight, Check, Pill, HeartPulse, 
  BarChart2, Info, ArrowUpRight, Zap, RefreshCw
} from 'lucide-react';
import { PatientEhrInput, CopilotSynthesisResult, synthesizeClinicalEhr } from '../lib/copilot-engine';

export default function PhysicianCopilot() {
  const [age, setAge] = useState<number>(54);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [systolicBp, setSystolicBp] = useState<number>(146);
  const [diastolicBp, setDiastolicBp] = useState<number>(92);
  const [heartRate, setHeartRate] = useState<number>(78);
  const [spo2, setSpo2] = useState<number>(97);
  const [weight, setWeight] = useState<number>(84);
  const [height, setHeight] = useState<number>(176);
  
  // Labs
  const [fastingGlucose, setFastingGlucose] = useState<number>(138);
  const [hba1c, setHba1c] = useState<number>(8.1);
  const [totalCholesterol, setTotalCholesterol] = useState<number>(228);
  const [hdl, setHdl] = useState<number>(38);
  const [ldl, setLdl] = useState<number>(148);
  const [triglycerides, setTriglycerides] = useState<number>(190);
  const [egfr, setEgfr] = useState<number>(54);
  const [creatinine, setCreatinine] = useState<number>(1.4);
  
  // History & Notes
  const [currentMedications, setCurrentMedications] = useState<string>('Metformin 500mg BID, Lisinopril 10mg daily');
  const [allergies, setAllergies] = useState<string>('Penicillin (rash)');
  const [clinicalNotes, setClinicalNotes] = useState<string>('Patient reports mild nocturnal fatigue and increased thirst. Smoker (10 pack-years). Family history of early CAD in father.');
  const [fileName, setFileName] = useState<string>('Lab_Report_Biomarkers_2026.pdf');

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [synthesisResult, setSynthesisResult] = useState<CopilotSynthesisResult | null>(() => {
    return synthesizeClinicalEhr({
      age: 54, gender: 'Male', systolicBp: 146, diastolicBp: 92, heartRate: 78, spo2: 97, weight: 84, height: 176,
      fastingGlucose: 138, hba1c: 8.1, totalCholesterol: 228, hdl: 38, ldl: 148, triglycerides: 190, egfr: 54, creatinine: 1.4,
      currentMedications: 'Metformin 500mg BID, Lisinopril 10mg daily', allergies: 'Penicillin (rash)',
      clinicalNotes: 'Patient reports mild nocturnal fatigue and increased thirst. Smoker (10 pack-years). Family history of early CAD in father.',
      uploadedAttachmentName: 'Lab_Report_Biomarkers_2026.pdf'
    });
  });

  const [copiedSoap, setCopiedSoap] = useState<boolean>(false);

  const handleSynthesize = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);

    const inputData: PatientEhrInput = {
      age, gender, systolicBp, diastolicBp, heartRate, spo2, weight, height,
      fastingGlucose, hba1c, totalCholesterol, hdl, ldl, triglycerides, egfr, creatinine,
      currentMedications, allergies, clinicalNotes, uploadedAttachmentName: fileName
    };

    try {
      const res = await fetch('/api/copilot/synthesize-ehr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputData)
      });
      const data = await res.json();
      if (data.success && data.synthesis) {
        setSynthesisResult(data.synthesis);
      } else {
        setSynthesisResult(synthesizeClinicalEhr(inputData));
      }
    } catch (err) {
      setSynthesisResult(synthesizeClinicalEhr(inputData));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const copySoapToClipboard = () => {
    if (!synthesisResult) return;
    const text = `SOAP CLINICAL DOCUMENTATION
----------------------------------
SUBJECTIVE:
${synthesisResult.soapNote.subjective}

OBJECTIVE:
${synthesisResult.soapNote.objective}

ASSESSMENT:
${synthesisResult.soapNote.assessment}

PLAN & EVIDENCE-BASED RECOMMENDATIONS:
${synthesisResult.soapNote.plan}
`;
    navigator.clipboard.writeText(text);
    setCopiedSoap(true);
    setTimeout(() => setCopiedSoap(false), 2500);
  };

  const downloadSoapText = () => {
    if (!synthesisResult) return;
    const text = `HEALTHOS CLINICAL COPILOT - SOAP NOTE & EVIDENCE BLUEPRINT
Generated: ${new Date().toLocaleString()}
----------------------------------------------------------------------
SUBJECTIVE:
${synthesisResult.soapNote.subjective}

OBJECTIVE:
${synthesisResult.soapNote.objective}

ASSESSMENT:
${synthesisResult.soapNote.assessment}

PLAN & TREATMENT SUGGESTIONS:
${synthesisResult.soapNote.plan}
`;
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Clinical_SOAP_Note_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950/70 to-slate-950 border border-indigo-800/60 p-6 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3.5 z-10">
          <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-xl shadow-indigo-500/20">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Physician AI Co-Pilot</h2>
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-[10px] font-mono font-semibold uppercase">ACC/AHA & ADA 2024 Guidelines</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Multi-Modal EHR Synthesizer & Real-Time Evidence-Based Clinical Decision Support</p>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10">
          <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>HIPAA-Safe Processing</span>
          </div>
        </div>
      </div>

      {/* Main Grid Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Multi-Modal EHR Input Form (5 cols) */}
        <form onSubmit={handleSynthesize} className="lg:col-span-5 bg-slate-950 border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Patient EHR & Multi-Modal Input
            </h3>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Input Workstation</span>
          </div>

          {/* Vitals Section */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">1. Physical Vitals</span>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Age (yrs)</label>
                <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value as any)} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Weight (kg)</label>
                <input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500" />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">SBP (mmHg)</label>
                <input type="number" value={systolicBp} onChange={(e) => setSystolicBp(Number(e.target.value))} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-rose-300 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">DBP (mmHg)</label>
                <input type="number" value={diastolicBp} onChange={(e) => setDiastolicBp(Number(e.target.value))} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-rose-300 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">HR (bpm)</label>
                <input type="number" value={heartRate} onChange={(e) => setHeartRate(Number(e.target.value))} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">SpO2 (%)</label>
                <input type="number" value={spo2} onChange={(e) => setSpo2(Number(e.target.value))} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-teal-300 focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
          </div>

          {/* Lab Biomarkers Section */}
          <div className="space-y-3 border-t border-slate-850 pt-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">2. Lab Biomarkers & Renal Metrics</span>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">HbA1c (%)</label>
                <input type="number" step="0.1" value={hba1c} onChange={(e) => setHba1c(Number(e.target.value))} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-purple-300 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Glucose (mg/dL)</label>
                <input type="number" value={fastingGlucose} onChange={(e) => setFastingGlucose(Number(e.target.value))} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-amber-300 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">LDL (mg/dL)</label>
                <input type="number" value={ldl} onChange={(e) => setLdl(Number(e.target.value))} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-orange-300 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">eGFR (mL/min)</label>
                <input type="number" value={egfr} onChange={(e) => setEgfr(Number(e.target.value))} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
          </div>

          {/* History & Multi-Modal Upload */}
          <div className="space-y-3 border-t border-slate-850 pt-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">3. Clinical History & Attachment</span>
            
            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-1">Current Prescriptions</label>
              <input type="text" value={currentMedications} onChange={(e) => setCurrentMedications(e.target.value)} placeholder="e.g. Metformin 500mg BID" className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500" />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-1">Allergies & Hypersensitivities</label>
              <input type="text" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g. Penicillin, Sulfa" className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500" />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-1">Clinical Notes & Complaints</label>
              <textarea value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} rows={3} placeholder="Enter physician progress notes..." className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none" />
            </div>

            {/* Upload multi-modal file */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-1">Upload Lab PDF / ECG / Diagnostic Scan</label>
              <div className="flex items-center gap-2 p-2 bg-slate-900 border border-dashed border-slate-800 rounded-lg">
                <Upload className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-xs text-slate-400 truncate flex-grow">{fileName || 'Choose PDF / Image report...'}</span>
                <input type="file" onChange={handleFileUpload} accept=".pdf,.png,.jpg,.jpeg" className="hidden" id="ehr-file-input" />
                <label htmlFor="ehr-file-input" className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-semibold cursor-pointer">
                  Browse
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isAnalyzing}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Synthesizing Multi-Modal EHR...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Synthesize EHR & Generate Evidence-Based Plan
              </>
            )}
          </button>
        </form>

        {/* Right Side: Synthesized Clinical Evidence Output (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {synthesisResult && (
            <>
              {/* Quick Risk Score Badges */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl flex flex-col gap-1">
                  <span className="text-[10px] font-mono uppercase text-slate-500">Framingham CVD Risk</span>
                  <div className="flex items-baseline justify-between">
                    <p className="text-lg font-bold text-rose-400">{synthesisResult.cvdRiskScorePercent}%</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${synthesisResult.cvdRiskScorePercent > 15 ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'}`}>
                      {synthesisResult.cvdRiskScorePercent > 20 ? 'High' : synthesisResult.cvdRiskScorePercent > 10 ? 'Moderate' : 'Low'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl flex flex-col gap-1">
                  <span className="text-[10px] font-mono uppercase text-slate-500">Glycemic Status</span>
                  <div className="flex items-baseline justify-between">
                    <p className="text-lg font-bold text-amber-400">{hba1c}% HbA1c</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono">
                      {synthesisResult.diabetesRiskLevel}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl flex flex-col gap-1">
                  <span className="text-[10px] font-mono uppercase text-slate-500">Renal Function Status</span>
                  <div className="flex items-baseline justify-between">
                    <p className="text-lg font-bold text-cyan-400">{egfr} eGFR</p>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono">
                      {egfr >= 60 ? 'Preserved' : 'Reduced'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Drug Interaction Banners */}
              {synthesisResult.interactionAlerts.length > 0 && (
                <div className="space-y-2">
                  {synthesisResult.interactionAlerts.map((alert, idx) => (
                    <div key={idx} className="p-3.5 bg-rose-950/40 border border-rose-900/60 rounded-xl text-xs flex items-start gap-3 shadow-lg">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-rose-300">{alert.drugsOrCondition}</span>
                          <span className="px-1.5 py-0.5 bg-rose-900 text-rose-200 text-[9px] font-bold uppercase rounded font-mono">{alert.severity} Safety Alert</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">{alert.description}</p>
                        <p className="text-emerald-300 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          Recommended Action: {alert.actionRequired}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Panel 1: Differential Diagnoses */}
              <div className="bg-slate-950 border border-slate-800 p-4.5 rounded-2xl space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-rose-400" />
                    Differential Diagnoses & Urgency Stratification
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">ICD-10 Mapped</span>
                </div>

                <div className="space-y-2.5">
                  {synthesisResult.differentials.map((diff, idx) => (
                    <div key={idx} className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{diff.condition}</span>
                          <span className="px-2 py-0.5 bg-slate-800 text-indigo-300 text-[10px] font-mono rounded border border-indigo-900/40">ICD-10: {diff.icd10}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          diff.urgency === 'Critical' ? 'bg-rose-950 text-rose-300' :
                          diff.urgency === 'High' ? 'bg-orange-950 text-orange-300' :
                          diff.urgency === 'Moderate' ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'
                        }`}>
                          {diff.urgency} Urgency
                        </span>
                      </div>

                      {/* Confidence bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400">
                          <span>Clinical Diagnostic Confidence</span>
                          <span className="text-indigo-400 font-bold">{diff.probability}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-indigo-500 to-teal-400 h-full rounded-full" style={{ width: `${diff.probability}%` }} />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{diff.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel 2: Guidelines Evidence-Based Treatment Suggestions */}
              <div className="bg-slate-950 border border-slate-800 p-4.5 rounded-2xl space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-emerald-400" />
                    Evidence-Based Treatment & Pharmacotherapy (ACC/AHA / ADA Guidelines)
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Class I Recommendations</span>
                </div>

                <div className="space-y-2.5">
                  {synthesisResult.treatmentPlan.map((plan, idx) => (
                    <div key={idx} className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-300">{plan.title}</span>
                        <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-900/40 text-[9px] font-mono font-semibold rounded uppercase">
                          {plan.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{plan.recommendation}</p>
                      <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-slate-400 border-t border-slate-800/60">
                        <span className="text-teal-400 font-semibold">📜 Citation: {plan.evidenceCitation}</span>
                        <span className="text-slate-500">{plan.icd10OrDrugClass}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel 3: SOAP Note & Prescription Export */}
              <div className="bg-slate-950 border border-slate-800 p-4.5 rounded-2xl space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-violet-400" />
                    Structured SOAP Note & Clinical Documentation
                  </h4>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={copySoapToClipboard}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      {copiedSoap ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSoap ? 'Copied!' : 'Copy SOAP'}</span>
                    </button>
                    <button
                      onClick={downloadSoapText}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .txt</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900 border border-slate-850 rounded-xl space-y-2 font-mono text-xs text-slate-300 leading-relaxed">
                  <div>
                    <span className="text-indigo-400 font-bold uppercase">Subjective:</span>
                    <p className="text-slate-300 mt-0.5">{synthesisResult.soapNote.subjective}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/60">
                    <span className="text-teal-400 font-bold uppercase">Objective:</span>
                    <p className="text-slate-300 mt-0.5 whitespace-pre-line">{synthesisResult.soapNote.objective}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/60">
                    <span className="text-amber-400 font-bold uppercase">Assessment:</span>
                    <p className="text-slate-300 mt-0.5 whitespace-pre-line">{synthesisResult.soapNote.assessment}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/60">
                    <span className="text-emerald-400 font-bold uppercase">Plan & Evidence-Based Prescriptions:</span>
                    <p className="text-slate-300 mt-0.5 whitespace-pre-line">{synthesisResult.soapNote.plan}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
