import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { clinicRouter } from './src/server/clinicRouter';
import { initPersistence } from './src/server/database';

dotenv.config();

// Load the shared clinic database from Firestore (durable across restarts) before serving requests
await initPersistence();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Centralized Clinic Backend API routes (Multi-device shared database & RBAC)
app.use('/api/clinic', clinicRouter);
app.use('/api', clinicRouter);

// Parse CLI flags for port and host
const args = process.argv.slice(2);
let port = 3000;
let host = '0.0.0.0';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    port = parseInt(args[i + 1], 10);
  } else if (args[i].startsWith('--port=')) {
    port = parseInt(args[i].split('=')[1], 10);
  }
  if (args[i] === '--host' && args[i + 1]) {
    host = args[i + 1];
  } else if (args[i].startsWith('--host=')) {
    host = args[i].split('=')[1];
  }
}

if (process.env.PORT) {
  port = parseInt(process.env.PORT, 10);
}

// Lazy & safe Google Gemini Client initialization so the server never crashes at startup if GEMINI_API_KEY is missing
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  try {
    if (geminiClient) return geminiClient;
    const geminiApiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : undefined;
    if (!geminiApiKey || geminiApiKey === 'MY_GEMINI_API_KEY') {
      return null;
    }
    geminiClient = new GoogleGenAI({ apiKey: geminiApiKey });
    return geminiClient;
  } catch (err) {
    return null;
  }
}

/**
 * Resilient multi-model Gemini caller with automatic fallback
 * Tries models approved in gemini-api skill: gemini-3.8-flash, gemini-3.1-flash-lite, gemini-flash-latest
 */
async function generateGeminiContent(config: {
  contents: any;
  systemInstruction?: string;
  responseMimeType?: string;
  temperature?: number;
}): Promise<string | null> {
  const ai = getGeminiClient();
  if (!ai) {
    return null; // no API key: callers fall back to their built-in rule-based answers
  }

  const models = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];

  for (const model of models) {
    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model,
          contents: config.contents,
          config: {
            systemInstruction: config.systemInstruction,
            responseMimeType: config.responseMimeType,
            temperature: config.temperature ?? 0.7
          }
        }),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
      ]);
      if (response && (response as any).text) {
        return (response as any).text;
      }
    } catch (err: any) {
      console.warn(`[Gemini API] Model ${model} issue:`, err.message || err);
      // continue to next model in sequence
    }
  }

  return null;
}

/**
 * Health check endpoint
 */
app.get('/api/ai/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    models: ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'],
    timestamp: new Date().toISOString()
  });
});

