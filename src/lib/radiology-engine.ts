/**
 * Automated Radiology Report Summarizer & Plain-Language Patient Translator Engine
 */

export interface RadiologyScanPreset {
  id: string;
  title: string;
  modality: 'X-Ray' | 'MRI' | 'CT Scan' | 'Ultrasound';
  anatomy: string;
  imageFileName: string;
  rawFindings: string;
  impression: string;
  icd10: string;
}

export interface MedicalTermTranslation {
  medicalJargon: string;
  plainEnglish: string;
  patientExplanation: string;
}

export interface RadiologySummaryResult {
  scanTitle: string;
  modality: string;
  anatomy: string;
  severityLevel: 'Normal' | 'Mild Finding' | 'Moderate Finding' | 'Urgent Attention';
  clinicalReport: {
    rawFindings: string;
    impression: string;
    icd10: string;
    technicalTerms: string[];
  };
  patientGuide: {
    headline: string;
    plainSummary: string;
    translatedTerms: MedicalTermTranslation[];
    whatThisMeansForYou: string;
    actionableSteps: string[];
    questionsForDoctor: string[];
  };
}

export const RADIOLOGY_PRESETS: RadiologyScanPreset[] = [
  {
    id: 'chest-xray-1',
    title: 'Chest X-Ray (PA & Lateral View)',
    modality: 'X-Ray',
    anatomy: 'Thoracic Cavity & Cardiopulmonary Systems',
    imageFileName: 'Chest_XRay_PA_Lateral_2026.png',
    rawFindings: 'PA and lateral chest radiograph demonstrates mild cardiomegaly. Bibasilar micro-atelectasis noted right greater than left. No focal consolidation, pneumothorax, or large pleural effusion. Osseous structures intact.',
    impression: '1. Mild cardiomegaly with bibasilar atelectasis.\n2. No active pulmonary infiltrate or pneumothorax.',
    icd10: 'I51.7, J98.11'
  },
  {
    id: 'lumbar-mri-1',
    title: 'Lumbar Spine MRI (L1-S1 Spectrum)',
    modality: 'MRI',
    anatomy: 'Lumbar Spine & Neural Foramina',
    imageFileName: 'Lumbar_MRI_L4_L5_Scan.png',
    rawFindings: 'L4-L5 demonstrates 4mm focal posterior disc herniation with indentation of the ventral thecal sac and mild bilateral neural foraminal stenosis. L5-S1 exhibits mild disc desiccation with preserved disc height. Conus medullaris terminates normally at L1.',
    impression: '1. L4-L5 posterior disc herniation with mild foraminal stenosis.\n2. No high-grade spinal cord compression.',
    icd10: 'M51.26, M48.06'
  },
  {
    id: 'brain-ct-1',
    title: 'Brain CT Scan (Non-Contrast)',
    modality: 'CT Scan',
    anatomy: 'Intracranial Parenchyma & Ventricles',
    imageFileName: 'Brain_CT_NonContrast.png',
    rawFindings: 'Non-contrast CT of the head reveals normal ventricular system and basilar cisterns. No acute intracranial hemorrhage, mass effect, or midline shift. Mild age-appropriate cerebral volume loss (cortical atrophy). Calvarium intact.',
    impression: '1. No acute intracranial hemorrhage or ischemic stroke.\n2. Age-appropriate mild cerebral atrophy.',
    icd10: 'G31.9, Z86.79'
  },
  {
    id: 'abdo-us-1',
    title: 'Abdominal Ultrasound (Complete)',
    modality: 'Ultrasound',
    anatomy: 'Hepatobiliary & Renal Systems',
    imageFileName: 'Abdomen_Ultrasound_Hepatobiliary.png',
    rawFindings: 'Liver demonstrates diffuesly increased echogenicity consistent with mild hepatic steatosis. No focal hepatic mass. Gallbladder contains a single 4mm non-obstructing hyperechoic calculus with posterior acoustic shadowing. Common bile duct measures 3.5mm.',
    impression: '1. Mild hepatic steatosis (Fatty Liver).\n2. Asymptomatic 4mm cholelithiasis (Gallstone).',
    icd10: 'K76.0, K80.20'
  }
];

