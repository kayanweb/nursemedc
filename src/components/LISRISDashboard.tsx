import React, { useState } from "react";
import { Microscope, Dna, Activity, Search, AlertCircle, HardDrive, TestTube, CheckCircle2 } from "lucide-react";

interface Props {
  language: "ar" | "en";
}

export default function LISRISDashboard({ language }: Props) {
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState<"lis" | "ris">("lis");

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen font-sans text-right" dir={isAr ? "rtl" : "ltr"}>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border-r-4 border-r-purple-500 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Microscope className="h-7 w-7 text-purple-600" />
            {isAr ? "الأنظمة الطبية المساعدة (Ancillary LIS & RIS)" : "Ancillary Systems (LIS / RIS / PACS)"}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {isAr ? "المختبر الطبي (LIS)، الأشعة وربط أجهزة الـ PACS." : "Laboratory Information System, Radiology, and Analyzer Interfaces."}
          </p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 flex-wrap">
          <button onClick={() => setActiveTab("lis")} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "lis" ? "bg-white text-purple-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>
            <TestTube className="w-4 h-4" /> {isAr ? "المعمل الكيميائي (LIS)" : "Laboratory (LIS)"}
          </button>
          <button onClick={() => setActiveTab("ris")} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "ris" ? "bg-white text-purple-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>
            <HardDrive className="w-4 h-4" /> {isAr ? "الأشعة والـ PACS (RIS)" : "Radiology (RIS)"}
          </button>
        </div>
      </div>

      {activeTab === "lis" && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* LIS Queue */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[min(calc(100vh-200px),700px)] flex flex-col">
               <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                   <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm">
                      <TestTube className="w-5 h-5 text-purple-500" /> {isAr ? "استقبال عينات المعمل" : "Order Receipt & Barcoding"}
                   </h3>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="border rounded-xl p-3 cursor-pointer bg-purple-50 border-purple-300 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-slate-800 text-sm block">MRN-2026-0041 (CBC)</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-xs text-slate-500">Dr. Ahmed (OPD)</span>
                         <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">Sample Collected</span>
                      </div>
                  </div>
                  {[2, 3].map(idx => (
                    <div key={idx} className="border rounded-xl p-3 cursor-pointer bg-white border-slate-200 hover:border-slate-300">
                        <div className="flex justify-between items-start mb-2">
                           <span className="font-bold text-slate-800 text-sm block">MRN-2026-004{idx} (Liver Funct.)</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-xs text-slate-500">IPD (Ward 3)</span>
                           <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded">Pending Draw</span>
                        </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Verification and Interfacing */}
            <div className="lg:col-span-2 space-y-6">
                {/* Analyzer Link */}
                <div className="bg-slate-800 rounded-2xl shadow-sm p-6 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500 opacity-20 rounded-bl-full"></div>
                   <div className="flex items-center gap-3 mb-2">
                      <Dna className="w-5 h-5 text-purple-400" />
                      <h3 className="font-black text-white text-sm">Sysmex XN-1000 Hematology Analyzer (HL7 Gateway)</h3>
                   </div>
                   <p className="text-xs text-slate-400 font-mono">STATUS: CONNECTED • AUTO-VERIFY: OFF</p>
                   <div className="mt-4 flex gap-2">
                      <button className="bg-slate-700 border border-slate-600 hover:bg-slate-600 text-white text-xs font-bold py-2 px-4 rounded transition">Fetch Last Result</button>
                      <button className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 px-4 rounded transition">Transmit to Analyzer</button>
                   </div>
                </div>

                {/* Verification View */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                   <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                      <h3 className="font-black text-purple-800 flex items-center gap-2 text-sm">
                         <CheckCircle2 className="w-5 h-5 text-purple-500" /> {isAr ? "مراجعة واعتماد النتائج" : "Results Verification"}
                      </h3>
                      <span className="text-xs font-bold text-slate-600">Sample: #SMP.2606.10A</span>
                   </div>
                   
                   <table className="w-full text-sm">
                      <thead className="bg-slate-100 text-slate-600 border-y border-slate-200">
                        <tr>
                          <th className="py-2 px-4 font-bold text-start">Test Name</th>
                          <th className="py-2 px-4 font-bold text-start">Result</th>
                          <th className="py-2 px-4 font-bold text-start">Unit</th>
                          <th className="py-2 px-4 font-bold text-start">Ref. Range</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-xs">
                        <tr>
                          <td className="py-3 px-4 font-bold text-slate-700">WBC (White Blood Cells)</td>
                          <td className="py-3 px-4 text-emerald-600 font-bold">7.2</td>
                          <td className="py-3 px-4 text-slate-400">10^9/L</td>
                          <td className="py-3 px-4 text-slate-500">4.5 - 11.0</td>
                        </tr>
                        <tr className="bg-rose-50/50">
                          <td className="py-3 px-4 font-bold text-slate-700 flex items-center gap-1">
                             <AlertCircle className="w-3 h-3 text-rose-500"/> Hemoglobin (HGB)
                          </td>
                          <td className="py-3 px-4 text-rose-600 font-black animate-pulse bg-rose-100 inline-block px-1 rounded mt-2 ml-4">9.5</td>
                          <td className="py-3 px-4 text-slate-400">g/dL</td>
                          <td className="py-3 px-4 text-slate-500">13.5 - 17.5 <span className="text-[10px] text-rose-600 font-bold ml-1">L</span></td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-slate-700">Platelet Count</td>
                          <td className="py-3 px-4 text-emerald-600 font-bold">250</td>
                          <td className="py-3 px-4 text-slate-400">10^9/L</td>
                          <td className="py-3 px-4 text-slate-500">150 - 450</td>
                        </tr>
                      </tbody>
                   </table>

                   <div className="p-4 bg-slate-50 border-t border-slate-200 mt-auto flex justify-between items-center">
                      <p className="text-[10px] text-slate-500 font-semibold max-w-sm">
                         {isAr ? "سيؤدي الاعتماد إلى ظهور النتيجة فوراً في شاشة الطبيب EMR. القيم الحرجة تمييز باللون الأحمر أوتوماتيكياً." : "Sign-off makes results immediately visible in physician EMR. Critical values auto-flagged."}
                      </p>
                      <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-xl shadow-sm transition">
                         Approve & Verify Results
                      </button>
                   </div>
                </div>
            </div>
         </div>
      )}

      {activeTab === "ris" && (
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-fade-in flex flex-col items-center justify-center min-h-[500px]">
             <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center border-2 border-dashed border-slate-300 mb-6">
                <HardDrive className="w-10 h-10 text-slate-400" />
             </div>
             <h2 className="text-xl font-black text-slate-800 mb-2">{isAr ? "نظام أرشفة الصور الإشعاعية PACS" : "PACS & RIS Linkage"}</h2>
             <p className="text-slate-500 text-center max-w-lg mb-6">
                {isAr 
                  ? "محاكي لوحدة كتابة التقارير الإشعاعية (Dictation). يتم في النظام الحقيقي تضمين رابط مشفر لفتح عارض DICOM الخاص بصور الـ MRI / CT ضمن شبكة المستشفى." 
                  : "Placeholder for Radiology dictation UI. In a production HIS, an encrypted HL7 link launches the external DICOM Viewer for MRI/CT scans directly from this dashboard."}
             </p>
             <button className="bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-bold py-2.5 px-6 rounded-xl transition flex items-center gap-2">
                <Search className="w-4 h-4"/> Load DICOM Study (Demo)
             </button>
         </div>
      )}
    </div>
  );
}