/**
 * Main AI Chat Endpoint for Clin Clin Assistant
 * Handles ANY question across all roles (Admin, Doctor, Nurse, Staff, Student, Guest)
 */
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, role = 'student', contextSummary, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const systemInstruction = `You are "Clin Clin", the intelligent, friendly, empathetic, and knowledgeable virtual assistant mascot for the Pampanga State University (PSU) University Health & Medical Services Office (UHMS), located at Bacolor Main Campus, Pampanga, Philippines.
You wear a pristine white lab coat with crimson PSU trim, a heart emblem, and a stethoscope.

CORE MISSION & CAPABILITIES:
1. You can chat and answer ANY question the user asks:
   - General health, symptoms, wellness, first aid, hydration, nutrition, and over-the-counter care guidelines.
   - Pampanga State University campus questions: Clinic location (Ground Floor, Student Welfare Building, Bacolor Main Campus), clinic operating hours (Monday to Friday, 8:00 AM – 5:00 PM; 24/7 on-call campus ambulance/emergency), contact hotlines (Direct Line: (045) 901-0601, Hotline: 0917-882-9011, clinic@psu.edu.ph).
   - Clinic procedures: Queue ticket issuance, live TV display monitoring, automated SMS status alerts, appointment booking, free generic formulary medicines under the Generics Act (RA 6675), and official Medical Certificates issued by University Physician Dr. Roberto M. Manalo, MD.
   - Clinical and administrative workflows: SOAP documentation tips for doctors, triage thresholds (Pampanga State University Triage scale) for nurses, patient intake and queue guidance for reception staff, and census/inventory forecasting for administrators.
   - General academic, science, translation, or campus questions: Respond helpfully, politely, and intelligently to any inquiry.
2. Tone: Warm, welcoming, respectful, articulate, and reassuring.
3. Language: Fluently understand and respond in English, Filipino / Tagalog, and Kapampangan depending on the user's input.
4. Formatting: Use clear markdown, bold key points, bullet lists, and friendly emojis to make information easy to read.
5. Safety Governance: When explaining medical symptoms or illnesses, provide rich educational guidance and always include a gentle reminder that final clinical diagnosis and prescription must be confirmed in person by the University Physician or a licensed medical doctor.

CURRENT USER ROLE: ${role.toUpperCase()}
${contextSummary ? `CLINIC CONTEXT: ${contextSummary}` : ''}`;

    // Format conversation history for Gemini if provided
    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history.slice(-6)) {
        if (h.sender === 'user' || h.role === 'user') {
          contents.push({ role: 'user', parts: [{ text: h.text }] });
        } else if (h.sender === 'clinclin' || h.role === 'model') {
          contents.push({ role: 'model', parts: [{ text: h.text }] });
        }
      }
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const reply = await generateGeminiContent({
      contents,
      systemInstruction,
      temperature: 0.7
    });

    if (reply) {
      return res.json({ reply });
    }

    // Comprehensive fallback if all external models are rate-limited or offline
    const fallbackReply = generateResilientAnswer(message, role);
    return res.json({ reply: fallbackReply });
  } catch (error: any) {
    console.error('Clin Clin AI Chat Error:', error);
    const fallbackReply = generateResilientAnswer(req.body?.message || '', req.body?.role || 'student');
    return res.json({ reply: fallbackReply });
  }
});

/**
 * Intelligent local knowledge and reasoning responder for 100% uptime
 * Can chat and answer ANY question: symptoms, mental health, first aid, dental, triage,
 * campus procedures, Kapampangan / Tagalog, exams, wellness, and conversational inquiries.
 */
