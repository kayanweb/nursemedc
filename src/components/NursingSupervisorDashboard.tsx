import React, { useState } from "react";
import { Users, AlertCircle, RefreshCw, ClipboardCheck, BedDouble, ShieldAlert, Activity, GitMerge, FileText, Zap, ShieldCheck, PieChart, PenTool, ArrowRight, Sparkles } from "lucide-react";
import SupervisorRoundingAudit from "./SupervisorRoundingAudit";
import SupervisorDailySuite from "./SupervisorDailySuite";
import SmartNotificationCenter from "./SmartNotificationCenter";

interface Props {
  language: "ar" | "en";
}

export default function NursingSupervisorDashboard({ language }: Props) {
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState<"reports" | "forms" | "interactive">("reports");
  const [activeForm, setActiveForm] = useState<"none" | "rounding" | "dailySuite">("none");

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen text-right font-sans flex flex-col gap-6" dir={isAr ? "rtl" : "ltr"}>
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border-r-4 border-r-emerald-500">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Activity className="h-7 w-7 text-emerald-600" />
            {isAr ? "شاشة مدير المناوبة / السوبرفايزر الميداني" : "Nursing Supervisor Dashboard (Real-Time SPA)"}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-semibold max-w-2xl">
            {isAr ? "مركز القيادة الميدانية التفاعلي (SPA): تقارير حية، نماذج تفتيش ذكية، والتحكم الفوري بالمهام ونواقل المرضى." : "Interactive Field Command (SPA): Live Reports, Smart Checklists, and Instant Float Control."}
          </p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1.5 flex-wrap">
          <button 
            onClick={() => {setActiveTab("reports"); setActiveForm("none");}}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "reports" ? "bg-white text-emerald-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
          >
            <PieChart className="w-4 h-4" />
            {isAr ? "التقارير التشغيلية الحية" : "Live Reports"}
          </button>
          <button 
            onClick={() => {setActiveTab("forms"); setActiveForm("none");}}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "forms" ? "bg-white text-emerald-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
          >
            <FileText className="w-4 h-4" />
            {isAr ? "النماذج الرقمية الذكية" : "Smart Forms"}
          </button>
          <button 
            onClick={() => {setActiveTab("interactive"); setActiveForm("none");}}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "interactive" ? "bg-white text-emerald-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
          >
            <Zap className="w-4 h-4" />
            {isAr ? "الأدوات التفاعلية (أكشن)" : "Interactive Tools"}
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 h-full items-stretch">
         
         {/* Main Content Area */}
         <div className="flex-1 space-y-6 overflow-hidden">
            {activeTab === "reports" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                
                {/* Patient Acuity & Workload Report */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                  <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-rose-500" />
                    {isAr ? "حمل العمل ودرجة خطورة المرضى (Acuity & NEWS2)" : "Patient Acuity & Workload"}
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center group">
                      <div>
                         <p className="font-bold text-sm text-slate-800">الرعاية المركزة (ICU)</p>
                         <p className="text-[10px] text-slate-500 mt-1 font-semibold">{isAr ? "حالات حرجة جداً (NEWS2 > 7)" : "Critical Accounts (NEWS2 > 7)"}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 font-black flex items-center justify-center font-mono">12</div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center group">
                      <div>
                         <p className="font-bold text-sm text-slate-800">الطوارئ (ER)</p>
                         <p className="text-[10px] text-slate-500 mt-1 font-semibold">{isAr ? "إشغال مرتفع (يحتاج دعم)" : "High Triage Occupancy"}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-black flex items-center justify-center font-mono">25</div>
                    </div>
                  </div>
                </div>

                {/* Predictive Bed Management Report */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                  <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                    <BedDouble className="w-5 h-5 text-indigo-500" />
                    {isAr ? "التنبؤ بالأسرة (Predictive Beds)" : "Predictive Bed Management"}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-center">
                         <div className="text-2xl font-black text-emerald-600 font-mono">8</div>
                         <div className="text-[10px] font-bold text-emerald-800">{isAr ? "أسرة شاغرة وجاهزة" : "Ready Empty Beds"}</div>
                      </div>
                      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-center">
                         <div className="text-2xl font-black text-amber-600 font-mono">3</div>
                         <div className="text-[10px] font-bold text-amber-800">{isAr ? "قيد التعقيم / التجهيز" : "Pending Terminal Cleaning"}</div>
                      </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-xs font-bold text-slate-700 mb-1">الخروج المتوقع من الشفت (Expected Discharges)</p>
                    <p className="text-xl font-black text-indigo-700 font-mono">14 <span className="text-[10px] text-slate-400 font-sans">مريض مقرر خروجهم اليوم</span></p>
                  </div>
                </div>

                {/* JCI Compliance KPI Report */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                  <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    {isAr ? "مؤشرات الأمان والجودة الدولية (JCI KPIs)" : "JCI Compliance KPIs"}
                  </h3>
                  <div className="space-y-4">
                     <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                           <span>تقييم مخاطر السقوط (Morse Fall Scale)</span>
                           <span>95% ملتزم</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{width: '95%'}}></div></div>
                     </div>
                     <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                           <span>تغيير قساطر البول (CAUTI Protocol)</span>
                           <span>70% ملتزم <span className="text-rose-500">(يوجد قصور)</span></span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-rose-500 h-1.5 rounded-full" style={{width: '70%'}}></div></div>
                     </div>
                     <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                           <span>إغلاق العهد والمخدرات بالنظام</span>
                           <span>100% ملتزم</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-indigo-500 h-1.5 rounded-full" style={{width: '100%'}}></div></div>
                     </div>
                  </div>
                </div>

                {/* High-Alert Overdue Report */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                  <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                    {isAr ? "الأدوية عالية الخطورة المتأخرة (High-Alert Overdue)" : "High-Alert Overdue Meds"}
                  </h3>
                  <div className="space-y-2">
                     <div className="flex justify-between items-center p-3 border border-rose-100 bg-rose-50/50 rounded-xl">
                       <div className="flex flex-col gap-0.5">
                         <span className="font-bold text-rose-900 text-xs">جرعة Insulin (IV Drip) متأخرة</span>
                         <span className="text-[10px] text-rose-700 font-mono">طوارئ - سرير 12</span>
                       </div>
                       <span className="px-2 py-0.5 bg-rose-200 text-rose-800 text-[9px] font-black rounded-sm animate-pulse">+45 دقيقة</span>
                     </div>
                     <div className="flex justify-between items-center p-3 border border-amber-100 bg-amber-50/50 rounded-xl">
                       <div className="flex flex-col gap-0.5">
                         <span className="font-bold text-amber-900 text-xs">Vancomycin Infusion</span>
                         <span className="text-[10px] text-amber-700 font-mono">عناية - سرير 2</span>
                       </div>
                       <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-[9px] font-black rounded-sm">+15 دقيقة</span>
                     </div>
                     <div className="text-center pt-2">
                       <button className="text-[10px] font-bold text-rose-600 hover:underline">{isAr ? "استدعاء تمريض الحالة للمساءلة" : "Call Assigned Nurse"}</button>
                     </div>
                  </div>
                </div>

              </div>
            )}

            {activeTab === "forms" && activeForm === "none" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in text-slate-800">
                 {/* Brand New Real Supervisor Daily Suite Card */}
                 <div className="bg-gradient-to-br from-pink-50 to-white p-5 rounded-2xl border-2 border-pink-200/80 shadow-md flex flex-col justify-between hover:shadow-lg transition hover:-translate-y-1 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 bg-pink-100 text-pink-700 font-extrabold text-[8px] font-mono px-2 py-0.5 rounded-bl uppercase">Official Form</div>
                    <div className="mb-4">
                      <div className="w-12 h-12 bg-pink-100 group-hover:bg-pink-200 text-pink-700 rounded-xl flex items-center justify-center mb-3 transition-colors">
                        <Sparkles className="w-6 h-6 animate-pulse" />
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 mb-1 flex items-center gap-1">
                        {isAr ? "شيت مرور ومستندات السوبرفايزر اليومي" : "Daily Supervisor Rounding Suite"}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                        {isAr ? "شامل: ورقة توزيع المهام المعتمدة، تعداد طاقم التمريض، حراك المرضى والأسرة والتدقيق الكامل لعيادات بهية." : "Verified copies: Assignment worksheet, beds census, nursing team count and diagnostic unit logs."}
                      </p>
                    </div>
                    <button 
                      onClick={() => setActiveForm("dailySuite")}
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white text-xs font-black py-2 rounded-lg shadow-sm transition flex justify-center items-center gap-1 cursor-pointer"
                    >
                      {isAr ? "افتح المستندات والتقارير الأربعة" : "Open 4-Form Suite"} <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                 </div>

                 <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition hover:-translate-y-1">
                    <div className="mb-4">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3">
                        <ClipboardCheck className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 mb-1">{isAr ? "تفتيش المرور الميداني" : "Rounding Checklist"}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold">{isAr ? "نظافة المحطة، هندام الموظفين، الالتزام بالـ ID، وتواجد خطط الرعاية." : "Station cleanliness, dress code, ID compliance, Care Plans."}</p>
                    </div>
                    <button 
                      onClick={() => setActiveForm("rounding")}
                      className="w-full bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 hover:text-indigo-700 text-slate-600 text-xs font-bold py-2 rounded-lg transition flex justify-center items-center gap-1"
                    >
                      {isAr ? "إبدأ التفتيش الآن" : "Start Rounding"} <ArrowRight className="w-3 h-3" />
                    </button>
                 </div>

                 <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition hover:-translate-y-1">
                    <div className="mb-4">
                      <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-3">
                        <Activity className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 mb-1">{isAr ? "تدقيق عربة الطوارئ" : "Crash Cart Audit"}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold">{isAr ? "جرد أدوية الصدمة، وتأكيد شحن الديفبريليتور (Defibrillator) اليومي." : "Daily Defib check and emergency drugs audit (Adrenaline, etc)."}</p>
                    </div>
                    <button className="w-full bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 hover:text-rose-700 text-slate-600 text-xs font-bold py-2 rounded-lg transition">فتح نموذج العهدة</button>
                 </div>

                 <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition hover:-translate-y-1">
                    <div className="mb-4">
                      <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 mb-1">{isAr ? "تقرير حدث عارض (OVR)" : "Adverse Event Report"}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold">{isAr ? "ملء بلاغ سقوط أو خطأ دوائي، تسجيل أسماء الشهود والتوقيت." : "Log falls, near-misses, witness accounts instantly for legal."}</p>
                    </div>
                    <button className="w-full bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 hover:text-amber-700 text-slate-600 text-xs font-bold py-2 rounded-lg transition">إبلاغ عن حدث جديد</button>
                 </div>

                 <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition hover:-translate-y-1">
                    <div className="mb-4">
                      <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mb-3">
                        <PenTool className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 mb-1">{isAr ? "تذكرة الهندسة الطبية" : "Biomedical Ticket"}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold">{isAr ? "الإبلاغ عن مضخة محاليل أو مونيتور معطل في قسمك للصيانة الفورية." : "Report broken Syringe Pumps or Monitors for instant repair."}</p>
                    </div>
                    <button className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-600 text-xs font-bold py-2 rounded-lg transition">فتح تذكرة صيانة</button>
                 </div>
              </div>
            )}

            {activeTab === "forms" && activeForm === "rounding" && (
               <div>
                  <button onClick={() => setActiveForm("none")} className="mb-4 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">&larr; {isAr ? "العودة للنماذج" : "Back to Forms"}</button>
                  <SupervisorRoundingAudit language={language} isAr={isAr} />
               </div>
            )}

            {activeTab === "forms" && activeForm === "dailySuite" && (
               <div>
                  <button onClick={() => setActiveForm("none")} className="mb-4 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">&larr; {isAr ? "العودة للنماذج" : "Back to Forms"}</button>
                  <SupervisorDailySuite language={language} />
               </div>
            )}

            {activeTab === "interactive" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                 
                 {/* Float Pool & Drag-and-Drop Assignment */}
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 mb-2 flex items-center gap-2">
                        <GitMerge className="w-5 h-5 text-indigo-500" />
                        {isAr ? "التوزيع السريع (Drag & Drop Float Pool)" : "Smart Float Assignment"}
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold mb-6">
                        {isAr ? "اسحب الممرض من قسم المستقر وقم بإدراجه في القسم العاجز لسد العجز." : "Drag available nurses to understaffed wards."}
                      </p>
                    </div>
                    
                    <div className="flex gap-4 p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50 mb-4 items-center">
                       <Users className="w-6 h-6 text-slate-400 shrink-0" />
                       <div className="flex-1">
                          <p className="font-bold text-sm text-slate-700">{isAr ? "سالمة محمد (قسم الجراحة)" : "Salma Mohamed (Surgical)"}</p>
                          <p className="text-[10px] font-mono text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded max-w-max mt-1">Available (Low Acuity)</p>
                       </div>
                       <p className="text-[10px] text-slate-400 font-bold border border-slate-200 bg-white px-2 py-1 rounded">:: Drag</p>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm mt-auto">
                       <h4 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2 mb-3">{isAr ? "قسم الطوارئ (عجز -2)" : "ER Drop Zone (Understaffed)"}</h4>
                       <div className="h-20 border-2 border-dashed border-rose-200 bg-rose-50 flex items-center justify-center rounded-lg text-rose-500 font-bold text-xs">
                          {isAr ? "اسقط اسم الممرض هنا لإعادة التعيين والتوجيه" : "Drop available nurse here to cover"}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                   {/* Code Activation Panel */}
                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-rose-500" />
                        {isAr ? "إطلاق نداءات الطوارئ الكبرى (Code Activation)" : "Code Activation Panel"}
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                         <button className="bg-rose-600 hover:bg-rose-700 border-b-4 border-rose-800 text-white font-black py-4 rounded-xl shadow-lg transition active:translate-y-1 active:border-b-0 flex flex-col items-center justify-center gap-1 group">
                            <Activity className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            <span className="text-sm tracking-widest">CODE BLUE</span>
                         </button>
                         <button className="bg-red-500 hover:bg-red-600 border-b-4 border-red-700 text-white font-black py-4 rounded-xl shadow-lg transition active:translate-y-1 active:border-b-0 flex flex-col items-center justify-center gap-1 group">
                            <Zap className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            <span className="text-sm tracking-widest">CODE RED</span>
                         </button>
                         <button className="bg-pink-500 hover:bg-pink-600 border-b-4 border-pink-700 text-white font-black py-4 rounded-xl shadow-lg transition active:translate-y-1 active:border-b-0 flex flex-col items-center justify-center gap-1 group">
                            <Users className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            <span className="text-sm tracking-widest">CODE PINK</span>
                         </button>
                         <button className="bg-amber-500 hover:bg-amber-600 border-b-4 border-amber-700 text-white font-black py-4 rounded-xl shadow-lg transition active:translate-y-1 active:border-b-0 flex flex-col items-center justify-center gap-1 group">
                            <ShieldAlert className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            <span className="text-sm tracking-widest">CODE YELLOW</span>
                         </button>
                      </div>
                   </div>

                   {/* Supervisor Shift Handover Log */}
                   <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 shadow-sm text-white">
                      <h3 className="text-sm font-black text-slate-100 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-400" />
                        {isAr ? "تسليم شفت السوبرفايزر (DN Shift Handover)" : "Supervisor Shift Handover Log"}
                      </h3>
                      <textarea 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-400 h-24 focus:outline-none focus:border-indigo-500 shadow-inner resize-none" 
                        placeholder={isAr ? "اكتب الملاحظات الإدارية الكبرى والمشاكل العالقة لتسليمها للسوبرفايزر القادم..." : "Log high-level operational issues and pending decisions for the next DN..."}
                      ></textarea>
                      <button className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-lg transition shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                        {isAr ? "توقيع وترحيل مفكرة القيادة" : "Sign & Lock Command Log"}
                      </button>
                   </div>
                 </div>
              </div>
            )}
         </div>

         {/* Right/Left Sidebar - Smart Notification Center */}
         <div className="w-full xl:w-[320px] shrink-0 xl:h-[calc(100vh-140px)] sticky top-6">
            <SmartNotificationCenter language={language} />
         </div>

      </div>
    </div>
  );
}

