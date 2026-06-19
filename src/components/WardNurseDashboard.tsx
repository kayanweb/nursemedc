import React, { useState } from "react";
import { BedDouble, Droplets, Droplet, Clock, CheckCircle2, XCircle, AlertCircle, ScanBarcode } from "lucide-react";

interface Props {
  language: "ar" | "en";
}

export default function WardNurseDashboard({ language }: Props) {
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState<"patients" | "emar" | "io">("emar");

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen font-sans text-right" dir={isAr ? "rtl" : "ltr"}>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border-r-4 border-r-sky-500 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <BedDouble className="h-7 w-7 text-sky-600" />
            {isAr ? "الأقسام الداخلية والتنويم (IPD Ward)" : "Inpatient Department (IPD)"}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {isAr ? "لوحة التمريض للداخلي، سجل إعطاء الدواء E-MAR، ومخطط السوائل I/O." : "Ward nurse dashboard, E-MAR medication tracking, and Fluid I/O chart."}
          </p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 flex-wrap">
          <button onClick={() => setActiveTab("patients")} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "patients" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <BedDouble className="w-4 h-4" /> {isAr ? "مرضى القسم" : "Ward List"}
          </button>
          <button onClick={() => setActiveTab("emar")} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "emar" ? "bg-white text-sky-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>
            <ScanBarcode className="w-4 h-4" /> E-MAR
          </button>
          <button onClick={() => setActiveTab("io")} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "io" ? "bg-white text-sky-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>
            <Droplets className="w-4 h-4" /> Intake/Output
          </button>
        </div>
      </div>

      {activeTab === "emar" && (
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-fade-in">
             <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                 <div>
                    <h3 className="font-black text-slate-800 flex items-center gap-2 mb-1">
                      <ScanBarcode className="w-6 h-6 text-sky-500" /> {isAr ? "سجل إعطاء الدواء الإلكتروني (E-MAR)" : "Electronic Medication Admin Record"}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold ml-8">Patient: MRN-2026-0041 (Bed 4) - سمير عبدالله حافظ</p>
                 </div>
                 <div className="flex gap-2">
                    <button className="bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 font-bold py-2 px-4 rounded-xl text-xs transition flex items-center gap-2">
                       <ScanBarcode className="w-4 h-4"/> Scan Patient ID
                    </button>
                 </div>
             </div>

             <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-sm">
                   <thead className="bg-slate-50 text-slate-600 border-b-2 border-slate-200">
                      <tr>
                         <th className="py-3 px-4 font-bold text-start w-1/3">{isAr ? "وصف الدواء والجرعة" : "Medication & Dose"}</th>
                         <th className="py-3 px-4 text-center font-bold border-l border-slate-200">08:00 AM</th>
                         <th className="py-3 px-4 text-center font-bold border-l border-slate-200">14:00 (2 PM)</th>
                         <th className="py-3 px-4 text-center font-bold border-l border-slate-200">20:00 (8 PM)</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      <tr>
                         <td className="py-4 px-4 bg-slate-50/50">
                            <p className="font-black text-slate-800">Ceftriaxone 1g</p>
                            <p className="text-[10px] text-slate-500 mt-1 font-mono">IV (Intravenous) - BID</p>
                         </td>
                         <td className="py-4 px-4 border-l border-slate-200 text-center align-middle">
                            <div className="inline-flex flex-col items-center justify-center p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                               <CheckCircle2 className="w-5 h-5 mb-1" />
                               <span className="text-[9px] font-bold">Given</span>
                               <span className="text-[8px] font-mono">08:05</span>
                            </div>
                         </td>
                         <td className="py-4 px-4 border-l border-slate-200 text-center align-middle bg-slate-50/30">
                            {/* Empty schedule block */}
                         </td>
                         <td className="py-4 px-4 border-l border-slate-200 text-center align-middle">
                            <button className="inline-flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-slate-300 text-slate-500 hover:bg-sky-50 md:min-w-[70px]">
                               <Clock className="w-5 h-5 mb-1" />
                               <span className="text-[9px] font-bold">Pending</span>
                            </button>
                         </td>
                      </tr>
                      <tr>
                         <td className="py-4 px-4 bg-slate-50/50">
                            <p className="font-black text-slate-800">Ketorolac 30mg Amp</p>
                            <p className="text-[10px] text-slate-500 mt-1 font-mono">IM - TID (As Needed / PRN)</p>
                         </td>
                         <td className="py-4 px-4 border-l border-slate-200 text-center align-middle">
                            <div className="inline-flex flex-col items-center justify-center p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 md:min-w-[70px]">
                               <AlertCircle className="w-5 h-5 mb-1" />
                               <span className="text-[9px] font-bold">Delayed</span>
                            </div>
                         </td>
                         <td className="py-4 px-4 border-l border-slate-200 text-center align-middle">
                            <div className="inline-flex flex-col items-center justify-center p-2 rounded-lg bg-slate-100 border border-slate-300 text-slate-500 md:min-w-[70px]">
                               <XCircle className="w-5 h-5 mb-1" />
                               <span className="text-[9px] font-bold">Skipped</span>
                            </div>
                         </td>
                         <td className="py-4 px-4 border-l border-slate-200 text-center align-middle">
                            <button className="inline-flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-slate-300 text-slate-500 hover:bg-sky-50 md:min-w-[70px]">
                               <Clock className="w-5 h-5 mb-1" />
                               <span className="text-[9px] font-bold">Pending</span>
                            </button>
                         </td>
                      </tr>
                   </tbody>
                </table>
             </div>
         </div>
      )}

      {activeTab === "io" && (
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-fade-in">
             <div className="mb-6 pb-4 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-black text-slate-800 flex items-center gap-2">
                    <Droplet className="w-5 h-5 text-sky-500" /> {isAr ? "مخطط السوائل (Intake / Output Chart)" : "Fluid Balance Chart"}
                 </h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                 <div>
                    <h4 className="text-emerald-700 font-bold mb-3 flex items-center gap-1"><Droplet className="w-4 h-4"/> Intake</h4>
                    <div className="grid grid-cols-3 gap-2">
                       <input type="number" placeholder="IV Fluids (ml)" className="border border-slate-300 rounded p-2 text-xs" />
                       <input type="number" placeholder="Oral / Oral (ml)" className="border border-slate-300 rounded p-2 text-xs" />
                       <button className="bg-emerald-100 text-emerald-800 font-bold text-xs rounded">+ Add Intake</button>
                    </div>
                 </div>
                 <div>
                    <h4 className="text-amber-700 font-bold mb-3 flex items-center gap-1"><Droplet className="w-4 h-4"/> Output</h4>
                    <div className="grid grid-cols-3 gap-2">
                       <input type="number" placeholder="Urine (ml)" className="border border-slate-300 rounded p-2 text-xs" />
                       <input type="number" placeholder="Drains (ml)" className="border border-slate-300 rounded p-2 text-xs" />
                       <button className="bg-amber-100 text-amber-800 font-bold text-xs rounded">+ Add Output</button>
                    </div>
                 </div>
             </div>

             <div className="bg-slate-800 p-4 rounded-xl flex items-center justify-between text-white">
                 <span className="font-bold">24-Hour Net Fluid Balance</span>
                 <span className="font-mono text-xl font-black text-emerald-400">+ 250 ml (Positive)</span>
             </div>
         </div>
      )}
      
      {activeTab === "patients" && (
         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-fade-in">
            {[1,2,3,4,5].map(bed => (
              <div key={bed} onClick={() => setActiveTab("emar")} className="bg-white border-2 border-sky-100 hover:border-sky-400 cursor-pointer p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition shadow-sm">
                 <div className="w-full flex justify-between items-center mb-2">
                   <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                   <span className="text-[10px] font-black text-slate-400">BED {bed}</span>
                 </div>
                 <User className="w-8 h-8 text-slate-300" />
                 <span className="font-bold text-sm text-slate-800 mt-2">عمر سمير</span>
                 <span className="text-[10px] font-mono bg-slate-100 px-2 rounded">MRN-100{bed}</span>
              </div>
            ))}
         </div>
      )}

    </div>
  );
}

function User({ className }: { className: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