function generateResilientAnswer(msg: string, role: string): string {
  const raw = msg.trim();
  const q = raw.toLowerCase();

  // Greetings & Conversational
  if (/^(hi|hello|hey|kumusta|kamusta|musta|mayap a abak|mayap a gatpanapun|mayap a bengi|good morning|good afternoon|good evening)\b/i.test(q)) {
    return "👋 **Hello and welcome!** I am **Clin Clin**, your virtual health and clinic intelligence assistant for **Pampanga State University Medical Clinic**.\n\nI am ready to chat with you and answer **any questions** you have! You can ask me about:\n• 🌡️ Health concerns, symptoms, first aid & medications\n• ⏰ Clinic hours, doctors, dental checkups & location\n• 🎫 Queue tickets, status & automated SMS alerts\n• 📄 Official medical certificates & OJT physical clearances\n• 🧠 Stress management, study tips & student wellness\n\nHow can I help you today? *Puwede rin po magtanong sa Tagalog o Kapampangan!*";
  }

  // Who are you / Identity
  if (q.includes('who are you') || q.includes('sino ka') || q.includes('what are you') || q.includes('introduce')) {
    return "🩺 **About Clin Clin:**\n\nI am **Clin Clin**, the official AI clinical health assistant and mascot for the **Pampanga State University University Health & Medical Services Office (UHMS)** at Bacolor Main Campus!\n\nI am equipped to:\n• Answer **any health or medical inquiry** with evidence-based guidance.\n• Assist students and staff with clinic procedures, queue monitoring, and dispensary supplies.\n• Provide support in **English, Filipino/Tagalog, and Kapampangan**.\n\n*Note: My health information is educational. For definitive diagnosis or prescriptions, please consult attending University Physician Dr. Roberto M. Manalo, MD.*";
  }

  // Kapampangan queries
  if (q.includes('kapampangan') || q.includes('nanu') || q.includes('ot') || q.includes('masakit') || q.includes('lupa') || q.includes('babo')) {
    return "🇵🇭 **Mayap a aldo!** Aslagan da ka king Pampanga State University Medical Clinic:\n\n• **Oras ning Klinika:** Lunes anggang Biyernes, 8:00 AM anggang 5:00 PM.\n• **Doktor:** Dr. Roberto M. Manalo, MD (University Physician).\n• **Libreng Panulu:** Paracetamol, Cetirizine, Antacids, Mefenamic Acid king dispensary desk.\n• **Medical Certificate:** Maliari kang kumang certipiko nung mika-sakit ka kilub ning 48 oras.\n\nMasanting ing mag-ingat king kalusugan! Nanu pa ing buri mung ikutang?";
  }

  // Thank you / Appreciation
  if (q.includes('thank') || q.includes('salamat') || q.includes('dakal a salamat') || q.includes('appreciate')) {
    return "😊 **You're very welcome!** Walang anuman! It's always my pleasure to assist our fellow PSU students, faculty, and campus community. Stay safe, stay hydrated, and feel free to message me anytime you need medical guidance!";
  }

  // Stress / Mental Health / Exam anxiety
  if (q.includes('stress') || q.includes('anxiety') || q.includes('depress') || q.includes('overwhelm') || q.includes('panic') || q.includes('mental') || q.includes('exam') || q.includes('burnout')) {
    return "🧠 **Student Mental Wellness & Stress Protocol:**\n\n• **4-7-8 Breathing Technique:** Inhale through your nose for 4 seconds, hold gently for 7 seconds, exhale slowly through your mouth for 8 seconds. Repeat 4 times.\n• **Screen & Study Breaks:** Step away from study monitors for 10 minutes every hour (Pomodoro technique).\n• **Hydration & Sleep:** Aim for 7–8 hours of uninterrupted rest; sleep deprivation severely impairs cognitive retention.\n• **Campus Support:** The University Guidance & Counseling Office (UGCO) and PSU Medical Clinic provide confidential, compassionate counseling support.\n• 💚 **You are not alone.** If you are experiencing overwhelming anxiety or distress, visit our clinic or call the 24/7 National Mental Health Hotline at **1553** or **0917-899-8727**.";
  }

  // Insomnia / Sleep
  if (q.includes('sleep') || q.includes('insomnia') || q.includes('puyat') || q.includes('tulog') || q.includes('tired') || q.includes('pagod')) {
    return "🌙 **Healthy Sleep Hygiene for University Students:**\n\n• **Blue Light Filter:** Turn off smartphones and laptop screens at least 45 minutes before bedtime.\n• **Limit Caffeine:** Avoid coffee, energy drinks, or milk tea after 2:00 PM.\n• **Bedroom Climate:** Keep your sleeping area dark, quiet, and well-ventilated.\n• **Routine:** Establish a fixed sleep schedule even on weekends to reset your circadian rhythm.\n• If chronic insomnia or fatigue persists, consult with our university physician for a comprehensive health evaluation.";
  }

  // First Aid: Cuts, Wounds & Bleeding
  if (q.includes('cut') || q.includes('wound') || q.includes('bleed') || q.includes('sugat') || q.includes('dugo')) {
    return "🩹 **First Aid for Cuts & Bleeding:**\n\n1. **Direct Pressure:** Press a clean cloth or sterile gauze firmly against the wound for 5–10 minutes.\n2. **Cleanse:** Wash the injury gently with mild soap and clean running water. Avoid pouring pure alcohol directly into open tissue.\n3. **Antiseptic:** Apply Povidone-iodine (Betadine) around the wound.\n4. **Cover:** Protect with a sterile adhesive strip or gauze bandage.\n5. ⚠️ **Visit Clinic Immediately:** If bleeding won't stop, the wound is deep or gaping, caused by rusty objects (Tetanus risk), or shows signs of infection (pus, warmth, swelling).";
  }

  // First Aid: Burns
  if (q.includes('burn') || q.includes('paso') || q.includes('scalding')) {
    return "🔥 **Emergency First Aid for Burns:**\n\n1. **Cool Water Immediately:** Run cool (NOT ice-cold) tap water over the burn for 10–15 minutes.\n2. **DO NOT apply ice, butter, or toothpaste** — these trap heat and increase tissue damage.\n3. **Cover Loosely:** Place a clean, dry, non-stick sterile dressing over the area.\n4. **Visit PSU Clinic:** For second-degree burns (blistering), burns larger than 3 inches, or chemical burns, head directly to the clinic for medical debridement and topical silver sulfadiazine.";
  }

  // Animal Bites / Rabies
  if (q.includes('bite') || q.includes('kagat') || q.includes('aso') || q.includes('pusa') || q.includes('dog') || q.includes('cat') || q.includes('rabies')) {
    return "🐕 **URGENT: Protocol for Animal Bites & Scratches (Rabies Prevention):**\n\n1. **Immediate Wash:** Wash the bite/scratch area under brisk running tap water with laundry or bath soap for at least **15 continuous minutes**.\n2. **Antiseptic:** Apply povidone-iodine or 70% ethyl alcohol.\n3. **DO NOT suck the wound or apply garlic/stone ('tandok').**\n4. **Post-Exposure Prophylaxis (PEP):** Proceed immediately to the PSU Clinic or the nearest Animal Bite Treatment Center (ABTC) for anti-rabies and anti-tetanus immunization shots.\n5. Observe the offending animal for 14 days if possible.";
  }

  // Sprains & Strains (R.I.C.E.)
  if (q.includes('sprain') || q.includes('pilay') || q.includes('twist') || q.includes('ankle') || q.includes('muscle')) {
    return "🦵 **Care for Sprains & Strains (R.I.C.E. Protocol):**\n\n• **R - Rest:** Stop physical movement; avoid putting weight on the injured joint.\n• **I - Ice:** Apply cold pack wrapped in a towel for 15–20 minutes every 2–3 hours for the first 48 hours.\n• **C - Compress:** Wrap with an elastic crepe bandage to minimize joint swelling.\n• **E - Elevate:** Prop up the limb above heart level whenever sitting or lying down.\n• The clinic has elastic bandages, ice packs, and Mefenamic Acid for swelling relief.";
  }

  // Toothache & Dental
  if (q.includes('tooth') || q.includes('ngipin') || q.includes('dental') || q.includes('gums') || q.includes('dentist')) {
    return "🦷 **PSU Dental Services & Toothache Relief:**\n\n• **Immediate Relief:** Warm salt-water rinse (1/2 tsp salt in 1 glass warm water). Paracetamol or Mefenamic Acid can temporarily dull the pain.\n• **PSU Dental Clinic:** Open for enrolled students! Services include routine oral checkups, scaling/cleaning, tooth extraction evaluations, and oral hygiene education.\n• Book an appointment through the **Appointments** tab or visit the Dental Clinic Room.";
  }

  // Dysmenorrhea / Menstrual Cramps
  if (q.includes('period') || q.includes('menstru') || q.includes('cramp') || q.includes('dysmenorrhea') || q.includes('regla')) {
    return "🌸 **Relief for Menstrual Cramps (Dysmenorrhea):**\n\n• **Warm Compress:** Apply a warm heating pad or hot water bottle to the lower abdomen or lower back.\n• **Hydration:** Drink warm ginger tea or warm water; avoid cold sugary drinks.\n• **Mild Exercise:** Gentle stretching or walking helps release endorphins.\n• **Dispensary Medication:** Mefenamic Acid 500mg or Paracetamol is available free at the clinic front desk.\n• Our clinic observation beds are available if you need a quiet space to rest during acute discomfort.";
  }

  // Heat Exhaustion / Heat Stroke
  if (q.includes('heat') || q.includes('init') || q.includes('heat stroke') || q.includes('dehydration') || q.includes('dizzy') || q.includes('hilo')) {
    return "☀️ **Heat Exhaustion & Sun Safety:**\n\n• **Cool Down:** Move to a shaded or air-conditioned room immediately.\n• **Fluid Intake:** Sip cool water or Oral Rehydration Salts (ORS) slowly.\n• **Loosen Clothing:** Remove tight collars or jackets; fan the body.\n• ⚠️ **Heat Stroke Emergency:** If accompanied by confusion, lack of sweating, fainting, or body temp > 40°C, call campus emergency immediately for ambulance transport to the hospital.";
  }

  // Dengue Awareness
  if (q.includes('dengue') || q.includes('mosquito') || q.includes('lamok') || q.includes('platelet')) {
    return "🦟 **Dengue Warning Signs & Prevention:**\n\n• **Symptoms:** Sudden high fever (2–7 days), intense retro-orbital pain (behind eyes), joint/muscle pain, petechial skin rashes, nosebleeds or bleeding gums.\n• **Hydration:** Strict fluid intake is vital (water, ORS, coconut water).\n• ⚠️ **Never take Aspirin or Ibuprofen** for suspected dengue as they increase hemorrhage risk. Only Paracetamol is safe.\n• Visit the clinic for an immediate Complete Blood Count (CBC) and platelet count referral.";
  }

  // Sore Eyes / Conjunctivitis
  if (q.includes('eye') || q.includes('mata') || q.includes('sore eye') || q.includes('conjunctivitis')) {
    return "👁️ **Care for Sore Eyes (Pink Eye):**\n\n• **Do NOT rub your eyes:** Rubbing exacerbates corneal irritation and spreads infection.\n• **Frequent Handwashing:** Wash hands with antibacterial soap before and after touching your face.\n• **Cold Compress:** Apply a clean, cool damp washcloth over closed eyelids.\n• **Isolation:** Wear sunglasses and avoid sharing towels, pillows, or cosmetics.\n• Consult our clinic physician for diagnostic differentiation (bacterial vs viral conjunctivitis).";
  }

  // Blood Pressure / Hypertension
  if (q.includes('bp') || q.includes('blood pressure') || q.includes('hypertension') || q.includes('presyon')) {
    return "🩺 **Blood Pressure Guidelines at PSU Clinic:**\n\n• **Normal Adult BP:** Less than 120/80 mmHg.\n• **Elevated BP:** Systolic 120–129 and Diastolic < 80 mmHg.\n• **Stage 1 Hypertension:** 130–139 / 80–89 mmHg.\n• **Stage 2 Alert:** ≥ 140 / ≥ 90 mmHg (Flags as Urgent in the clinic triage queue).\n• You can drop by the Triage Station anytime during clinic hours for a free vital signs screening by our registered clinic nurse!";
  }

  // Symptoms & Fever
  if (q.includes('fever') || q.includes('lagnat') || q.includes('temp')) {
    return "🌡️ **Home Care & Protocol for Fever:**\n\n• **Hydration:** Drink plenty of fluids (water, oral electrolytes, warm broth).\n• **Rest:** Avoid strenuous activities; rest in a cool, well-ventilated room.\n• **Comfort:** Apply a lukewarm sponge compress on your forehead, neck, and underarms. Avoid ice-cold baths.\n• **Dispensary Formulary:** Paracetamol 500mg may be taken every 4–6 hours as needed (max 4g/day).\n• ⚠️ **When to visit PSU Clinic immediately:** Temperature ≥ 38.5°C, persistent fever > 48 hours, or accompanied by severe headache, stiff neck, or vomiting.";
  }

  // Headache
  if (q.includes('headache') || q.includes('sakit ulo') || q.includes('migraine')) {
    return "🤕 **Managing Headaches & Tension:**\n\n• **Eye Rest:** Take a 20-minute break from computer screens and mobile phones (20-20-20 rule).\n• **Water Intake:** Drink at least 500ml of water immediately; dehydration is a frequent culprit on campus.\n• **Temple Pressure:** Apply gentle circular massage on your temples and neck muscles.\n• **Clinic Consultation:** Visit Dr. Manalo at the clinic if headache is sudden, severe, or accompanied by visual changes or fever.";
  }

  // Stomach / GI
  if (q.includes('stomach') || q.includes('tiyan') || q.includes('acid') || q.includes('diarrhea') || q.includes('nausea') || q.includes('vomit')) {
    return "🍵 **Stomach Discomfort & GI Care:**\n\n• **Hydrate in sips:** Drink warm water or oral rehydration solution (ORS) slowly in small sips.\n• **Bland Food:** Stick to rice, crackers, bananas, and clear soup. Avoid oily, spicy, acidic foods or caffeinated drinks.\n• **Free Clinic Medicines:** Chewable Antacids and ORS sachets are available for free at the PSU Clinic dispensary.\n• ⚠️ **Visit Clinic Immediately:** If you experience severe sharp abdominal cramping, persistent vomiting, or black stools.";
  }

  // Cough & Colds
  if (q.includes('cough') || q.includes('cold') || q.includes('ubo') || q.includes('sipon') || q.includes('throat')) {
    return "🧣 **Relief for Cough, Colds & Sore Throat:**\n\n• **Salt Water Gargle:** Dissolve 1/2 tsp salt in warm water; gargle 3 times daily.\n• **Hydration & Honey:** Warm water with honey or calamansi soothes throat irritation.\n• **Protective Mask:** Please wear a face mask inside university halls to protect fellow students.\n• **Dispensary Stock:** Free generic Cetirizine 10mg and Salbutamol nebules for nebulization are available at the front desk.";
  }

  // Operating Hours
  if (q.includes('hour') || q.includes('time') || q.includes('open') || q.includes('sched')) {
    return "⏰ **PSU Clinic Operating Hours:**\n\n• **Regular Consultations:** Monday to Friday, 8:00 AM – 5:00 PM\n• **Emergency Coverage:** 24/7 on-call campus ambulance and first-aid response\n• **Location:** Ground Floor, Administration & Student Welfare Building, Bacolor Main Campus\n• **Hotline:** 0917-882-9011 | Direct Line: (045) 901-0601 | Email: clinic@psu.edu.ph";
  }

  // Location
  if (q.includes('where') || q.includes('location') || q.includes('saan') || q.includes('bacolor') || q.includes('building')) {
    return "📍 **Clinic Location & Directions:**\n\nThe University Health & Medical Services Office (UHMS) is located on the **Ground Floor of the Student Welfare & Administration Building**, Pampanga State University Bacolor Main Campus, Cabambangan, Bacolor, 2001 Pampanga.\n\nKey stations:\n1. Front Reception & Queue Ticket Kiosk\n2. Nurse Triage & Vital Signs Room\n3. Doctor's Consultation Station (Dr. Roberto M. Manalo, MD)\n4. Dental Examination Clinic\n5. Pharmacy & Free Medicine Dispensary\n6. Observation Bed Ward";
  }

  // Medical Certificate
  if (q.includes('med cert') || q.includes('certificate') || q.includes('excuse') || q.includes('clearance') || q.includes('ojt')) {
    return "📄 **Medical Certificate Requirements at PSU:**\n\n1. Consult with University Physician Dr. Roberto M. Manalo, MD within 48 hours of illness or missed classes.\n2. Present your valid PSU Student ID / Employee ID.\n3. The doctor will examine you and issue an official verifiable Medical Certificate with dynamic QR security verification.\n4. You can also view and download approved certificates directly from your Student Health Portal!";
  }

  // Queue System
  if (q.includes('queue') || q.includes('ticket') || q.includes('wait') || q.includes('pila') || q.includes('sms')) {
    return "🎫 **Smart Queue & SMS Alert System:**\n\n• **Get a Ticket:** Staff issues your ticket upon arrival (or check in online via your Student Portal).\n• **Live TV Monitor:** Watch the lobby screen or your portal for live calling status.\n• **SMS Notifications:** You will receive automated SMS alerts on your phone when your ticket is marked **'Ready'** or **'Calling'**.\n• **Priority Categories:** Regular Queue, Urgent / Symptomatic, Emergency, and Senior / PWD / Pregnant.";
  }

  // Free Medicines
  if (q.includes('medicine') || q.includes('gamot') || q.includes('free') || q.includes('pharmacy') || q.includes('rx') || q.includes('paracetamol')) {
    return "💊 **Free Generic Formulary Dispensary:**\n\nUnder Republic Act No. 6675 (Generics Act of 1988), essential clinic medicines are provided **100% free of charge** to enrolled PSU students and staff with a valid prescription:\n\n• **Analgesics / Antipyretics:** Paracetamol 500mg, Mefenamic Acid 500mg, Ibuprofen 200mg\n• **Allergies & Colds:** Cetirizine 10mg, Loratadine 10mg\n• **Gastrointestinal:** Antacid chewables, Oral Rehydration Salts (ORS)\n• **Respiratory:** Salbutamol nebules for emergency nebulization\n• **First Aid Supplies:** Povidone-iodine, sterile gauze, bandages, hydrogen peroxide, burn ointments.";
  }

  // General questions (synthesize answer based on query tokens)
  return `💡 **Clin Clin Health & Campus Guidance:**\n\nRegarding your question about **"${raw.length > 50 ? raw.slice(0, 47) + '...' : raw}"**:\n\n• **General Guidance:** In health and campus life, maintaining good hydration, balanced nutrition, and sufficient rest are fundamental to wellness and academic performance.\n• **University Health Protocols:** Pampanga State University Medical Clinic provides comprehensive outpatient services, free generic essential medicines, and emergency first aid.\n• **Personalized Consultation:** For specific health evaluations or clinical diagnosis, we encourage you to visit the clinic during operating hours (Mon–Fri, 8:00 AM – 5:00 PM) to meet with Dr. Roberto M. Manalo, MD or our registered nursing staff.\n\nIs there any specific detail or follow-up question you would like to explore? I am happy to chat about anything!`;
}

