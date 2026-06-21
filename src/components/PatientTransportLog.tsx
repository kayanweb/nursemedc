import React, { useState } from "react";
import { Activity, Clock, CheckCircle2, User, UserCheck, ArrowRightLeft, ShieldAlert, BedDouble, PlusCircle, Edit, Trash2, X, Save, Navigation, Play, FileSignature } from "lucide-react";

interface Props {
  language: "ar" | "en";
  currentUser?: any;
}

export default function PatientTransportLog({ language, currentUser }: Props) {
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
      timeDeparted: "10:20 AM",
      timeCompleted: "10:35 AM",
      assignedPorter: "محمود حسن",
      type: "Critical Transfer",
      equipmentNeeded: "Oxygen Cylinder, Portable Monitor",
      requestedBy: "منى نور (ER)",
      receivedBy: "أحمد كمال (ICU)"
    },
    {
      id: "tr-2",
      patientName: "سعاد عبد الجليل",
      mrn: "MRN-33421",
      fromUnit: "MEDICAL WARD",
      toUnit: "RADIOLOGY UNIT",
      status: "in-transit",
      timeAssigned: "11:00 AM",
      timeDeparted: "11:10 AM",
      timeCompleted: "",
      assignedPorter: "إبراهيم الدسوقي",
      type: "Diagnostic",
      equipmentNeeded: "Wheelchair",
      requestedBy: "فاطمة محمد (Medical)",
      receivedBy: ""
    },
    {
      id: "tr-3",
      patientName: "نور الدين عمر",
      mrn: "MRN-55823",
      fromUnit: "OPERATING ROOM",
      toUnit: "SURGICAL WARD",
      status: "pending",
      timeAssigned: "11:20 AM",
      timeDeparted: "",
      timeCompleted: "",
      assignedPorter: "Unassigned",
      type: "Post-Op Transfer",
      equipmentNeeded: "Stretcher",
      requestedBy: "د. سامي (OR)",
      receivedBy: ""
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    patientName: "", mrn: "", fromUnit: "", toUnit: "",
    status: "waiting-approval", timeAssigned: "", timeDeparted: "", timeCompleted: "",
    assignedPorter: "Unassigned", type: "Diagnostic", equipmentNeeded: "", requestedBy: "", receivedBy: "", isolationCategory: ""
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "in-transit": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "assigned": return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending": return "bg-amber-100 text-amber-800 border-amber-200";
      case "waiting-approval": return "bg-rose-100 text-rose-800 border-rose-200 animate-pulse";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getStatusText = (status: string) => {
    if (isAr) {
      switch (status) {
        case "completed": return "تم الوصول وتأكيد الاستلام";
        case "in-transit": return "جاري النقل في المسار";
        case "assigned": return "تم تعيين الناقل";
        case "pending": return "بانتظار الناقل";
        case "waiting-approval": return "بانتظار موافقة الوجهة";
        default: return "غير معروف";
      }
    }
    return status.toUpperCase();
  };

  const calculateTotal = () => transports.length;
  const calculatePending = () => transports.filter(t => t.status === "pending" || t.status === "assigned").length;

  const handleSave = () => {
    if (editingId) {
      setTransports(transports.map(t => t.id === editingId ? { ...formData, id: editingId } : t));
    } else {
      setTransports([...transports, { ...formData, id: `tr-${Date.now()}`, timeAssigned: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), requestedBy: currentUser?.nameAr || "User" }]);
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
      status: "waiting-approval", timeAssigned: "", timeDeparted: "", timeCompleted: "",
      assignedPorter: "Unassigned", type: "Diagnostic", equipmentNeeded: "", requestedBy: "", receivedBy: "", isolationCategory: ""
    });
    setShowModal(true);
  };

  const openEdit = (t: any) => {
    setEditingId(t.id);
    setFormData(t);
    setShowModal(true);
  };

  const updateStatus = (id: string, newStatus: string, updates: any = {}) => {
    setTransports(transports.map(t => t.id === id ? { ...t, status: newStatus, ...updates } : t));
  };

  const handleAssignPorter = (id: string) => {
    const porterName = prompt(isAr ? "أدخل اسم مسؤول النقل المتاح:" : "Enter available porter name:");
    if (porterName) {
      updateStatus(id, "assigned", { assignedPorter: porterName });
    }
  };

  const handleStartTransport = (id: string) => {
    updateStatus(id, "in-transit", { timeDeparted: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) });
  };

  const handleReceivePatient = (id: string) => {
    const signature = prompt(isAr ? "التوقيع الإلكتروني للمستلم للتأكيد:" : "Electronic signature of receiving staff:");
    if (signature) {
      updateStatus(id, "completed", { 
        timeCompleted: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        receivedBy: signature
      });
    }
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen font-sans text-right" dir={isAr ? "rtl" : "ltr"}>
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border-r-4 border-r-indigo-500 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <ArrowRightLeft className="h-7 w-7 text-indigo-600" />
            {isAr ? "لوحة المراقبة التفاعلية لمهام النقل (الإصدار الجديد)" : "Patient Transport & Logistics"}
          </h1>
          <p className="text-xs text-slate-500 mt-2 font-bold max-w-2xl leading-relaxed">
            {isAr ? "تتبع وتسجيل حركة المرضى عبر الأقسام مع التأكيد الآني من قبل الموظف المسلم والموظف المستلم لضمان توثيق وقت الانطلاق والوصول وسلامة العبور." : "Live tracking of patient movement across wards with sender/receiver electronic confirmations."}
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
             <p className="font-black text-lg text-slate-800">{calculateTotal()} {isAr ? "مهمة" : "Tasks"}</p>
           </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xl shadow-inner">
             {calculatePending()}
           </div>
           <div>
             <p className="text-xs text-slate-500 font-bold">{isAr ? "مهام عالقة أو قيد المعالجة" : "Active Pending Tasks"}</p>
             <p className="font-black text-lg text-slate-800">{isAr ? "بحاجة لمقاطعة" : "Require Action"}</p>
           </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl shadow-inner">
             12m
           </div>
           <div>
             <p className="text-xs text-slate-500 font-bold">{isAr ? "متوسط الاستجابة والوصول" : "Average Transport Time"}</p>
             <p className="font-black text-lg text-slate-800">{isAr ? "استجابة سريعة" : "Within KPI Target"}</p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in relative z-10">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              {isAr ? "سجل توقيعات النقل وتدفق الحالة المشتركة" : "Live Interactive Task Board & Signatures"}
            </h3>
        </div>
        <div className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-black">{isAr ? "المريض ورقم الملف (MRN)" : "Patient / MRN"}</th>
                <th className="py-3 px-4 font-black text-center">{isAr ? "المسار (طالب النقل -> وجهة الاستلام)" : "Route & Flow"}</th>
                <th className="py-3 px-4 font-black text-center">{isAr ? "نوع النقل والاحتياجات" : "Transport Type & Needs"}</th>
                <th className="py-3 px-4 font-black text-center">{isAr ? "الناقل المعين (Porter)" : "Assigned Porter"}</th>
                <th className="py-3 px-4 font-black text-center">{isAr ? "حالة المهمة والوقت" : "Status & Time"}</th>
                <th className="py-3 px-4 font-black text-center">{isAr ? "إدارة وتعديل التدفق" : "Controls"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transports.map((t) => (
                <tr key={t.id} className="hover:bg-indigo-50/50 transition">
                  <td className="py-4 px-4 align-top">
                     <p className="font-bold text-slate-900">{t.patientName}</p>
                     <p className="font-mono text-xs text-slate-500 mt-1 bg-slate-100 inline-block px-1.5 py-0.5 rounded border border-slate-200">{t.mrn}</p>
                  </td>
                  <td className="py-4 px-4 align-top">
                    <div className="flex flex-col items-center gap-2 text-xs">
                        <div className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-center">
                           <span className="font-bold text-slate-500 mr-1">{isAr ? "من:" : "From:"}</span>
                           <span className="font-black text-indigo-700">{t.fromUnit}</span>
                           <br />
                           {t.requestedBy && <span className="text-[10px] text-slate-500">طالب النقل: {t.requestedBy}</span>}
                        </div>
                        <ArrowRightLeft className="w-4 h-4 text-slate-400 rotate-90 md:rotate-0 flex-shrink-0" />
                        <div className="w-full bg-emerald-50 border border-emerald-100 rounded p-1.5 text-center">
                           <span className="font-bold text-slate-500 mr-1">{isAr ? "إلى:" : "To:"}</span>
                           <span className="font-black text-emerald-700">{t.toUnit}</span>
                           <br />
                           {t.receivedBy ? <span className="text-[10px] text-emerald-600 font-bold">المستلم: {t.receivedBy}</span> : <span className="text-[10px] text-amber-600 opacity-70">في انتظار الاستلام</span>}
                        </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center align-top">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold shadow-sm ${t.type?.includes('Critical') ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                      {t.type}
                    </span>
                    {(t.equipmentNeeded || t.isolationCategory) && (
                      <div className="mt-2 text-[10px] text-slate-500 font-bold bg-slate-50 inline-block px-2 py-1 rounded-lg border border-slate-100 space-y-1">
                         {t.equipmentNeeded && <div><BedDouble className="w-3 h-3 inline-block mx-1 text-indigo-400" /> {t.equipmentNeeded}</div>}
                         {t.isolationCategory && <div><ShieldAlert className="w-3 h-3 inline-block mx-1 text-rose-500" /> {t.isolationCategory}</div>}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center align-top">
                     <div className="flex flex-col items-center justify-center gap-1">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-inner ${t.assignedPorter === 'Unassigned' ? 'bg-rose-50 text-rose-500 border border-rose-200' : 'bg-indigo-50 text-indigo-600 border border-indigo-200'}`}>
                         <User className="w-4 h-4" />
                       </div>
                       <span className={`text-xs font-bold ${t.assignedPorter === 'Unassigned' ? 'text-rose-600' : 'text-slate-800'}`}>
                         {t.assignedPorter}
                       </span>
                     </div>
                  </td>
                  <td className="py-4 px-4 text-center align-top">
                     <span className={`px-3 py-1.5 rounded-full text-[11px] font-black border shadow-sm ${getStatusColor(t.status)}`}>
                       {getStatusText(t.status)}
                     </span>
                     <div className="text-[10px] font-medium text-slate-500 mt-2 space-y-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100 w-full max-w-[140px] mx-auto text-right">
                        <div className="flex justify-between"><span>الطلب:</span><span className="font-mono font-bold text-slate-700">{t.timeAssigned || "--:--"}</span></div>
                        <div className="flex justify-between text-indigo-600"><span>الانطلاق:</span><span className="font-mono font-bold">{t.timeDeparted || "--:--"}</span></div>
                        <div className="flex justify-between text-emerald-600"><span>الوصول:</span><span className="font-mono font-bold">{t.timeCompleted || "--:--"}</span></div>
                     </div>
                  </td>
                  <td className="py-4 px-4 text-center align-top">
                    <div className="flex flex-wrap items-center justify-center gap-2 max-w-[150px] mx-auto">
                       {t.status === "waiting-approval" && (
                         <button 
                           onClick={() => {
                             if(window.confirm(isAr ? "هل أنت متأكد من موافقة وجهة النقل (القسم المستلم)؟" : "Confirm receiving unit approval?")) {
                               updateStatus(t.id, "pending");
                             }
                           }}
                           className="w-full bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 px-2 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                         >
                           <CheckCircle2 className="w-4 h-4" /> {isAr ? "موافقة الوجهة" : "Approve"}
                         </button>
                       )}
                       {t.status === "pending" && (
                         <button 
                           onClick={() => handleAssignPorter(t.id)}
                           className="w-full bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 px-2 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                         >
                           <UserCheck className="w-4 h-4" /> {isAr ? "تعيين ناقل" : "Assign Porter"}
                         </button>
                       )}
                       {t.status === "assigned" && (
                         <button 
                           onClick={() => handleStartTransport(t.id)}
                           className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200 px-2 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                         >
                           <Play className="w-4 h-4 text-indigo-500" /> {isAr ? "انطلاق (قسم التمريض)" : "Start Transfer"}
                         </button>
                       )}
                       {t.status === "in-transit" && (
                         <button 
                           onClick={() => handleReceivePatient(t.id)}
                           className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 px-2 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                         >
                           <FileSignature className="w-4 h-4" /> {isAr ? "اعتماد وصول المريض" : "Receive"}
                         </button>
                       )}
                       
                       {/* Control Options */}
                       <div className="flex gap-1 w-full justify-center pt-2">
                         <button onClick={() => openEdit(t)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all cursor-pointer" title="تعديل">
                           <Edit size={16} />
                         </button>
                         <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer" title="حذف">
                           <Trash2 size={16} />
                         </button>
                       </div>
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
                {editingId ? (isAr ? "تعديل بيانات طلب النقل السريري" : "Edit Request") : (isAr ? "إنشاء طلب نقل مريض عبر الأقسام" : "New Request")}
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
               
               <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-indigo-700 mx-1 mb-1">{isAr ? "القسم المُصَدِّر (المغادرة)" : "From Unit"}</label>
                  <input type="text" value={formData.fromUnit} onChange={e => setFormData({...formData, fromUnit: e.target.value})} className="w-full border border-slate-300 bg-white rounded-lg p-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none uppercase" />
                  
                  <label className="block text-xs font-bold text-slate-600 mt-2 mx-1 mb-1">{isAr ? "اسم طالب النقل (القسم)" : "Requested By"}</label>
                  <input type="text" value={formData.requestedBy} onChange={e => setFormData({...formData, requestedBy: e.target.value})} className="w-full border border-slate-300 bg-white rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="توقيع..." />
               </div>

               <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-emerald-700 mx-1 mb-1">{isAr ? "القسم المُستقِبل (الوجهة)" : "To Unit"}</label>
                  <input type="text" value={formData.toUnit} onChange={e => setFormData({...formData, toUnit: e.target.value})} className="w-full border border-slate-300 bg-white rounded-lg p-2 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none uppercase" />
                  
                  <label className="block text-xs font-bold text-slate-600 mt-2 mx-1 mb-1">{isAr ? "توقيع الموظف المستلم (القسم المراد الوصول إليه)" : "Received By"}</label>
                  <input type="text" value={formData.receivedBy} onChange={e => setFormData({...formData, receivedBy: e.target.value})} className="w-full border border-slate-300 bg-white rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="توقيع المستلم عند إتمام النقل..." />
               </div>

               <div>
                  <label className="block text-xs font-bold text-slate-700 mx-1 mb-1">{isAr ? "الحالة" : "Status"}</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
                     <option value="waiting-approval">بانتظار موافقة الوجهة (Waiting Approval)</option>
                     <option value="pending">في الانتظار (Pending)</option>
                     <option value="assigned">تم تعيين الناقل (Assigned)</option>
                     <option value="in-transit">جاري في المسار الشرياني (In Transit)</option>
                     <option value="completed">تم استلام المريض بالوجهة (Completed)</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-700 mx-1 mb-1">{isAr ? "عامل النقل (Porter)" : "Porter"}</label>
                  <input type="text" value={formData.assignedPorter} onChange={e => setFormData({...formData, assignedPorter: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
               </div>

               <div>
                  <label className="block text-xs font-bold text-slate-700 mx-1 mb-1">{isAr ? "نوع النقل والتقييم السريري" : "Type"}</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
                     <option value="Diagnostic">عادي - تشخيص (Diagnostic)</option>
                     <option value="Critical Transfer">عناية حرجة بمرافقة ممرض (Critical Transfer)</option>
                     <option value="Post-Op Transfer">بعد العمليات إفاقة (Post-Op)</option>
                     <option value="Discharge">خروج من المستشفى (Discharge)</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-700 mx-1 mb-1">{isAr ? "فئة العزل الوقائي (Isolation Category)" : "Isolation Category"}</label>
                  <input type="text" list="iso-categories" value={formData.isolationCategory} onChange={e => setFormData({...formData, isolationCategory: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={isAr ? "لا يوجد عزل / اختر..." : "None / Select..."} />
                  <datalist id="iso-categories">
                     <option value="Contact Isolation (عزل تلامسي)" />
                     <option value="Droplet Isolation (عزل رذاذ)" />
                     <option value="Airborne Isolation (عزل هوائي)" />
                     <option value="Protective Isolation (عزل وقائي)" />
                     <option value="None (لا يوجد عزل)" />
                  </datalist>
               </div>
               <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mx-1 mb-1">{isAr ? "المعدات المطلوبة للنقل والأكسجين" : "Equipment"}</label>
                  <input type="text" value={formData.equipmentNeeded} onChange={e => setFormData({...formData, equipmentNeeded: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Wheelchair, Stretcher, O2..." />
               </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl shadow-inner mt-2">
               <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition cursor-pointer">
                 {isAr ? "إلغاء النافذة" : "Cancel"}
               </button>
               <button onClick={handleSave} className="px-6 py-2.5 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer">
                 <Save size={16} />
                 {isAr ? "اعتماد حفظ مسار النقل والإشعارات" : "Save changes"}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}