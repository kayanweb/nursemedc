import React, { useState } from "react";
import { Activity, Stethoscope, ClipboardList, Thermometer, User, AlertTriangle, FileSignature, Save, Pill, TestTube, ArrowRight } from "lucide-react";
import { useHIS } from "../context/HISContext";
import { toast } from "sonner";

interface Props {
  language: "ar" | "en";
}

export default function EMRDashboard({ language }: Props) {
  const isAr = language === "ar";
  const [activeRoleTab, setActiveRoleTab] = useState<"triage" | "emr">("triage");
  const [emrSubTab, setEmrSubTab] = useState<"subjective" | "objective" | "assessment" | "plan">("subjective");
  
  const { patients, updatePatientStatus, addPrescription } = useHIS();
  const triagePatients = patients.filter(p => p.status === "registered" || p.status === "triage");
  const doctorPatients = patients.filter(p => p.status === "doctor");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  const selectedPatient = patients.find(p => p.id === selectedPatientId) || triagePatients[0] || doctorPatients[0];

  const vitalsFormInputs = [
    { label: isAr ? "ضغط الدم الانقباضي (Systolic)" : "Systolic BP", unit: "mmHg", id: "sys" },
    { label: isAr ? "ضغط الدم الانبساطي (Diastolic)" : "Diastolic BP", unit: "mmHg", id: "dia" },
    { label: isAr ? "نبض القلب (Heart Rate)" : "Heart Rate", unit: "bpm", id: "hr" },
    { label: isAr ? "درجة الحرارة (Temp)" : "Temperature", unit: "°C", id: "temp" },
    { label: isAr ? "معدل التنفس (Resp. Rate)" : "Respiratory Rate", unit: "bpm", id: "rr" },
    { label: isAr ? "نسبة الأكسجين (SpO2)" : "SpO2 Level", unit: "%", id: "spo2" },
    { label: isAr ? "الوزن (Weight)" : "Weight", unit: "kg", id: "weight" },
    { label: isAr ? "الطول (Height)" : "Height", unit: "cm", id: "height" },
  ];

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen font-sans text-right" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border-r-4 border-r-emerald-500 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Stethoscope className="h-7 w-7 text-emerald-600" />
            {isAr ? "العيادات الخارجية ومكتب الطبيب (OPD & Doctor EMR)" : "Outpatient Dept & Physician EMR"}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {isAr ? "محطة التمريض والفرز (Triage)، والملف الطبي الإلكتروني للطبيب (EMR, CPOE)." : "Nursing Triage Station and complete Physician EMR / CPOE."}
          </p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 flex-wrap">
          <button onClick={() => setActiveRoleTab("triage")} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeRoleTab === "triage" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <Thermometer className="w-4 h-4" /> {isAr ? "فرز التمريض (Triage)" : "Nurse Triage"}
          </button>
          <button onClick={() => setActiveRoleTab("emr")} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeRoleTab === "emr" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <User className="w-4 h-4" /> {isAr ? "مكتب الطبيب (EMR)" : "Physician Desk"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Triage Station */}
        {activeRoleTab === "triage" && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              {/* Queue List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[min(calc(100vh-200px),700px)] flex flex-col">
                 <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm">
                       <ClipboardList className="w-5 h-5 text-emerald-500" /> {isAr ? "قائمة انتظار العيادة اليوم" : "Today's Clinic Queue"}
                    </h3>
                 </div>
                 <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {triagePatients.map((patient, idx) => (
                      <div key={patient.id} onClick={() => setSelectedPatientId(patient.id)} className={`border rounded-xl p-3 cursor-pointer transition ${selectedPatient?.id === patient.id ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                         <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-slate-800 text-sm">{isAr ? patient.nameAr : patient.nameEn}</span>
                            <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1 rounded">{patient.mrn}</span>
                         </div>
                         <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">Queue: #{10 + idx}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${patient.status === 'triage' ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                               {patient.status === 'triage' ? (isAr ? "قيد الفرز الآن" : "In Triage") : (isAr ? "في الانتظار" : "Waiting")}
                            </span>
                         </div>
                      </div>
                    ))}
                    {triagePatients.length === 0 && <p className="text-center text-sm text-slate-500 p-4">{isAr ? "لا يوجد مرضى في الانتظار" : "No patients in waiting queue"}</p>}
                 </div>
              </div>

              {/* Vitals Form */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                 <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-black text-emerald-800 flex items-center gap-2 text-sm">
                       <Activity className="w-5 h-5 text-emerald-500" /> {isAr ? "تسجيل العلامات الحيوية (Vital Signs Form)" : "Vital Signs Recording"}
                    </h3>
                    <span className="text-xs font-bold text-slate-500">MRN-2026-0041 - سمير عبدالله</span>
                 </div>
                 <div className="p-6 pb-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                       {vitalsFormInputs.map((input) => (
                          <div key={input.id}>
                             <label className="text-xs font-bold text-slate-600 mb-1.5 flex justify-between">
                               {input.label} <span className="text-slate-400 font-normal">{input.unit}</span>
                             </label>
                             <input type="number" step="any" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-500 focus:bg-white transition text-left font-mono" placeholder="0.0" />
                          </div>
                       ))}
                    </div>

                    <div className="mt-8 bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
                       <div>
                          <p className="text-xs font-bold text-indigo-800 mb-1">{isAr ? "مؤشر كتلة الجسم المحسوب تلقائياً (Auto BMI)" : "Auto-Calculated BMI"}</p>
                          <p className="text-[10px] text-indigo-600">{isAr ? "يتم الحساب تلقائياً بمجرد إدخال الطول والوزن" : "Calculated instantly upon weight/height entry"}</p>
                       </div>
                       <div className="text-2xl font-black font-mono text-indigo-700">
                          24.5 <span className="text-sm font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded ml-2">{isAr ? "وزن طبيعي" : "Normal"}</span>
                       </div>
                    </div>
                 </div>
                     <div className="p-4 border-t border-slate-100 mt-auto flex justify-end">
                        <button 
                           disabled={!selectedPatient}
                           onClick={() => selectedPatient && updatePatientStatus(selectedPatient.id, "doctor")} 
                           className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm transition flex items-center gap-2">
                           <Save className="w-4 h-4"/> {isAr ? "حفظ وتمرير للطبيب" : "Save & Send to Doctor"}
                        </button>
                     </div>
              </div>
           </div>
        )}

        {/* Doctor EMR */}
        {activeRoleTab === "emr" && (
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm animate-fade-in flex flex-col min-h-[600px] overflow-hidden">
             {/* Patient Context Header */}
             <div className="bg-slate-800 text-white p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center font-black text-xl">{selectedPatient ? selectedPatient.nameAr.charAt(0) : "؟"}</div>
                   <div>
                      <h2 className="font-black text-lg">{selectedPatient ? (isAr ? selectedPatient.nameAr : selectedPatient.nameEn) : "No Patient Selected"} <span className="text-xs font-normal text-slate-400 bg-slate-900 px-2 py-0.5 rounded ml-2 font-mono">MRN: {selectedPatient?.mrn || "N/A"}</span></h2>
                      <p className="text-xs text-slate-300 mt-1">{selectedPatient?.age || 0} Y • {selectedPatient?.gender || "Unknown"} • {selectedPatient ? (isAr ? selectedPatient.insurance : selectedPatient.insurance) : ""}</p>
                   </div>
                </div>
                {selectedPatient && (
                  <div className="bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-400 flex items-center gap-2 animate-pulse">
                     <AlertTriangle className="w-4 h-4" /> {isAr ? "تنبيه: لا يوجد حساسيات مسجلة" : "ALERT: No allergies recorded"}
                  </div>
                )}
             </div>

             {/* EMR Tabs */}
             <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto">
                <button onClick={() => setEmrSubTab("subjective")} className={`flex-1 py-3 px-4 text-xs font-bold transition-all whitespace-nowrap min-w-[120px] text-center border-b-2 ${emrSubTab === "subjective" ? "border-emerald-500 text-emerald-700 bg-emerald-50/50" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>{isAr ? "الشكوى والتاريخ (Subjective)" : "Subjective"}</button>
                <button onClick={() => setEmrSubTab("objective")} className={`flex-1 py-3 px-4 text-xs font-bold transition-all whitespace-nowrap min-w-[120px] text-center border-b-2 ${emrSubTab === "objective" ? "border-emerald-500 text-emerald-700 bg-emerald-50/50" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>{isAr ? "الفحص الحيوي (Objective)" : "Objective"}</button>
                <button onClick={() => setEmrSubTab("assessment")} className={`flex-1 py-3 px-4 text-xs font-bold transition-all whitespace-nowrap min-w-[120px] text-center border-b-2 ${emrSubTab === "assessment" ? "border-emerald-500 text-emerald-700 bg-emerald-50/50" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>{isAr ? "التشخيص الطبي (Assessment)" : "Assessment (ICD-11)"}</button>
                <button onClick={() => setEmrSubTab("plan")} className={`flex-1 py-3 px-4 text-xs font-bold transition-all whitespace-nowrap min-w-[120px] text-center border-b-2 ${emrSubTab === "plan" ? "border-emerald-500 text-emerald-700 bg-emerald-50/50" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>{isAr ? "خطة العلاج والأوامر (CPOE)" : "Plan / CPOE"}</button>
             </div>

             {/* EMR Content Area */}
             <div className="flex-1 p-6 bg-white overflow-y-auto">
                {emrSubTab === "subjective" && (
                   <div className="space-y-6 max-w-4xl mx-auto">
                     <div>
                       <label className="font-bold text-slate-700 text-sm mb-2 block">{isAr ? "الشكوى الرئيسية (Chief Complaint)" : "Chief Complaint"}</label>
                       <textarea className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-emerald-500 transition min-h-[100px]" placeholder={isAr ? "اكتب شكوى المريض الرئيسية..." : "Patient complaint..."}></textarea>
                     </div>
                     <div>
                       <label className="font-bold text-slate-700 text-sm mb-2 block">{isAr ? "تاريخ المرض الحالي (HPI)" : "History of Present Illness (HPI)"}</label>
                       <textarea className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-emerald-500 transition min-h-[150px]" placeholder={isAr ? "الاسترسال في وصف التاريخ المرضي لتبرير التشخيص للجهة الضامنة..." : "Detailed history for insurance justification..."}></textarea>
                     </div>
                   </div>
                )}
                
                {emrSubTab === "objective" && (
                   <div className="space-y-6 max-w-4xl mx-auto text-center py-10 opacity-60">
                      <div className="w-32 h-32 bg-slate-100 rounded-full mx-auto flex items-center justify-center border-2 border-dashed border-slate-300">
                         <Activity className="w-10 h-10 text-slate-400" />
                      </div>
                      <p className="font-bold text-slate-600">{isAr ? "مخطط الفحص السريري (Interactive Body Map) - مساحة مخصصة للرسم التفاعلي" : "Interactive Body Map Placeholder"}</p>
                   </div>
                )}

                {emrSubTab === "assessment" && (
                   <div className="space-y-6 max-w-4xl mx-auto">
                      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-4 flex items-start gap-3">
                         <AlertTriangle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                         <p className="text-xs text-indigo-800 font-bold leading-relaxed">
                           {isAr ? "التشخيص هنا مرتبط آلياً بقاعدة بيانات ICD-11 العالمية لضمان الدقة وتجنب رفض مطالبات التأمين الطبي. يمنع إدخال تشخيص نصي غير مكود." : "Diagnoses are hard-linked to the ICD-11 global database to ensure compliance and prevent insurance claim rejections."}
                         </p>
                      </div>
                      <div>
                         <label className="font-bold text-slate-700 text-sm mb-2 block">{isAr ? "بحث كود التشخيص (ICD-11 Search)" : "Search ICD-11 Code / Disease Name"}</label>
                         <div className="relative">
                            <input type="text" className="w-full bg-white border-2 border-emerald-500 rounded-xl p-3 outline-none text-sm font-bold shadow-[0_0_10px_rgba(16,185,129,0.1)]" placeholder={isAr ? "مثال: Diabetes, Hypertension, BA00..." : "e.g. Type 2 Diabetes Mellitus..."} />
                         </div>
                      </div>
                      <div className="border border-slate-200 rounded-xl mt-4">
                         <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center rounded-t-xl">
                            <span className="text-xs font-bold text-slate-600">{isAr ? "التشخيصات الحالية للزيارة" : "Current Visit Diagnoses"}</span>
                         </div>
                         <div className="p-4 flex flex-col gap-2">
                            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-2 rounded-lg flex justify-between items-center">
                               <div>
                                  <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-emerald-100 font-black mr-2">E11.9</span>
                                  <span className="text-xs font-bold">Type 2 diabetes mellitus without complications</span>
                               </div>
                               <button className="text-rose-500 text-xs hover:underline">{isAr ? "حذف" : "Remove"}</button>
                            </div>
                         </div>
                      </div>
                   </div>
                )}

                {emrSubTab === "plan" && (
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                      {/* E-Prescription */}
                      <div className="border border-slate-200 rounded-xl flex flex-col">
                         <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 rounded-t-xl">
                            <Pill className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-black text-slate-800">{isAr ? "الروشتة الإلكترونية (E-RX)" : "Digital Prescriptions (E-Rx)"}</span>
                         </div>
                         <div className="p-4 flex-1 space-y-4">
                            <input type="text" placeholder={isAr ? "ابحث باسم الدواء التجاري أو العلمي..." : "Search medication inventory..."} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs outline-none focus:border-emerald-500" />
                            <div className="space-y-2">
                               <div className="border border-slate-200 rounded-lg p-3 relative overflow-hidden bg-white">
                                  <div className="flex justify-between items-start mb-2">
                                     <p className="font-bold text-sm text-indigo-900">Glucophage 1000mg Tablet</p>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                                     <div>
                                        <span className="block text-slate-400 font-bold mb-1">{isAr ? "الجرعة" : "Dose"}</span>
                                        <select className="w-full border border-slate-200 rounded p-1"><option>1 Tablet</option></select>
                                     </div>
                                     <div>
                                        <span className="block text-slate-400 font-bold mb-1">{isAr ? "التكرار" : "Frequency"}</span>
                                        <select className="w-full border border-slate-200 rounded p-1"><option>BID (Twice/Day)</option></select>
                                     </div>
                                     <div>
                                        <span className="block text-slate-400 font-bold mb-1">{isAr ? "المدة" : "Duration"}</span>
                                        <input type="text" defaultValue="30 Days" className="w-full border border-slate-200 rounded p-1" />
                                     </div>
                                  </div>
                               </div>
                            </div>
                            <button className="w-full py-2 border-2 border-dashed border-slate-300 text-slate-500 text-xs font-bold rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition">
                               + {isAr ? "إضافة دواء للروشتة" : "Add Medication"}
                            </button>
                         </div>
                      </div>

                      {/* Orders */}
                      <div className="border border-slate-200 rounded-xl flex flex-col">
                         <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 rounded-t-xl">
                            <TestTube className="w-4 h-4 text-indigo-600" />
                            <span className="text-sm font-black text-slate-800">{isAr ? "طلبات المعمل والأشعة (Orders)" : "Lab & Rad Orders"}</span>
                         </div>
                         <div className="p-4 flex-1 space-y-4">
                            <div className="border border-slate-200 rounded-lg p-3 bg-white">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" />
                                  Comprehensive Metabolic Panel (CMP)
                                </label>
                            </div>
                            <div className="border border-slate-200 rounded-lg p-3 bg-white">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" />
                                  Hemoglobin A1C
                                </label>
                            </div>
                            <button className="w-full py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition flex items-center justify-center gap-1">
                               {isAr ? "استعراض دليل المعمل كامل" : "Browse Lab Catalog"} <ArrowRight className="w-3 h-3" />
                            </button>
                         </div>
                      </div>
                   </div>
                )}
             </div>
             
             {/* EMR Sticky Footer Actions */}
             <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center">
                <button className="text-slate-500 text-xs font-bold hover:text-slate-700">{isAr ? "تأجيل الحفظ" : "Save as Draft"}</button>
                <button 
                  disabled={!selectedPatient}
                  onClick={async () => {
                     if (!selectedPatient) return;
                     await addPrescription({ 
                        id: "rx" + Date.now(), 
                        patientId: selectedPatient.id, 
                        mrn: selectedPatient.mrn,
                        doctorName: "Dr. Smith", // Mock
                        medications: [{ name: "Glucophage 1000mg Tablet", dose: "1 Tablet", freq: "BID", duration: "30 Days" }],
                        status: "pending" 
                     });
                     await updatePatientStatus(selectedPatient.id, "pharmacy");
                     toast.success(isAr ? "تم إرسال الروشتة وتوجيه المريض للصيدلية" : "Prescription sent to Pharmacy successfully.");
                  }}
                  className="bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-bold py-2.5 px-8 rounded-xl shadow-md transition flex items-center gap-2">
                   <FileSignature className="w-4 h-4" /> {isAr ? "توقيع وإغلاق الزيارة (Sign & Close)" : "Sign & Lock Visit"}
                </button>
             </div>
           </div>
        )}
      </div>
    </div>
  );
}
