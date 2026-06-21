import React, { useState, useEffect } from "react";
import { Brain, X, Activity, Droplet, MonitorPlay as Ste2, Sparkles, AlertTriangle, ClipboardList, MonitorPlay, MessageSquare } from "lucide-react";
import { Stethoscope, Pill, ShieldAlert, HeartPulse, Microscope, FileText, FileCheck, BookOpen, Key, Calendar, Calculator, Flame } from "lucide-react";

export default function SmartAIAssistant({ language, currentUser }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-ai-assistant", handleOpen);
    return () => window.removeEventListener("open-ai-assistant", handleOpen);
  }, []);

  const tools = [
    { id: "calc_bmi", icon: Calculator, titleAr: "حاسبة BMI", titleEn: "BMI Calc" },
    { id: "med_interaction", icon: Pill, titleAr: "تداخلات الأدوية", titleEn: "Drug Interactions" },
    { id: "vital_analyzer", icon: Activity, titleAr: "محلل حيويات", titleEn: "Vitals Analyzer" },
    { id: "iv_drip", icon: Droplet, titleAr: "حاسبة التسريب IV", titleEn: "IV Drip Rates" },
    { id: "symptoms_ai", icon: Ste2, titleAr: "التشخيص المدعم", titleEn: "AI Symptoms" },
    { id: "lab_ranges", icon: Microscope, titleAr: "قيم المعامل الطبيعية", titleEn: "Normal Lab Ranges" },
    { id: "ecg_guide", icon: HeartPulse, titleAr: "دليل مخطط القلب", titleEn: "ECG Guide" },
    { id: "triage", icon: AlertTriangle, titleAr: "فرز الطوارئ", titleEn: "ER Triage" },
    { id: "medical_dic", icon: BookOpen, titleAr: "القاموس الطبي", titleEn: "Medical Dictionary" },
    { id: "pain_scale", icon: MonitorPlay, titleAr: "مقياس الألم", titleEn: "Pain Scale Ref" },
    { id: "burn_calc", icon: Flame, titleAr: "حاسبة الحروق", titleEn: "Burn Calculator" },
    { id: "pregnancy", icon: Calendar, titleAr: "آلة الحمل الحاسبة", titleEn: "Pregnancy Wheel" },
    { id: "qsofa", icon: ShieldAlert, titleAr: "تقييم التسمم", titleEn: "Sepsis qSOFA" },
    { id: "gcs", icon: Brain, titleAr: "مقياس غلاسكو للغيبوبة", titleEn: "GCS Scale" },
    { id: "ped_dosage", icon: Calculator, titleAr: "علاجات الأطفال", titleEn: "Pediatric Doses" },
    { id: "apgar", icon: Activity, titleAr: "درجة أبغار (APGAR)", titleEn: "APGAR Score" },
    { id: "policy_bot", icon: FileCheck, titleAr: "شات بوت السياسات", titleEn: "Policy Bot" },
    { id: "shift_notes", icon: ClipboardList, titleAr: "ملاحظات السليم", titleEn: "Smart Handover" },
    { id: "icu_monitor", icon: Activity, titleAr: "عين العناية", titleEn: "ICU Monitor AI" },
    { id: "mental_health", icon: MessageSquare, titleAr: "الدعم النفسي", titleEn: "Mental Support" },
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[10000] flex justify-end bg-black/50 backdrop-blur-sm shadow-2xl transition-all font-sans">
      <div className="w-full max-w-sm sm:max-w-md bg-slate-50 h-full flex flex-col shadow-2xl relative animate-in slide-in-from-right-full overflow-hidden border-l border-slate-700">
        
        {/* Header */}
        <div className="p-6 bg-slate-950 text-white flex justify-between items-center relative overflow-hidden shrink-0 border-b-2 border-indigo-600">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[90px] -mr-10 -mt-20 opacity-40 pointer-events-none"></div>
          <button onClick={() => setIsOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition backdrop-blur-md relative z-10 cursor-pointer">
            <X className="w-5 h-5 text-indigo-100" />
          </button>
          <div className="text-right relative z-10 flex flex-col items-end gap-1">
            <h2 className="text-xl font-black flex items-center gap-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-indigo-300 to-purple-200">المساعد الذكي والمتطور</span>
              <Brain className="w-6 h-6 text-indigo-400 animate-bounce" />
            </h2>
            <div className="text-[9px] bg-white/10 px-2.5 py-0.5 rounded font-mono tracking-widest uppercase">
               20 INTELLIGENT MODULES ACTIVE
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 relative" dir={language === "ar" ? "rtl" : "ltr"}>
          
          <div className="bg-white border border-slate-200 p-4 rounded-3xl mb-6 shadow-sm flex gap-4 text-right">
            <div className="p-3 bg-indigo-50 rounded-2xl shrink-0 h-max">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-800 leading-tight">مرحباً {currentUser?.nameAr && currentUser.nameAr.split(" ")[0]}!</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-2 font-semibold">
                تم تجهيز 20 أداة ذكية ومدعمة لتقديم الدعم السريري التخصصي والفني الفوري، لدعم قراراتك ومساعدة المرضى بفعالية وجودة عالية. 
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 pb-8">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2.5 text-center transition-all bg-white hover:-translate-y-1 ${
                  activeTool === tool.id ? "ring-2 ring-indigo-500 bg-indigo-50/50 border-indigo-200 shadow-md" : "border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-indigo-300"
                }`}
              >
                <div className={`p-3 rounded-xl ${activeTool === tool.id ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-600"}`}>
                  <tool.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-black text-slate-700 leading-tight">
                  {language === "ar" ? tool.titleAr : tool.titleEn}
                </span>
              </button>
            ))}
          </div>
        </div>

        {activeTool && (
          <div className="bg-slate-900 border-t border-slate-800 h-64 shrink-0 shadow-[0_-15px_40px_rgba(0,0,0,0.2)] flex flex-col z-20 sticky bottom-0">
            <div className="px-5 py-3 bg-slate-950/80 backdrop-blur border-b border-white/10 flex items-center justify-between" dir="rtl">
              <span className="text-[11px] font-black tracking-wide text-indigo-300 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                أداة نشطة: {tools.find(t => t.id === activeTool)?.titleAr}
              </span>
              <button onClick={() => setActiveTool(null)} className="text-[10px] text-slate-300 hover:text-white font-bold px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg shrink-0 transition">إنهاء والتخلص</button>
            </div>
            <div className="flex-1 overflow-y-auto p-0 relative bg-slate-900 custom-scrollbar" dir="rtl">
              {activeTool === "calc_bmi" && (
                <div className="p-6 text-right space-y-4">
                  <h3 className="text-white font-bold text-sm">حاسبة مؤشر كتلة الجسم (BMI) الذكية</h3>
                  <div className="flex gap-4">
                    <input type="number" placeholder="الوزن (كجم)" className="w-1/2 bg-slate-800 border-none text-white rounded p-2 text-sm" />
                    <input type="number" placeholder="الطول (سم)" className="w-1/2 bg-slate-800 border-none text-white rounded p-2 text-sm" />
                  </div>
                  <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded transition">احسب الآن</button>
                </div>
              )}
              {activeTool === "policy_bot" && (
                <div className="flex flex-col h-full text-right p-4">
                  <div className="flex-1 space-y-3 overflow-y-auto mb-3">
                    <div className="bg-slate-800 p-3 rounded-2xl rounded-tr-sm w-[85%] text-slate-200 text-xs leading-relaxed">
                      مرحباً بك في المحرك الخبير للسياسات الطبية. أنا هنا للإجابة على استفساراتك حول بروتوكولات وإجراءات المستشفى المعتمدة. كيف أساعدك اليوم؟
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="ابحث أو اسأل هنا..." className="flex-1 bg-slate-800 border-none text-white rounded-xl px-3 py-2 text-xs" />
                    <button className="bg-indigo-600 rounded-xl px-3 py-2 hover:bg-indigo-500 transition text-white">
                      <svg className="w-4 h-4 translate-x-[-1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                    </button>
                  </div>
                </div>
              )}
              {activeTool !== "calc_bmi" && activeTool !== "policy_bot" && (
                <div className="p-6 flex flex-col items-center justify-center h-full gap-3 relative overflow-hidden text-center text-white">
                  <div className="p-4 bg-indigo-500/10 rounded-full animate-bounce">
                    <Brain className="w-8 h-8 text-indigo-400" />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium z-10 max-w-xs mt-2 relative">
                    يتم الآن تفعيل المحرك المعرفي الذكي للأداة الخاصة بك... 
                    <br/>
                    <span className="text-[9px] text-slate-500 mt-2 block uppercase tracking-widest font-mono">Standby for AI Handshake</span>
                  </p>
                  <div className="w-32 mx-auto mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-1/2 rounded-full translate-x-0 animate-[pulse_1.5s_ease-in-out_infinite]"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
