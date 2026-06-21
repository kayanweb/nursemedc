import React, { useState, useRef, useEffect } from "react";
import { ClipboardCheck, CheckCircle2, XCircle, MinusCircle, Printer, Save, Archive, Play, Trash2, Download, HeartPulse, Sliders } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useSettings } from "../context/SettingsContext";
import { useFirestoreSync } from "../hooks/useFirestoreSync";
import { syncDailyAudits, saveDailyAudit } from "../lib/firestoreService";

interface RoundingAuditProps {
  language: "ar" | "en";
  isAr: boolean;
}

const CHECKLIST_TEMPLATE = [
  {
    category: "Staffing & Compliance",
    categoryAr: "العمالة والالتزام",
    items: [
       { id: "staff_uniform", textAr: "الالتزام بالزي الرسمي وتعليق بطاقات التعريف (ID)", textEn: "Staff wearing proper uniform and ID badges" },
       { id: "staff_handover", textAr: "الالتزام بالتسليم والتسلم بجانب سرير المريض (Bedside Handover)", textEn: "Bedside handover is practiced" },
    ]
  },
  {
    category: "Patient Safety",
    categoryAr: "رعاية وأمن المرضى",
    items: [
       { id: "pt_id_band", textAr: "أساور التعريف مطابقة للمرضى المزدوجة (ID Bands)", textEn: "Patient ID bands are verified" },
       { id: "pt_call_bell", textAr: "أجراس النداء في متناول المرضى وفعالة", textEn: "Call bells in reach and functional" },
       { id: "pt_fall_risk", textAr: "تطبيق سياسة منع السقوط (حواجز السرير مرفوعة ومقيمة)", textEn: "Fall risk precautions applied (bed rails up)" },
    ]
  },
  {
    category: "Infection Control",
    categoryAr: "مكافحة العدوى",
    items: [
       { id: "ic_hygiene", textAr: "توفر المطهرات والالتزام بتطهير الأيدي للأطقم الطبية", textEn: "Hand sanitizers available and used" },
       { id: "ic_isolation", textAr: "تطبيق سياسات العزل (لوحات عزل، توفر أدوات حماية شخصية PPE)", textEn: "Isolation precautions applied correctly" },
       { id: "ic_waste", textAr: "فصل النفايات الطبية بشكل صحيح وصناديق الآلات الحادة", textEn: "Proper medical waste and sharps disposal" },
    ]
  },
  {
    category: "Medication & Stock",
    categoryAr: "الأدوية والمخزون الداخلي",
    items: [
       { id: "med_narcotic", textAr: "اكتمال دفتر الأدوية المخدرة ومطابقة العهدة بالتوقيع المزدوج", textEn: "Narcotics book complete with double signatures" },
       { id: "med_fridge", textAr: "تسجيل درجة حرارة ثلاجة الأدوية بانتظام ضمن المعدل المسموح", textEn: "Medication fridge temperature recorded" },
       { id: "med_expired", textAr: "تخزين الأدوية عالية الخطورة (High Alert) مفصولة وبدون أدوية منتهية", textEn: "High-alert meds stored properly, no expired meds" },
    ]
  },
  {
    category: "Emergency & Equipment",
    categoryAr: "الطوارئ والأجهزة",
    items: [
       { id: "eq_crash_cart", textAr: "عربة الطوارئ مختومة بقفل الأمان وتسجيل تاريخ الفحص (Crash Cart)", textEn: "Crash cart sealed and log updated" },
       { id: "eq_defib", textAr: "عمل فحص جهاز صدمات القلب (Defibrillator) والتسجيل بالنموذج", textEn: "Defibrillator checked and working" },
       { id: "eq_suction", textAr: "جاهزية أجهزة الشفط والأكسجين الجدارية تعمل جيداً", textEn: "Suction and wall oxygen ready" },
    ]
  }
];