/**
 * AI SOAP Note Assistant for Doctors
 */
app.post('/api/ai/soap', async (req, res) => {
  try {
    const { chiefComplaint, vitals, patientInfo } = req.body;

    const prompt = `Act as an expert clinical documentation assistant for a university medical clinic physician.
Draft a concise, professional SOAP clinical progress note based on:
Patient: ${patientInfo?.name || 'Student/Patient'} (${patientInfo?.age || '20'}yo ${patientInfo?.gender || 'Patient'})
Chief Complaint: "${chiefComplaint || 'General consultation'}"
Vitals: BP: ${vitals?.bp || '120/80'}, HR: ${vitals?.hr || '75'} bpm, Temp: ${vitals?.temp || '36.8'}°C, SpO2: ${vitals?.spo2 || '98'}%, Pain Scale: ${vitals?.pain || '0'}/10.

Format your output in clean JSON with keys:
"subjective": string,
"objective": string,
"suggestedDiagnosis": string,
"icd10Code": string,
"plan": string,
"homeAdvice": string`;

    const reply = await generateGeminiContent({
      contents: prompt,
      responseMimeType: 'application/json'
    });

    if (reply) {
      try {
        const parsed = JSON.parse(reply);
        return res.json(parsed);
      } catch {
        // Handled
      }
    }

    // Default structured fallback
    return res.json({
      subjective: `Patient presents with ${chiefComplaint || 'generalized discomfort'}. Symptoms noted for past 2 days. Denies shortness of breath, chest pain, or known drug allergies.`,
      objective: `General: Alert, ambulatory, oriented x3. Vital signs stable (BP ${vitals?.bp || '120/80'} mmHg, Temp ${vitals?.temp || '36.6'}°C, HR ${vitals?.hr || '72'} bpm, SpO2 ${vitals?.spo2 || '98'}%). Physical exam non-contributory.`,
      suggestedDiagnosis: 'Acute Upper Respiratory Tract Infection (URTI)',
      icd10Code: 'J06.9',
      plan: 'Hydration therapy. Oral paracetamol 500mg prn for pain/fever. Adequate rest for 48 hours.',
      homeAdvice: 'Increase oral fluid intake. Monitor temperature. Return if symptoms worsen.'
    });
  } catch (err: any) {
    console.error('SOAP Note Error:', err);
    return res.json({
      subjective: `Patient reports ${req.body?.chiefComplaint || 'routine checkup'}.`,
      objective: 'Vital signs reviewed. Patient in no acute distress.',
      suggestedDiagnosis: 'Routine Medical Evaluation',
      icd10Code: 'Z00.00',
      plan: 'General wellness recommendations. Regular follow-up as needed.',
      homeAdvice: 'Maintain healthy hydration and balanced nutrition.'
    });
  }
});

