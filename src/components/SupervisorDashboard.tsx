import React, { useState, useEffect } from "react";
import { 
  User, 
  ClipboardCheck, 
  ClipboardList,
  FileText, 
  CheckSquare, 
  Search, 
  Users, 
  AlertTriangle, 
  FileSignature, 
  WifiOff, 
  ShieldAlert, 
  UserCheck, 
  Calendar, 
  Sliders, 
  Save, 
  Plus, 
  Trash2, 
  Heart, 
  Shield, 
  RefreshCw,
  Share2,
  Copy,
  Check,
  BellRing,
  Award
} from "lucide-react";
import { db } from "../firebase";
import { AppUser } from "../types";
import SupervisorDailySuite from "./SupervisorDailySuite";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface SupervisorDashboardProps {
  language: "ar" | "en";
  currentUser: AppUser;
  systemUsers: AppUser[];
  departments: string[];
  dailyDuties: any[];
  saveDailyDuty: (duty: any) => Promise<void>;
  emergencyTeams: any[];
  saveEmergencyTeam: (team: any) => Promise<void>;
}

export default function SupervisorDashboard({ 
  language,
  currentUser,
  systemUsers = [],
  departments = [],
  dailyDuties = [],
  saveDailyDuty,
  emergencyTeams = [],
  saveEmergencyTeam
}: SupervisorDashboardProps) {
  const isAr = language === "ar";
  const [activeSubTab, setActiveSubTab] = useState<"duties" | "emergency" | "rounding" | "reports" | "approvals" | "dailySuite">("dailySuite");
  const [isOnline, setIsOnline] = useState(true);
  
  // Format today's date as YYYY-MM-DD
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString);
  const [selectedDutyDept, setSelectedDutyDept] = useState<string>(departments[0] || "EMERGENCY UNIT");
  const [selectedStaffIdForDuty, setSelectedStaffIdForDuty] = useState<string>("");
  const [selectedStaffDutyRole, setSelectedStaffDutyRole] = useState<string>("");
  const [dutySearchQuery, setDutySearchQuery] = useState<string>("");
  const [copyStatus, setCopyStatus] = useState<boolean>(false);
  
  // Simulator states
  const [simActive, setSimActive] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<number>(0);

  // Status/Rounds states
  const [audits, setAudits] = useState([
    { id: 1, nameAr: "وحدة الرعاية المركزة (ICU)", nameEn: "ICU", status: "audited" },
    { id: 2, nameAr: "قسم الطوارئ", nameEn: "ER", status: "pending" },
    { id: 3, nameAr: "قسم تحضير الكيماوي", nameEn: "Chemo Unit Prepn", status: "pending" },
  ]);

  const [pendingApprovals, setPendingApprovals] = useState([
    { id: 1, titleAr: "طلب إجازة طارئة للممرض أحمد", titleEn: "Urgent leave request - Nurse Ahmed" },
    { id: 2, titleAr: "طلب صرف مستلزمات عاجلة للقسم", titleEn: "Urgent supplies requisition for Unit" },
  ]);

  useEffect(() => {
    setIsOnline(!!db);
  }, []);

  const toggleAudit = (id: number) => {
    setAudits(audits.map(a => a.id === id ? {...a, status: a.status === "audited" ? "pending" : "audited"} : a));
  };

  // Find existing duty assignment for selectedDate + selectedDutyDept
  const currentDutyAssignment = dailyDuties.find(
    (d) => d.date === selectedDate && d.department === selectedDutyDept
  );

  // Find existing emergency team assignment for selectedDate
  const currentEmergencyTeam = emergencyTeams.find(
    (t) => t.date === selectedDate
  );

  // Handlers for Duty Assignment
  const handleAddStaffToDuty = async () => {
    if (!selectedStaffIdForDuty) return;
    const staff = systemUsers.find(u => u.id === selectedStaffIdForDuty);
    if (!staff) return;

    const existingAssignedIds = currentDutyAssignment?.assignedStaffIds || [];
    const existingAssignedNames = currentDutyAssignment?.assignedStaffNames || [];
    const existingTasks = currentDutyAssignment?.assignedTasks ? { ...currentDutyAssignment.assignedTasks } : {};

    if (existingAssignedIds.includes(staff.id)) {
      alert(isAr ? "هذا الموظف مضاف بالفعل لهذه المناوبة اليومية!" : "This employee is already assigned to this daily shift!");
      return;
    }

    const updatedIds = [...existingAssignedIds, staff.id];
    // Keep names in both formats for clarity
    const nameStr = `${staff.nameAr} (${staff.nameEn})`;
    const updatedNames = [...existingAssignedNames, nameStr];
    
    // Assign specific duty
    if (selectedStaffDutyRole) {
      existingTasks[staff.id] = selectedStaffDutyRole;
    } else {
      existingTasks[staff.id] = isAr ? "جرد روتيني" : "Routine Ward Duty";
    }

    const newAssignment = {
      id: currentDutyAssignment?.id || `${selectedDate}_${selectedDutyDept}_duty`,
      date: selectedDate,
      department: selectedDutyDept,
      assignedStaffIds: updatedIds,
      assignedStaffNames: updatedNames,
      assignedTasks: existingTasks,
      assignedBy: currentUser.nameAr || currentUser.nameEn || "Supervisor",
      updatedAt: new Date().toISOString()
    };

    try {
      await saveDailyDuty(newAssignment);
      setSelectedStaffIdForDuty("");
      setSelectedStaffDutyRole("");
    } catch (err) {
      console.error(err);
      alert("Error saving duty assignment to Cloud Firestore.");
    }
  };

  const handleRemoveStaffFromDuty = async (staffId: string) => {
    if (!currentDutyAssignment) return;
    
    const idx = currentDutyAssignment.assignedStaffIds.indexOf(staffId);
    if (idx === -1) return;

    const updatedIds = currentDutyAssignment.assignedStaffIds.filter((id: string) => id !== staffId);
    const updatedNames = currentDutyAssignment.assignedStaffNames.filter((_: any, i: number) => i !== idx);
    const existingTasks = { ...(currentDutyAssignment.assignedTasks || {}) };
    delete existingTasks[staffId];

    const updatedAssignment = {
      ...currentDutyAssignment,
      assignedStaffIds: updatedIds,
      assignedStaffNames: updatedNames,
      assignedTasks: existingTasks,
      assignedBy: currentUser.nameAr || currentUser.nameEn || "Supervisor",
      updatedAt: new Date().toISOString()
    };

    try {
      await saveDailyDuty(updatedAssignment);
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Emergency Team Assign
  const handleAssignEmergencyRole = async (roleKey: string, staffId: string) => {
    const rolesObj = currentEmergencyTeam?.roles ? { ...currentEmergencyTeam.roles } : {};
    
    if (staffId === "") {
      delete rolesObj[roleKey];
    } else {
      const staff = systemUsers.find(u => u.id === staffId);
      if (staff) {
        rolesObj[roleKey] = {
          id: staff.id,
          nameAr: staff.nameAr,
          nameEn: staff.nameEn,
          staffId: staff.staffId
        };
      }
    }

    const newTeamAssignment = {
      id: currentEmergencyTeam?.id || `${selectedDate}_emergency_team`,
      date: selectedDate,
      roles: rolesObj,
      assignedBy: currentUser.nameAr || currentUser.nameEn || "Supervisor",
      updatedAt: new Date().toISOString()
    };

    try {
      await saveEmergencyTeam(newTeamAssignment);
    } catch (err) {
      console.error(err);
      alert("Error saving emergency team assignment.");
    }
  };

  // Generate WhatsApp text report for sharing
  const getTeamShareString = () => {
    let header = `*🏥 تقرير توزيع النوبتجية وفرق الطوارئ ليوم ${selectedDate}* \n`;
    header += `*مركز المستشفى لعلاج أورام السيدات*\n`;
    header += `-------------------------------------------\n\n`;

    header += `*🚨 طاقم الكود بلو وجدول الطوارئ اليومي:*\n`;
    const emergencyRolesDef = [
      { key: "codeBlueLeader", ar: "قائد فريق الكود بلو (Code Blue Leader)", en: "Code Blue Leader" },
      { key: "defibOperator", ar: "جهاز الصدمات والإنعاش (CPR / Defib)", en: "CPR/Defib Operator" },
      { key: "airwayManager", ar: "مسلك الهواء والتنفس (Airway / Oxygen)", en: "Airway & Vent" },
      { key: "medRunner", ar: "الأدوية والمحاليل الطارئة (Meds Runner)", en: "Meds Runner" },
      { key: "scribeNurse", ar: "ممرض تسجيل الملاحظات (Scribe Nurse)", en: "Scribe/Recorder" },
      { key: "codeRedWarden", ar: "مسؤول مكافحة الحريق الإخلاء (Code Red)", en: "Code Red Fire Warden" },
      { key: "codeYellowCoord", ar: "منسق الكوارث والقيادة (Code Yellow)", en: "Code Yellow Coordinator" }
    ];

    emergencyRolesDef.forEach(role => {
      const asignee = currentEmergencyTeam?.roles?.[role.key];
      if (asignee) {
        header += `• *${role.ar}:* ${asignee.nameAr} [كود: ${asignee.staffId}]\n`;
      } else {
        header += `• *${role.ar}:* ⚠️ _بانتظار التعيين_\n`;
      }
    });

    header += `\n*📋 تعيينات المهام اليومية للأقسام (Daily Ward Duties):*\n`;
    departments.forEach(dept => {
      const assignment = dailyDuties.find(d => d.date === selectedDate && d.department === dept);
      const staffList = assignment?.assignedStaffNames || [];
      header += `• *${dept}:* `;
      if (staffList.length > 0) {
        header += `${staffList.join(" | ")}\n`;
      } else {
        header += `_لا يوجد تمريض معين للجرد بعد_\n`;
      }
    });

    header += `\n*تم الاعتماد والتحقق بواسطة مشرف التمريض:* ${currentUser.nameAr || currentUser.nameEn}\n`;
    header += `*نظام المستشفى للرعاية والتفتيش الذكي 🩺*`;
    return header;
  };

  const handleCopyToClipboard = () => {
    const text = getTeamShareString();
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2500);
    }).catch(err => {
      console.error("Failed to copy text: ", err);
    });
  };

  const tabs = [
    { id: "dailySuite", icon: ClipboardList, labelAr: "السجل اليومي للمشرف (4 شيتات)", labelEn: "Supervisor Daily 4-Form Suite" },
    { id: "duties", icon: Sliders, labelAr: "توزيع مهام الأقسام", labelEn: "Ward Duties" },
    { id: "emergency", icon: ShieldAlert, labelAr: "فريق الطوارئ والكود بلو", labelEn: "Emergency (Code Blue)" },
    { id: "rounding", icon: ClipboardCheck, labelAr: "المرور والتفتيش", labelEn: "Daily Inspector Rounds" },
    { id: "reports", icon: FileText, labelAr: "الأرشيف والتقارير", labelEn: "Performance Reports" },
    { id: "approvals", icon: FileSignature, labelAr: "طلبات معلقة", labelEn: "Pending Approvals" },
  ];

  // Code Blue Simulator steps
  const simSteps = [
    { title: "الأرقام السريعة 5555", desc: "الاتصال برقم الطوارئ الداخلي للإبلاغ فوراً.", nurse: "Scribe Nurse" },
    { title: "إنعاش قلبي رئوي CPR", desc: "يبدأ المسؤول بالضغطات الصدرية فوراً 30:2.", nurse: "CPR / Defib" },
    { title: "تأمين مسلك الهواء", desc: "تحضير وتركيب الأنبوبة الحنجرية وضخ الأكسجين.", nurse: "Airway & Vent" },
    { title: "شحن جهاز الصدمات", desc: "إيصال وضبط جهاز الصدمات DC وتحليل رسم القلب.", nurse: "CPR / Defib" },
    { title: "حقن إيبينفرين طارئ", desc: "تركيب كانيولا واسعة وحقن الأدوية والمنشطات في الموعد.", nurse: "Meds Runner" },
    { title: "تسجيل الملاحظات والوقت", desc: "تدوين جرعات الأدرينالين والـ Shock والمؤشرات الحيوية بدقة.", nurse: "Scribe Nurse" }
  ];

  const totalAssignedInAllDept = dailyDuties
    .filter(d => d.date === selectedDate)
    .reduce((sum, d) => sum + (d.assignedStaffIds?.length || 0), 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 text-slate-800" dir={isAr ? "rtl" : "ltr"}>
      {!isOnline && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-3">
          <WifiOff className="h-5 w-5 text-red-600" /> 
          <span className="text-xs font-bold font-sans">
            {isAr ? "تحذير: لا يوجد اتصال لشبكة السيرفر وقاعدة البيانات. البيانات قد تكون محلية ومؤقتة." : "Warning: No connection to Cloud database. Running in local fallback."}
          </span>
        </div>
      )}

      {/* Hero Card containing date selector and supervisor state */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-indigo-505/20 text-indigo-400 rounded-lg">
                <Shield className="h-5 w-5" />
              </span>
              <h1 className="text-xl font-black tracking-tight font-sans">
                {isAr ? "مركز تحكم وتوجيه المشرفين المعتمد" : "Clinical Supervisor Control suite"}
              </h1>
            </div>
            <p className="text-xs text-slate-350">
              {isAr 
                ? `مشرف النوبة النشط: ${currentUser.nameAr || currentUser.nameEn} | رتبة: ${currentUser.role}` 
                : `Active Duty Coordinator: ${currentUser.nameEn} | Role: ${currentUser.role}`}
            </p>
          </div>

          {/* DATE SELECTOR */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-800/80 p-2 rounded-xl border border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 px-1">
              <Calendar className="h-3 w-3 text-indigo-400" />
              {isAr ? "تاريخ المناوبة:" : "Duty Shift Date:"}
            </span>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-950 text-emerald-400 text-xs font-bold font-mono px-3 py-1 border border-indigo-500/30 rounded outline-none cursor-pointer focus:border-emerald-500 transition-all"
            />
            <button 
              onClick={() => setSelectedDate(getTodayString())}
              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white text-[10px] rounded font-bold transition-all"
            >
              {isAr ? "اليوم" : "Today"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs list inside supervisor page */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)} 
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all ${
                isActive 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15" 
                  : "bg-white border text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={14} className={isActive ? "text-white animate-pulse" : "text-slate-400"} />
              <span>{isAr ? tab.labelAr : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* ==================== SUB-TAB 0: DAILY INTEGRATED 4-FORM SUITE ==================== */}
      {activeSubTab === "dailySuite" && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fade-in text-slate-800">
          <div className="border-b border-slate-100 pb-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
                {isAr ? "سجل السوبرفايزر المالي والتشغيلي اليومي المعتمد" : "Approved Clinical Supervisor Daily Log & Census"}
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                {isAr ? "قم بملء المستندات والجرودات التشغيلية لليوم بشكل كامل لدقة الجودة والاعتماد." : "Complete the comprehensive daily workforce checklists, bed counts and rounding observations."}
              </p>
            </div>
          </div>
          <SupervisorDailySuite language={language} />
        </div>
      )}

      {/* ==================== SUB-TAB 1: DEPARTMENT DUTY ALLOCATION ==================== */}
      {activeSubTab === "duties" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b pb-3 border-slate-100">
              <span className="text-slate-400 text-[10px] block font-black uppercase font-mono">STEP 1</span>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-indigo-500" />
                {isAr ? "اختر القسم واليوم لتعيين الموظفين" : "Select Clinical Wing & Target Date"}
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 block mb-1">
                  {isAr ? "القسم السريري المستهدف:" : "Target Clinical Wing / Wing:"}
                </label>
                <select
                  value={selectedDutyDept}
                  onChange={(e) => setSelectedDutyDept(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* SEARCH STAFF ACCORD"> */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-[10px] font-black text-slate-500 block">
                  {isAr ? "ابحث عن ممرض/موظف لتعيينه بالجرد:" : "Find nurse to bind to this department:"}
                </label>
                <div className="relative">
                  <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={isAr ? "ابحث بالاسم أو كود التمريض..." : "Search by name or staff code..."}
                    value={dutySearchQuery}
                    onChange={(e) => setDutySearchQuery(e.target.value)}
                    className="w-full bg-slate-5 font-sans border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div className="bg-slate-50 max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {systemUsers
                    .filter(u => {
                      if (!dutySearchQuery.trim()) return true;
                      const q = dutySearchQuery.toLowerCase();
                      return u.nameAr.toLowerCase().includes(q) || u.nameEn.toLowerCase().includes(q) || u.staffId.includes(q);
                    })
                    .map(user => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => setSelectedStaffIdForDuty(user.id)}
                        className={`w-full text-right p-2.5 text-xs transition duration-150 flex items-center justify-between hover:bg-indigo-50 ${
                          selectedStaffIdForDuty === user.id ? "bg-indigo-100 border-indigo-305 font-bold text-indigo-950" : "text-slate-700"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="block font-bold">{isAr ? user.nameAr : user.nameEn}</span>
                          <span className="block text-[9px] text-slate-500 font-mono">
                            {user.role} | ID: {user.staffId} {user.department ? `(${user.department})` : ""}
                          </span>
                        </div>
                        {selectedStaffIdForDuty === user.id && <Check className="h-4 w-4 text-indigo-600" />}
                      </button>
                    ))}
                </div>
              </div>

              {/* TASK ASSIGNMENT */}
              <div className="space-y-1 pt-2">
                <label className="text-[10px] font-black text-slate-500 block">
                  {isAr ? "المهام المحددة (مثال: كراش كارت، غرف 1-4، الخ...):" : "Specific Duty/Role (e.g. Crash Cart, Beds 1-5):"}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? "اكتب المهام الموكلة للممرض/الموظف" : "Enter designated tasks..."}
                  value={selectedStaffDutyRole}
                  onChange={(e) => setSelectedStaffDutyRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              {/* SAVE ACTION BUTTON */}
              <button
                onClick={handleAddStaffToDuty}
                disabled={!selectedStaffIdForDuty}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl py-2.5 text-xs font-bold transition-all shadow-md shadow-indigo-600/10 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                {isAr ? "إضافة وتعيين بالقسم" : "Add & Duty Tag User"}
              </button>
            </div>
          </div>

          {/* ACTIVE ALLOCATIONS LIST */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <div>
                  <span className="text-[10px] text-indigo-600 font-black tracking-widest block uppercase">LIVE DEPT SHIFTING</span>
                  <h3 className="font-black text-sm text-slate-900">
                    {isAr ? `طاقم الجرد المعين لقسم: ${selectedDutyDept}` : `Assigned Duty Staff: ${selectedDutyDept}`}
                  </h3>
                </div>
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-xs px-2.5 py-1 rounded-full font-black">
                  {selectedDate}
                </span>
              </div>

              {currentDutyAssignment?.assignedStaffIds && currentDutyAssignment.assignedStaffIds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {currentDutyAssignment.assignedStaffIds.map((id: string, index: number) => {
                    const matchedUser = systemUsers.find(u => u.id === id);
                    const displayName = currentDutyAssignment.assignedStaffNames?.[index] || (isAr ? "موظف مجهول" : "Staff User");
                    const task = currentDutyAssignment.assignedTasks && currentDutyAssignment.assignedTasks[id] ? currentDutyAssignment.assignedTasks[id] : (isAr ? "جرد روتيني" : "Routine Ward Duty");
                    
                    return (
                      <div 
                        key={id} 
                        className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between hover:bg-slate-50 transition-all text-right group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                            {matchedUser?.nameEn ? matchedUser.nameEn.charAt(0) : "N"}
                          </div>
                          <div className="min-w-0 flex flex-col items-start w-full">
                            <span className="text-xs font-black text-slate-800 block truncate w-full" title={displayName}>
                              {matchedUser ? (isAr ? matchedUser.nameAr : matchedUser.nameEn) : displayName}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono block">
                              ID: {matchedUser?.staffId || "N/A"} | {matchedUser?.role || "Staff Nurse"}
                            </span>
                            <div className="mt-1 flex items-center gap-1 bg-white border border-indigo-100 text-[10px] text-indigo-700 font-bold px-1.5 py-0.5 rounded w-fit">
                              <CheckSquare className="h-2.5 w-2.5 text-indigo-500" />
                              <span className="truncate max-w-[120px]" title={task}>{task}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveStaffFromDuty(id)}
                          className="p-1 px-2 border border-rose-250 text-rose-600 hover:bg-rose-50 rounded-lg text-[10px] font-bold transition-all shrink-0 opacity-0 group-hover:opacity-100"
                          title={isAr ? "إزالة من جرد اليوم" : "Remove Assignment"}
                        >
                          {isAr ? "إزالة" : "Revoke"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-44 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <UserCheck className="h-10 w-10 text-slate-300 stroke-[1.5] mb-2" />
                  <p className="text-xs font-bold">{isAr ? "لا يوجد تمريض معين لهذا القسم في هذا التاريخ بعد" : "No crew assigned for this wing checklist/duty yet."}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{isAr ? "استخدم الحقول الجانبية لتعيين طاقم الاستمارة في ثوانٍ." : "Select nurse from sidebar list to initiate duty."}</p>
                </div>
              )}
            </div>

            {/* LIVE OVERVIEW GRID OF ALL DEPARTMENTS */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Award className="h-4 w-4 text-emerald-500" />
                  {isAr ? "ملخص النوبتجية عبر باقي الأقسام:" : "Wing Assignment status:"}
                </span>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-black px-2 py-0.5 rounded">
                  {isAr ? `إجمالي التكليفات: ${totalAssignedInAllDept}` : `Total Staff Assigned: ${totalAssignedInAllDept}`}
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {departments.map((dept) => {
                  const assignment = dailyDuties.find(d => d.date === selectedDate && d.department === dept);
                  const count = assignment?.assignedStaffIds?.length || 0;
                  return (
                    <button
                      key={dept}
                      onClick={() => setSelectedDutyDept(dept)}
                      className={`p-2 rounded-lg border text-right transition-all text-[10px] ${
                        selectedDutyDept === dept 
                          ? "bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]" 
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="block truncate font-bold text-[9px] mb-0.5">{dept}</span>
                      <span className={`inline-block text-[8px] font-black px-1.5 py-0.2 rounded-full ${
                        count > 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400"
                      }`}>
                        {isAr ? `${count} معينيّن` : `${count} crew`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 2: EMERGENCY CODE TEAMS ALLOCATOR ==================== */}
      {activeSubTab === "emergency" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-100">
              <div className="space-y-1">
                <span className="bg-red-100 text-red-800 font-black text-[10px] px-2.5 py-1 rounded-full font-mono uppercase inline-block">
                  🚨 OFFICIAL RESUSCITATION PROTOCOLS
                </span>
                <h3 className="font-extrabold text-sm text-slate-900">
                  {isAr 
                    ? `جداول فرق الطوارئ الحرجة (الكود بلو والأكواد الأمنية) ليوم ${selectedDate}` 
                    : `Critical Emergency Code Response Teams rosters for date: ${selectedDate}`}
                </h3>
              </div>
              
              {/* WhatsApp Share block */}
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyToClipboard}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow active:scale-95"
                >
                  {copyStatus ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copyStatus ? (isAr ? "تم النسخ!" : "Copied!") : (isAr ? "نسخ الجدول للواتساب" : "Copy for WhatsApp")}</span>
                </button>
              </div>
            </div>

            {/* Emergency roles editor grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* CARD 1: CODE BLUE (Cardiac Resuscitation) */}
              <div className="border border-indigo-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white p-3 flex justify-between items-center">
                  <span className="text-xs font-black tracking-wider flex items-center gap-1.5">
                    <Heart className="h-4 w-4 fill-white animate-pulse" />
                    {isAr ? "فريق الكود بلو الإنعاشي" : "Code Blue Resuscitation"}
                  </span>
                  <span className="bg-white/20 text-[9px] px-2 py-0.5 rounded-full font-bold">CPR 5555</span>
                </div>

                <div className="p-4 space-y-3.5 bg-slate-50/50">
                  
                  {/* Role 1: Team Leader */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-rose-700 block flex justify-between">
                      <span>{isAr ? "1. قائد الفريق (Code Blue Leader)" : "Team Leader"}</span>
                      <span className="text-[9px] font-normal text-slate-400">MD or HN</span>
                    </label>
                    <select
                      value={currentEmergencyTeam?.roles?.codeBlueLeader?.id || ""}
                      onChange={(e) => handleAssignEmergencyRole("codeBlueLeader", e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
                    >
                      <option value="">{isAr ? "-- اختر عضو كود بلو --" : "-- Select staff member --"}</option>
                      {systemUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {isAr ? u.nameAr : u.nameEn} (ID: {u.staffId} | {u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Role 2: Defibrillator and Chest compressions */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-rose-700 block text-right">
                      {isAr ? "2. جهاز الصدمات والإنعاش الرئوي (CPR/Defib)" : "Defib & CPR Operator"}
                    </label>
                    <select
                      value={currentEmergencyTeam?.roles?.defibOperator?.id || ""}
                      onChange={(e) => handleAssignEmergencyRole("defibOperator", e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
                    >
                      <option value="">{isAr ? "-- اختر عضو كود بلو --" : "-- Select staff member --"}</option>
                      {systemUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {isAr ? u.nameAr : u.nameEn} (ID: {u.staffId} | {u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Role 3: Airway and Intubation */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-rose-700 block text-right">
                      {isAr ? "3. مسؤول مجرى الهواء والأكسجين (Airway)" : "Oxygen & Airway Technician"}
                    </label>
                    <select
                      value={currentEmergencyTeam?.roles?.airwayManager?.id || ""}
                      onChange={(e) => handleAssignEmergencyRole("airwayManager", e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
                    >
                      <option value="">{isAr ? "-- اختر عضو كود بلو --" : "-- Select staff member --"}</option>
                      {systemUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {isAr ? u.nameAr : u.nameEn} (ID: {u.staffId} | {u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                </div>
              </div>

              {/* CARD 2: ADDITIONAL MEDS & RECUPERATION */}
              <div className="border border-indigo-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white p-3 flex justify-between items-center">
                  <span className="text-xs font-black tracking-wider flex items-center gap-1.5">
                    <BellRing className="h-4 w-4" />
                    {isAr ? "العلاجات والأدوية الطارئة" : "Iv Med Runner & Registry"}
                  </span>
                  <span className="bg-white/20 text-[9px] px-2 py-0.5 rounded-full font-bold">RESCUE</span>
                </div>

                <div className="p-4 space-y-3.5 bg-slate-50/50">
                  
                  {/* Role 4: Intravenous medication & IV runner */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-fuchsia-700 block text-right">
                      {isAr ? "4. مسؤول الكانيولا وحقن الأدوية (Meds/IV)" : "IV Lines & Medication Runner"}
                    </label>
                    <select
                      value={currentEmergencyTeam?.roles?.medRunner?.id || ""}
                      onChange={(e) => handleAssignEmergencyRole("medRunner", e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-fuchsia-500 cursor-pointer"
                    >
                      <option value="">{isAr ? "-- اختر عضو كود بلو --" : "-- Select staff member --"}</option>
                      {systemUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {isAr ? u.nameAr : u.nameEn} (ID: {u.staffId} | {u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Role 5: Recorder Nurse */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-fuchsia-700 block text-right">
                      {isAr ? "5. ممرض تدوين الجدول والوقت ومتابعة التوقيت" : "Scribe & Time Documentation Nurse"}
                    </label>
                    <select
                      value={currentEmergencyTeam?.roles?.scribeNurse?.id || ""}
                      onChange={(e) => handleAssignEmergencyRole("scribeNurse", e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-fuchsia-500 cursor-pointer"
                    >
                      <option value="">{isAr ? "-- اختر عضو كود بلو --" : "-- Select staff member --"}</option>
                      {systemUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {isAr ? u.nameAr : u.nameEn} (ID: {u.staffId} | {u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 bg-fuchsia-50 border border-fuchsia-100 rounded-xl text-[10px] text-fuchsia-800 font-bold leading-normal">
                    {isAr 
                      ? "⚠️ يلتزم طاقم الكود بلو بحمل أجهزة الهاتف اللاسلكية واستجابة نداء الطوارئ خلال 3 دقائق كحد أقصى للوصول لأي قسم بالمستشفى." 
                      : "⚠️ Med runners and scribe nurses must secure immediate IV trolley preparation and respond within 3 minutes of clinical overhead pager activation."}
                  </div>

                </div>
              </div>

              {/* CARD 3: SECURITY & SAFETIES (CODE RED & CODE YELLOW) */}
              <div className="border border-indigo-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-3 flex justify-between items-center">
                  <span className="text-xs font-black tracking-wider flex items-center gap-1.5">
                    <Shield className="h-4 w-4" />
                    {isAr ? "تأمين الكوارث ومكافحة الحريق" : "Crisis & Evacuation Warden"}
                  </span>
                  <span className="bg-white/20 text-[9px] px-2 py-0.5 rounded-full font-bold">SAFETY</span>
                </div>

                <div className="p-4 space-y-3.5 bg-slate-50/50">
                  
                  {/* Role 6: Code Red Coordinator */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-amber-700 block text-right">
                      {isAr ? "6. منسق كود رد (الحريق والإخلاء آمن)" : "Code Red Warden (Fire & Evacuation)"}
                    </label>
                    <select
                      value={currentEmergencyTeam?.roles?.codeRedWarden?.id || ""}
                      onChange={(e) => handleAssignEmergencyRole("codeRedWarden", e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                    >
                      <option value="">{isAr ? "-- اختر مسؤول الإخلاء --" : "-- Select fire warden --"}</option>
                      {systemUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {isAr ? u.nameAr : u.nameEn} (ID: {u.staffId} | {u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Role 7: Code Yellow Coordinator */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-amber-700 block text-right">
                      {isAr ? "7. منسق كود يلو (الكوارث الكبرى والأزمات)" : "Code Yellow Command Coordinator"}
                    </label>
                    <select
                      value={currentEmergencyTeam?.roles?.codeYellowCoord?.id || ""}
                      onChange={(e) => handleAssignEmergencyRole("codeYellowCoord", e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                    >
                      <option value="">{isAr ? "-- اختر منسق الطوارئ --" : "-- Select coordinator --"}</option>
                      {systemUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {isAr ? u.nameAr : u.nameEn} (ID: {u.staffId} | {u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-800 font-bold leading-normal">
                    {isAr 
                      ? "🔒 تسري هذه الأكواد والتعيينات بشكل حي على شاشة التنبيهات بقسم الطوارئ وفيصل الإدارة طوال الـ 24 ساعة المعتمدة." 
                      : "🔒 Assignments automatically map into safety monitors across wings to guarantee swift incident command structures in the hospital."}
                  </div>

                </div>
              </div>

            </div>

          </div>

          {/* CODE BLUE SIMULATION MODULE FOR QUALITY DRILLS */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-700 shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                <h3 className="font-extrabold text-sm tracking-tight text-red-400">
                  {isAr ? "محاكي سيناريو الطوارئ لاختبار الجاهزية" : "Interactive Code Blue Simulation & Training Drill"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSimActive(!simActive);
                  setSimStep(0);
                }}
                className={`text-xs font-extrabold px-3 py-1.5 rounded-lg transition-all ${
                  simActive ? "bg-red-650 hover:bg-red-700 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }`}
              >
                {simActive ? (isAr ? "إيقاف التدريب" : "Stop Drill") : (isAr ? "بدء محاكاة تجريبية" : "Launch Simulation Drill")}
              </button>
            </div>

            {simActive ? (
              <div className="space-y-4 animate-fade border-t border-slate-700 pt-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="bg-slate-800 p-4 rounded-xl border border-slate-705 text-right space-y-1 col-span-2">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 font-mono">
                      {isAr ? `الخطوة ${simStep + 1} من ${simSteps.length}` : `Step ${simStep + 1} of ${simSteps.length}`}
                    </span>
                    <h4 className="text-sm font-black text-slate-100">{simSteps[simStep].title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">{simSteps[simStep].desc}</p>
                    <div className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 p-1 px-2 rounded-lg inline-block mt-2">
                      {isAr ? `المسؤول المباشر المكلّف حالياً: ` : `Tagged Nurse on Duty: `}
                      <span className="underline">
                        {(() => {
                          const roleMapping: { [key: string]: string } = {
                            "CPR / Defib": "defibOperator",
                            "Scribe Nurse": "scribeNurse",
                            "Airway & Vent": "airwayManager",
                            "Meds Runner": "medRunner"
                          };
                          const key = roleMapping[simSteps[simStep].nurse];
                          const liveUser = currentEmergencyTeam?.roles?.[key];
                          return liveUser ? (isAr ? liveUser.nameAr : liveUser.nameEn) : (isAr ? `[ ممرض ${simSteps[simStep].nurse} ]` : `[ ${simSteps[simStep].nurse} ]`);
                        })()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 flex flex-col justify-center">
                    <button
                      onClick={() => {
                        if (simStep < simSteps.length - 1) {
                          setSimStep(simStep + 1);
                        } else {
                          alert(isAr ? "أحسنت! تم إكمال الدورة والتدريب بنجاح تام." : "Excellent! Simulation drill cycle clinical log validated.");
                          setSimActive(false);
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 font-black text-xs py-2 rounded-xl text-center"
                    >
                      {simStep < simSteps.length - 1 ? (isAr ? "الخطوة التالية ➔" : "Next Step ➔") : (isAr ? "إكمال التدريب ✔" : "Finish Drill ✔")}
                    </button>
                    {simStep > 0 && (
                      <button
                        onClick={() => setSimStep(simStep - 1)}
                        className="bg-slate-800 text-slate-350 hover:bg-slate-700 text-xs py-1 rounded"
                      >
                        {isAr ? "السابق" : "Prev"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Simulated timeline */}
                <div className="flex gap-1.5 pt-2">
                  {simSteps.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 flex-1 rounded ${
                        i === simStep ? "bg-red-500 animate-pulse" : i < simStep ? "bg-emerald-500" : "bg-slate-700"
                      }`} 
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                {isAr 
                  ? "يمكنك استخدام المحاكي التفاعلي لتقييم أداء الطاقم الطبي المختار وتدريبهم على آليات الكود بلو المتكاملة بالمركز." 
                  : "Train your assigned nurses by starting a mock scenario to guarantee full clinical mastery of life support schedules."}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 3: ROUNDING & STATS (ORIGINAL) ==================== */}
      {activeSubTab === "rounding" && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-700">
            <h3 className="font-black text-xl tracking-tight">{isAr ? "نظام الجولات التفتيشية الإكلينيكية الذكي" : "Clinical Rounds & Intelligent Audit System"}</h3>
            <p className="text-xs text-slate-400 mt-2">{isAr ? "تفتيش ومراجعة كفاءة الأقسام والسجلات السريرية بشكل مدروس وباعتماد مباشر لإدارة التمريض العليا." : "Complete structured clinical rounds and validate ward compliance standards instantly."}</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Audits sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-xs font-black text-slate-800 mb-3 uppercase tracking-wider">{isAr ? "الوحدات المستهدفة للتفتيش اليوم" : "Targeted Wards for Today"}</h4>
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  {audits.map(audit => (
                    <button 
                      key={audit.id} 
                      onClick={() => toggleAudit(audit.id)} 
                      className={`flex justify-between items-center p-3 rounded-xl border text-right w-full transition duration-150 ${
                        audit.status === "audited" ? "bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50" : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {audit.status === "audited" ? <CheckSquare className="text-emerald-500 h-5 w-5 shrink-0" /> : <AlertTriangle className="text-amber-500 h-5 w-5 shrink-0" />}
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-800 block">{isAr ? audit.nameAr : audit.nameEn}</span>
                          <span className="text-[9px] text-slate-500 block font-mono">{audit.status.toUpperCase()}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${
                        audit.status === "audited" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {audit.status === "audited" ? (isAr ? "مكتمل" : "Complete") : (isAr ? "مطلوب" : "Required")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Checklist Main Area */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b pb-4 border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="bg-indigo-100 text-indigo-700 p-2 rounded-xl">
                    <ClipboardCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">{isAr ? "استمارة المرور السريرية النشطة" : "Active Clinical Round Form"}</h3>
                    <p className="text-[10px] text-slate-500">{isAr ? "نموذج توثيق جولات المشرف العام للأقسام المحددة" : "Supervisor standard checklist for active ward."}</p>
                  </div>
                </div>
                <div className="text-[10px] font-mono bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg font-bold">
                  {selectedDate}
                </div>
              </div>

              <div className="space-y-6">
                
                {/* Metric 1 */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 flex justify-between">
                    <span>{isAr ? "1. الالتزام بالمعايير البيئية ومكافحة العدوى" : "1. Infection Control & Environmental Standards"}</span>
                    <span className="text-indigo-600 font-black">IC-101</span>
                  </label>
                  <p className="text-[10px] text-slate-500">{isAr ? "التأكد من نظافة الأسطح، توافر المطهرات، والتزام الطاقم بلبس الواقيات الشخصية." : "Verify surface cleanliness, sanitizer availability, and staff PPE adherence."}</p>
                  <div className="flex gap-3 mt-2">
                    <button className="flex-1 p-2 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors">
                      {isAr ? "مستوفى كلياً" : "Fully Compliant"}
                    </button>
                    <button className="flex-1 p-2 border border-amber-200 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors">
                      {isAr ? "مستوفى جزئياً" : "Partial Compliant"}
                    </button>
                    <button className="flex-1 p-2 border border-red-200 bg-red-50 text-red-700 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">
                      {isAr ? "غير مستوفى" : "Non-Compliant"}
                    </button>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-800 flex justify-between">
                    <span>{isAr ? "2. سجلات المرضى والتسليم الدوائي" : "2. Patient Records & Medication Handover"}</span>
                    <span className="text-indigo-600 font-black">MR-204</span>
                  </label>
                  <p className="text-[10px] text-slate-500">{isAr ? "التأكد من دقة تحديث السجلات وفحص أدوية الثلاجة والعربات الطارئة." : "Audit file updates and check fridge/crash cart inventory."}</p>
                  <div className="flex gap-3 mt-2">
                    <button className="flex-1 p-2 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors">
                      {isAr ? "مستوفى كلياً" : "Fully Compliant"}
                    </button>
                    <button className="flex-1 p-2 border border-amber-200 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors">
                      {isAr ? "مستوفى جزئياً" : "Partial Compliant"}
                    </button>
                    <button className="flex-1 p-2 border border-red-200 bg-red-50 text-red-700 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">
                      {isAr ? "غير مستوفى" : "Non-Compliant"}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <label className="text-[10px] font-black text-slate-800">{isAr ? "ملاحظات وتوصيات المشرف" : "Supervisor Notes & Recommendations"}</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-indigo-500"
                    rows={3}
                    placeholder={isAr ? "سجل أي ملاحظات، أعطال تقنية، أو إرشادات للممرضين..." : "Log technical defects, guidelines, or corrective actions here..."}
                  ></textarea>
                </div>

                <button className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-all">
                  <Save className="h-4 w-4" />
                  {isAr ? "اعتماد تسجيل الجولة التفتيشية" : "Submit & Authorize Round Log"}
                </button>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 4: DATA ANALYTICS & REPORTS ==================== */}
      {activeSubTab === "reports" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white p-5 rounded-2xl shadow-lg border border-slate-700">
            <h3 className="font-black text-lg tracking-tight">{isAr ? "تحليلات البيانات وتقارير الأداء" : "Data Analytics & Performance Reports"}</h3>
            <p className="text-xs text-indigo-200 mt-1">{isAr ? "مؤشرات الامتثال وتقارير أداء طواقم التمريض والأقسام السريرية." : "Compliance metrics and staff performance tracking across clinical wings."}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Compliance */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-xs font-bold text-slate-800 mb-4">{isAr ? "نسبة إنجاز المهام والجرد حسب القسم" : "Task & Checklist Compliance by Wing (%)"}</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'ICU', value: 92 },
                    { name: 'ER', value: 85 },
                    { name: 'Chemo', value: 98 },
                    { name: 'OR', value: 88 },
                    { name: 'Ward 1', value: 95 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', fontSize: '10px'}} />
                    <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Staff Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-xs font-bold text-slate-800 mb-4">{isAr ? "توزيع طواقم التمريض على الورديات والمهام" : "Staff Distribution by Shift/Roles"}</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: isAr ? 'طوارئ وإنعاش' : 'Emergency & ER', value: 15 },
                        { name: isAr ? 'أجنحة داخلية' : 'Inpatient Wards', value: 35 },
                        { name: isAr ? 'تحضير كيماوي' : 'Chemo Prepn', value: 10 },
                        { name: isAr ? 'رعاية مركزة' : 'ICU', value: 20 },
                        { name: isAr ? 'إجازات/راحات' : 'Off / Leaves', value: 5 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {["#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#94a3b8"].map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{borderRadius: '8px', fontSize: '10px'}} />
                    <Legend wrapperStyle={{fontSize: '10px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Documents export mock */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-800">{isAr ? "سجلات التصدير والاعتمادات" : "Export Archives & Document Approvals"}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="border p-4 rounded-xl flex items-center justify-between hover:bg-slate-50 transition duration-150">
                <div className="flex items-center gap-3">
                  <FileText className="text-indigo-500 h-5 w-5"/>
                  <div className="text-right">
                    <span className="block font-bold text-xs text-slate-800">{isAr ? "تقرير التمريض اليومي الشامل" : "Comprehensive Daily Nursing Report"}</span>
                    <span className="block text-[10px] text-slate-400">{isAr ? "الورديات ومؤشرات الحضور ونسب المهام" : "Unit rosters, presence & task compliance"}</span>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded">PDF</span>
              </button>
              
              <button className="border p-4 rounded-xl flex items-center justify-between hover:bg-slate-50 transition duration-155">
                <div className="flex items-center gap-3">
                  <FileText className="text-red-500 h-5 w-5"/>
                  <div className="text-right">
                    <span className="block font-bold text-xs text-slate-800">{isAr ? "تقرير الحوادث ومؤشر الجودة الفوري" : "Incident Quality Log & CPR Rhythms"}</span>
                    <span className="block text-[10px] text-slate-400">{isAr ? "توثيق أحداث الكود الزمني وسرعة الاستجابة" : "Real-time records of response times"}</span>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded">EXCEL</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 5: PENDING APPROVALS ==================== */}
      {activeSubTab === "approvals" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-semibold text-lg">{isAr ? "طلبات الكادر بانتظار موافقة المشرف" : "Staff Requests & Approvals"}</h3>
          
          {pendingApprovals.length === 0 ? (
            <div className="text-slate-400 text-xs font-bold py-6 text-center">{isAr ? "لا توجد طلبات معلقة حالياً." : "No pending staff requests."}</div>
          ) : (
            <div className="space-y-3.5">
              {pendingApprovals.map(app => (
                <div key={app.id} className="p-3.5 border rounded-xl flex items-center justify-between text-right hover:bg-slate-50 transition-all">
                  <div className="space-y-1">
                    <span className="font-bold text-xs text-slate-800 block">{isAr ? app.titleAr : app.titleEn}</span>
                    <span className="text-[10px] text-slate-400 block">{isAr ? "المقدم: كادر التمريض المناوب" : "Requester: Staff Nurse"}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setPendingApprovals(pendingApprovals.filter(a => a.id !== app.id))} 
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition duration-150"
                    >
                      {isAr ? "موافقة" : "Approve"}
                    </button>
                    <button 
                      onClick={() => setPendingApprovals(pendingApprovals.filter(a => a.id !== app.id))} 
                      className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition duration-150"
                    >
                      {isAr ? "رفض" : "Reject"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

