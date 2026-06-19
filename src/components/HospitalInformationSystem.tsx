import React, { useState } from "react";
import { Users, Stethoscope, BedDouble, Scissors, Pill, Receipt, Microscope, Settings, TrendingUp, Activity, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import PatientRegistration from "./PatientRegistration";
import EMRDashboard from "./EMRDashboard";
import WardNurseDashboard from "./WardNurseDashboard";
import OperatingTheaterBoard from "./OperatingTheaterBoard";
import PharmacyInventory from "./PharmacyInventory";
import BillingInsurance from "./BillingInsurance";
import LISRISDashboard from "./LISRISDashboard";
import NursingDirectorDashboard from "./NursingDirectorDashboard";
import NursingSupervisorDashboard from "./NursingSupervisorDashboard";
import HeadNurseDashboard from "./HeadNurseDashboard";
import { HISProvider } from "../context/HISContext";

interface Props {
  language: "en" | "ar";
}

export default function HospitalInformationSystem({ language }: Props) {
  const [activeSubTab, setActiveSubTab] = useState("adt");

  const tabs = [
    { id: "adt", labelAr: "الاستقبال والتسجيل (ADT)", labelEn: "Reception & ADT", icon: Users },
    { id: "opd", labelAr: "العيادات الإلكترونية (OPD)", labelEn: "Outpatient (OPD)", icon: Stethoscope },
    { id: "ipd", labelAr: "الأقسام الداخلية (IPD)", labelEn: "Inpatient Wards (IPD)", icon: BedDouble },
    { id: "ot", labelAr: "العمليات الجراحية (OT)", labelEn: "Operating Theater", icon: Scissors },
    { id: "pharmacy", labelAr: "الصيدلية والمخازن", labelEn: "Pharmacy & Stores", icon: Pill },
    { id: "billing", labelAr: "الحسابات والمطالبات", labelEn: "Billing & Claims", icon: Receipt },
    { id: "lis_ris", labelAr: "المعمل والأشعة (LIS/RIS)", labelEn: "Lab & Radiology", icon: Microscope },
    { id: "admin", labelAr: "إعدادات المستشفى", labelEn: "Hospital Settings", icon: Settings },
    { id: "cno", labelAr: "شاشة الإدارة العليا CNO", labelEn: "CNO Dashboard", icon: TrendingUp },
    { id: "supervisor", labelAr: "إشراف أرضي وتوجيه سريع", labelEn: "Floor Supervisor", icon: Activity },
    { id: "headnurse", labelAr: "إدارة القسم والكارديكس", labelEn: "Head Nurse View", icon: Users },
  ];

  return (
    <HISProvider>
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="p-4 space-y-4"
      >
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl shadow-xl border border-blue-800/50 p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-white relative overflow-hidden" dir={language === "ar" ? "rtl" : "ltr"}>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
              <LayoutGrid className="w-8 h-8 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">{language === "ar" ? "نظام إدارة المستشفى الشامل (HIS)" : "Complete Hospital Information System (HIS)"}</h1>
              <p className="text-sm text-blue-200/80 mt-1">{language === "ar" ? "واجهة الإدارة المركزية الموحدة لجميع الأقسام والبرامج" : "Centralized Unified Management Interface for all departments"}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-2 overflow-x-auto custom-scrollbar" dir={language === "ar" ? "rtl" : "ltr"}>
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-3 rounded-xl text-[11px] font-black transition-all whitespace-nowrap shadow-sm border overflow-hidden ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-700 shadow-blue-500/30"
                      : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {isActive && <motion.div layoutId="his-active-tab-indicator" className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 z-0" />}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{language === "ar" ? tab.labelAr : tab.labelEn}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl border border-slate-200/60 min-h-[600px] overflow-hidden shadow-inner relative">
          <AnimatePresence mode="wait">
            <motion.div 
               key={activeSubTab}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               transition={{ duration: 0.2 }}
               className="h-full"
            >
              {activeSubTab === "adt" && <PatientRegistration language={language} />}
              {activeSubTab === "opd" && <EMRDashboard language={language} />}
              {activeSubTab === "ipd" && <WardNurseDashboard language={language} />}
              {activeSubTab === "ot" && <OperatingTheaterBoard language={language} />}
              {activeSubTab === "pharmacy" && <PharmacyInventory language={language} />}
              {activeSubTab === "billing" && <BillingInsurance language={language} />}
              {activeSubTab === "lis_ris" && <LISRISDashboard language={language} />}
              {activeSubTab === "admin" && <div className="p-10 text-center animate-pulse"><p className="text-pink-600 font-bold mb-2">🛡️ تم ترحيل هذه الشاشة</p><p className="text-slate-500 font-bold text-sm">تم نقل أدوات إدارة النظام للمركز الرئيسي: لوحة الإدارة والدعم الأكاديمي (WSD Console).</p></div>}
              {activeSubTab === "cno" && <NursingDirectorDashboard language={language} />}
              {activeSubTab === "supervisor" && <NursingSupervisorDashboard language={language} />}
              {activeSubTab === "headnurse" && <HeadNurseDashboard language={language} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </HISProvider>
  );
}
