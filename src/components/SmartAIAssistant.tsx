import React, { useState, useEffect } from "react";
import { Brain, X, Activity, Droplet, MonitorPlay as Ste2, Sparkles, AlertTriangle, ClipboardList, MonitorPlay, MessageSquare, Send } from "lucide-react";
import { Stethoscope, Pill, ShieldAlert, HeartPulse, Microscope, FileText, FileCheck, BookOpen, Key, Calendar, Calculator, Flame } from "lucide-react";

export default function SmartAIAssistant({ language, currentUser }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Dynamic Tool States
  const [bmiWeight, setBmiWeight] = useState("");
  const [bmiHeight, setBmiHeight] = useState("");
  const [drug1, setDrug1] = useState("");
  const [drug2, setDrug2] = useState("");
  const [ivVol, setIvVol] = useState("");
  const [ivTime, setIvTime] = useState("");
  const [vitalsDrop, setVitalsDrop] = useState("20");
  const [gcsEye, setGcsEye] = useState(4);
  const [gcsVerbal, setGcsVerbal] = useState(5);
  const [gcsMotor, setGcsMotor] = useState(6);
  const [lmpDate, setLmpDate] = useState("");
  const [triageStatus, setTriageStatus] = useState("");
  const [qSofaScore, setQSofaScore] = useState({ bp: false, rr: false, mentation: false });
  const [apgarScore, setApgarScore] = useState({ hr: 2, resp: 2, tone: 2, reflex: 2, color: 2 });

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
    { id: "pregnancy", icon: Calendar, titleAr: "عجلة الحمل", titleEn: "Pregnancy Wheel" },
    { id: "qsofa", icon: ShieldAlert, titleAr: "تقييم التسمم", titleEn: "Sepsis qSOFA" },
    { id: "gcs", icon: Brain, titleAr: "مقياس غلاسكو", titleEn: "GCS Scale" },
    { id: "ped_dosage", icon: Calculator, titleAr: "أدوية الأطفال", titleEn: "Pediatric Doses" },
    { id: "apgar", icon: Activity, titleAr: "درجة أبغار (APGAR)", titleEn: "APGAR Score" },
    { id: "policy_bot", icon: FileCheck, titleAr: "شات بوت السياسات", titleEn: "Policy Bot" },
    { id: "shift_notes", icon: ClipboardList, titleAr: "ملاحظات التسليم", titleEn: "Smart Handover" },
    { id: "icu_monitor", icon: Activity, titleAr: "عين العناية", titleEn: "ICU Monitor AI" },
    { id: "mental_health", icon: MessageSquare, titleAr: "الدعم النفسي", titleEn: "Mental Support" },
  ];

  if (!isOpen) {
    return null;
  }

  const renderToolContent = () => {
    switch (activeTool) {
      case "calc_bmi":
        const bmi = bmiWeight && bmiHeight ? (Number(bmiWeight) / ((Number(bmiHeight) / 100) ** 2)).toFixed(1) : "--";
        return (
          <div className="p-4 space-y-4 text-right">
            <h3 className="text-white font-bold text-sm">حاسبة مؤشر كتلة الجسم الذكية</h3>
            <div className="flex gap-4">
              <input type="number" value={bmiWeight} onChange={e=>setBmiWeight(e.target.value)} placeholder="الوزن (كجم)" className="w-1/2 bg-slate-800 text-white rounded p-2 text-sm border border-slate-700" />
              <input type="number" value={bmiHeight} onChange={e=>setBmiHeight(e.target.value)} placeholder="الطول (سم)" className="w-1/2 bg-slate-800 text-white rounded p-2 text-sm border border-slate-700" />
            </div>
            <div className="bg-slate-800 p-4 rounded-xl text-center text-white text-xl font-bold border border-slate-700">BMI: <span className="text-indigo-400">{bmi}</span></div>
          </div>
        );
      case "med_interaction":
        return (
          <div className="p-4 space-y-4 text-right">
            <h3 className="text-white font-bold text-sm">التداخلات الدوائية المدرب (Simulated AI)</h3>
            <input type="text" value={drug1} onChange={e=>setDrug1(e.target.value)} placeholder="العقار الأول (مثال: Aspirin)" className="w-full bg-slate-800 border-slate-700 text-white rounded p-2 text-sm" />
            <input type="text" value={drug2} onChange={e=>setDrug2(e.target.value)} placeholder="العقار الثاني (مثال: Warfarin)" className="w-full bg-slate-800 border-slate-700 text-white rounded p-2 text-sm" />
            <div className="bg-indigo-900/30 p-3 rounded text-sm text-indigo-300 font-bold border border-indigo-500/30">
              {drug1 && drug2 ? "⚠️ تحذير: قد يزيد خطر النزيف. المراقبة مطلوبة." : "أدخل الأدوية للفحص السريع"}
            </div>
          </div>
        );
      case "vital_analyzer":
        return (
          <div className="p-4 space-y-3 text-right">
            <h3 className="text-white font-bold text-sm">محلل العلامات الحيوية الاستباقي</h3>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="الضغط (120/80)" className="bg-slate-800 border-slate-700 text-white rounded p-2 text-sm" />
              <input type="number" placeholder="النبض (bpm)" className="bg-slate-800 border-slate-700 text-white rounded p-2 text-sm" />
              <input type="number" placeholder="التنفس (rpm)" className="bg-slate-800 border-slate-700 text-white rounded p-2 text-sm" />
              <input type="number" placeholder="الحرارة (C)" className="bg-slate-800 border-slate-700 text-white rounded p-2 text-sm" />
            </div>
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded text-sm">تحليل فوري</button>
          </div>
        );
      case "iv_drip":
        const drops = ivVol && ivTime ? ((Number(ivVol) * Number(vitalsDrop)) / (Number(ivTime) * 60)).toFixed(0) : "0";
        return (
          <div className="p-4 space-y-3 text-right text-white">
            <h3 className="font-bold text-sm">حاسبة معدل التنقيط الوريدي (IV Drip)</h3>
            <div className="flex gap-2">
              <input type="number" value={ivVol} onChange={e=>setIvVol(e.target.value)} placeholder="الحجم (ml)" className="w-1/3 bg-slate-800 border-slate-700 rounded p-2 text-sm" />
              <input type="number" value={ivTime} onChange={e=>setIvTime(e.target.value)} placeholder="الزمن (ساعات)" className="w-1/3 bg-slate-800 border-slate-700 rounded p-2 text-sm" />
              <select value={vitalsDrop} onChange={e=>setVitalsDrop(e.target.value)} className="w-1/3 bg-slate-800 border-slate-700 rounded p-2 text-xs">
                <option value="10">10 drops</option>
                <option value="15">15 drops</option>
                <option value="20">20 drops</option>
                <option value="60">60 drops</option>
              </select>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center text-lg font-bold">المعدل: <span className="text-pink-400">{drops}</span> قطرة/دقيقة</div>
          </div>
        );
      case "symptoms_ai":
        return (
          <div className="p-4 space-y-3 text-right">
             <h3 className="text-white font-bold text-sm">التشخيص التفريقي المدعم</h3>
             <textarea placeholder="وصف الحالة والأعراض..." className="w-full bg-slate-800 border-slate-700 text-white rounded p-3 text-sm h-24" />
             <button className="w-full bg-indigo-600 text-white font-bold py-2 rounded text-sm hover:bg-indigo-700">توليد تشخيص محتمل</button>
          </div>
        );
      case "lab_ranges":
        return <LabRangesTool language={language} />;
      case "ecg_guide":
        return (
          <div className="p-4 space-y-3 text-right text-white">
             <h3 className="font-bold text-sm">دليل مخطط القلب السريع</h3>
             <div className="bg-slate-800 border border-slate-700 p-2 rounded text-xs flex items-center justify-between"><HeartPulse className="w-4 h-4 text-emerald-400"/> Sinus Rhythm (60-100)</div>
             <div className="bg-slate-800 border border-rose-500/50 p-2 rounded text-xs flex items-center justify-between"><HeartPulse className="w-4 h-4 text-rose-400"/> Atrial Fibrillation</div>
             <div className="bg-slate-800 border border-rose-500/50 p-2 rounded text-xs flex items-center justify-between"><HeartPulse className="w-4 h-4 text-rose-400"/> Ventricular Tachycardia</div>
             <div className="bg-slate-800 border border-red-600 text-red-200 p-2 rounded text-xs flex items-center justify-between"><HeartPulse className="w-4 h-4 animate-ping text-red-500"/> Ventricular Fibrillation</div>
          </div>
        );
      case "triage":
        return (
          <div className="p-4 space-y-3 text-right text-white">
            <h3 className="font-bold text-sm">نظام الفرز (Triage)</h3>
            <select onChange={(e)=>setTriageStatus(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2 text-sm outline-none">
               <option value="">-- اختر الشكوى الرئيسية --</option>
               <option value="cardiac">ألم بالصدر (اشتباه قلبي)</option>
               <option value="breath">ضيق تنفس ملحوظ</option>
               <option value="fever">حمى مرتفعة مع استقرار</option>
            </select>
            {triageStatus === 'cardiac' && <div className="bg-rose-600/20 border border-rose-500 p-3 rounded-lg text-rose-200 font-bold text-center">Level 1 - إنعاش فورى</div>}
            {triageStatus === 'fever' && <div className="bg-amber-600/20 border border-amber-500 p-3 rounded-lg text-amber-200 font-bold text-center">Level 3 - عاجل (30 دقيقة)</div>}
          </div>
        );
      case "medical_dic":
        return (
          <div className="p-4 space-y-3 text-right">
             <h3 className="text-white font-bold text-sm">الموسوعة الطبية</h3>
             <input type="text" placeholder="بحث عن مرض..." className="w-full bg-slate-800 border border-slate-700 text-white rounded p-3 text-sm" />
             <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-400 text-center">بانتظار مصطلح البحث ...</div>
          </div>
        );
      case "pain_scale":
        return (
          <div className="p-4 space-y-3 text-right text-white">
             <h3 className="font-bold text-sm">التقييم البصري للألم</h3>
             <input type="range" min="0" max="10" className="w-full accent-rose-500" />
             <div className="flex justify-between text-xs text-slate-400">
               <span>0 (لايوجد)</span> <span>5 (متوسط)</span> <span>10 (أسوأ ألم)</span>
             </div>
          </div>
        );
      case "burn_calc":
        return (
          <div className="p-4 space-y-3 text-right text-white">
            <h3 className="font-bold text-sm">حاسبة حروق مساحة الجسم (Rule of 9s)</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button className="bg-slate-800 border border-slate-700 hover:bg-slate-700 p-2 rounded">الرأس والرقبة (9%)</button>
              <button className="bg-slate-800 border border-slate-700 hover:bg-slate-700 p-2 rounded">الذراع الأيمن (9%)</button>
              <button className="bg-slate-800 border border-slate-700 hover:bg-slate-700 p-2 rounded">الجذع الأمامي (18%)</button>
              <button className="bg-slate-800 border border-slate-700 hover:bg-slate-700 p-2 rounded">الساق اليمنى (18%)</button>
            </div>
            <div className="bg-indigo-900/50 p-2 text-center rounded-xl font-bold border border-indigo-500/30">المساحة المقدرة: <span className="text-pink-400">0% TBSA</span></div>
          </div>
        );
      case "pregnancy":
        return (
          <div className="p-4 space-y-3 text-right text-white">
            <h3 className="font-bold text-sm">لحساب استحقاق الولادة (EDD)</h3>
            <label className="text-xs text-slate-400">تاريخ آخر دورة شهرية (LMP):</label>
            <input type="date" value={lmpDate} onChange={e=>setLmpDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 text-sm" />
            <div className="bg-slate-800 border border-slate-700 p-3 text-center rounded-xl font-bold">
               تاريخ الولادة المتوقع: <span className="text-emerald-400"> {lmpDate ? new Date(new Date(lmpDate).getTime() + 280*24*60*60*1000).toLocaleDateString() : "--/--/----"} </span>
            </div>
          </div>
        );
      case "qsofa":
        const qsScore = (qSofaScore.bp ? 1:0) + (qSofaScore.rr ? 1:0) + (qSofaScore.mentation ? 1:0);
        return (
          <div className="p-4 space-y-3 text-right text-white">
            <h3 className="font-bold text-sm">معيار التسمم الدموي السريع (qSOFA)</h3>
            <div className="space-y-2 text-[11px]">
              <label className="flex items-center gap-2 bg-slate-800 border border-slate-700 p-2 rounded"><input type="checkbox" checked={qSofaScore.bp} onChange={e=>setQSofaScore({...qSofaScore, bp: e.target.checked})}/> SBP ≤ 100 mmHg</label>
              <label className="flex items-center gap-2 bg-slate-800 border border-slate-700 p-2 rounded"><input type="checkbox" checked={qSofaScore.rr} onChange={e=>setQSofaScore({...qSofaScore, rr: e.target.checked})}/> RR ≥ 22 rpm</label>
              <label className="flex items-center gap-2 bg-slate-800 border border-slate-700 p-2 rounded"><input type="checkbox" checked={qSofaScore.mentation} onChange={e=>setQSofaScore({...qSofaScore, mentation: e.target.checked})}/> تغيير في الحالة العقلية</label>
            </div>
            <div className={`p-2 font-bold text-center rounded-xl ${qsScore >= 2 ? "bg-rose-600" : "bg-emerald-600"}`}>
               النقاط: {qsScore} {qsScore >= 2 ? "(خطر عالٍ)" : "(طبيعي)"}
            </div>
          </div>
        );
      case "gcs":
        const gcsTotal = Number(gcsEye) + Number(gcsVerbal) + Number(gcsMotor);
        return (
          <div className="p-3 space-y-2 text-right text-white">
            <h3 className="font-bold text-sm mb-1">مقياس غلاسكو للغيبوبة</h3>
             <select value={gcsEye} onChange={e=>setGcsEye(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded text-xs">
               <option value="4">العين 4 - تلقائية</option><option value="3">العين 3 - للصوت</option><option value="2">العين 2 - للألم</option><option value="1">العين 1 - بلا استجابة</option>
             </select>
             <select value={gcsVerbal} onChange={e=>setGcsVerbal(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded text-xs">
               <option value="5">اللفظي 5 - طبيعي</option><option value="4">اللفظي 4 - مشوش</option><option value="3">اللفظي 3 - غير مناسب</option><option value="2">اللفظي 2 - أصوات</option><option value="1">اللفظي 1 - بلا استجابة</option>
             </select>
             <select value={gcsMotor} onChange={e=>setGcsMotor(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded text-xs">
               <option value="6">الحركي 6 - يتبع الأوامر</option><option value="5">الحركي 5 - يحدد الألم</option><option value="4">الحركي 4 - ينسحب</option><option value="3">الحركي 3 - انثناء</option><option value="2">الحركي 2 - انبساط</option><option value="1">الحركي 1 - بلا استجابة</option>
             </select>
             <div className="bg-indigo-900 border border-indigo-500/50 p-2 rounded-xl text-center font-bold">إجمالي GCS: {gcsTotal}/15</div>
          </div>
        );
      case "ped_dosage":
        return (
          <div className="p-4 space-y-3 text-right">
             <h3 className="text-white font-bold text-sm">أدوية الأطفال</h3>
             <input type="number" placeholder="وزن الطفل بالكيلوجرام" className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 text-sm" />
             <select className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2 text-sm">
                <option value="">Paracetamol (10-15 mg/kg)</option>
                <option value="">Ibuprofen (5-10 mg/kg)</option>
             </select>
             <button className="w-full bg-indigo-600 text-white font-bold py-2 rounded text-sm hover:bg-indigo-700">احتساب الجرعة</button>
          </div>
        );
      case "apgar":
        const apSum = apgarScore.color + apgarScore.hr + apgarScore.reflex + apgarScore.resp + apgarScore.tone;
        return (
          <div className="p-4 space-y-3 text-right text-white">
            <h3 className="font-bold text-sm">مقياس أبغار لحديثي الولادة</h3>
            <div className="flex gap-2">
              <select value={apgarScore.hr} onChange={e=>setApgarScore({...apgarScore, hr: Number(e.target.value)})} className="flex-1 bg-slate-800 border border-slate-700 text-white p-1 rounded text-xs"><option value="2">النبض: طبيعي</option><option value="0">النبض: غائب</option></select>
              <select value={apgarScore.resp} onChange={e=>setApgarScore({...apgarScore, resp: Number(e.target.value)})} className="flex-1 bg-slate-800 border border-slate-700 text-white p-1 rounded text-xs"><option value="2">التنفس: ممتاز</option><option value="0">التنفس: غائب</option></select>
            </div>
            <div className={`p-2 font-bold text-center rounded-xl bg-slate-800 border border-slate-700`}>
               النتيجة الكلية: <span className={apSum >= 7 ? "text-emerald-400" : "text-rose-400"}>{apSum} / 10</span>
            </div>
          </div>
        );
      case "policy_bot":
        return (
          <div className="flex flex-col h-full text-right p-4">
             <div className="flex-1 space-y-3 overflow-y-auto mb-3">
               <div className="bg-slate-800 p-3 rounded-2xl rounded-tr-sm w-[90%] text-slate-200 text-[11px] leading-relaxed">
                 مرحباً! أنا "المستشار الآلي" للتمريض. يمكنك سؤالي عن المعايير، قواعد JCI، والمزيد.
               </div>
             </div>
             <div className="flex gap-2">
                 <input type="text" placeholder="اكتب سؤالك هنا..." className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500" />
                 <button className="bg-indigo-600 rounded-xl px-3 py-2 hover:bg-indigo-500 transition text-white">
                   <Send className="w-4 h-4" />
                 </button>
             </div>
          </div>
        );
      case "shift_notes":
        return (
          <div className="p-4 space-y-3 text-right">
             <h3 className="text-white font-bold text-sm">SBAR تسليم الوردية</h3>
             <textarea placeholder="عناصر الحالة باختصار..." className="w-full bg-slate-800 border border-slate-700 text-white rounded p-3 text-sm h-16 outline-none" />
             <button className="w-full bg-indigo-600 text-white font-bold py-2 rounded text-sm hover:bg-indigo-700">تنسيق SBAR آلي</button>
          </div>
        );
      case "icu_monitor":
        return (
          <div className="p-4 space-y-3 text-right text-white">
             <h3 className="font-bold text-sm">تنبؤ العناية (ICU Prediction)</h3>
             <div className="p-4 border border-indigo-500/30 bg-indigo-900/20 rounded-xl text-center">
                 <Activity className="w-8 h-8 text-indigo-400 mx-auto" />
                 <p className="mt-3 text-xs text-indigo-200 block">يرجى مزامنة المريض بالمشاهدة الحيوية المتصلة HL7/FHIR.</p>
             </div>
          </div>
        );
      case "mental_health":
        return (
          <div className="p-4 space-y-3 text-right text-white h-full flex flex-col justify-center items-center text-center">
             <Sparkles className="w-8 h-8 text-emerald-400 mb-2 animate-bounce" />
             <h3 className="font-black text-sm">أنت بطل الرعاية!</h3>
             <p className="text-[11px] text-emerald-100 mt-2">خذ نفساً عميقاً... عملك الجبار يبقي المرضى في أمان. شكراً لك!</p>
          </div>
        );
      default:
        return null;
    }
  };

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
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-indigo-300 to-purple-200">المساعد الذكي</span>
              <Brain className="w-6 h-6 text-indigo-400 animate-bounce" />
            </h2>
            <div className="text-[9px] bg-white/10 px-2.5 py-0.5 rounded font-mono tracking-widest uppercase">
               20 INTELLIGENT MODULES
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 relative" dir="rtl">
          
          <div className="bg-white border border-slate-200 p-4 rounded-3xl mb-6 shadow-sm flex gap-4 text-right">
            <div className="p-3 bg-indigo-50 rounded-2xl shrink-0 h-max">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-800 leading-tight">مرحباً!</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-2 font-semibold">
                تم تجهيز 20 أداة ذكية ومدعمة لتقديم الدعم السريري الفوري. 
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pb-4">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2.5 text-center transition-all bg-white hover:-translate-y-1 ${
                  activeTool === tool.id ? "ring-2 ring-indigo-500 bg-indigo-50 border-indigo-200 shadow-md" : "border-slate-200 shadow-sm shadow-slate-100 hover:border-indigo-300 cursor-pointer"
                }`}
              >
                <div className={`p-3 rounded-xl ${activeTool === tool.id ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-50 text-slate-600"}`}>
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
          <div className="bg-slate-900 border-t border-slate-800 shrink-0 shadow-[0_-15px_40px_rgba(0,0,0,0.2)] flex flex-col z-20 sticky bottom-0" style={{ height: "320px" }}>
            <div className="px-5 py-3 bg-slate-950/80 backdrop-blur border-b border-white/10 flex items-center justify-between" dir="rtl">
              <span className="text-[11px] font-black tracking-wide text-indigo-300 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                أداة نشطة: {language === "ar" ? tools.find(t => t.id === activeTool)?.titleAr : tools.find(t => t.id === activeTool)?.titleEn}
              </span>
              <button onClick={() => setActiveTool(null)} className="text-[10px] text-slate-300 hover:text-white font-bold px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg shrink-0 transition cursor-pointer">إغلاق</button>
            </div>
            <div className="flex-1 overflow-y-auto p-0 relative bg-slate-900 custom-scrollbar" dir="rtl">
              {renderToolContent()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Interactive Lab reference database and search engine with drawer visuals
function LabRangesTool({ language }: { language: "ar" | "en" }) {
  const isAr = language === "ar";
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const labDb = [
    {
      nameAr: "صورة الدم الكاملة (CBC / Hb)",
      nameEn: "Complete Blood Count (CBC)",
      category: "hematology",
      rangeAr: "الهيموجلوبين: الذكور (13.5-17.5 g/dL)، الإناث (12.0-15.5 g/dL). الصفائح: 150-450k",
      rangeEn: "Hb: Male (13.5-17.5 g/dL), Female (12.0-15.5 g/dL). PLT: 150-450k/uL",
      tubeAr: "أنبوبة لافندر غطاء بنفسجي (EDTA Anticoagulant)",
      tubeEn: "Lavender-cap tube (EDTA Anticoagulant)",
      tubeColor: "border-purple-600 bg-purple-900/40 text-purple-200",
      methodAr: "سحب عينة دم وريدي، يمنع رج الأنبوبة بعنف؛ يحرك بلطف ٨ مرات لتجنب تحلل الدم (Hemolysis).",
      methodEn: "Venipuncture. Invert gently 8 times. Do NOT shake vigorously to avoid Hemolysis.",
      volumeAr: "2-3 ملليلتر",
      volumeEn: "2-3 mL"
    },
    {
      nameAr: "وظائف كلى - الكرياتينين (Creatinine)",
      nameEn: "Kidney Function - Creatinine",
      category: "kidney",
      rangeAr: "البالغين: 0.6-1.2 mg/dL. الارتفاع يشير لقصور في كفاءة الكلى والتصفية.",
      rangeEn: "Adults: 0.6-1.2 mg/dL. Elevated indicates impaired Glomerular Filtration.",
      tubeAr: "أنبوبة صفراء أو حمراء (SST / Gel Act)",
      tubeEn: "Yellow or Red cap tube (SST Serum Separator)",
      tubeColor: "border-amber-500 bg-amber-900/40 text-amber-200",
      methodAr: "سحب دم وريدي، صيام اختياري، تترك لتتجلط ثم تفصل عينة السيروم بجهاز الطرد المركزي الـ Centrifuge.",
      methodEn: "Venipuncture. Wait 30 mins to clot. Spin in centrifuge to separate serum.",
      volumeAr: "4-5 ملليلتر",
      volumeEn: "4-5 mL"
    },
    {
      nameAr: "البوتاسيوم في الدم (Potassium / K+)",
      nameEn: "Serum Potassium (K+)",
      category: "electrolytes",
      rangeAr: "المعدل الطبيعي الحرج: 3.5 - 5.0 mEq/L. الانحراف يهدد كهرباء عضل القلب.",
      rangeEn: "Critical Range: 3.5 - 5.0 mEq/L. High/low threatens cardiac conduction.",
      tubeAr: "أنبوبة خضراء (هيبارين الليثيوم) أو SST صفراء",
      tubeEn: "Green cap tube (Lithium Heparin) or Yellow SST",
      tubeColor: "border-emerald-600 bg-emerald-900/40 text-emerald-200",
      methodAr: "سحب فوري بدون ترك التورنيكية مربوطة لفترة طويلة، لأن حبس الدم يسبب تحلل كاذب للبيانات وارتفاع مستوى البوتاسيوم.",
      methodEn: "Release tourniquet within 1 minute. Prolonged stasis falsely elevates K+.",
      volumeAr: "3 ملليلتر",
      volumeEn: "3 mL"
    },
    {
      nameAr: "إنزيمات الكبد (ALT / AST)",
      nameEn: "Liver Enzymes (ALT / AST)",
      category: "liver",
      rangeAr: "معدل الإنزيمات: ALT (7-56 U/L)، AST (10-40 U/L). الارتفاع المفرط يدل على إصابة كبدية.",
      rangeEn: "Normal values: ALT (7-56 U/L), AST (10-40 U/L). Elevated indicates hepatocellular injury.",
      tubeAr: "أنبوبة صفراء مصلية (SST / Gel Clot Activator)",
      tubeEn: "Yellow serum tube (SST / Gel Clot Activator)",
      tubeColor: "border-amber-500 bg-amber-900/40 text-amber-200",
      methodAr: "سحب عينة دم وريدي، يوصى بالبعد عن الوجبات الدسمة قبل إجراء التحليل بـ 12 ساعة لتجنب عكارة السيروم (Lipemic sample).",
      methodEn: "Standard venipuncture. Serum sample. Avoid heavy fat meal to prevent lipemia.",
      volumeAr: "4 ملليلتر",
      volumeEn: "4 mL"
    },
    {
      nameAr: "غازات الدم الشريانية (ABG / Art Blood Gas)",
      nameEn: "Arterial Blood Gas (ABG)",
      category: "respiratory",
      rangeAr: "الأس الهيدروجيني pH: 7.35-7.45. الضغط الجزئي pCO2: 35-45. الـ HCO3: 22-26 mEq/L.",
      rangeEn: "pH: 7.35-7.45. pCO2: 35-45 mmHg. HCO3: 22-26 mEq/L. pO2: 80-100 mmHg.",
      tubeAr: "سرنجة سحب شرياني جاهزة تحتوي على هيبارين جاف مسبقاً",
      tubeEn: "Heparinized Arterial Syringe",
      tubeColor: "border-sky-500 bg-sky-900/40 text-sky-200",
      methodAr: "سحب من الشريان الكعبري بالمعصم (Radial Artery) بعد إجراء اختبار ألين لتروية اليد (Allen's Test). تنقل العينة مثلجة فوراً للمعمل.",
      methodEn: "Arterial draw. Run Allen's test first. Transport on ice immediately.",
      volumeAr: "1-2 ملليلتر غازات",
      volumeEn: "1-2 mL arterial"
    },
    {
      nameAr: "تحليل السيولة وزمن البروثرومبين (PT / INR)",
      nameEn: "Prothrombin Time / INR",
      category: "hematology",
      rangeAr: "النسبة الطبيعية INR: 0.8-1.2 (المقيدون بالوارفارين: 2.0-3.0 لضمان الحماية من الجلطة).",
      rangeEn: "INR: 0.8-1.2. (Target for Warfarin therapy: 2.0-3.0).",
      tubeAr: "أنبوبة زرقاء فاتحة (صوديوم سيترات 3.2% Sodium Citrate)",
      tubeEn: "Light Blue cap tube (3.2% Sodium Citrate)",
      tubeColor: "border-blue-500 bg-blue-900/40 text-blue-200",
      methodAr: "يجب ملء الأنبوبة للعلامة الدقيقة المطبوعة عليها مسبقاً (Ratio 9:1) لكي لا تفسد حسابات زمن التخثر بسبب زيادة السيترات.",
      methodEn: "Precise fill to the mark (9:1 blood-to-citrate ratio) to prevent false prolongation.",
      volumeAr: "2.7 ملليلتر (شديد الأهمية)",
      volumeEn: "2.7 mL exact"
    },
    {
      nameAr: "إنزيم القلب المخصص - تروبونين (Troponin I)",
      nameEn: "Cardiac Troponin I",
      category: "cardiac",
      rangeAr: "المعدل الطبيعي: أقل من 0.04 ng/mL. الارتفاع السريع طارئ يثبت جلطة أو احتشاء عضل القلب (MI).",
      rangeEn: "Normal: < 0.04 ng/mL. Elevation signifies myocardial infarction (STEMI/NSTEMI).",
      tubeAr: "أنبوبة خضراء (هيبارين) أو SST صفراء مصلية",
      tubeEn: "Green-cap Heparin or Yellow-cap SST",
      tubeColor: "border-emerald-500 bg-emerald-950/40 text-emerald-300",
      methodAr: "سحب طارئ (STAT)، تفصل العينة سريعاً لقراءة النتيجة خلال ٢٠ دقيقة لإنقاذ المريض.",
      methodEn: "STAT emergency draw. Spin immediately. Report result within 30 minutes.",
      volumeAr: "3-4 ملليلتر",
      volumeEn: "3-4 mL"
    }
  ];

  const filtered = labDb.filter(lab => {
    const matchSearch = 
      lab.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) || 
      lab.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lab.rangeAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lab.rangeEn.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeCategory === "all") return matchSearch;
    return matchSearch && lab.category === activeCategory;
  });

  return (
    <div className="p-4 space-y-4 text-right text-slate-100">
      
      {/* Search Input Section */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-slate-400">
          {isAr ? "🔎 بحث فوري عن قيم المعامل ودرجات السحب" : "🔎 Search Lab References & Guidelines"}
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isAr ? "ابحث بالاسم... مثلاً: CBC, PT, K+, Creatinine" : "Search e.g. CBC, K+, Troponin..."}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-white"
        />
      </div>

      {/* Category Tags */}
      <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 max-w-full">
        {[
          { id: "all", ar: "الكل", en: "All" },
          { id: "hematology", ar: "الدم", en: "Hematology" },
          { id: "kidney", ar: "الكلى", en: "Kidney" },
          { id: "electrolytes", ar: "الأيونات", en: "Electrolytes" },
          { id: "liver", ar: "الكبد", en: "Liver" },
          { id: "cardiac", ar: "القلب", en: "Cardiac" }
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex-shrink-0 ${
              activeCategory === cat.id 
                ? "bg-indigo-650 text-white shadow-sm border border-indigo-500" 
                : "bg-slate-800 text-slate-400 border border-slate-700/60 hover:text-white"
            }`}
          >
            {isAr ? cat.ar : cat.en}
          </button>
        ))}
      </div>

      {/* Cards List */}
      <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="text-center text-[11px] text-slate-500 py-4">
            {isAr ? "لم نجد نتائج مطابقة لبحثك." : "No matching lab tests found."}
          </p>
        ) : (
          filtered.map((lab, index) => (
            <div key={index} className="bg-slate-950/40 border border-slate-800 p-3 rounded-xl space-y-2.5 hover:border-slate-700 transition">
              
              {/* Header Title with Tube color badge */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-tighter border ${lab.tubeColor}`}>
                  {isAr ? lab.tubeAr.split(" (")[0] : lab.tubeEn.split(" (")[0]}
                </span>
                <h4 className="text-[11px] font-black text-indigo-400 truncate">
                  {isAr ? lab.nameAr : lab.nameEn}
                </h4>
              </div>

              {/* Lab Values */}
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold leading-tight flex items-start gap-1">
                  <span>📊 {isAr ? "القيم الطبيعية:" : "Normal range:"}</span>
                  <span className="text-emerald-400 font-mono font-medium">{isAr ? lab.rangeAr : lab.rangeEn}</span>
                </p>
              </div>

              {/* Sample Guidelines & Visuals */}
              <div className="text-[10px] space-y-1 text-slate-300 leading-normal">
                <p className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-bold">🧪 {isAr ? "أنبوبة وتعبئة:" : "Tube details:"}</span>
                  <span className="font-semibold text-purple-300">{isAr ? lab.tubeAr : lab.tubeEn}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-bold">📏 {isAr ? "حجم العينة المطلوب:" : "Sample volume:"}</span>
                  <span className="text-indigo-300 font-mono font-black">{isAr ? lab.volumeAr : lab.volumeEn}</span>
                </p>
                <div className="bg-indigo-950/20 border border-indigo-900/30 p-1.5 rounded-lg text-[9px] text-indigo-200 mt-1">
                  💡 <span className="font-semibold">{isAr ? "إرشادات السحب:" : "Draw criteria:"}</span> {isAr ? lab.methodAr : lab.methodEn}
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