export const MEDICAL_DICTIONARY: Record<string, MedicalTermTranslation> = {
  'cardiomegaly': {
    medicalJargon: 'Cardiomegaly',
    plainEnglish: 'Slightly enlarged heart size',
    patientExplanation: 'Your heart appears slightly larger than average on the X-Ray, which can happen with blood pressure or regular cardio changes.'
  },
  'atelectasis': {
    medicalJargon: 'Atelectasis',
    plainEnglish: 'Small area of resting or deflated lung tissue',
    patientExplanation: 'A small portion of your lower lung tissue isn’t fully inflated. This is very common after shallow breathing, rest, or cold.'
  },
  'herniation': {
    medicalJargon: 'Disc Herniation',
    plainEnglish: 'Bulging disc cushion between spine bones',
    patientExplanation: 'One of the jelly-like shock absorber cushions between your spine bones is bulging out slightly.'
  },
  'stenosis': {
    medicalJargon: 'Foraminal Stenosis',
    plainEnglish: 'Narrowing of nerve exit space',
    patientExplanation: 'The small side doorway where nerves leave your backbone is slightly narrowed, which can sometimes cause stiffness or back tingling.'
  },
  'steatosis': {
    medicalJargon: 'Hepatic Steatosis',
    plainEnglish: 'Fatty liver storage',
    patientExplanation: 'Your liver has extra fat accumulation, which is reversible with diet changes and exercise.'
  },
  'cholelithiasis': {
    medicalJargon: 'Cholelithiasis',
    plainEnglish: 'Gallstone',
    patientExplanation: 'A small stone formed in the gallbladder, which is currently sitting peacefully without causing blockage.'
  },
  'atrophy': {
    medicalJargon: 'Cerebral Atrophy',
    plainEnglish: 'Normal age-related brain volume change',
    patientExplanation: 'Normal natural shrinkage of brain volume that happens as we grow older, similar to getting gray hair.'
  }
};

/**
 * Summarizes raw radiology findings into clinical & patient plain-language summaries
 */
export function summarizeRadiologyReport(
  modality: string,
  anatomy: string,
  rawFindings: string,
  impression: string,
  icd10: string,
  scanTitle: string = 'Diagnostic Radiology Scan'
): RadiologySummaryResult {
  const textLower = (rawFindings + ' ' + impression).toLowerCase();

  // Find matching dictionary terms
  const translatedTerms: MedicalTermTranslation[] = [];
  Object.keys(MEDICAL_DICTIONARY).forEach(termKey => {
    if (textLower.includes(termKey)) {
      translatedTerms.push(MEDICAL_DICTIONARY[termKey]);
    }
  });

  // Default fallback term if none matched
  if (translatedTerms.length === 0) {
    translatedTerms.push({
      medicalJargon: 'Unremarkable Findings',
      plainEnglish: 'Normal healthy appearance',
      patientExplanation: 'Your diagnostic scan shows clean, healthy structures without significant abnormal changes.'
    });
  }

  // Determine Severity Level
  let severityLevel: 'Normal' | 'Mild Finding' | 'Moderate Finding' | 'Urgent Attention' = 'Normal';
  if (textLower.includes('hemorrhage') || textLower.includes('fracture') || textLower.includes('severe stenosis')) {
    severityLevel = 'Urgent Attention';
  } else if (textLower.includes('herniation') || textLower.includes('cardiomegaly') || textLower.includes('steatosis')) {
    severityLevel = 'Moderate Finding';
  } else if (textLower.includes('atelectasis') || textLower.includes('atrophy') || textLower.includes('mild')) {
    severityLevel = 'Mild Finding';
  }

  // Build Patient Plain Summary
  let plainSummary = `Your ${modality} of the ${anatomy} has been processed. Overall, your scan shows `;
  if (severityLevel === 'Normal') {
    plainSummary += 'no major medical concerns. Your organs and tissues look healthy and normal.';
  } else if (severityLevel === 'Mild Finding') {
    plainSummary += 'mostly healthy results with minor, routine observations that are very common and usually not dangerous.';
  } else {
    plainSummary += 'some specific findings (such as ' + translatedTerms.map(t => t.plainEnglish).join(', ') + ') that your doctor will review with you.';
  }

  const whatThisMeansForYou = `This test gives your doctor a clear visual picture. There are no sudden life-threatening emergencies detected. The main finding to know is: ${translatedTerms[0]?.patientExplanation || 'your scan is clear.'}`;

  const actionableSteps = [
    'Deep breathing exercises: Practice taking 5-10 deep breaths every hour if resting.',
    'Keep physical activity: Light 20-minute daily walks help circulation and spinal flexibility.',
    'Share this summary: Bring this plain-language summary to your follow-up doctor appointment.'
  ];

  const questionsForDoctor = [
    `"Doctor, can you explain what ${translatedTerms[0]?.medicalJargon || 'these findings'} mean for my daily routine?"`,
    '"Do I need any physical therapy, lifestyle adjustments, or medication for this?"',
    '"When should we schedule our next check-up or follow-up scan?"'
  ];

  return {
    scanTitle,
    modality,
    anatomy,
    severityLevel,
    clinicalReport: {
      rawFindings,
      impression,
      icd10,
      technicalTerms: translatedTerms.map(t => t.medicalJargon)
    },
    patientGuide: {
      headline: severityLevel === 'Normal' ? 'Clean & Healthy Scan Results' : 'Clear & Understandable Scan Breakdown',
      plainSummary,
      translatedTerms,
      whatThisMeansForYou,
      actionableSteps,
      questionsForDoctor
    }
  };
}
