import React, { useState } from "react";
import { ShieldCheck, FileSignature, AlertTriangle, Bug, Activity, CheckCircle, Search, Calendar, MapPin, Eye, FileText, Send, RefreshCw } from "lucide-react";

interface AppUser {
  id: string;
  nameAr: string;
  nameEn: string;
  department: string;
  staffId?: string;
  pin?: string;
}

interface InfectionControlProps {
  language: "ar" | "en";
  currentUser: AppUser | null;
  systemUsers: AppUser[];
  hospitalSettings: any;
}

export default function InfectionControlHub({ language, currentUser, systemUsers, hospitalSettings }: InfectionControlProps) {
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState<"incidents" | "audits" | "protocols">("incidents");
  const [searchTerm, setSearchTerm] = useState("");
  
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
    authModal.action();
    setAuthModal({ open: false, title: "", action: () => {}, input: "" });
    alert(isAr ? `تم توقيع نموذج الجودة/العدوى إلكترونياً بنجاح كـ ${authorizer.nameAr}` : `Infection/Quality form signed electronically successfully by ${authorizer.nameEn}`);
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-80px)]" style={{ direction: isAr ? "rtl" : "ltr" }}>
      
      {authModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-black text-slate-800 mb-4">{authModal.title}</h3>
            <p className="text-sm text-slate-500 mb-4">
              {isAr ? "إجراء توقيع إلكتروني لمكافحة العدوى: أدخل الكود الخاص بك (PIN/Staff ID) للاعتماد الموثق." : "Infection Control Electronic Signature: Enter your access code (PIN/Staff ID) to authorize."}
            </p>
            <input 
              type="password"
              autoFocus
              placeholder={isAr ? "رمز التوقيع..." : "Signature code..."}
              className="w-full border-2 border-slate-200 rounded-lg p-3 text-center tracking-widest font-bold focus:border-emerald-500 outline-none mb-4"
              value={authModal.input}
              onChange={(e) => setAuthModal({ ...authModal, input: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && executeAuth()}
            />
            <div className="flex gap-3">
              <button onClick={() => setAuthModal({ ...authModal, open: false })} className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition">
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button onClick={executeAuth} className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition">
                {isAr ? "توقيع موثق" : "Secure Sign"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
              <span>{isAr ? "نظام مكافحة العدوى الشامل" : "Comprehensive Infection Control"}</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {isAr ? "أدوات متكاملة لرصد العدوى، تطبيق المعايير، وتلقي البلاغات الفورية بالمستشفى." : "Integrated tools for infection tracking, standards compliance, and instant hospital reporting."}
            </p>
          </div>
          <button 
            onClick={() => confirmSignature(() => console.log("New Protocol"), isAr ? "توقيع لبدء بلاغ / جولة إشرافية جديدة" : "Sign to initiate incident/audit")}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow flex items-center gap-2 transition"
          >
            <Activity className="h-4 w-4" />
            {isAr ? "رصد جديد" : "New Report"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-emerald-50 opacity-50 group-hover:scale-110 transition shrink-0"><ShieldCheck className="h-24 w-24" /></div>
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider relative z-10">{isAr ? "الالتزام بالمعايير" : "Standards Compliance"}</h3>
            <p className="text-3xl font-black text-slate-800 mt-2 relative z-10">98.2%</p>
            <p className="text-[10px] text-emerald-600 font-bold mt-1 relative z-10">{isAr ? "تقييم الجولات الأسبوعي" : "Weekly Audit Score"}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-amber-50 opacity-50 group-hover:scale-110 transition shrink-0"><Bug className="h-24 w-24" /></div>
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider relative z-10">{isAr ? "العدوى المكتسبة" : "HAI Cases"}</h3>
            <p className="text-3xl font-black text-slate-800 mt-2 relative z-10">0.4%</p>
            <p className="text-[10px] text-emerald-600 font-bold mt-1 relative z-10">{isAr ? "أقل من المعدل الوطني" : "Below National Avg"}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-rose-50 opacity-50 group-hover:scale-110 transition shrink-0"><AlertTriangle className="h-24 w-24" /></div>
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider relative z-10">{isAr ? "حالات عزل مفعلة" : "Active Isolations"}</h3>
            <p className="text-3xl font-black text-slate-800 mt-2 relative z-10">3</p>
            <p className="text-[10px] font-bold mt-1 relative z-10 text-rose-600">{isAr ? "تحت الرقابة المباشرة" : "Under Direct Monitor"}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-blue-50 opacity-50 group-hover:scale-110 transition shrink-0"><CheckCircle className="h-24 w-24" /></div>
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider relative z-10">{isAr ? "نظافة الأيدي" : "Hand Hygiene"}</h3>
            <p className="text-3xl font-black text-slate-800 mt-2 relative z-10">92%</p>
            <p className="text-[10px] text-emerald-600 font-bold mt-1 relative z-10">{isAr ? "حسب مراقبة الكاميرات الذكية" : "Via Smart Vision Audits"}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex gap-1 border-b border-slate-100 bg-slate-50/50 p-2 overflow-x-auto">
            {["incidents", "audits", "protocols"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab 
                    ? "bg-emerald-100 text-emerald-700" 
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {tab === "incidents" ? (isAr ? "سجل البلاغات والوقائع" : "Incident Log") :
                 tab === "audits" ? (isAr ? "الجولات ومراقبة البيئة" : "Audits & Environment") :
                 (isAr ? "بروتوكولات التطهير" : "Disinfection Protocols")}
              </button>
            ))}
          </div>

          <div className="p-6 min-h-[300px] flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <ShieldCheck className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-bold">
                {isAr ? "قريباً: يتم جلب بيانات العدوى الحية من لوحة القيادة..." : "Coming Soon: Fetching live infection data pipeline..."}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