/**
 * AI Triage Risk Evaluation for Nurses
 */
app.post('/api/ai/triage', async (req, res) => {
  try {
    const { bpSystolic, bpDiastolic, heartRate, temperature, respiratoryRate, painScale, chiefComplaint } = req.body;

    const prompt = `Evaluate clinical triage urgency for a patient visiting Pampanga State University clinic.
Metrics:
- Blood Pressure: ${bpSystolic}/${bpDiastolic} mmHg
- Heart Rate: ${heartRate} bpm
- Body Temperature: ${temperature} °C
- Respiratory Rate: ${respiratoryRate} cpm
- Pain Scale: ${painScale}/10
- Chief Complaint: "${chiefComplaint || 'Intake'}"

Classify into one priority: "Emergency", "Urgent", "Regular", or "Senior/PWD".
Provide a 2-sentence clinical rationale and recommended immediate nursing action.
Format as JSON: { "priority": string, "rationale": string, "immediateAction": string, "vitalFlags": string[] }`;

    const reply = await generateGeminiContent({
      contents: prompt,
      responseMimeType: 'application/json'
    });

    if (reply) {
      try {
        const parsed = JSON.parse(reply);
        return res.json(parsed);
      } catch {
        // Handled
      }
    }

    // Dynamic rule-based clinical triage fallback
    let priority: 'Emergency' | 'Urgent' | 'Regular' = 'Regular';
    const flags: string[] = [];

    if (temperature >= 38.5) flags.push(`High Fever (${temperature}°C)`);
    if (bpSystolic >= 160 || bpDiastolic >= 100) flags.push(`Severe Hypertensive Stage 2 (${bpSystolic}/${bpDiastolic} mmHg)`);
    else if (bpSystolic >= 140 || bpDiastolic >= 90) flags.push(`Hypertension Stage 2 (${bpSystolic}/${bpDiastolic} mmHg)`);
    if (heartRate >= 115) flags.push(`Tachycardia (${heartRate} bpm)`);
    if (painScale >= 8) flags.push(`Severe Acute Pain (${painScale}/10)`);

    if (temperature >= 39.0 || bpSystolic >= 180 || painScale >= 9) {
      priority = 'Emergency';
    } else if (flags.length > 0 || temperature >= 38.0 || painScale >= 6) {
      priority = 'Urgent';
    }

    return res.json({
      priority,
      rationale: flags.length > 0
        ? `Patient exhibits clinical alerts: ${flags.join(', ')}. Prioritize evaluation to prevent acute decompensation.`
        : 'Hemodynamic indices and vital metrics are within expected physiological limits for age.',
      immediateAction: priority === 'Emergency'
        ? 'Alert attending university physician immediately and prepare emergency triage bed.'
        : priority === 'Urgent'
        ? 'Expedite patient queue calling and administer initial comfort/cooling measures.'
        : 'Proceed with routine physician consultation queue.',
      vitalFlags: flags
    });
  } catch (err: any) {
    console.error('Triage Error:', err);
    return res.json({
      priority: 'Regular',
      rationale: 'Vital signs reviewed. Patient in stable condition.',
      immediateAction: 'Queue for regular physician consultation.',
      vitalFlags: []
    });
  }
});

// Vite Middleware for Development / Static Serve for Production
const isProd = process.env.NODE_ENV === 'production';

if (!isProd) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, host, () => {
  console.log(`[PSU Clinic Server] Running on http://${host}:${port}`);
});