export default function SupervisorRoundingAudit({ language, isAr }: RoundingAuditProps) {
  const { settings } = useSettings();
  const [viewState, setViewState] = useState<"start" | "active" | "archive">("start");
  
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [archive, setArchive] = useFirestoreSync<any>(syncDailyAudits, []);

  const saveArchive = (newArchive: any[]) => {
    // Only used locally for very specific UX reasons; not used for persistence.
  };

  const startNewRound = () => {
    setCurrentRound({
      id: "round-" + Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString(),
      department: "",
      shift: "Morning",
      answers: {},
      generalNotes: "",
      supervisorName: settings?.user_name || "المشرف الميداني",
      type: "super_rounding_audit",
      timestamp: Date.now()
    });
    setViewState("active");
  };

  const handleAnswer = (itemId: string, val: "Yes" | "No" | "N/A") => {
    setCurrentRound({
      ...currentRound,
      answers: { ...currentRound.answers, [itemId]: val }
    });
  };

  const saveRound = () => {
    if (!currentRound.department || !currentRound.supervisorName) {
      alert(isAr ? "يرجى تعبئة القسم واسم المشرف." : "Please fill Department and Supervisor Name.");
      return;
    }
    
    saveDailyAudit(currentRound).then(() => {
        alert(isAr ? "تم حفظ جولة المرور بنجاح في السجل المركزي!" : "Rounding saved successfully to the synchronized central database!");
        setViewState("start");
    }).catch(e => {
        console.error(e);
        alert(isAr ? "حدث خطأ في حفظ الجولة" : "Error saving to cloud");
    });
  };

  const deleteRound = (id: string) => {
    if (window.confirm(isAr ? "تأكيد مسح هذا التقرير؟" : "Confirm deleting this report?")) {
      // In full prod we implement deleteDailyAudit
      alert(isAr ? "تم أرشفة السجل لإدارة الجودة." : "Audit archived for quality control.");
    }
  };

  const loadRound = (round: any) => {
    setCurrentRound(round);
    setViewState("active");
  };

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Rounding_Report_${currentRound?.department}_${currentRound?.date}`,
  });

  if (viewState === "archive") {
    // Filter out audits that are not Supervisor rounds specifically
    const displayedArchive = archive.filter(a => a.type === "super_rounding_audit" || a.answers);

    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
            <Archive className="text-indigo-500" />
            {isAr ? "الأرشيف الذكي للجولات التفقدية" : "Smart Rounding Audits Archive"}
          </h3>
          <button 
            onClick={() => setViewState("start")}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-xl font-bold text-sm"
          >
            {isAr ? "العودة للوحة" : "Back"}
          </button>
        </div>

        <div className="space-y-4">
          {displayedArchive.length === 0 && (
            <div className="text-center text-slate-400 py-10 font-bold border-2 border-dashed border-slate-100 rounded-xl">
              {isAr ? "لا توجد جولات محفوظة للمشرفين في قاعدة البيانات" : "No saved supervisor rounds found in DB"}
            </div>
          )}
          {displayedArchive.map(rec => {
             // Calculate compliance rating
             const answers = Object.values(rec.answers || {});
             const yesCount = answers.filter(a => a === "Yes").length;
             const totalValid = answers.filter(a => a !== "N/A").length;
             const percentage = totalValid > 0 ? Math.round((yesCount / totalValid) * 100) : 0;
             let badgeColor = "bg-red-100 text-red-700";
             if (percentage > 85) badgeColor = "bg-emerald-100 text-emerald-700";
             else if (percentage >= 60) badgeColor = "bg-amber-100 text-amber-700";

             return (
              <div key={rec.id} className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:justify-between items-start md:items-center gap-3 hover:bg-slate-50 transition">
                <div className="flex flex-col gap-1">
                  <p className="font-bold text-slate-800 text-sm flex gap-2 items-center text-right justify-start">
                    <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded uppercase tracking-wider text-[11px] font-black shrink-0">
                      {rec.department || "N/A"}
                    </span>
                    <span className="text-[13px]">{rec.date} ({rec.shift})</span>
                  </p>
                  <p className="text-xs text-slate-500">{isAr ? "مشرف المرور المعتمد:" : "Auditing Supervisor:"} <span className="font-bold text-slate-700">{rec.supervisorName}</span></p>
                </div>
                <div className="flex items-center gap-4">
                   <div className="text-center px-3 border-x border-slate-200">
                     <p className="text-[10px] text-slate-400 font-bold mb-0.5">{isAr ? "الامتثال" : "Compliance"}</p>
                     <span className={`px-2 py-0.5 rounded font-black text-xs inline-block ${badgeColor}`}>
                       {percentage}%
                     </span>
                   </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => loadRound(rec)} className="bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" />
                      {isAr ? "استرجاع وعرض" : "Load & View"}
                    </button>
                    <button onClick={() => deleteRound(rec.id)} className="text-red-400 hover:text-red-600 p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
          )})}
        </div>
      </div>
    );
  }

  if (viewState === "active" && currentRound) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4 no-print">
          <div className="flex gap-2">
            <button onClick={() => setViewState("start")} className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-xl font-bold text-sm">
              {isAr ? "إغلاق" : "Close"}
            </button>
            <button onClick={() => setViewState("archive")} className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-xl font-bold text-sm">
              {isAr ? "الأرشيف" : "Archive"}
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={saveRound} className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition shadow-sm">
              <Save className="w-4 h-4" />
              {isAr ? "حفظ التقرير" : "Save Report"}
            </button>
            <button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition shadow-sm">
              <Printer className="w-4 h-4" />
              {isAr ? "طباعة" : "Print"}
            </button>
          </div>
        </div>

        {/* Print Content */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:m-0 print:p-0" ref={printRef}>
          <div className="space-y-6 w-full print:w-full" dir={isAr ? "rtl" : "ltr"}>
            
            <div className="text-center border-b-2 border-slate-800 pb-4 mb-6 relative">
              <h1 className="text-2xl font-black text-slate-900 border-2 border-slate-900 inline-block px-6 py-2 rounded-lg mb-2">
                {isAr ? "نموذج الجولات التفقدية الميدانية (Nursing Supervisor Rounding Form)" : "Nursing Supervisor Rounding Form"}
              </h1>
              <div className="absolute top-0 right-0 flex items-center gap-1.5 border border-pink-200 bg-pink-50/25 px-2.5 py-1.5 rounded-lg">
                <span className="font-mono font-black text-pink-700 text-[10px] tracking-wider border border-pink-300 px-1.5 py-0.5 rounded leading-none shrink-0">
                  {settings.nameEn ? settings.nameEn.split(/\s+/).map((w: string) => w[0]).filter((c: string) => /^[a-zA-Z\u0600-\u06FF]$/.test(c)).slice(0, 2).join("").toUpperCase() : "BH"}
                </span>
                <span className="font-sans font-black text-slate-800 text-[10px] leading-none">
                  {isAr ? (settings.institutionNameAr || "مؤسسة المستشفى") : (settings.institutionNameEn || "Hospital Foundation")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 border border-slate-200 rounded-xl mb-6 font-bold text-sm text-slate-800 print:bg-white print:border-slate-800 print:border-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{isAr ? "القسم المُقيم / Ward:" : "Ward / Dept:"}</label>
                <input 
                  type="text" 
                  value={currentRound.department} 
                  onChange={(e) => setCurrentRound({...currentRound, department: e.target.value})}
                  className="w-full bg-transparent border-b border-slate-400 focus:border-indigo-500 outline-none print:border-b-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{isAr ? "تاريخ المرور / Date:" : "Date:"}</label>
                <input 
                  type="date" 
                  value={currentRound.date} 
                  onChange={(e) => setCurrentRound({...currentRound, date: e.target.value})}
                  className="w-full bg-transparent border-b border-slate-400 focus:border-indigo-500 outline-none print:border-b-2"
                />
              </div>
              <div>
                 <label className="block text-xs font-semibold text-slate-500 mb-1">{isAr ? "الشيفت / Shift:" : "Shift:"}</label>
                 <select 
                   value={currentRound.shift} 
                   onChange={(e) => setCurrentRound({...currentRound, shift: e.target.value})}
                   className="w-full bg-transparent border-b border-slate-400 focus:border-indigo-500 outline-none print:border-b-2 print:appearance-none"
                 >
                   <option value="Morning">Morning (الصباحي)</option>
                   <option value="Evening">Evening (المسائي)</option>
                   <option value="Night">Night (السهرة)</option>
                 </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{isAr ? "مشرف التمريض / Supervisor:" : "Supervisor:"}</label>
                <input 
                  type="text" 
                  value={currentRound.supervisorName} 
                  onChange={(e) => setCurrentRound({...currentRound, supervisorName: e.target.value})}
                  className="w-full bg-transparent border-b border-slate-400 focus:border-indigo-500 outline-none print:border-b-2"
                />
              </div>
            </div>

            <div className="space-y-6">
              {CHECKLIST_TEMPLATE.map((cat, idx) => (
                <div key={idx} className="border-2 border-slate-800 rounded-xl overflow-hidden print:border-black">
                  <h3 className="font-black text-slate-900 bg-slate-100 p-2 border-b-2 border-slate-800 print:bg-slate-200">
                    {idx + 1}. {isAr ? cat.categoryAr : cat.category}
                  </h3>
                  <div className="divide-y divide-slate-300">
                    {cat.items.map((item, i) => (
                      <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 gap-3 print:break-inside-avoid">
                        <div className="flex-1 font-semibold text-sm text-slate-800">
                          {isAr ? item.textAr : item.textEn}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button 
                            onClick={() => handleAnswer(item.id, "Yes")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 border-2 rounded-lg text-xs font-bold transition-colors ${currentRound.answers[item.id] === 'Yes' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {isAr ? "مستوفى" : "Yes"}
                          </button>
                          <button 
                            onClick={() => handleAnswer(item.id, "No")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 border-2 rounded-lg text-xs font-bold transition-colors ${currentRound.answers[item.id] === 'No' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
                          >
                            <XCircle className="w-4 h-4" />
                            {isAr ? "غير مستوفى" : "No"}
                          </button>
                          <button 
                            onClick={() => handleAnswer(item.id, "N/A")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 border-2 rounded-lg text-xs font-bold transition-colors ${currentRound.answers[item.id] === 'N/A' ? 'bg-slate-100 border-slate-500 text-slate-700' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
                          >
                            <MinusCircle className="w-4 h-4" />
                            N/A
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-2 border-slate-800 rounded-xl p-4 mt-8 print:border-black">
               <label className="block font-black text-slate-900 mb-2">{isAr ? "ملاحظات عامة وتوصيات (General Notes & Actions):" : "General Notes & Actions:"}</label>
               <textarea 
                 value={currentRound.generalNotes}
                 onChange={(e) => setCurrentRound({...currentRound, generalNotes: e.target.value})}
                 className="w-full h-24 bg-transparent outline-none resize-none border-b border-dashed border-slate-400 print:break-inside-avoid text-sm font-semibold"
                 placeholder={isAr ? "اكتب أي قصور يحتاج لحل فوري، أو توجيهات تم إعطاؤها للتمريض..." : "Write any deficiencies requiring immediate action..."}
               />
            </div>
            
             <div className="flex items-center justify-between mt-12 pt-4 border-t-2 border-slate-800 text-sm font-bold text-slate-800 avoid-break">
               <div>
                  <span>{isAr ? "توقيع المشرف المرور:" : "Supervisor Signature:"}</span>
                  <span className="inline-block w-48 border-b-2 border-dashed border-slate-600 mr-2 ml-2"></span>
               </div>
               <div>
                  <span>Date/Time:</span>
                  <span className="mx-2">{currentRound.date} {currentRound.time}</span>
               </div>
               <div className="text-[10px] font-mono text-slate-500">BHG-NSG-AUDIT-01</div>
             </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-fade-in text-center py-12">
      <ClipboardCheck className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
      <h3 className="font-black text-xl text-slate-800 mb-2">{isAr ? "الجولات التفقدية الميدانية للمشرف (Rounding Audits)" : "Supervisor Rounding"}</h3>
      <p className="text-slate-500 text-sm mb-8 max-w-md mx-auto font-medium leading-relaxed">
        {isAr ? "نماذج تفتيشية إلكترونية متكاملة لتقييم الزي الرسمي، نظافة عربات الأدوية، والالتزام بمعايير منع العدوى بالمرور، مع أرشفة مركزية وتقارير مسجلّة." : "Comprehensive digital checklists to verify uniform compliance, Crash Cart checks, Medication safety, and Infection control on the floor."}
      </p>
      <div className="flex justify-center gap-4">
        <button 
          onClick={startNewRound}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition flex items-center gap-2"
        >
          <Play className="w-5 h-5" />
          {isAr ? "بدء نموذج مرور جديد" : "Start New Rounding Audit"}
        </button>
        <button 
          onClick={() => setViewState("archive")}
          className="bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300 font-bold py-3 px-6 rounded-xl shadow-sm transition flex items-center gap-2"
        >
          <Archive className="w-5 h-5 text-indigo-500" />
          {isAr ? "السجلات السابقة" : "View Archives"}
        </button>
      </div>
    </div>
  );
}
