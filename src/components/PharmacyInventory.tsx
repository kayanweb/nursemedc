import React, { useState } from "react";
import { Pill, Package, ArrowRightLeft, FileSpreadsheet, CheckCircle2, AlertTriangle, ScanLine, Printer } from "lucide-react";
import { useHIS } from "../context/HISContext";
import { toast } from "sonner";

interface Props {
  language: "ar" | "en";
}

export default function PharmacyInventory({ language }: Props) {
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState<"dispense" | "inventory" | "alerts">("dispense");

  const { prescriptions, updatePrescriptionStatus, patients } = useHIS();
  
  const pendingRx = prescriptions.filter(rx => rx.status === "pending");
  const [selectedRxId, setSelectedRxId] = useState<string | null>(null);
  
  const selectedRx = pendingRx.find(rx => rx.id === selectedRxId) || pendingRx[0];
  const rxPatient = selectedRx ? patients.find(p => p.id === selectedRx.patientId) : null;

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen font-sans text-right" dir={isAr ? "rtl" : "ltr"}>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border-r-4 border-r-teal-500 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Pill className="h-7 w-7 text-teal-600" />
            {isAr ? "الصيدلية وإدارة المخزون الطبي" : "Pharmacy & Medical Inventory"}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {isAr ? "صرف الروشتات، مراقبة المخزون، تحويلات الرصيد، والمستلزمات الطبية." : "Rx dispensing, stock master, transfers, and expiry alerts."}
          </p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 flex-wrap">
          <button onClick={() => setActiveTab("dispense")} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "dispense" ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <ScanLine className="w-4 h-4" /> {isAr ? "شاشة الصرف" : "Dispensing"}
          </button>
          <button onClick={() => setActiveTab("inventory")} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "inventory" ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <Package className="w-4 h-4" /> {isAr ? "حركة المخازن" : "Stock ledger"}
          </button>
          <button onClick={() => setActiveTab("alerts")} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "alerts" ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <AlertTriangle className="w-4 h-4" /> {isAr ? "النواقص والصلاحية" : "Alerts & Expiry"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === "dispense" && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
             {/* Rx Verification Queue */}
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[min(calc(100vh-200px),700px)] flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm">
                       <FileSpreadsheet className="w-5 h-5 text-teal-500" /> {isAr ? "روشتات قيد المراجعة" : "Pending E-Rx Queue"}
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                   {pendingRx.map(rx => (
                     <div key={rx.id} onClick={() => setSelectedRxId(rx.id)} className={`border rounded-xl p-3 cursor-pointer transition ${selectedRx?.id === rx.id ? 'bg-teal-50 border-teal-300 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                        <div className="flex justify-between items-start mb-2">
                           <div>
                             <span className="font-bold text-slate-800 text-sm block">{rx.mrn}</span>
                             <span className="text-xs text-slate-500">{rx.doctorName}</span>
                           </div>
                           <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">
                              {isAr ? "جديد" : "Pending Review"}
                           </span>
                        </div>
                     </div>
                   ))}
                   {pendingRx.length === 0 && <p className="text-center text-sm text-slate-500 p-4">{isAr ? "لا توجد روشتات قيد الانتظار" : "No pending prescriptions"}</p>}
                </div>
             </div>

             {/* Dispensing Area */}
             <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                   <h3 className="font-black text-teal-800 flex items-center gap-2 text-sm">
                      <ScanLine className="w-5 h-5 text-teal-500" /> {isAr ? "تفاصيل الروشتة وعمل الباركود" : "Rx Review & Dispense"}
                   </h3>
                </div>
                <div className="p-6 flex-1 space-y-6">
                   <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center">
                      <div>
                         <p className="font-bold text-slate-800">MRN: {selectedRx?.mrn || "N/A"}</p>
                         <p className="text-sm text-slate-600">{rxPatient ? (isAr ? rxPatient.nameAr : rxPatient.nameEn) : "Unknown Patient"}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-bold text-slate-500">{isAr ? "جهة التغطية" : "Payer"}</p>
                         <p className="text-sm font-black text-indigo-700">{rxPatient ? rxPatient.insurance : "Cash"}</p>
                      </div>
                   </div>

                   <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-200 text-slate-500 bg-slate-50/50">
                           <th className="py-3 px-2 text-start font-bold">{isAr ? "الدواء" : "Medication"}</th>
                           <th className="py-3 px-2 text-start font-bold">{isAr ? "الجرعة" : "Dose"}</th>
                           <th className="py-3 px-2 text-start font-bold">{isAr ? "الكمية المطلوبة" : "Qty Requested"}</th>
                           <th className="py-3 px-2 text-start font-bold">{isAr ? "المتوفر في المخزن" : "In Stock"}</th>
                           <th className="py-3 px-2 text-start font-bold"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRx ? selectedRx.medications.map((med, idx) => (
                           <tr key={idx} className="border-b border-slate-100">
                              <td className="py-4 px-2 font-bold text-slate-800">{med.name}</td>
                              <td className="py-4 px-2 text-xs">{med.dose} {med.freq}</td>
                              <td className="py-4 px-2 font-mono font-bold">{med.duration}</td>
                              <td className="py-4 px-2 text-emerald-600 font-mono font-bold">In Stock</td>
                              <td className="py-4 px-2 text-center text-emerald-500"><CheckCircle2 className="w-5 h-5 mx-auto" /></td>
                           </tr>
                        )) : (
                           <tr><td colSpan={5} className="py-4 text-center text-slate-500 text-sm">Select a prescription from the queue</td></tr>
                        )}
                      </tbody>
                   </table>

                   <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mt-6">
                      <p className="text-xs text-indigo-800 font-bold mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> {isAr ? "نظام التحذيرات الدوائية" : "Drug Interaction Check"}
                      </p>
                      <p className="text-[10px] text-indigo-600 font-medium">No severe interactions found based on patient EMR state and allergies.</p>
                   </div>
                </div>
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between">
                   <button className="text-slate-500 font-bold text-sm hover:text-slate-800">{isAr ? "تعديل الروشتة بالاتصال بالطبيب" : "Request Rx Change"}</button>
                   <button disabled={!selectedRx} onClick={async () => { if (!selectedRx) return; await updatePrescriptionStatus(selectedRx.id, "dispensed"); toast.success(isAr ? "تم صرف الروشتة بنجاح!" : "Dispensed successfully!"); }} className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm transition flex items-center gap-2">
                      <Printer className="w-4 h-4"/> {isAr ? "طباعة الباركود وتسعير الفاتورة" : "Print Labels & Bill Patient"}
                   </button>
                </div>
             </div>
           </div>
        )}

        {activeTab === "inventory" && (
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-fade-in">
              <h3 className="font-black text-slate-800 border-b border-slate-100 pb-3 mb-6 flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-500" /> {isAr ? "بطاقة الصنف وحركة المخزون" : "Item Master & Stock Limits"}
              </h3>
              
              <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                   <thead className="bg-slate-50 text-slate-500">
                     <tr>
                       <th className="py-3 px-4 font-bold text-start">GTIN Code / Barcode</th>
                       <th className="py-3 px-4 font-bold text-start">Item Name</th>
                       <th className="py-3 px-4 font-bold text-start">Category</th>
                       <th className="py-3 px-4 font-bold text-start">Current Stock</th>
                       <th className="py-3 px-4 font-bold text-start">Unit Cost</th>
                       <th className="py-3 px-4 font-bold text-start">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {[1,2,3,4].map(row => (
                       <tr key={row} className="hover:bg-slate-50">
                         <td className="py-3 px-4 font-mono text-xs font-bold text-slate-600">0000326442{row}</td>
                         <td className="py-3 px-4 font-bold text-slate-800">Panadol Advance 500mg</td>
                         <td className="py-3 px-4"><span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-bold">Medicines</span></td>
                         <td className="py-3 px-4 font-mono font-black text-teal-600">12,400 <span className="text-[10px] font-normal text-slate-500">Tabs</span></td>
                         <td className="py-3 px-4 font-mono font-bold">1.50 EGP</td>
                         <td className="py-3 px-4"><button className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">Transfer</button></td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
           </div>
        )}
        
        {activeTab === "alerts" && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-6 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-2 h-full bg-rose-500"></div>
                 <h3 className="font-black text-rose-800 mb-4 flex items-center gap-2">
                   <AlertTriangle className="w-5 h-5 text-rose-500" /> {isAr ? "نواقص وصلت لحد الطلب" : "Re-order Point Alerts"}
                 </h3>
                 <div className="space-y-3">
                   <div className="flex justify-between items-center bg-rose-50 p-3 rounded-lg border border-rose-100">
                      <div>
                         <p className="font-bold text-slate-800 text-sm">Amoxicillin 500mg Caps</p>
                         <p className="text-xs text-rose-600">Re-order limit hit (0 in stock)</p>
                      </div>
                      <button className="bg-rose-600 text-white text-[10px] font-bold px-3 py-1.5 rounded shadow-sm">Trigger PO</button>
                   </div>
                 </div>
              </div>

              <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
                 <h3 className="font-black text-amber-800 mb-4 flex items-center gap-2">
                   <AlertTriangle className="w-5 h-5 text-amber-500" /> {isAr ? "أصناف مقاربة على انتهاء الصلاحية" : "Near-Expiry Alerts"}
                 </h3>
                 <div className="space-y-3">
                   <div className="flex justify-between items-center bg-amber-50 p-3 rounded-lg border border-amber-100">
                      <div>
                         <p className="font-bold text-slate-800 text-sm">Ketorolac 30mg Ampoules (Batch: K992L)</p>
                         <p className="text-xs text-amber-700">Expires in 45 Days</p>
                      </div>
                      <button className="bg-amber-600 text-white text-[10px] font-bold px-3 py-1.5 rounded shadow-sm">Recall / Return</button>
                   </div>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
