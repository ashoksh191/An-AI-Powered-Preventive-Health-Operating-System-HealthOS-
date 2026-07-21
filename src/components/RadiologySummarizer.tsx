import React, { useState } from 'react';
import { 
  FileText, Upload, Volume2, VolumeX, Sparkles, Eye, UserCheck, 
  Stethoscope, Download, Check, HelpCircle, AlertCircle, Info, 
  ArrowRight, Heart, Shield, RefreshCw, Layers
} from 'lucide-react';
import { RADIOLOGY_PRESETS, summarizeRadiologyReport, RadiologySummaryResult } from '../lib/radiology-engine';

export default function RadiologySummarizer() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('chest-xray-1');
  const [viewMode, setViewMode] = useState<'patient' | 'clinical'>('patient');
  
  const currentPreset = RADIOLOGY_PRESETS.find(p => p.id === selectedPresetId) || RADIOLOGY_PRESETS[0];
  
  const [rawFindings, setRawFindings] = useState<string>(currentPreset.rawFindings);
  const [impression, setImpression] = useState<string>(currentPreset.impression);
  const [icd10, setIcd10] = useState<string>(currentPreset.icd10);
  const [uploadedFileName, setUploadedFileName] = useState<string>(currentPreset.imageFileName);
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [summaryResult, setSummaryResult] = useState<RadiologySummaryResult>(() => {
    return summarizeRadiologyReport(
      currentPreset.modality,
      currentPreset.anatomy,
      currentPreset.rawFindings,
      currentPreset.impression,
      currentPreset.icd10,
      currentPreset.title
    );
  });

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  const handleSelectPreset = (presetId: string) => {
    const preset = RADIOLOGY_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setSelectedPresetId(preset.id);
      setRawFindings(preset.rawFindings);
      setImpression(preset.impression);
      setIcd10(preset.icd10);
      setUploadedFileName(preset.imageFileName);
      setSummaryResult(summarizeRadiologyReport(preset.modality, preset.anatomy, preset.rawFindings, preset.impression, preset.icd10, preset.title));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFileName(file.name);
    }
  };

  const handleProcessScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const res = await fetch('/api/radiology/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modality: currentPreset.modality,
          anatomy: currentPreset.anatomy,
          rawFindings,
          impression,
          icd10,
          title: currentPreset.title
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setSummaryResult(data.result);
      } else {
        setSummaryResult(summarizeRadiologyReport(currentPreset.modality, currentPreset.anatomy, rawFindings, impression, icd10, currentPreset.title));
      }
    } catch (err) {
      setSummaryResult(summarizeRadiologyReport(currentPreset.modality, currentPreset.anatomy, rawFindings, impression, icd10, currentPreset.title));
    } finally {
      setIsProcessing(false);
    }
  };

  const speakPatientSummary = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = `${summaryResult.patientGuide.headline}. ${summaryResult.patientGuide.plainSummary} ${summaryResult.patientGuide.whatThisMeansForYou}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const downloadPatientGuide = () => {
    const text = `RADIOLOGY REPORT PATIENT PLAIN-LANGUAGE SUMMARY
==================================================
Scan: ${summaryResult.scanTitle} (${summaryResult.modality})
Anatomy: ${summaryResult.anatomy}
Generated: ${new Date().toLocaleDateString()}

OVERALL SUMMARY:
${summaryResult.patientGuide.plainSummary}

WHAT THIS MEANS FOR YOU:
${summaryResult.patientGuide.whatThisMeansForYou}

TRANSLATED MEDICAL TERMS:
${summaryResult.patientGuide.translatedTerms.map(t => `- ${t.medicalJargon}: ${t.plainEnglish} (${t.patientExplanation})`).join('\n')}

ACTIONABLE NEXT STEPS:
${summaryResult.patientGuide.actionableSteps.map(s => `- ${s}`).join('\n')}

