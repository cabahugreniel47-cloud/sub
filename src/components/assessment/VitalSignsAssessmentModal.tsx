import React, { useState, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { Patient, TriageLevel } from '../../types/clinic';
import { X, Activity, Heart, Thermometer, Wind, CheckCircle2, AlertTriangle } from 'lucide-react';

export const VitalSignsAssessmentModal: React.FC = () => {
  const {
    patients,
    recordVitalSigns,
    setActiveModal,
    modalPayload,
    selectedPatient,
    showToast
  } = useClinic();

  const patientToAssess: Patient | undefined = modalPayload?.patient || selectedPatient || (patients.length > 0 ? patients[0] : undefined);

  const [patientId, setPatientId] = useState(patientToAssess?.id || '');
  const [systolic, setSystolic] = useState<number | string>(0);
  const [diastolic, setDiastolic] = useState<number | string>(0);
  const [heartRate, setHeartRate] = useState<number | string>(0);
  const [respiratoryRate, setRespiratoryRate] = useState<number | string>(0);
  const [temperature, setTemperature] = useState<number | string>(0);
  const [oxygenSaturation, setOxygenSaturation] = useState<number | string>(0);
  const [heightCm, setHeightCm] = useState<number | string>(0);
  const [weightKg, setWeightKg] = useState<number | string>(0);
  const [painScale, setPainScale] = useState<number | string>(0);
  const [chiefComplaint, setChiefComplaint] = useState(modalPayload?.chiefComplaint || 'Health Assessment & checkup');
  const [triageLevel, setTriageLevel] = useState<TriageLevel>('Standard');
  const [nurseNotes, setNurseNotes] = useState('');

  // Auto calculate BMI
  const numHeight = Number(heightCm) || 0;
  const numWeight = Number(weightKg) || 0;
  const heightM = numHeight / 100;
  const bmi = heightM > 0 && numWeight > 0 ? Number((numWeight / (heightM * heightM)).toFixed(1)) : 0;

  let bmiClassification: 'Pending Assessment' | 'Underweight' | 'Normal' | 'Overweight' | 'Obese Class I' | 'Obese Class II' = 'Pending Assessment';
  if (bmi === 0) bmiClassification = 'Pending Assessment';
  else if (bmi < 18.5) bmiClassification = 'Underweight';
  else if (bmi < 25.0) bmiClassification = 'Normal';
  else if (bmi < 30.0) bmiClassification = 'Overweight';
  else if (bmi < 35.0) bmiClassification = 'Obese Class I';
  else bmiClassification = 'Obese Class II';

  // Blood Pressure Classification
  const numSys = Number(systolic) || 0;
  const numDia = Number(diastolic) || 0;
  let bpStage = 'Pending BP Measurement';
  let bpBadgeColor = 'text-slate-600 bg-slate-100';
  if (numSys === 0 && numDia === 0) {
    bpStage = 'Not Measured (0/0 mmHg)';
    bpBadgeColor = 'text-slate-600 bg-slate-100';
  } else if (numSys >= 140 || numDia >= 90) {
    bpStage = 'Stage 2 Hypertension';
    bpBadgeColor = 'text-red-700 bg-red-50';
  } else if (numSys >= 130 || numDia >= 80) {
    bpStage = 'Stage 1 Hypertension';
    bpBadgeColor = 'text-amber-700 bg-amber-50';
  } else if (numSys >= 120) {
    bpStage = 'Elevated BP';
    bpBadgeColor = 'text-yellow-700 bg-yellow-50';
  } else {
    bpStage = 'Normal BP';
    bpBadgeColor = 'text-emerald-700 bg-emerald-50';
  }

  // Auto recommend triage if fever or severe BP (ignores unmeasured 0 values)
  useEffect(() => {
    const temp = Number(temperature) || 0;
    const sys = Number(systolic) || 0;
    const spo2 = Number(oxygenSaturation) || 0;
    const pain = Number(painScale) || 0;

    if (temp >= 38.5 || sys >= 160 || (spo2 > 0 && spo2 <= 92) || pain >= 8) {
      setTriageLevel('Emergency');
    } else if (temp >= 37.8 || sys >= 140 || pain >= 5) {
      setTriageLevel('Urgent');
    } else {
      setTriageLevel('Standard');
    }
  }, [temperature, systolic, oxygenSaturation, painScale]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    recordVitalSigns({
      patientId,
      bloodPressureSystolic: Number(systolic),
      bloodPressureDiastolic: Number(diastolic),
      heartRate: Number(heartRate),
      respiratoryRate: Number(respiratoryRate),
      temperature: Number(temperature),
      oxygenSaturation: Number(oxygenSaturation),
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      bmi,
      bmiClassification: (bmi === 0 ? 'Normal' : bmiClassification) as any,
      painScale: Number(painScale),
      chiefComplaint,
      triageLevel,
      nurseNotes
    });

    showToast('Vital signs & preliminary triage recorded successfully! Patient queue advanced to Doctor examination.', 'success');
    setActiveModal(null);
  };

  const currentPatient = patients.find(p => p.id === patientId) || patientToAssess;

  if (!currentPatient) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-3">
          <Activity className="w-9 h-9 mx-auto text-emerald-600" />
          <h3 className="font-bold text-slate-900 text-base">No Patient Selected</h3>
          <p className="text-xs text-slate-500">
            Please register or select a patient to record vital signs and preliminary triage.
          </p>
          <button
            type="button"
            onClick={() => setActiveModal(null)}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-base">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>Vital Signs & Preliminary Triage Assessment</span>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Selection & Summary */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <label className="font-semibold text-slate-700">Patient:</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="p-1.5 bg-white border border-slate-300 rounded font-semibold text-slate-900 cursor-pointer"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.psuId} - {p.classification})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">
              Age: {currentPatient.age} yrs · Sex: {currentPatient.gender}
            </span>
            {currentPatient.knownAllergies && currentPatient.knownAllergies[0] !== 'None declared' && (
              <span className="text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded">
                Allergy: {currentPatient.knownAllergies.join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 flex-1">
          {/* Card 1: Core Vital Signs */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-2 pb-1 border-b border-slate-100">
              Cardiopulmonary & Thermal Metrics
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* BP Systolic */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block font-semibold mb-1">Blood Pressure (Systolic)</label>
                <div className="flex items-center gap-1 font-mono">
                  <input
                    type="number"
                    value={systolic}
                    onChange={(e) => setSystolic(Number(e.target.value))}
                    min={60}
                    max={260}
                    required
                    className="w-full p-2 bg-white border border-slate-300 rounded font-bold text-slate-900 text-sm"
                  />
                  <span className="text-slate-400 text-[10px]">mmHg</span>
                </div>
              </div>

              {/* BP Diastolic */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block font-semibold mb-1">Blood Pressure (Diastolic)</label>
                <div className="flex items-center gap-1 font-mono">
                  <input
                    type="number"
                    value={diastolic}
                    onChange={(e) => setDiastolic(Number(e.target.value))}
                    min={40}
                    max={160}
                    required
                    className="w-full p-2 bg-white border border-slate-300 rounded font-bold text-slate-900 text-sm"
                  />
                  <span className="text-slate-400 text-[10px]">mmHg</span>
                </div>
              </div>

              {/* Heart Rate */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block font-semibold mb-1 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-red-600" />
                  <span>Heart Rate / Pulse</span>
                </label>
                <div className="flex items-center gap-1 font-mono">
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(Number(e.target.value))}
                    min={40}
                    max={220}
                    required
                    className="w-full p-2 bg-white border border-slate-300 rounded font-bold text-slate-900 text-sm"
                  />
                  <span className="text-slate-400 text-[10px]">bpm</span>
                </div>
              </div>

              {/* Respiratory Rate */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block font-semibold mb-1 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-blue-600" />
                  <span>Respiratory Rate</span>
                </label>
                <div className="flex items-center gap-1 font-mono">
                  <input
                    type="number"
                    value={respiratoryRate}
                    onChange={(e) => setRespiratoryRate(Number(e.target.value))}
                    min={8}
                    max={60}
                    required
                    className="w-full p-2 bg-white border border-slate-300 rounded font-bold text-slate-900 text-sm"
                  />
                  <span className="text-slate-400 text-[10px]">cpm</span>
                </div>
              </div>
            </div>

            {/* Live BP Clinical Staging Indicator */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">BP Interpretation:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${bpBadgeColor}`}>
                {bpStage} ({systolic}/{diastolic} mmHg)
              </span>
            </div>
          </div>

          {/* Temperature & Oxygen Saturation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block font-semibold mb-1 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-red-600" />
                <span>Body Temperature (°C)</span>
              </label>
              <div className="flex items-center gap-2 font-mono">
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  min={34}
                  max={43}
                  required
                  className="w-full p-2 bg-white border border-slate-300 rounded font-bold text-slate-900 text-sm"
                />
                <span className="text-slate-500">°C</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {Number(temperature) >= 37.8 ? (
                  <span className="text-red-700 font-bold">Feverish (Temp ≥ 37.8°C)</span>
                ) : (
                  <span className="text-emerald-700">Afebrile (Normal range)</span>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block font-semibold mb-1">Pulse Oximetry (SpO2 %)</label>
              <div className="flex items-center gap-2 font-mono">
                <input
                  type="number"
                  value={oxygenSaturation}
                  onChange={(e) => setOxygenSaturation(Number(e.target.value))}
                  min={70}
                  max={100}
                  required
                  className="w-full p-2 bg-white border border-slate-300 rounded font-bold text-slate-900 text-sm"
                />
                <span className="text-slate-500">% SpO2</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {Number(oxygenSaturation) < 95 ? (
                  <span className="text-amber-700 font-bold">Sub-optimal SpO2 (&lt; 95%)</span>
                ) : (
                  <span className="text-emerald-700">Adequate Oxygen Saturation</span>
                )}
              </div>
            </div>
          </div>

          {/* Anthropometrics: Height, Weight, Auto BMI */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-2 pb-1 border-b border-slate-100">
              Anthropometrics & Body Mass Index (BMI)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block font-semibold mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  min={100}
                  max={230}
                  className="w-full p-2 bg-white border border-slate-300 rounded font-bold text-slate-900 text-sm font-mono"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block font-semibold mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  min={30}
                  max={250}
                  className="w-full p-2 bg-white border border-slate-300 rounded font-bold text-slate-900 text-sm font-mono"
                />
              </div>

              <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl">
                <label className="block font-semibold mb-1">Calculated BMI</label>
                <div className="text-lg font-bold font-mono text-slate-900">
                  {bmi}{' '}
                  <span className="text-xs font-semibold text-slate-600">({bmiClassification})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pain Scale Slider (0-10) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800">
                Visual Pain Scale Score: <strong className="font-mono text-red-800">{painScale} / 10</strong>
              </label>
              <span className="text-[11px] text-slate-500">
                {Number(painScale) === 0 ? 'No Pain' : Number(painScale) <= 3 ? 'Mild Discomfort' : Number(painScale) <= 6 ? 'Moderate Pain' : 'Severe Pain'}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={painScale}
              onChange={(e) => setPainScale(Number(e.target.value))}
              className="w-full accent-red-700 cursor-pointer"
            />
          </div>

          {/* Chief Complaint & Triage Classification */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">Stated Chief Complaint / Symptoms *</label>
              <input
                type="text"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="e.g. Sore throat, headache, ankle sprain, fever"
                required
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Assigned Triage Level *</label>
              <select
                value={triageLevel}
                onChange={(e) => setTriageLevel(e.target.value as TriageLevel)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-bold cursor-pointer"
              >
                <option value="Standard">Standard (Non-urgent)</option>
                <option value="Urgent">Urgent (Priority)</option>
                <option value="Emergency">Emergency (Immediate)</option>
              </select>
            </div>
          </div>

          {/* Nurse Clinical Notes */}
          <div>
            <label className="block font-semibold mb-1">Nurse Initial Notes / Interventions</label>
            <textarea
              value={nurseNotes}
              onChange={(e) => setNurseNotes(e.target.value)}
              placeholder="e.g. Patient provided oral rehydration salt. Wheelchair assistance provided for left ankle injury."
              rows={2}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Route to Doctor Queue</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
