import React, { useState } from "react";
import { Scissors, Activity, Users, Clock, CheckSquare, ShieldCheck, HeartPulse } from "lucide-react";

interface Props {
  language: "ar" | "en";
}

export default function OperatingTheaterBoard({ language }: Props) {
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState<"schedule" | "intraop" | "pacu">("schedule");

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen font-sans text-right" dir={isAr ? "rtl" : "ltr"}>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border-r-4 border-r-rose-500 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Scissors className="h-7 w-7 text-rose-600" />
            {isAr ? "إدارة عمليات الجراحة (Operating Theater)" : "Operating Theater (OT)"}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {isAr ? "جدولة الغرف، ملف العملية الجراحي، وتقرير الإفاقة (PACU)." : "OT Scheduling, Intra-Op Record, and PACU documentation."}
          </p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 flex-wrap">
          <button onClick={() => setActiveTab("schedule")} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "schedule" ? "bg-white text-rose-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <Clock className="w-4 h-4" /> {isAr ? "جدولة العمليات" : "OT Schedule"}
          </button>
          <button onClick={() => setActiveTab("intraop")} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "intraop" ? "bg-white text-rose-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>
            <ShieldCheck className="w-4 h-4" /> {isAr ? "ملف الجراحة الداخلي" : "Intra-Op Record"}
          </button>
          <button onClick={() => setActiveTab("pacu")} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "pacu" ? "bg-white text-rose-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>
            <HeartPulse className="w-4 h-4" /> {isAr ? "الإفاقة (PACU)" : "PACU Chart"}
          </button>
        </div>
      </div>

      {activeTab === "schedule" && (
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[1,2,3].map(room => (
                    <div key={room} className="border border-slate-200 rounded-xl overflow-hidden">
                       <div className="bg-slate-800 text-white p-3 flex justify-between items-center">
                          <span className="font-black text-sm">OR Room 0{room}</span>
                          <span className="text-[10px] bg-emerald-500 px-2 py-0.5 rounded font-bold">ACTIVE</span>
                       </div>
                       <div className="p-4 space-y-3">
                          <div className="bg-rose-50 border border-rose-100 rounded-lg p-3">
                             <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-black text-rose-800">08:00 - 11:30 AM</span>
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-200 px-1 rounded">In Progress</span>
                             </div>
                             <p className="font-bold text-slate-800 text-sm">Appendectomy (Laparoscopic)</p>
                             <p className="text-[10px] text-slate-500 mt-1">Surgeon: Dr. Khalid | Anes: Dr. Hany</p>
                             <p className="text-[10px] text-slate-500 font-mono mt-1">MRN-2026-0041 • 35Y • Male</p>
                          </div>
                          {room === 1 && (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                               <div className="flex justify-between items-start mb-2">
                                  <span className="text-xs font-black text-slate-600">12:30 - 15:00 PM</span>
                                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-1 rounded">Scheduled</span>
                               </div>
                               <p className="font-bold text-slate-800 text-sm">Cholecystectomy</p>
                               <p className="text-[10px] text-slate-500 mt-1">Surgeon: Dr. Tarek | Anes: Dr. Samy</p>
                            </div>
                          )}
                       </div>
                    </div>
                 ))}
             </div>
         </div>
      )}

      {activeTab === "intraop" && (
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-fade-in flex flex-col md:flex-row gap-8">
             <div className="flex-1 space-y-6">
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex items-center justify-between">
                   <div>
                      <p className="text-xs font-bold text-rose-800">MRN-2026-0041 • Appendectomy</p>
                      <h2 className="text-xl font-black text-rose-900 mt-1">{isAr ? "ملف العملية (Intra-Operative Record)" : "Intra-Op Master Record"}</h2>
                   </div>
                   <div className="text-right">
                      <span className="block text-[10px] text-rose-700 font-bold mb-1">Elapsed Time</span>
                      <span className="text-2xl font-mono font-black text-rose-600">01:45:22</span>
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                   <div className="border border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-emerald-500 transition">
                      <Clock className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-600">Anesthesia Start</p>
                      <p className="text-sm font-mono font-black text-slate-800 mt-1">08:15 AM</p>
                   </div>
                   <div className="border border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-rose-500 transition">
                      <Scissors className="w-6 h-6 text-rose-500 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-600">Surgical Incision</p>
                      <p className="text-sm font-mono font-black text-slate-800 mt-1">08:45 AM</p>
                   </div>
                   <div className="border border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-500 transition">
                      <CheckSquare className="w-6 h-6 text-slate-400 mx-auto mb-2 text-indigo-500" />
                      <p className="text-xs font-bold text-slate-600">Surgery End</p>
                      <button className="mt-1 text-[10px] bg-slate-100 hover:bg-slate-200 font-bold px-3 py-1 rounded w-full">Record Time</button>
                   </div>
                </div>
             </div>

             <div className="w-full md:w-80 border-l border-slate-200 pl-8 space-y-4">
                <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                   <ShieldCheck className="w-4 h-4 text-emerald-500" /> {isAr ? "قائمة أمان الجراحة (WHO Checklist)" : "WHO Safety Checklist"}
                </h3>
                <div className="space-y-3">
                   <label className="flex items-start gap-2 text-xs font-bold text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                      <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" />
                      Patient Identity, Site, and Procedure Verified
                   </label>
                   <label className="flex items-start gap-2 text-xs font-bold text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                      <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" />
                      Allergies checked (Sever Penicillin Alert active!)
                   </label>
                   <label className="flex items-start gap-2 text-xs font-bold text-slate-700 bg-white p-2 rounded border border-rose-300">
                      <input type="checkbox" className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" />
                      Sponge and Instrument counts correct (Closing phase)
                   </label>
                </div>
                <button className="w-full bg-slate-800 text-white text-xs font-bold py-2 rounded-lg opacity-50 cursor-not-allowed">
                   {isAr ? "إغلاق ملف العملية (يتطلب التأكيد)" : "Lock & Close Operation"}
                </button>
             </div>
         </div>
      )}

      {activeTab === "pacu" && (
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-fade-in text-center py-20">
            <HeartPulse className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-black text-slate-600">{isAr ? "تقرير الملاحظة ما بعد الإفاقة (PACU)" : "Post-Anesthesia Care Unit (PACU)"}</h2>
            <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">{isAr ? "جدول لتسجيل علامات الإفاقة، النقاط الطبية (Aldrete Score)، والإذن بالنقل للقسم الداخلي." : "Record vitals, Aldrete scoring, and discharge authorization to ward."}</p>
         </div>
      )}
    </div>
  );
}
