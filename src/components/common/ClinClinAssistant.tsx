import React, { useState, useEffect, useRef } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { ClinClinAIService, ClinClinMessage } from '../../services/clinClinAIService';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  HelpCircle,
  TrendingUp,
  FileText,
  AlertTriangle,
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  Stethoscope,
  ChevronDown,
  RotateCcw
} from 'lucide-react';

export const ClinClinAssistant: React.FC = () => {
  const {
    currentUser,
    queue,
    consultations,
    medicines,
    patients,
    activityLogs,
    setActiveTab,
    setActiveModal,
    isMobile
  } = useClinic();

  const [isOpen, setIsOpen] = useState(false);
  const [isDocked, setIsDocked] = useState(false);
  const [messages, setMessages] = useState<ClinClinMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Swipe / Drag detection to slide to the right
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    touchStartXRef.current = clientX;
    touchDeltaXRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (touchStartXRef.current === null) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    touchDeltaXRef.current = clientX - touchStartXRef.current;
  };

  const handleTouchEnd = () => {
    if (touchDeltaXRef.current > 30) {
      // Swiped or dragged to the right - hide/dock Clin Clin
      setIsDocked(true);
    }
    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
  };

  // Initialize role-specific warm greeting on mount or role change
  useEffect(() => {
    if (!currentUser) return;

    let greeting = '';
    let quickActions: { label: string; action: string }[] = [];

    switch (currentUser.role) {
      case 'administrator':
        greeting = `Hello, Engr. Ferdinand! 👑 I am **Clin Clin**, your clinic administrative intelligence assistant. I can interpret health census data, forecast inventory burn rates, detect compliance anomalies, and assist with staff account requests.`;
        quickActions = [
          { label: '📊 AI Dashboard Insights', action: 'show_insights' },
          { label: '📦 AI Inventory Forecast', action: 'show_forecast' },
          { label: '🛡️ Anomaly Detection', action: 'show_anomalies' },
          { label: '📑 Morbidity Report Summary', action: 'show_reports' }
        ];
        break;

      case 'doctor':
        greeting = `Good day, Doctor Manalo! 🩺 I am **Clin Clin**, your clinical documentation assistant. I can summarize previous patient visits, provide ICD-10 quick references, and help organize SOAP progress notes.`;
        quickActions = [
          { label: '📋 Summarize Active Queue', action: 'doctor_queue' },
          { label: '📝 SOAP Note Guidelines', action: 'doctor_soap' },
          { label: '🔍 Smart Patient Search', action: 'doctor_search' }
        ];
        break;

      case 'nurse':
        greeting = `Hi Nurse Mary Jane! 💉 I am **Clin Clin**, your triage and vital signs workflow helper. I can guide vital signs thresholds, monitor triage waiting times, and verify SMS alerts.`;
        quickActions = [
          { label: '🚨 Triage Priority Alert Check', action: 'nurse_triage' },
          { label: '📢 Queue & SMS Calling Tips', action: 'nurse_sms' },
          { label: '🔍 Patient Search Assistance', action: 'nurse_search' }
        ];
        break;

      case 'staff':
        greeting = `Hello Angelica! 📋 I am **Clin Clin**. I can assist you with patient intake lookups, queue ticket issuance, appointment scheduling, and DOH daily clinic census.`;
        quickActions = [
          { label: '🎫 Queue Intake Help', action: 'staff_queue' },
          { label: '📅 Appointment Schedule Tips', action: 'staff_appointment' },
          { label: '🔍 Search Patient Records', action: 'staff_search' }
        ];
        break;

      case 'student':
        greeting = `Kumusta Kristine! 🎓 I am **Clin Clin**, your friendly campus clinic guide! I'm here to answer your clinic FAQs, explain medical certificate procedures, and show you your current queue position.`;
        quickActions = [
          { label: '📄 How to get a Medical Certificate?', action: 'student_medcert' },
          { label: '⏰ What are the clinic hours?', action: 'student_hours' },
          { label: '🎫 Check my Queue Status', action: 'student_queue' },
          { label: '📅 How to book an appointment?', action: 'student_appointment' }
        ];
        break;
    }

    setMessages([
      {
        id: 'msg-welcome',
        sender: 'clinclin',
        text: greeting,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: quickActions
      }
    ]);
  }, [currentUser?.role]);

  // Scroll to bottom on message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || !currentUser) return;

    const userMsg: ClinClinMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    // Build context
    const contextSummary = `Role: ${currentUser.role}. Patients: ${patients.length}. Queue size: ${queue.length}. Medicines in stock: ${medicines.length}.`;

    try {
      const replyText = await ClinClinAIService.chat(query, currentUser.role, contextSummary, messages);
      const botMsg: ClinClinMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'clinclin',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      // Handled
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (actionKey: string) => {
    switch (actionKey) {
      case 'show_insights':
        handleSendMessage('Explain the latest AI Dashboard Insights, busy clinic hours, and consultation trends.');
        break;
      case 'show_forecast':
        handleSendMessage('Provide an AI inventory forecast for medicines that are running low.');
        break;
      case 'show_anomalies':
        handleSendMessage('Run an AI anomaly detection scan on patient records and clinic queue.');
        break;
      case 'show_reports':
        handleSendMessage('Summarize this month\'s clinic morbidity and consultation census.');
        break;
      case 'doctor_queue':
        handleSendMessage('Summarize the waiting queue for doctor consultation room 1.');
        break;
      case 'doctor_soap':
        handleSendMessage('Show clinical documentation guidelines for SOAP notes.');
        break;
      case 'nurse_triage':
        handleSendMessage('What are the urgent triage threshold parameters for fever and elevated blood pressure?');
        break;
      case 'nurse_sms':
        handleSendMessage('How does automated SMS calling work when a patient status changes to Ready or Calling?');
        break;
      case 'student_medcert':
        handleSendMessage('What are the requirements and steps to get a PSU Medical Certificate?');
        break;
      case 'student_hours':
        handleSendMessage('What are the clinic operating hours and emergency contact hotlines?');
        break;
      case 'student_queue':
        handleSendMessage('How do I track my live queue ticket status and SMS alerts?');
        break;
      case 'student_appointment':
        handleSendMessage('How do I book an appointment with the campus doctor or nurse?');
        break;
      default:
        handleSendMessage(`Explain ${actionKey}`);
    }
  };

  const handleOpen = () => {
    if (isDocked) {
      setIsDocked(false);
      return;
    }
    setIsOpen(true);
    setHasUnread(false);
  };

  if (!currentUser) return null;

  return (
    <>
      {/* Floating Clin Clin Mascot Button (Lower-Right) with Slide-to-Hide & Half-Face Peek */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        className={`fixed z-50 transition-all duration-300 ease-in-out select-none ${
          isMobile ? 'bottom-20' : 'bottom-6'
        } ${
          isDocked
            ? 'right-0 translate-x-[calc(100%-30px)] cursor-pointer'
            : isMobile ? 'right-4 translate-x-0' : 'right-6 translate-x-0'
        }`}
      >
        {!isOpen && (
          <div className="relative flex items-center">
            <button
              onClick={handleOpen}
              className={`group relative flex items-center gap-2 p-2 sm:p-2.5 bg-gradient-to-r from-[#7F1416] via-[#94191c] to-[#7F1416] hover:from-[#6b0f11] hover:to-[#7F1416] text-white rounded-full shadow-2xl border-2 border-amber-300/80 transition-all cursor-pointer ring-4 ring-red-900/20 ${
                isDocked
                  ? 'hover:scale-105 active:scale-95'
                  : 'hover:scale-105 active:scale-95'
              }`}
              title={isDocked ? "Click to bring Clin Clin back" : "Chat with Clin Clin (Swipe right to hide)"}
            >
              {/* Mascot Avatar Icon - Exactly half stays peeked when docked */}
              <div className="relative w-11 h-11 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-red-700 shadow-md shrink-0">
                {/* Cute Stylized Clin Clin Character */}
                <div className="w-full h-full bg-gradient-to-b from-white to-red-50 flex flex-col items-center justify-center relative">
                  {/* Red cross cap */}
                  <div className="w-5 h-2 bg-red-700 rounded-t-full absolute top-1 flex items-center justify-center">
                    <div className="w-1.5 h-1 bg-white" />
                  </div>
                  {/* Friendly Eyes */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-1.5 h-2 bg-slate-900 rounded-full animate-bounce" />
                    <span className="w-1.5 h-2 bg-slate-900 rounded-full animate-bounce delay-100" />
                  </div>
                  {/* Sweet smile */}
                  <div className="w-2.5 h-1 border-b-2 border-red-800 rounded-full mt-0.5" />
                </div>

                {/* Glowing Pulse Ring */}
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full animate-ping" />
              </div>

              {/* Text Pill (Visible when not docked) */}
              <div className="hidden sm:flex flex-col text-left pr-1">
                <span className="font-extrabold text-xs text-white flex items-center gap-1">
                  <span>Clin Clin</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-400 text-slate-950 uppercase tracking-tighter">
                    AI Guide
                  </span>
                </span>
                <span className="text-[10px] text-red-200">PSU Clinic Assistant</span>
              </div>

              {/* Unread Ask Me Badge */}
              {hasUnread && !isDocked && (
                <span className="absolute -top-1 -right-1 px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full shadow-md animate-bounce">
                  Ask Me!
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Clin Clin Interactive Chat Bubble Window */}
      {isOpen && (
        <div className={`fixed z-50 bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 ${
          isMobile
            ? 'inset-x-3 bottom-20 top-20 max-w-none'
            : 'bottom-6 right-6 w-96 max-h-[580px] h-[540px]'
        }`}>
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#7F1416] via-[#94191c] to-[#7F1416] text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1 border-2 border-amber-300 shadow-sm shrink-0">
                {/* Cute Clin Clin Face */}
                <div className="w-full h-full rounded-full bg-red-50 flex flex-col items-center justify-center relative">
                  <div className="w-4 h-1.5 bg-red-700 rounded-t-full absolute top-0.5" />
                  <div className="flex gap-1 mt-1.5">
                    <div className="w-1 h-1.5 bg-slate-900 rounded-full" />
                    <div className="w-1 h-1.5 bg-slate-900 rounded-full" />
                  </div>
                  <div className="w-2 h-0.5 border-b border-red-700 rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-white">Clin Clin</h3>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-400 text-slate-950 uppercase tracking-tighter">
                    AI Assistant
                  </span>
                </div>
                <div className="text-[11px] text-red-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  <span>Online · PSU Clinical Intelligence</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setMessages(prev => prev.slice(0, 1));
                }}
                className="p-1 rounded-full text-red-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Reset conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-red-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Minimize Clin Clin"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Safety & Governance Notice Banner */}
          <div className="px-3.5 py-1.5 bg-red-50 border-b border-red-100 text-[10px] text-red-900 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
            <span>AI Guide only. Does not diagnose or prescribe. Official clinic orders remain with staff.</span>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs bg-slate-50/60">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-end gap-1.5 max-w-[88%]">
                  {msg.sender === 'clinclin' && (
                    <div className="w-6 h-6 rounded-full bg-red-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-xs mb-1">
                      CC
                    </div>
                  )}

                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-[#7F1416] text-white rounded-br-xs font-medium'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                    }`}
                  >
                    {msg.text}

                    {/* Quick Action Chips */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                        {msg.suggestedActions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleQuickAction(action.action)}
                            className="px-2 py-1 bg-red-50 hover:bg-red-100 text-[#7F1416] border border-red-200/70 rounded-lg text-[10px] font-bold transition-colors cursor-pointer text-left"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <span className="text-[9px] text-slate-400 mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-slate-400 text-xs pl-8">
                <span className="w-1.5 h-1.5 bg-red-700 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-red-700 rounded-full animate-bounce delay-100" />
                <span className="w-1.5 h-1.5 bg-red-700 rounded-full animate-bounce delay-200" />
                <span className="text-[11px] text-slate-500 font-medium">Clin Clin is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Inquiry Suggestions Bar */}
          <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex items-center gap-1 overflow-x-auto text-[10px]">
            {currentUser.role === 'administrator' && (
              <>
                <button
                  onClick={() => handleSendMessage('Give me an AI inventory forecast summary.')}
                  className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold whitespace-nowrap cursor-pointer"
                >
                  📦 Inventory Forecast
                </button>
                <button
                  onClick={() => handleSendMessage('Check for duplicate patient records or anomalies.')}
                  className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold whitespace-nowrap cursor-pointer"
                >
                  🛡️ Anomaly Check
                </button>
              </>
            )}

            {currentUser.role === 'doctor' && (
              <>
                <button
                  onClick={() => handleSendMessage('Help me format this consultation SOAP assessment.')}
                  className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold whitespace-nowrap cursor-pointer"
                >
                  📝 SOAP Notes
                </button>
                <button
                  onClick={() => handleSendMessage('Show me top ICD-10 codes for respiratory checkups.')}
                  className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold whitespace-nowrap cursor-pointer"
                >
                  📖 ICD-10 Lookup
                </button>
              </>
            )}

            {currentUser.role === 'nurse' && (
              <>
                <button
                  onClick={() => handleSendMessage('Explain the emergency triage parameters for PSU clinic.')}
                  className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold whitespace-nowrap cursor-pointer"
                >
                  🚨 Triage Guide
                </button>
                <button
                  onClick={() => handleSendMessage('How does automated SMS trigger work when queue status is Ready?')}
                  className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold whitespace-nowrap cursor-pointer"
                >
                  📱 SMS Alerts
                </button>
              </>
            )}

            {currentUser.role === 'student' && (
              <>
                <button
                  onClick={() => handleSendMessage('Can I view my medical certificate online?')}
                  className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold whitespace-nowrap cursor-pointer"
                >
                  📄 Med Cert Online
                </button>
                <button
                  onClick={() => handleSendMessage('Where is the clinic located on Bacolor campus?')}
                  className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold whitespace-nowrap cursor-pointer"
                >
                  📍 Clinic Location
                </button>
              </>
            )}
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={`Ask Clin Clin anything (${currentUser.role})...`}
              className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-600 focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isTyping}
              className="p-2.5 rounded-xl bg-[#7F1416] hover:bg-[#680F11] text-white disabled:opacity-40 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
