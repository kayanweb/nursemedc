import React, { useState } from "react";
import { Receipt, FileCheck, DollarSign, Wallet, FileSpreadsheet, Send, Search } from "lucide-react";

interface Props {
  language: "ar" | "en";
}

export default function BillingInsurance({ language }: Props) {
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState<"ledger" | "claims">("ledger");

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen font-sans text-right" dir={isAr ? "rtl" : "ltr"}>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border-r-4 border-r-amber-500 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Receipt className="h-7 w-7 text-amber-600" />
            {isAr ? "الحسابات، الفواتير والمطالبات (Billing & Insurance)" : "Billing & Insurance Claims"}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {isAr ? "الدائرة المالية للمرضى، الدفع والتحصيل، ومطالبات شركات التأمين." : "Patient ledgers, cashier, and automated insurance claims."}
          </p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 flex-wrap">
          <button onClick={() => setActiveTab("ledger")} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "ledger" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <Wallet className="w-4 h-4" /> {isAr ? "فاتورة المريض والخزينة" : "Patient Ledger"}
          </button>
          <button onClick={() => setActiveTab("claims")} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "claims" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <FileCheck className="w-4 h-4" /> {isAr ? "مطالبات التأمين" : "Insurance Claims"}
          </button>
        </div>
      </div>

      {activeTab === "ledger" && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[min(calc(100vh-200px),700px)] flex flex-col">
               <div className="p-4 border-b border-slate-200 bg-slate-50 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-6 top-7" />
                  <input type="text" placeholder={isAr ? "بحث برقم الملف المستحق" : "Search AR / Due Invoices"} className="w-full bg-white border border-slate-300 rounded-lg py-2 pl-4 pr-8 text-xs outline-none focus:border-amber-500" />
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {[1, 2, 3].map(idx => (
                    <div key={idx} className={`border rounded-xl p-3 cursor-pointer transition ${idx === 1 ? 'bg-amber-50 border-amber-300 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                       <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-bold text-slate-800 text-sm block">MRN-2026-0041</span>
                            <span className="text-xs text-slate-500">سمير عبدالله حافظ</span>
                          </div>
                          <span className="text-xs font-black font-mono text-rose-600 block text-left">
                             850 EGP<br/>
                             <span className="text-[9px] font-normal text-slate-400">{isAr ? "رصيد مستحق" : "Due Balance"}</span>
                          </span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
               <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <h3 className="font-black text-amber-800 flex items-center gap-2 text-sm">
                     <FileSpreadsheet className="w-5 h-5 text-amber-500" /> {isAr ? "كشف حساب الخدمات المجمّع (Charges Aggregator)" : "Consolidated Charges Ledger"}
                  </h3>
               </div>
               
               <div className="p-0 border-b border-slate-100 flex-1 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 border-b-2 border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-bold text-start">{isAr ? "التاريخ والمصدر" : "Date / Source"}</th>
                        <th className="py-3 px-4 font-bold text-start">{isAr ? "الخدمة المضافة" : "Charged Service"}</th>
                        <th className="py-3 px-4 font-bold text-center">Qty</th>
                        <th className="py-3 px-4 font-bold text-start">{isAr ? "تغطية تأمين" : "Insurance Cover"}</th>
                        <th className="py-3 px-4 font-bold text-end">{isAr ? "على المريض" : "Patient Portion"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                         <td className="py-4 px-4">
                           <span className="block font-mono text-xs text-slate-500">Today, 09:00 AM</span>
                           <span className="inline-block bg-slate-100 text-[10px] font-bold px-1 rounded text-slate-600">OPD Clinic</span>
                         </td>
                         <td className="py-4 px-4 font-bold text-slate-800 text-xs">Internal Medicine Consultation (Dr. Ahmed)</td>
                         <td className="py-4 px-4 text-center font-mono text-xs">1</td>
                         <td className="py-4 px-4 text-xs font-mono text-slate-400">0.00 EGP</td>
                         <td className="py-4 px-4 text-end font-mono font-black text-slate-800">300.00 EGP</td>
                      </tr>
                      <tr>
                         <td className="py-4 px-4">
                           <span className="block font-mono text-xs text-slate-500">Today, 10:15 AM</span>
                           <span className="inline-block bg-slate-100 text-[10px] font-bold px-1 rounded text-slate-600">Laboratory LIS</span>
                         </td>
                         <td className="py-4 px-4 font-bold text-slate-800 text-xs">Complete Blood Count (CBC)</td>
                         <td className="py-4 px-4 text-center font-mono text-xs">1</td>
                         <td className="py-4 px-4 text-xs font-mono text-slate-400">0.00 EGP</td>
                         <td className="py-4 px-4 text-end font-mono font-black text-slate-800">150.00 EGP</td>
                      </tr>
                      <tr>
                         <td className="py-4 px-4">
                           <span className="block font-mono text-xs text-slate-500">Today, 11:30 AM</span>
                           <span className="inline-block bg-slate-100 text-[10px] font-bold px-1 rounded text-slate-600">Pharmacy HIS</span>
                         </td>
                         <td className="py-4 px-4 font-bold text-slate-800 text-xs text-rose-700">Glucophage 1000mg Tablet (Rx)</td>
                         <td className="py-4 px-4 text-center font-mono text-xs">2 Packs</td>
                         <td className="py-4 px-4 text-xs font-mono text-slate-400">0.00 EGP</td>
                         <td className="py-4 px-4 text-end font-mono font-black text-slate-800">400.00 EGP</td>
                      </tr>
                    </tbody>
                  </table>
               </div>

               <div className="p-6 bg-amber-50 shrink-0">
                  <div className="flex justify-between items-center mb-6">
                     <div>
                        <p className="text-sm font-bold text-slate-600">{isAr ? "إجمالي المطالبة النقدية للعيادة" : "Total Cash Due"}</p>
                     </div>
                     <div className="text-3xl font-black font-mono text-amber-700 text-end">
                        850.00 <span className="text-sm">EGP</span>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <select className="border border-slate-300 rounded-xl p-3 outline-none focus:border-amber-500 bg-white shadow-sm font-bold text-xs">
                        <option>Cash السداد نقدي</option>
                        <option>Credit Card بطاقة ائتمانية</option>
                     </select>
                     <button className="md:col-span-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition flex items-center justify-center gap-2">
                        <DollarSign className="w-5 h-5"/> {isAr ? "ترحيل الحساب وطباعة الإيصال الرسمي" : "Settle Ledger & Print Official Receipt"}
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {activeTab === "claims" && (
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-fade-in">
             <div className="mb-6 pb-6 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-black text-slate-800 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-amber-500" /> {isAr ? "محرك مطالبات أطراف التأمين" : "TPA / Insurance Claims Engine"}
                 </h3>
                 <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition flex items-center gap-2 text-xs">
                    <Send className="w-4 h-4"/> {isAr ? "تصدير حزمة المطالبات (Batch Export)" : "Batch Export XML"}
                 </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <select className="border border-slate-300 rounded-lg p-2.5 text-xs outline-none bg-slate-50 font-bold">
                   <option>Misr Insurance Co.</option>
                   <option>Bupa / Allianz</option>
                </select>
                <input type="month" className="border border-slate-300 rounded-lg p-2.5 text-xs outline-none bg-slate-50" defaultValue="2026-06" />
                <button className="md:col-span-2 border border-slate-300 rounded-lg p-2.5 text-xs outline-none bg-white font-bold text-slate-600 hover:bg-slate-50">Filter Batch</button>
             </div>

             <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-6">
                <p className="font-bold text-indigo-900 text-xs mb-1">Pre-Export Validation Check</p>
                <p className="text-[10px] text-indigo-700 font-medium">Checking ICD-11 diagnosis matching vs Billed Services... All approvals are valid.</p>
             </div>

             <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="py-2 px-3 text-start">Invoice ID</th>
                    <th className="py-2 px-3 text-start">Patient MRN</th>
                    <th className="py-2 px-3 text-start">Insurance ID</th>
                    <th className="py-2 px-3 text-start">ICD-11 Code</th>
                    <th className="py-2 px-3 text-center">Approval Code</th>
                    <th className="py-2 px-3 text-end">Total Claim Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[1,2,3,4,5].map(row => (
                    <tr key={row} className="hover:bg-slate-50 text-xs font-mono">
                      <td className="py-3 px-3">INV-602{row}</td>
                      <td className="py-3 px-3">MRN-2026-10{row}</td>
                      <td className="py-3 px-3">MED-00998{row}</td>
                      <td className="py-3 px-3 font-bold text-indigo-700">E11.9</td>
                      <td className="py-3 px-3 text-center"><span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">AUTH-99{row}X</span></td>
                      <td className="py-3 px-3 text-end font-bold text-slate-800">4,500.00 EGP</td>
                    </tr>
                  ))}
                </tbody>
             </table>
         </div>
      )}
    </div>
  );
}
