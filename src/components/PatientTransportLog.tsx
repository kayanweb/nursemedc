import React, { useState } from "react";
import { Activity, Clock, CheckCircle2, User, UserCheck, ArrowRightLeft, ShieldAlert, BedDouble, PlusCircle, Edit, Trash2, X, Save } from "lucide-react";

interface Props {
  language: "ar" | "en";
}

export default function PatientTransportLog({ language }: Props) {
  const isAr = language === "ar";
  
  const [transports, setTransports] = useState<any[]>([
    {
      id: "tr-1",
      patientName: "علي محمد السيد",
      mrn: "MRN-10901",
      fromUnit: "EMERGENCY UNIT",
      toUnit: "INTENSIVE CARE UNIT",
      status: "completed",
      timeAssigned: "10:15 AM",
      timeCompleted: "10:35 AM",
      assignedPorter: "محمود حسن",
      type: "Critical Transfer",
      equipmentNeeded: "Oxygen Cylinder, Portable Monitor"
    },
    {
      id: "tr-2",
      patientName: "سعاد عبد الجليل",
      mrn: "MRN-33421",
      fromUnit: "MEDICAL WARD",
      toUnit: "RADIOLOGY UNIT",
      status: "in-progress",
      timeAssigned: "11:00 AM",
      timeCompleted: "",
      assignedPorter: "إبراهيم الدسوقي",
      type: "Diagnostic",
      equipmentNeeded: "Wheelchair"
    },
    {
      id: "tr-3",
      patientName: "نور الدين عمر",
      mrn: "MRN-55823",
      fromUnit: "OPERATING ROOM",
      toUnit: "SURGICAL WARD",
      status: "pending",
      timeAssigned: "11:20 AM",
      timeCompleted: "",
      assignedPorter: "Unassigned",
      type: "Post-Op Transfer",
      equipmentNeeded: "Stretcher"
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    patientName: "",
    mrn: "",
    fromUnit: "",
    toUnit: "",
    status: "pending",
    timeAssigned: "",
    timeCompleted: "",
    assignedPorter: "Unassigned",
    type: "Diagnostic",
    equipmentNeeded: ""
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "in-progress": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "pending": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getStatusText = (status: string) => {
    if (isAr) {
      switch (status) {
        case "completed": return "مكتمل";
        case "in-progress": return "جاري النقل";
        case "pending": return "في الانتظار";
        default: return "غير معروف";
      }
    }
    return status.toUpperCase();
  };

  const calculateTotal = () => transports.length;
  const calculatePending = () => transports.filter(t => t.status === "pending").length;

  const handleSave = () => {
    if (editingId) {
      setTransports(transports.map(t => t.id === editingId ? { ...formData, id: editingId } : t));
    } else {
      setTransports([...transports, { ...formData, id: `tr-${Date.now()}` }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(isAr ? "هل أنت متأكد من الحذف؟" : "Are you sure?")) {
      setTransports(transports.filter(t => t.id !== id));
    }
  };

  const openNew = () => {
    setEditingId(null);
    setFormData({
      patientName: "", mrn: "", fromUnit: "", toUnit: "",
      status: "pending", timeAssigned: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), timeCompleted: "",
      assignedPorter: "Unassigned", type: "Diagnostic", equipmentNeeded: ""
    });
    setShowModal(true);
  };

  const openEdit = (t: any) => {
    setEditingId(t.id);
    setFormData(t);
    setShowModal(true);
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen font-sans text-right" dir={isAr ? "rtl" : "ltr"}>
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border-r-4 border-r-indigo-500 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <ArrowRightLeft className="h-7 w-7 text-indigo-600" />
            {isAr ? "نظام النقل وحركة المرضى المتقدم" : "Patient Transport & Logistics"}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {isAr ? "تتبع وتسجيل حركة المرضى عبر الأقسام مع صلاحيات الإنشاء والتعديل المتقدمة" : "Live tracking of patient movement across wards with full management controls."}
          </p>
        </div>
        <button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition shadow-sm flex items-center gap-2 shrink-0 cursor-pointer">
           <PlusCircle className="w-5 h-5" />
           {isAr ? "طلب نقل جديد بالسيستم" : "Request Transport"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl shadow-inner">
             {calculateTotal()}
           </div>
           <div>
             <p className="text-xs text-slate-500 font-bold">{isAr ? "إجمالي طلبات النقل" : "Total Transport Requests"}</p>
             <p className="font-black text-lg text-slate-800">{calculateTotal()} {isAr ? "مريض" : "Patients"}</p>
           </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xl shadow-inner">
             {calculatePending()}
           </div>
           <div>
             <p className="text-xs text-slate-500 font-bold">{isAr ? "حالات الانتظار النشطة" : "Active Pending Tasks"}</p>
             <p className="font-black text-lg text-slate-800">{isAr ? "بحاجة للتوجه" : "Require Action"}</p>
           </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl shadow-inner">
             15m
           </div>
           <div>
             <p className="text-xs text-slate-500 font-bold">{isAr ? "متوسط وقت إنجاز النقل" : "Average Transport Time"}</p>
             <p className="font-black text-lg text-slate-800">{isAr ? "ضمن المعدل المسموح" : "Within KPI Target"}</p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in relative z-10">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              {isAr ? "لوحة المراقبة التفاعلية لمهام النقل (الإصدار الجديد)" : "Live Interactive Task Board"}
            </h3>
        </div>
        <div className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-black">{isAr ? "المريض ورقم الملف (MRN)" : "Patient / MRN"}</th>
                <th className="py-3 px-4 font-black text-center">{isAr ? "المسار (من / إلى)" : "Route (From -> To)"}</th>
                <th className="py-3 px-4 font-black text-center">{isAr ? "نوع النقل والاحتياجات" : "Transport Type & Needs"}</th>
                <th className="py-3 px-4 font-black text-center">{isAr ? "الناقل المعين (Porter)" : "Assigned Porter"}</th>
                <th className="py-3 px-4 font-black text-center">{isAr ? "حالة المهمة والوقت" : "Status & Time"}</th>
                <th className="py-3 px-4 font-black text-center">{isAr ? "إدارة وتعديل" : "Controls"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transports.map((t) => (
                <tr key={t.id} className="hover:bg-indigo-50/50 transition">
                  <td className="py-4 px-4">
                     <p className="font-bold text-slate-900">{t.patientName}</p>
                     <p className="font-mono text-xs text-slate-500 mt-1 bg-slate-100 inline-block px-1.5 py-0.5 rounded border border-slate-200">{t.mrn}</p>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <p className="text-xs font-bold text-indigo-700 bg-indigo-50 rounded py-0.5 px-2 border border-indigo-100 inline-block">{t.fromUnit}</p>
                    <div className="flex justify-center my-1.5"><ArrowRightLeft className="w-3 h-3 text-slate-400 rotate-90 md:rotate-0" /></div>
                    <p className="text-xs font-bold text-emerald-700 bg-emerald-50 rounded py-0.5 px-2 border border-emerald-100 inline-block">{t.toUnit}</p>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold shadow-sm ${t.type.includes('Critical') ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                      {t.type}
                    </span>
                    <div className="mt-2 text-[10px] text-slate-500 font-bold bg-slate-50 inline-block px-2 py-1 rounded-lg border border-slate-100">
                       <BedDouble className="w-3 h-3 inline-block mx-1" /> {t.equipmentNeeded || "None"}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                     <div className="flex items-center justify-center gap-2">
                       <div className={`w-7 h-7 rounded-full flex items-center justify-center ${t.assignedPorter === 'Unassigned' ? 'bg-rose-50 text-rose-500 border border-rose-200' : 'bg-indigo-50 text-indigo-500 border border-indigo-200'}`}>
                         <User className="w-3.5 h-3.5" />
                       </div>
                       <span className={`text-xs font-bold ${t.assignedPorter === 'Unassigned' ? 'text-rose-600' : 'text-slate-800'}`}>
                         {t.assignedPorter}
                       </span>
                     </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                     <span className={`px-3 py-1.5 rounded-full text-[11px] font-black border shadow-sm ${getStatusColor(t.status)}`}>
                       {getStatusText(t.status)}
                     </span>
                     <div className="text-[10px] font-medium text-slate-500 mt-2 flex items-center justify-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-100">
                        <Clock className="w-3 h-3" /> Req: <span className="font-mono font-bold text-slate-700">{t.timeAssigned}</span>
                     </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                       {t.status === "pending" && (
                         <button 
                           onClick={() => {
                             setTransports(transports.map(tr => tr.id === t.id ? { ...tr, status: "in-progress", assignedPorter: "ناقل متاح" } : tr));
                           }}
                           className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-200 px-2 py-1.5 rounded text-[10px] font-bold transition-all cursor-pointer"
                         >
                           {isAr ? "تعيين وبدء" : "Start"}
                         </button>
                       )}
                       {t.status === "in-progress" && (
                         <button 
                           onClick={() => {
                             setTransports(transports.map(tr => tr.id === t.id ? { ...tr, status: "completed", timeCompleted: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) } : tr));
                           }}
                           className="bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 px-2 py-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                         >
                           <CheckCircle2 className="w-3 h-3" /> {isAr ? "تأكيد" : "Done"}
                         </button>
                       )}
                       
                       {/* Edit/Delete Actions */}
                       <button onClick={() => openEdit(t)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all cursor-pointer">
                         <Edit size={16} />
                       </button>
                       <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer">
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Modal for Create / Edit */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-black text-lg flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5" />
                {editingId ? (isAr ? "تعديل طلب نقل" : "Edit Request") : (isAr ? "إنشاء طلب نقل جديد" : "New Request")}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-all cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-slate-700 mx-1 mb-1">{isAr ? "اسم المريض" : "Patient Name"}</label>
                  <input type="text" value={formData.patientName} onChange={e => setFormData({...formData, patientName: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-700 mx-1 mb-1">{isAr ? "الملف الطبي MRN" : "MRN"}</label>
                  <input type="text" value={formData.mrn} onChange={e => setFormData({...formData, mrn: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="MRN-XXXXX" />
               </div>
               
               <div>
                  <label className="block text-xs font-bold text-slate-700 mx-1 mb-1">{isAr ? "من قسم" : "From Unit"}</label>
                  <input type="text" value={formData.fromUnit} onChange={e => setFormData({...formData, fromUnit: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none uppercase" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-700 mx-1 mb-1">{isAr ? "إلى قسم" : "To Unit"}</label>
                  <input type="text" value={formData.toUnit} onChange={e => setFormData({...formData, toUnit: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none uppercase" />
               </div>

               <div>
                  <label className="block text-xs font-bold text-slate-700 mx-1 mb-1">{isAr ? "الحالة" : "Status"}</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
                     <option value="pending">في الانتظار (Pending)</option>
                     <option value="in-progress">جاري (In Progress)</option>
                     <option value="completed">مكتمل (Completed)</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-700 mx-1 mb-1">{isAr ? "عامل النقل" : "Porter"}</label>
                  <input type="text" value={formData.assignedPorter} onChange={e => setFormData({...formData, assignedPorter: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
               </div>

               <div>
                  <label className="block text-xs font-bold text-slate-700 mx-1 mb-1">{isAr ? "نوع النقل" : "Type"}</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
                     <option value="Diagnostic">عادي - تشخيص (Diagnostic)</option>
                     <option value="Critical Transfer">حرجة - رعاية (Critical Transfer)</option>
                     <option value="Post-Op Transfer">بعد العمليات (Post-Op)</option>
                     <option value="Discharge">خروج مريض (Discharge)</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-700 mx-1 mb-1">{isAr ? "الأدوات المطلوبة" : "Equipment"}</label>
                  <input type="text" value={formData.equipmentNeeded} onChange={e => setFormData({...formData, equipmentNeeded: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Wheelchair, Stretcher, O2..." />
               </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl shadow-inner">
               <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition cursor-pointer">
                 {isAr ? "إلغاء" : "Cancel"}
               </button>
               <button onClick={handleSave} className="px-6 py-2.5 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer">
                 <Save size={16} />
                 {isAr ? "حفظ الطلب والتحديث" : "Save changes"}
               </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

