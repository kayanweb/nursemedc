import React from "react";
import { AlertCircle, AlertTriangle, Info, X } from "lucide-react";

interface Props {
  language: "ar" | "en";
}

export default function SmartNotificationCenter({ language }: Props) {
  const isAr = language === "ar";
  
  return (
    <div className="bg-slate-900 rounded-2xl p-4 text-white shadow-xl flex flex-col h-full border border-slate-700">
      <h3 className="font-black text-sm mb-4 flex items-center gap-2 border-b border-slate-700 pb-3">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
        </div>
        {isAr ? "مركز التنبيهات الذكي (Live Alerts)" : "Intelligent Notification Center"}
      </h3>
      
      <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
        {/* Red Alert */}
        <div className="bg-rose-950/50 border border-rose-800 rounded-xl p-3 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
          <div className="flex gap-3">
            <div className="mt-0.5 bg-rose-900/50 p-1.5 rounded-lg shrink-0 h-min">
              <AlertCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-300 flex items-center gap-2">
                {isAr ? "نداء كود الطوارئ (Code Blue)" : "Code Blue Activation"}
                <span className="text-[9px] bg-rose-800 text-rose-100 px-1.5 py-0.5 rounded font-mono animate-pulse">LIVE</span>
              </h4>
              <p className="text-[10px] text-rose-200/70 mt-1 font-semibold leading-relaxed">
                {isAr ? "قسم العناية المركزة (ICU) - السرير 4، توقف بالقلب. الاستجابة جارية." : "ICU - Bed 4, Cardiac arrest. Code team responding."}
              </p>
              <div className="text-[9px] font-mono text-rose-400/50 mt-2">NEWS2 Score &gt; 7</div>
            </div>
          </div>
        </div>

        {/* Yellow Alert */}
        <div className="bg-amber-950/50 border border-amber-800/50 rounded-xl p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <div className="flex gap-3">
            <div className="mt-0.5 bg-amber-900/50 p-1.5 rounded-lg shrink-0 h-min">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-300">
                {isAr ? "تنبيه تشغيلي تحذيري" : "Operational Warning"}
              </h4>
              <p className="text-[10px] text-amber-200/70 mt-1 font-semibold leading-relaxed">
                {isAr ? "قسم الطوارئ يعاني من عجز تمريضي (Understaffed) مقارنة بعدد المرضى." : "ER is understaffed based on current patient acuity."}
              </p>
              <p className="text-[10px] text-amber-300 mt-1 font-semibold leading-relaxed">
                {isAr ? "عهدة المخدرات لم يتم تقفيلها في قسم الباطنة." : "Narcotics inventory not closed in Medical Ward."}
              </p>
            </div>
          </div>
        </div>

        {/* Blue Alert */}
        <div className="bg-sky-950/50 border border-sky-800/50 rounded-xl p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-sky-500"></div>
          <div className="flex gap-3">
            <div className="mt-0.5 bg-sky-900/50 p-1.5 rounded-lg shrink-0 h-min">
              <Info className="w-4 h-4 text-sky-400" />
            </div>
            <div className="w-full">
              <h4 className="text-xs font-bold text-sky-300">
                {isAr ? "طلبات النقل المعلقة" : "Pending Transfer Request"}
              </h4>
              <p className="text-[10px] text-sky-200/70 mt-1 font-semibold">
                {isAr ? "نقل المريض من الطوارئ إلى غرفة 312 بالباطنة، بانتظار موافقتك." : "Transfer from ER to Ward 312 pending your approval."}
              </p>
              <div className="mt-2 flex gap-2 w-full">
                  <button className="flex-1 bg-sky-600 hover:bg-sky-500 text-white text-[9px] font-bold py-1.5 rounded transition">
                     {isAr ? "موافقة فورية" : "Approve Now"}
                  </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
