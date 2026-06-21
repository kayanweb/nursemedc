import React, { useState, useEffect } from "react";
import { Users, FileSignature, AlertTriangle, Activity, BarChart, ShieldAlert, Award, Star, Search, Filter, Stethoscope, Briefcase, Plus, Send, RefreshCw, Layers, Check, X, ClipboardCheck, CheckCircle } from "lucide-react";
import { useFirestoreSync } from "../hooks/useFirestoreSync";
import { saveSetting, syncSetting } from "../lib/firestoreService";

interface AppUser {
  id: string;
  nameAr: string;
  nameEn: string;
  department: string;
  staffId?: string;
  pin?: string;
  role?: string;
}

interface EvaluationSystemProps {
  language: "ar" | "en";
  currentUser: AppUser | null;
  systemUsers: AppUser[];
  hospitalSettings: any;
}

interface EvaluationRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  type: "clinical" | "behavioral" | "kpi";
  scores: Record<string, number>; // Criteria ID -> 1 to 5 score
  overallScore: number;
  comments: string;
  evaluatedBy: string;
  evaluatedById: string;
  date: string;
}

const CLINICAL_CRITERIA = [
  { id: "c1", ar: "إدارة الحالات الحرجة", en: "Critical Case Management" },
  { id: "c2", ar: "مكافحة العدوى والتعقيم", en: "Infection Control & Sterilization" },
  { id: "c3", ar: "إعطاء الأدوية بدقة", en: "Medication Administration Accuracy" },
  { id: "c4", ar: "التوثيق الطبي السليم", en: "Clinical Documentation" },
  { id: "c5", ar: "التجاوب مع حالات الطوارئ", en: "Emergency Response" }
];

const BEHAVIORAL_CRITERIA = [
  { id: "b1", ar: "الالتزام بأوقات الدوام", en: "Attendance & Punctuality" },
  { id: "b2", ar: "العمل الجماعي", en: "Teamwork & Collaboration" },
  { id: "b3", ar: "التواصل مع المرضى", en: "Patient Communication" },
  { id: "b4", ar: "إدارة الضغوط", en: "Stress Management" },
  { id: "b5", ar: "الالتزام بالزي الرسمي", en: "Uniform Compliance" }
];

const KPI_CRITERIA = [
  { id: "k1", ar: "نسبة إنجاز المهام اليومية", en: "Daily Task Completion %" },
  { id: "k2", ar: "عدد الأخطاء الدوائية (عكسي)", en: "Medication Errors (Inverted)" },
  { id: "k3", ar: "حضور التدريبات", en: "Training Attendance" },
  { id: "k4", ar: "رضا المرضى (أثناء المناوبة)", en: "Patient Satisfaction" }
];