QUESTIONS TO ASK YOUR DOCTOR:
${summaryResult.patientGuide.questionsForDoctor.map(q => `- ${q}`).join('\n')}
`;
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Patient_Radiology_Summary_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-teal-950/60 to-slate-950 border border-teal-800/60 p-6 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3.5 z-10">
          <div className="p-3 bg-teal-600 rounded-xl text-white shadow-xl shadow-teal-500/20">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Automated Radiology Summarizer</h2>
              <span className="px-2.5 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full text-[10px] font-mono font-semibold uppercase">Multi-Modal Vision Engine</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Extracts radiological findings & translates complex medical imaging jargon into plain patient summaries</p>
          </div>
        </div>

        {/* View Mode Toggle Pill */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl z-10">
          <button
            onClick={() => setViewMode('patient')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              viewMode === 'patient'
                ? 'bg-emerald-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Patient View (Plain Language)
          </button>
          <button
            onClick={() => setViewMode('clinical')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              viewMode === 'clinical'
                ? 'bg-indigo-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            Clinical View (Radiologist)
          </button>
        </div>
      </div>

      {/* Preset Scan Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {RADIOLOGY_PRESETS.map(preset => (
          <button
            key={preset.id}
            onClick={() => handleSelectPreset(preset.id)}
            className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all ${
              selectedPresetId === preset.id
                ? 'bg-slate-900 border-teal-500/80 shadow-lg shadow-teal-500/10 ring-1 ring-teal-500/40'
                : 'bg-slate-950 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50'
            }`}
          >
            <div>
              <span className="text-[9px] font-mono uppercase font-bold text-teal-400 bg-teal-950 px-1.5 py-0.5 rounded border border-teal-900/40">
                {preset.modality}
              </span>
              <p className="text-xs font-bold text-white mt-1.5 leading-snug">{preset.title}</p>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">{preset.anatomy}</span>
          </button>
        ))}
      </div>

      {/* Main Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form: Radiology Inputs & Scan Preview (5 cols) */}
        <form onSubmit={handleProcessScan} className="lg:col-span-5 bg-slate-950 border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Upload className="w-4 h-4 text-teal-400" />
              Upload Medical Scan / Report
            </h3>
            <span className="text-[10px] font-mono text-slate-500 uppercase">DICOM / Image Input</span>
          </div>

          {/* Upload Dropzone */}
          <div className="p-4 bg-slate-900 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-center gap-2">
            <FileText className="w-8 h-8 text-teal-400/60" />
            <div>
              <p className="text-xs font-semibold text-slate-300">{uploadedFileName || 'Drop X-Ray / MRI Image file here'}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Supports PNG, JPG, DICOM preview, or PDF radiology report</p>
            </div>
            <input type="file" onChange={handleFileUpload} accept=".pdf,.png,.jpg,.jpeg" className="hidden" id="radiology-file" />
            <label htmlFor="radiology-file" className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors">
              Browse Scan File
            </label>
          </div>

          {/* Raw Findings Input */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Radiology Findings (Text / Extracted)</label>
            <textarea
              value={rawFindings}
              onChange={(e) => setRawFindings(e.target.value)}
              rows={4}
              placeholder="Paste or view radiological findings..."
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-teal-500 leading-relaxed resize-none"
            />
          </div>

          {/* Impression Input */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Radiological Impression</label>
            <textarea
              value={impression}
              onChange={(e) => setImpression(e.target.value)}
              rows={3}
              placeholder="Radiologist impression notes..."
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-teal-500 leading-relaxed resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Translating Radiology Findings...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-slate-950/20 text-slate-950" />
                Summarize & Translate Report
              </>
            )}
          </button>
        </form>

        {/* Right Output: Dual View Display (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          {/* Header Bar of Output */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                summaryResult.severityLevel === 'Normal' ? 'bg-emerald-950 text-emerald-300 border border-emerald-900/40' :
                summaryResult.severityLevel === 'Mild Finding' ? 'bg-amber-950 text-amber-300 border border-amber-900/40' :
                'bg-rose-950 text-rose-300 border border-rose-900/40'
              }`}>
                {summaryResult.severityLevel} Status
              </span>
              <h3 className="text-xs font-bold text-white">{summaryResult.scanTitle}</h3>
            </div>

            <div className="flex items-center gap-2">
              {viewMode === 'patient' && (
                <button
                  onClick={speakPatientSummary}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isSpeaking
                      ? 'bg-rose-600 text-white shadow-lg animate-pulse'
                      : 'bg-slate-900 border border-slate-800 text-teal-300 hover:bg-slate-850'
                  }`}
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isSpeaking ? 'Stop Audio' : 'Listen Summary'}</span>
                </button>
              )}

              <button
                onClick={downloadPatientGuide}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-teal-500/10"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* PATIENT VIEW DISPLAY */}
          {viewMode === 'patient' && (
            <div className="space-y-4">
              {/* Plain Language Headline & Summary Card */}
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider font-mono">
                  <UserCheck className="w-4 h-4" />
                  <span>{summaryResult.patientGuide.headline}</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{summaryResult.patientGuide.plainSummary}</p>
                
                <div className="p-3 bg-emerald-950/30 border border-emerald-900/40 rounded-xl text-xs text-emerald-200/90 leading-relaxed flex items-start gap-2">
                  <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold text-emerald-300">What this means for you: </strong>
                    {summaryResult.patientGuide.whatThisMeansForYou}
                  </div>
                </div>
              </div>

              {/* Translated Medical Terms Dictionary */}
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  Medical Terms Translated to Plain Language
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {summaryResult.patientGuide.translatedTerms.map((term, idx) => (
                    <div key={idx} className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-300 line-through decoration-rose-500/50">{term.medicalJargon}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
                        <span className="text-xs font-bold text-teal-300">{term.plainEnglish}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800/60">{term.patientExplanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Questions for Your Doctor */}
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-400" />
                  Recommended Questions to Ask Your Doctor
                </h4>
                
                <div className="space-y-2">
                  {summaryResult.patientGuide.questionsForDoctor.map((q, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-900 border border-slate-850 rounded-xl text-xs text-indigo-200 font-mono flex items-center gap-2">
                      <span className="text-indigo-400 font-bold">Q{idx + 1}:</span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CLINICAL VIEW DISPLAY */}
          {viewMode === 'clinical' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-indigo-400" />
                    Raw Radiological Findings & ICD-10 Mappings
                  </h4>
                  <span className="text-[10px] font-mono text-indigo-400 font-semibold bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900/40">
                    ICD-10: {summaryResult.clinicalReport.icd10}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-1">Detailed Anatomical Findings:</span>
                    <p className="p-3 bg-slate-900 border border-slate-850 rounded-xl text-xs font-mono text-slate-200 leading-relaxed">
                      {summaryResult.clinicalReport.rawFindings}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-1">Radiologist Impression:</span>
                    <p className="p-3 bg-slate-900 border border-slate-850 rounded-xl text-xs font-mono text-emerald-300 leading-relaxed whitespace-pre-line">
                      {summaryResult.clinicalReport.impression}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