export default function EmployeeEvaluationSystem({ language, currentUser, systemUsers, hospitalSettings }: EvaluationSystemProps) {
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState<"assessments" | "new_eval">("assessments");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    return syncSetting("baheya_evaluations", (data) => {
      if (data && Array.isArray(data)) {
        setEvaluations(data);
      }
      setIsLoaded(true);
    });
  }, []);

  // New Eval State
  const [evalType, setEvalType] = useState<"clinical" | "behavioral" | "kpi">("clinical");
  const [selectedEmp, setSelectedEmp] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [evalComments, setEvalComments] = useState("");

  // Custom auth modal state for electronic signatures
  const [authModal, setAuthModal] = useState<{
    open: boolean;
    title: string;
    action: () => void;
    input: string;
  }>({ open: false, title: "", action: () => {}, input: "" });

  const confirmSignature = (actionFn: () => void, title: string) => {
    setAuthModal({
      open: true,
      title,
      input: "",
      action: actionFn
    });
  };

  const executeAuth = () => {
    const code = authModal.input;
    if (!code) return;

    const authorizer = systemUsers.find(u => u.staffId === code || u.pin === code || u.id === code);
    if (!authorizer) {
      alert(isAr ? "الكود التعريفي غير صحيح." : "Invalid employee ID or PIN.");
      return;
    }
    
    // Check permission to evaluate
    if (!["head_nurse", "admin", "quality", "president", "medical_director", "supervisor"].includes(authorizer.role || "")) {
      alert(isAr ? "ليس لديك صلاحية لإضافة تقييم." : "You do not have permission to evaluate.");
      return;
    }

    authModal.action();
    setAuthModal({ open: false, title: "", action: () => {}, input: "" });
    alert(isAr ? `تم التوقيع واعتماد التقييم إلكترونياً بنجاح כـ ${authorizer.nameAr}` : `Evaluation electronically authorized by ${authorizer.nameEn}`);
  };

  const getCriteriaList = () => {
    if (evalType === "clinical") return CLINICAL_CRITERIA;
    if (evalType === "behavioral") return BEHAVIORAL_CRITERIA;
    return KPI_CRITERIA;
  };

  const handleScoreChange = (id: string, val: number) => {
    setScores(prev => ({ ...prev, [id]: val }));
  };

  const submitEvaluation = () => {
    if (!selectedEmp) {
      alert(isAr ? "الرجاء اختيار الموظف أولاً" : "Please select an employee first");
      return;
    }
    const criteriaList = getCriteriaList();
    if (Object.keys(scores).length < criteriaList.length) {
      alert(isAr ? "الرجاء تقييم جميع المعايير" : "Please score all criteria elements");
      return;
    }

    const total: number = Object.values(scores).reduce<number>((acc: number, v: unknown) => {
      return acc + (typeof v === 'number' ? v : 0);
    }, 0);
    const avg: number = total / criteriaList.length;

    const empObj = systemUsers.find(u => u.id === selectedEmp);

    const newEval: EvaluationRecord = {
      id: `eval-${Date.now()}`,
      employeeId: selectedEmp,
      employeeName: empObj ? (isAr ? empObj.nameAr : empObj.nameEn) : "Unknown",
      department: empObj?.department || "General",
      type: evalType,
      scores: { ...scores },
      overallScore: Number(avg.toFixed(1)),
      comments: evalComments,
      evaluatedBy: currentUser ? (isAr ? currentUser.nameAr : currentUser.nameEn) : "System",
      evaluatedById: currentUser?.id || "N/A",
      date: new Date().toISOString()
    };

    const nextList = [newEval, ...evaluations];
    setEvaluations(nextList);
    saveSetting("baheya_evaluations", nextList);
    
    // Reset
    setScores({});
    setEvalComments("");
    setSelectedEmp("");
    setActiveTab("assessments");
  };

  const getTypeName = (t: string) => {
    if (t === "clinical") return isAr ? "كفاءة سريرية" : "Clinical";
    if (t === "behavioral") return isAr ? "سلوكي وانضباط" : "Behavioral";
    return isAr ? "مؤشرات أداء KPI" : "KPI Metrics";
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-80px)]" style={{ direction: isAr ? "rtl" : "ltr" }}>
      
      {authModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-0 overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
               <h3 className="text-sm font-bold">{authModal.title}</h3>
               <button onClick={() => setAuthModal({ ...authModal, open: false })} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-6">
              <p className="text-xs text-slate-500 mb-4 leading-relaxed font-bold">
                {isAr ? "مطلوب التوقيع الإلكتروني الإلزامي: يرجى إدخال الكود الوظيفي (Staff ID) أو الرمز السري (PIN) للتأكيد والتوقيع." : "Mandatory E-Signature required: Please enter your Staff ID or PIN to sign & authorize."}
              </p>
              <input 
                type="password"
                autoFocus
                placeholder={isAr ? "رمز التوقيع..." : "Signature code..."}
                className="w-full border-2 border-slate-200 bg-slate-50 rounded-xl p-3 text-center tracking-widest font-bold text-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none mb-6 transition-all"
                value={authModal.input}
                onChange={(e) => setAuthModal({ ...authModal, input: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && executeAuth()}
              />
              <div className="flex gap-2">
                <button onClick={() => setAuthModal({ ...authModal, open: false })} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition text-sm">
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <button onClick={executeAuth} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition shadow-sm text-sm">
                  {isAr ? "توقيع واعتماد" : "Sign & Authorize"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-gradient-to-l from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl shadow-lg border border-indigo-500/30 p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="relative z-10">
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Award className="h-7 w-7 text-indigo-400" />
              <span>{isAr ? "نظام التقييم والاعتماد الوظيفي" : "Employee Evaluation & Competency System"}</span>
            </h1>
            <p className="text-indigo-200 text-sm mt-2 max-w-2xl font-medium leading-relaxed">
              {isAr ? "منصة متكاملة لإدارة تقييمات الأداء الدورية، ومتابعة الجدارات المهنية، ورصد الكفاءة السريرية للكوادر والممرضين لضمان أعلى معايير الجودة الشاملة." : "Integrated platform for managing periodic performance evaluations, tracking professional competencies, and monitoring clinical efficiency."}
            </p>
          </div>
          <button 
            onClick={() => setActiveTab("new_eval")}
            className="relative z-10 whitespace-nowrap px-6 py-3 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/50 border border-indigo-400/50 text-white font-bold shadow-lg flex items-center gap-2 transition-all backdrop-blur-md"
          >
            <Plus className="h-5 w-5" />
            {isAr ? "إجراء تقييم جديد" : "New Evaluation"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full -mr-8 -mt-8"></div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><ClipboardCheck className="h-5 w-5" /></div>
              <h3 className="font-bold text-slate-600 text-sm">{isAr ? "إجمالي التقييمات" : "Total Evals"}</h3>
            </div>
            <p className="text-3xl font-black text-slate-800">{evaluations.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -mr-8 -mt-8"></div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Activity className="h-5 w-5" /></div>
              <h3 className="font-bold text-slate-600 text-sm">{isAr ? "متوسط التقييم العام" : "Avg Overall Score"}</h3>
            </div>
            <p className="text-3xl font-black text-slate-800">
              {evaluations.length > 0 ? (evaluations.reduce((a, b) => a + b.overallScore, 0) / evaluations.length).toFixed(1) : "0.0"} <span className="text-sm text-slate-400 font-bold">/ 5.0</span>
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -mr-8 -mt-8"></div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Stethoscope className="h-5 w-5" /></div>
              <h3 className="font-bold text-slate-600 text-sm">{isAr ? "تقييمات سريرية" : "Clinical Evals"}</h3>
            </div>
            <p className="text-3xl font-black text-slate-800">{evaluations.filter(e => e.type === "clinical").length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-bl-full -mr-8 -mt-8"></div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Users className="h-5 w-5" /></div>
              <h3 className="font-bold text-slate-600 text-sm">{isAr ? "سلوكي ومؤشرات" : "Behavioral/KPI"}</h3>
            </div>
            <p className="text-3xl font-black text-slate-800">{evaluations.filter(e => e.type !== "clinical").length}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex gap-2 border-b border-slate-100 bg-slate-50/80 p-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab("assessments")}
              className={`px-5 py-2.5 text-sm font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === "assessments" 
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-200" 
                  : "text-slate-500 hover:bg-slate-200/50 border border-transparent"
              }`}
            >
              <Layers size={16} />
              {isAr ? "سجل التقييمات والأداء" : "Assessments Log"}
            </button>
            <button
              onClick={() => setActiveTab("new_eval")}
              className={`px-5 py-2.5 text-sm font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === "new_eval" 
                   ? "bg-white text-indigo-700 shadow-sm border border-slate-200" 
                   : "text-slate-500 hover:bg-slate-200/50 border border-transparent"
              }`}
            >
              <FileSignature size={16} />
              {isAr ? "نموذج تقييم جديد" : "New Evaluation Form"}
            </button>
          </div>

          <div className="p-0">
            {activeTab === "assessments" && (
              <div className="flex flex-col">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-white">
                  <div className="relative flex-1 max-w-sm">
                    <Search className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4`} />
                    <input 
                      type="text"
                      className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-2 ${isAr ? 'pr-10 pl-3' : 'pl-10 pr-3'} text-sm focus:border-indigo-500 outline-none`}
                      placeholder={isAr ? "بحث بالاسم أو القسم..." : "Search by name or unit..."}
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
                    <Filter className="h-4 w-4" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className={`text-xs text-slate-500 bg-slate-50 uppercase font-black ${isAr ? 'text-right' : 'text-left'} border-b border-slate-100`}>
                      <tr>
                        <th className="px-6 py-4">{isAr ? "الموظف/القسم" : "Employee/Dept"}</th>
                        <th className="px-6 py-4">{isAr ? "نوع التقييم" : "Eval Type"}</th>
                        <th className="px-6 py-4">{isAr ? "الدرجة" : "Score"}</th>
                        <th className="px-6 py-4">{isAr ? "المُقَيِّم" : "Evaluator"}</th>
                        <th className="px-6 py-4">{isAr ? "التاريخ" : "Date"}</th>
                        <th className="px-6 py-4 text-center">{isAr ? "التفاصيل" : "Details"}</th>
                      </tr>
                    </thead>
                    <tbody className={`${isAr ? 'text-right' : 'text-left'} divide-y divide-slate-50`}>
                      {evaluations.filter(e => e.employeeName.includes(searchTerm) || e.department.includes(searchTerm)).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                             <ShieldAlert className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                             {isAr ? "لا توجد تقييمات مطابقة" : "No evaluations found"}
                          </td>
                        </tr>
                      ) : (
                        evaluations.filter(e => e.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || e.department.toLowerCase().includes(searchTerm.toLowerCase())).map(ev => (
                          <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800">{ev.employeeName}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{ev.department}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase ${
                                ev.type === 'clinical' ? 'bg-blue-100 text-blue-700' :
                                ev.type === 'behavioral' ? 'bg-amber-100 text-amber-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {getTypeName(ev.type)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`font-black text-lg ${ev.overallScore >= 4 ? 'text-emerald-600' : ev.overallScore >= 3 ? 'text-amber-500' : 'text-rose-500'}`}>
                                  {ev.overallScore}
                                </span>
                                <span className="text-xs text-slate-400">/ 5</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-700 text-xs">{ev.evaluatedBy}</td>
                            <td className="px-6 py-4 text-xs font-mono text-slate-500">{new Date(ev.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-center">
                              <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                                <Search size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "new_eval" && (
              <div className="p-6 md:p-8 space-y-8 bg-white max-w-4xl mx-auto border-x border-slate-100 shadow-sm min-h-[500px]">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700">{isAr ? "الموظف المُراد تقييمه" : "Employee to Evaluate"}</label>
                    <select 
                      value={selectedEmp}
                      onChange={(e) => setSelectedEmp(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">{isAr ? "-- اختر الموظف --" : "-- Select Employee --"}</option>
                      {systemUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {isAr ? u.nameAr : u.nameEn} ({u.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700">{isAr ? "نوع التقييم" : "Evaluation Type"}</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => setEvalType("clinical")} className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col justify-center items-center gap-1 ${evalType === 'clinical' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-inner' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        <Stethoscope size={16} />
                        {isAr ? "سريري" : "Clinical"}
                      </button>
                      <button onClick={() => setEvalType("behavioral")} className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col justify-center items-center gap-1 ${evalType === 'behavioral' ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-inner' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        <Users size={16} />
                        {isAr ? "سلوكي" : "Behavioral"}
                      </button>
                      <button onClick={() => setEvalType("kpi")} className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col justify-center items-center gap-1 ${evalType === 'kpi' ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-inner' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        <BarChart size={16} />
                        {isAr ? "مؤشرات أداء" : "KPIs"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-2">{isAr ? "معايير التقييم والجدارات (1 إلى 5)" : "Evaluation Criteria Categories (1 to 5)"}</h3>
                  <div className="bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden">
                    {getCriteriaList().map((crit, idx) => (
                      <div key={crit.id} className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${idx !== getCriteriaList().length - 1 ? 'border-b border-slate-100' : ''}`}>
                        <div className="font-bold text-slate-700 text-sm max-w-sm">
                          {isAr ? crit.ar : crit.en}
                        </div>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map(num => (
                            <button
                              key={num}
                              onClick={() => handleScoreChange(crit.id, num)}
                              className={`w-10 h-10 rounded-xl font-black text-sm transition-all border ${
                                scores[crit.id] === num 
                                  ? num <= 2 ? 'bg-rose-500 text-white border-rose-600 shadow-md transform scale-110' : num === 3 ? 'bg-amber-500 text-white border-amber-600 shadow-md transform scale-110' : 'bg-emerald-500 text-white border-emerald-600 shadow-md transform scale-110'
                                  : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-100 hover:border-slate-300'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700">{isAr ? "ملاحظات وتوجيهات المقيم" : "Evaluator Notes & Guidance"}</label>
                  <textarea 
                    rows={4}
                    value={evalComments}
                    onChange={(e) => setEvalComments(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none transition-all"
                    placeholder={isAr ? "أضف تفاصيل ونقاط القوة والضعف ومقترحات التطوير..." : "Enter details, strengths, weaknesses and development plans..."}
                  ></textarea>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                   <button 
                     onClick={() => confirmSignature(submitEvaluation, isAr ? "توقيع واعتماد التقييم" : "Sign & Authorize Evaluation")}
                     className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-600/30 flex items-center gap-3 transition-transform hover:-translate-y-0.5 active:translate-y-0"
                   >
                     <CheckCircle size={18} />
                     {isAr ? "اعتماد التقييم النهائي والتوقيع" : "Submit & Sign Final Evaluation"}
                   </button>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
