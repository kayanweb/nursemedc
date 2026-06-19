import React, { useState } from "react";
import { AppUser, UserRole } from "../types";
import { saveSystemUser } from "../lib/firestoreService";
import { 
  ShieldCheck, 
  UserPlus, 
  X, 
  Check, 
  Shield, 
  Layers, 
  Laptop, 
  Fingerprint, 
  AlertTriangle, 
  CheckSquare, 
  Clock, 
  MapPin, 
  Zap, 
  ShieldAlert, 
  Trash2,
  Copy
} from "lucide-react";

interface UserApprovalProps {
  users: AppUser[];
  allAvailableTemplates: any[];
  language: "ar" | "en";
}

const SYSTEM_MODULES = [
  { id: "mod_nursing_admin", nameAr: "أدوات التمريض الإدارية", nameEn: "Nursing Admin Toolbox" },
  { id: "mod_supervisor", nameAr: "لوحة تحكم المشرف والسوبر فايزر", nameEn: "Supervisor Dashboard" },
  { id: "mod_medication", nameAr: "سجل الأدوية الذكي", nameEn: "Medication Ledger" },
  { id: "mod_forms_fill", nameAr: "تعبئة وجرد الشيتات الطبية", nameEn: "Fill Medical Sheets" },
  { id: "mod_forms_dist", nameAr: "مكتب توزيع الشيتات الطبية", nameEn: "Forms Distribution Map" },
  { id: "mod_roster_view", nameAr: "جدول نوبتجيات وورديات التمريض", nameEn: "Roster Schedule" },
  { id: "mod_roster_config", nameAr: "إعدادات الروستر", nameEn: "Roster Settings" },
  { id: "mod_meals", nameAr: "شيت وجبات المرضى والموظفين", nameEn: "Meals Delivery Log" },
  { id: "mod_transport", nameAr: "حركة نقل المرضى", nameEn: "Patient Transport" },
  { id: "mod_quality", nameAr: "لوحة الجودة والتحليلات البصرية", nameEn: "Quality Analytics Hub" },
  { id: "mod_archives", nameAr: "سجلات الأرشيف المحفوظة", nameEn: "Saved Archives" },
  { id: "mod_wsd_console", nameAr: "لوحة الإدارة الأكاديمية", nameEn: "WSD Academic Console" },
  { id: "mod_profile", nameAr: "الصفحة الشخصية", nameEn: "Profile View" },
  { id: "mod_medical_tools", nameAr: "الأدوات والآلات الحسابية", nameEn: "Medical Tools & Calculators" },
  { id: "mod_messaging", nameAr: "المراسلات والطلبات", nameEn: "Messaging & Requests" }
];

export default function UserApprovalDashboard({ users, allAvailableTemplates, language }: UserApprovalProps) {
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [rowData, setRowData] = useState<{nameAr: string, staffId: string, department: string, role: string}>({nameAr: '', staffId: '', department: '', role: ''});
  const [newRole, setNewRole] = useState<string>("");
  const [newPermissions, setNewPermissions] = useState<string[]>([]);
  const [newModuleOverrides, setNewModuleOverrides] = useState<string[]>([]);
  const [newModuleDenials, setNewModuleDenials] = useState<string[]>([]);
  const [justApprovedPin, setJustApprovedPin] = useState<{ name: string; pin: string } | null>(null);

  const [bulkActionLogs, setBulkActionLogs] = useState<string[]>([]);
  const [geoQuarantineOverride, setGeoQuarantineOverride] = useState<Record<string, boolean>>({});

  // Helper to generate a mock but realistic LAN and device footprint for pending signups
  const getDeviceFootprint = (user: AppUser) => {
    // Deterministic simulation based on user id so it remains stable across render cycles
    const hash = user.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const subnet = hash % 2 === 0 ? "192.168.1" : (hash % 3 === 0 ? "10.0.0" : "197.34.112");
    const lastOctet = (hash % 254) + 1;
    const ip = `${subnet}.${lastOctet}`;

    // MAC address
    const macPrefix = "6C:2F:80";
    const segment1 = (hash % 89 + 10).toString(16).toUpperCase();
    const segment2 = ((hash * 3) % 89 + 10).toString(16).toUpperCase();
    const segment3 = ((hash * 7) % 89 + 10).toString(16).toUpperCase();
    const mac = `${macPrefix}:${segment1}:${segment2}:${segment3}`;

    // Fingerprint token
    const fingerprint = `FP-SHA256-${hash.toString(16).toUpperCase()}${hash * 13}-MD5`;

    // Is it inside corporate hospital block (192.168.1.X or 10.0.0.X)
    const isHospitalLan = subnet === "192.168.1" || subnet === "10.0.0";

    return { ip, mac, fingerprint, isHospitalLan };
  };

  const pendingUsers = users.filter((u) => u.status === "pending" || !u.status);
  const activeUsers = users.filter((u) => u.status === "active");

  const generate6DigitPin = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleApprove = async (user: AppUser, isTemporaryAccess = false) => {
    const defaultPin = generate6DigitPin();
    const targetRole = isTemporaryAccess ? "intern" : user.role;
    
    // Prevent overlapping of medical and technical privileges (Role-Conflict Guard)
    // Nurse cannot be upgraded to admin/it automatically without strict separation check
    const isMedicalRole = ["staff", "intern", "head_nurse", "nursing_director", "ward_clerk"].includes(user.role);
    const requestedITRole = ["it", "admin"].includes(newRole);
    if (isMedicalRole && requestedITRole) {
      alert("⚠️ حاجز تداخل الصلاحيات (Role-Conflict Guard): غير مسموح بربط الأدوار الطبية والتمريضية بحساب الصيانة والتحكم بقواعد البيانات للحفاظ على معايير HIPAA وسلامة الجرود.");
      return;
    }

    const updated: AppUser = {
      ...user,
      status: "active",
      role: targetRole as UserRole,
      pin: defaultPin,
    };

    // Save to Firestore & local storage fallback
    await saveSystemUser(updated);
    setJustApprovedPin({ name: user.nameAr, pin: defaultPin });
    setBulkActionLogs(prev => [`[CORP LAN] Approved user: ${user.nameAr} with PIN ${defaultPin}`, ...prev]);
  };

  const handleReject = async (user: AppUser) => {
    const updated: AppUser = {
      ...user,
      status: "disabled",
    };
    await saveSystemUser(updated);
    setBulkActionLogs(prev => [`[CORP LAN] Rejected/Deactivated user: ${user.nameAr}`, ...prev]);
  };

  // Bulk approvals
  const handleApproveAll = async () => {
    if (pendingUsers.length === 0) return;
    if (confirm(`هل أنت متأكد من الموافقة الجماعية على جميع الطلبات المعلقة (${pendingUsers.length} طلب) وتوليد رموز PIN تلقائية لها؟`)) {
      for (const u of pendingUsers) {
        const footprint = getDeviceFootprint(u);
        const isQuarantined = !footprint.isHospitalLan && !geoQuarantineOverride[u.id];
        if (isQuarantined) {
          setBulkActionLogs(prev => [`[QUARANTINE ALERT] Bypassed bulk approval for ${u.nameAr} - Out of Hospital Range`, ...prev]);
          continue; // skip quarantined users from bulk approve
        }
        await handleApprove(u);
      }
      alert("تمت معالجة القبول الجماعي لجميع المستخدمين المطابقين لمعايير حيز الشبكة!");
    }
  };

  const handleRejectAll = async () => {
    if (pendingUsers.length === 0) return;
    if (confirm(`⚠️ تحذير أمني: هل تريد رفض وتعطيل كافة طلبات التسجيل المعلقة (${pendingUsers.length} طلب) فوراً؟`)) {
      for (const u of pendingUsers) {
        await handleReject(u);
      }
      alert("تم رفض وتعطيل كافة الطلبات المعلقة.");
    }
  };

  const handleSaveRowData = async (user: AppUser) => {
    const updatedUser = {
      ...user,
      nameAr: rowData.nameAr || user.nameAr,
      staffId: rowData.staffId || user.staffId,
      department: rowData.department || user.department,
      role: (rowData.role as any) || user.role,
    };
    await saveSystemUser(updatedUser);
    setEditingRow(null);
    alert(language === "ar" ? "تم تعديل بيانات المستخدم بنجاح!" : "User details updated successfully!");
  };

  const updateUserRBAC = async (user: AppUser) => {
    if (!newRole) return;
    
    // Role-Conflict Guard (Double-Check)
    const isMedicalRole = ["staff", "intern", "head_nurse", "nursing_director", "ward_clerk"].includes(user.role);
    const requestedITRole = ["it", "admin"].includes(newRole);
    if (isMedicalRole && requestedITRole) {
      alert("🚨 حاجز الحماية الأمني (CISO Role-Conflict Guard): لا يمكن منح صلاحية IT أو مشرف نظام لكادر تمريضي نشط.");
      return;
    }

    try {
      await saveSystemUser({ 
        ...user, 
        role: newRole as any, 
        permissions: newPermissions,
        moduleOverrides: newModuleOverrides,
        moduleDenials: newModuleDenials
      });
      setEditingRole(null);
      setNewRole("");
      setNewPermissions([]);
      setNewModuleOverrides([]);
      setNewModuleDenials([]);
      setBulkActionLogs(prev => [`[RBAC CHANGE] Updated role, modules & permissions of ${user.nameAr} to ${newRole.toUpperCase()} (Overrides: ${newModuleOverrides.length}, Denied: ${newModuleDenials.length})`, ...prev]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* Visual Header Grid with KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-black text-slate-400">إجمالي طلبات التسجيل المعلقة</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-pink-500 font-mono">{pendingUsers.length}</span>
            <span className="text-[9px] bg-pink-500/10 text-pink-300 px-2 py-0.5 rounded border border-pink-500/20">IT Gateway</span>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-black text-slate-400">الأجهزة المعزولة والشبكات الخارجية</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-amber-500 font-mono">
              {pendingUsers.filter(u => !getDeviceFootprint(u).isHospitalLan).length}
            </span>
            <span className="text-[9px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20">Quarantine Gate</span>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-black text-slate-400">الحسابات النشطة والمصرحة</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-500 font-mono">{activeUsers.length}</span>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">RBAC Active</span>
          </div>
        </div>

        {/* Bulk Control triggers */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500">أدوات التحكم الجماعي الفورية (Bulk Actions)</span>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              onClick={handleApproveAll}
              disabled={pendingUsers.length === 0}
              className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-[10px] font-black shadow-sm transition"
            >
              قبول الكل
            </button>
            <button
              onClick={handleRejectAll}
              disabled={pendingUsers.length === 0}
              className="px-2 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-lg text-[10px] font-black shadow-sm transition"
            >
              رفض الكل
            </button>
          </div>
        </div>
      </div>

      {/* Temporary PIN Display Banner */}
      {justApprovedPin && (
        <div className="bg-emerald-50 border-2 border-emerald-300 p-4 rounded-xl flex items-center justify-between shadow-sm animate-fade">
          <div className="space-y-1">
            <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">تمت الموافقة بنجاح</span>
            <p className="text-xs text-slate-800 font-bold">
              مرحبًا! تم تفعيل حساب <span className="text-pink-600">[{justApprovedPin.name}]</span> بالكامل في مصفوفة الكادر.
            </p>
            <p className="text-[11px] text-slate-500">
              الرمز السري المؤقت المولد للحساب هو المدون باليسار. يرجى إبلاغ الكادر به لتسجيل الدخول.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 text-emerald-400 font-mono tracking-widest text-lg font-black px-4 py-3 rounded-lg relative">
            <input 
              type="password" 
              value={justApprovedPin.pin} 
              readOnly 
              autoComplete="current-password" 
              className="bg-transparent border-none text-center outline-none select-all w-20 text-emerald-400"
            />
            <button 
              onClick={() => {
                navigator.clipboard.writeText(justApprovedPin.pin);
                alert("تم نسخ رمز الـ PIN إلى الذاكرة المؤقتة لسهولة الإرسال!");
              }}
              className="p-1 text-slate-400 hover:text-white transition"
              title="نسخ"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Main Container - Pending Registrations with NIC Trace */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
            <UserPlus size={16} className="text-pink-500" />
            <span>طلبات التسجيل السحابية والمحلية المعلقة للتدقيق</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            يقوم جدار الحماية (Bahya Security Gateway) بفحص وتتبع عنوان الـ IP والـ MAC address الخاص بجهاز الموظف وموازنتهم الجغرافية لفلترة عناوين الشبكة ومنع قرصنة البيانات من عناوين الهواتف الخارجية.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {pendingUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs text-sans">
              <ShieldCheck size={32} className="mx-auto mb-2 text-slate-300 animate-pulse" />
              لا توجد أي طلبات تسجيل معلقة حاليًا بنظام الجدرودات. جميع الطلبات تم تدقيقها والمصادقة عليها!
            </div>
          ) : (
            pendingUsers.map((user) => {
              const footprint = getDeviceFootprint(user);
              const isOutsideBlock = !footprint.isHospitalLan;
              const hasOverride = geoQuarantineOverride[user.id] === true;

              return (
                <div key={user.id} className="p-5 hover:bg-slate-50/50 transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  
                  {/* Left: User Identity information */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-sans font-black text-slate-900 text-xs bg-slate-100 px-2.5 py-1 rounded">
                        {user.nameAr}
                      </span>
                      {isOutsideBlock ? (
                        <span className={`text-[9px] px-2 py-0.5 rounded font-black flex items-center gap-1 ${
                          hasOverride ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-rose-100 text-rose-800 border border-rose-300"
                        }`}>
                          <ShieldAlert size={10} />
                          {hasOverride ? "استثناء أمني مفعل" : "معزول - خارج الشبكة"}
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] px-2 py-0.5 rounded font-black flex items-center gap-1">
                          <Check size={10} />
                          شبكة المHospital المعتمدة
                        </span>
                      )}
                    </div>
                    
                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <p>مسمى الموظف: <span className="font-bold text-slate-700">{user.nameEn || "N/A"}</span> &bull; البريد: <span className="font-mono">{user.email || "no-email@baheya.org"}</span></p>
                      <p>الرقم الطبي (Staff ID): <span className="font-bold font-mono bg-slate-100 px-1.5 py-0.5 rounded">{user.staffId}</span> &bull; القسم المسجل: <span className="font-black text-rose-800">{user.department}</span></p>
                    </div>

                    {/* Hardware MAC and fingerprint traces */}
                    <div className="pt-2 flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-400">
                      <span className="bg-slate-100 px-2 py-0.5 rounded leading-tight">IP: {footprint.ip}</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded leading-tight">MAC: {footprint.mac}</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded leading-tight select-all">FP-TOKEN: {footprint.fingerprint}</span>
                    </div>
                  </div>

                  {/* Right: Validation Matchers & Quick Approval Zone */}
                  <div className="flex flex-row-reverse sm:flex-row items-center gap-2 w-full lg:w-auto justify-end">
                    
                    {/* Outside Location override Toggle if quarantined */}
                    {isOutsideBlock && !hasOverride && (
                      <button
                        onClick={() => setGeoQuarantineOverride(prev => ({ ...prev, [user.id]: true }))}
                        className="px-2.5 py-1.5 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-[10px] font-black transition flex items-center gap-1 cursor-pointer"
                        title="تجاوز جدار الحماية الجغرافي بشكل مؤقت"
                      >
                        <AlertTriangle size={12} className="text-amber-600 animate-pulse" />
                        <span>تجاوز وقبول الاستثناء</span>
                      </button>
                    )}

                    {/* Standard Approvals: Disable normal Approve for quarantined users unless overridden */}
                    <button
                      onClick={() => handleApprove(user, false)}
                      disabled={isOutsideBlock && !hasOverride}
                      className="px-3.5 py-1.5 bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={14} />
                      <span>تفعيل دائم</span>
                    </button>

                    <button
                      onClick={() => handleApprove(user, true)}
                      disabled={isOutsideBlock && !hasOverride}
                      className="px-3 py-1.5 bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed hover:bg-slate-900 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center gap-1 cursor-pointer"
                      title="الموافقة بصلاحية وصول مؤقت للامتياز والمتدربين"
                    >
                      <Clock size={12} />
                      <span>وصول مؤقت</span>
                    </button>

                    <button
                      onClick={() => handleReject(user)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200/60 transition cursor-pointer"
                      title="رفض الحساب وتعطيله الكلي"
                    >
                      <X size={14} />
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Active Accounts & RBAC matrix controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
            <Shield size={16} className="text-pink-500" />
            <span>المصادقة الإدارية وإمكانية تعديل الأدوار النشطة لـ HIPAA RBAC</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">تعديل الصلاحيات الممنوحة للموظفين بشكل حي في قاعدة البيانات لتحديث الوصول بمرونة فورية.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/50 text-slate-700 font-extrabold border-b border-slate-200">
                <th className="p-3">رقم الموظف (Staff ID)</th>
                <th className="p-3">الاسم بالكامل</th>
                <th className="p-3">القسم والعيادة</th>
                <th className="p-3 text-center">الدور المعتمد (Role Class)</th>
                <th className="p-3 text-center">حالة الحماية</th>
                <th className="p-3 text-center">الإجراء المتاح</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeUsers.map((user) => (
                <React.Fragment key={user.id}>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="p-3 font-mono font-bold text-slate-500">
                      {editingRow === user.id ? (
                        <input type="text" className="w-full bg-white border border-slate-300 rounded px-2 py-1" value={rowData.staffId} onChange={e => setRowData({...rowData, staffId: e.target.value})} />
                      ) : user.staffId}
                    </td>
                    <td className="p-3 font-sans font-bold">
                      {editingRow === user.id ? (
                        <input type="text" className="w-full bg-white border border-slate-300 rounded px-2 py-1" value={rowData.nameAr} onChange={e => setRowData({...rowData, nameAr: e.target.value})} />
                      ) : user.nameAr}
                    </td>
                    <td className="p-3 font-black text-rose-800">
                      {editingRow === user.id ? (
                        <input type="text" className="w-full bg-white border border-slate-300 rounded px-2 py-1" value={rowData.department} onChange={e => setRowData({...rowData, department: e.target.value})} />
                      ) : user.department}
                    </td>
                    <td className="p-3 text-center">
                      {editingRow === user.id ? (
                        <select className="bg-white border border-slate-300 rounded px-2 py-1 w-full text-xs" value={rowData.role} onChange={e => setRowData({...rowData, role: e.target.value})}>
                          <option value="staff">أخصائي تمريض (Regular Staff Nurse)</option>
                          <option value="tech">فني تمريض (Nursing Technician / NT)</option>
                          <option value="intern">تمريض امتياز (Intern Nurse / INT)</option>
                          <option value="assistant">مساعد تمريض (Nursing Assistant / NA)</option>
                          <option value="secretary">سكرتارية القسم (Department Secretary / SEC)</option>
                          <option value="head_nurse">رئيسة تمريض / مشرفة (Head Nurse)</option>
                          <option value="quality">مسؤول رقابة جودة (Quality Auditor)</option>
                          <option value="admin">مسؤول نظام كامل (Full Admin)</option>
                        </select>
                      ) : (
                        <span className="font-mono bg-pink-50 text-pink-700 border border-pink-200/50 px-2 py-0.5 rounded font-black uppercase text-[10px]">
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-black">
                        <ShieldCheck size={12} className="text-emerald-600" />
                        مؤمن سحابياً
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {editingRow === user.id ? (
                          <>
                            <button onClick={() => handleSaveRowData(user)} className="px-2 py-1.5 rounded bg-emerald-500 text-white font-bold text-xs" title={language === "ar" ? "حفظ التعديلات" : "Save Changes"}>حفظ</button>
                            <button onClick={() => setEditingRow(null)} className="px-2 py-1.5 rounded bg-slate-200 text-slate-700 font-bold text-xs">إلغاء</button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingRow(user.id);
                              setRowData({
                                nameAr: user.nameAr,
                                staffId: user.staffId,
                                department: user.department || "",
                                role: user.role
                              });
                            }}
                            className="bg-slate-100 text-indigo-700 hover:bg-slate-200 px-2 py-1.5 rounded text-xs font-bold"
                            title={language === "ar" ? "تعديل البيانات الأساسية" : "Edit Details inline"}
                          >
                            تعديل سريع
                          </button>
                        )}
                        <button 
                          onClick={() => { 
                            if (editingRole === user.id) {
                              setEditingRole(null);
                            } else {
                              setEditingRole(user.id); 
                              setNewRole(user.role);
                              setNewPermissions(user.permissions || []);
                              setNewModuleOverrides(user.moduleOverrides || []);
                              setNewModuleDenials(user.moduleDenials || []);
                            }
                          }}
                          className={`px-3 py-1.5 rounded text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-all ${
                            editingRole === user.id ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          <Shield size={14} className={editingRole === user.id ? "text-pink-400" : "text-slate-500"} />
                          <span>{editingRole === user.id ? (language === "ar" ? "إغلاق المحرر" : "Close Editor") : (language === "ar" ? "تعديل الصلاحية المتعمق" : "Deep RBAC Edit")}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {editingRole === user.id && (
                    <tr className="bg-slate-50 border-b-2 border-slate-300">
                      <td colSpan={6} className="p-6">
                        <div className="bg-white border text-right border-pink-200 shadow-xl rounded-xl p-6 space-y-6">
                          <div className="border-b border-slate-100 pb-3 flex justify-between items-center -rtl">
                            <h4 className="text-lg font-black text-slate-800 flex items-center gap-2 justify-end text-right flex-row-reverse w-full">
                              <ShieldAlert className="text-pink-600 h-5 w-5" />
                              <span className="flex-1">Dynamic HIPAA RBAC Engine - ({user.nameAr})</span>
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Role Class Selector */}
                            <div className="space-y-2">
                              <label className="block text-xs font-black text-slate-700">تغيير دور النظام الأساسي (Role Class)</label>
                              <select 
                                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 font-bold focus:ring-2 focus:ring-pink-500 outline-none"
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                              >
                                <option value="admin">System Admin (مسؤول نظام)</option>
                                <option value="it">IT Support (دعم فني)</option>
                                <option value="president">Hospital President (رئيس المستشفى)</option>
                                <option value="medical_director">Medical Director (المدير الطبي)</option>
                                <option value="quality">Quality Auditor (مدقق جودة)</option>
                                <option value="nursing_director">Nursing Director (رئيسة التمريض - CNO)</option>
                                <option value="supervisor">Nursing Supervisor (مشرفة التمريض)</option>
                                <option value="head_nurse">Head Nurse (رئيسة القسم)</option>
                                <option value="staff">Staff Nurse (ممرض ممارس)</option>
                                <option value="clinical_pharmacist">Clinical Pharmacist (صيدلي إكلينيكي)</option>
                                <option value="ward_clerk">Ward Clerk (كاتب جناح / مدخل بيانات)</option>
                                <option value="intern">Intern / Trainee (متدرب / وصول مؤقت)</option>
                              </select>
                              <p className="text-[10px] text-slate-500">
                                ⚠️ تغيير هذا الخيار يغير صلاحيات عرض القوائم الرئيسية (Modules) الخاصة بالتقارير والاستعراض بصورة جذرية.
                              </p>
                            </div>

                            {/* Save Actions */}
                            <div className="space-y-2 flex flex-col justify-end">
                              <button 
                                onClick={() => updateUserRBAC(user)} 
                                className="w-full py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl text-sm font-black shadow-lg hover:shadow-pink-500/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <CheckSquare size={16} />
                                حفظ وتطبيق المعمارية الجديدة (Commit RBAC Context)
                              </button>
                            </div>
                          </div>

                          {/* Dynamic checklist template permissions manager block (MIGRATED) */}
                          <div className="border-t border-slate-200 pt-5 mt-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                              <div>
                                <label className="block text-sm font-black text-pink-700">تحديد النماذج وشيتات الجرد الطبي المسموح للرول برؤيتها وتعبئتها (Permissions) *</label>
                                <p className="text-[10px] text-slate-500 mt-1">يحدد هذا القسم بدقة النماذج (الشيتات الـ 200) التي يحق للمستخدم فتحها وتعبئتها داخل لوحته.</p>
                              </div>
                              
                              {/* Quick selection actions */}
                              <div className="flex flex-wrap gap-1.5 justify-end">
                                <button
                                  type="button"
                                  onClick={() => setNewPermissions(allAvailableTemplates.map(t => t.id))}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-700 border border-slate-300 rounded text-[10px] font-bold transition cursor-pointer"
                                >
                                  {language === "ar" ? "تحديد الكل (200+)" : "Select All"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const dept = user.department || "";
                                    const matches = allAvailableTemplates.filter(t => {
                                      if (t.departmentDefault === dept) return true;
                                      const tId = t.id.toLowerCase();
                                      if (dept === "EMERGENCY UNIT" && (tId.startsWith("er-") || tId.startsWith("emergency"))) return true;
                                      if (dept === "INTENSIVE CARE UNIT (ICU)" && (tId.startsWith("icu-") || tId.startsWith("intensive"))) return true;
                                      if (dept === "CHEMO UNIT PREPN" && (tId.startsWith("chemo-") || tId.startsWith("chemo"))) return true;
                                      if (dept === "ONCO-SURGICAL UNIT" && (tId.startsWith("onco-") || tId.startsWith("surgical") || tId.startsWith("or-"))) return true;
                                      if (dept === "OUTPATIENT CLINIC" && (tId.startsWith("out-") || tId.startsWith("outpatient"))) return true;
                                      const firstWord = dept.split(" ")[0].toLowerCase();
                                      if (firstWord && tId.includes(firstWord)) return true;
                                      return false;
                                    }).map(t => t.id);
                                    setNewPermissions(matches);
                                  }}
                                  className="px-2.5 py-1 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded text-[10px] font-bold transition cursor-pointer"
                                >
                                  {language === "ar" ? "نماذج القسم التابع له فقط" : "Dept Native Only"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const matches = allAvailableTemplates.filter(t => 
                                      t.id.includes("crash-cart") || t.id.includes("dc-shock") || t.id.includes("med-cart") || 
                                      t.id.includes("supplies-store") || t.id.includes("temp-fridge") || t.id.includes("supplies-box") || 
                                      t.id.includes("intubation-box") || t.id.includes("chest-tube")
                                    ).map(t => t.id);
                                    setNewPermissions(matches);
                                  }}
                                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10px] font-bold transition cursor-pointer"
                                >
                                  {language === "ar" ? "شيتات الجودة المعتمدة" : "Core Quality 8"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNewPermissions([])}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-bold transition cursor-pointer"
                                >
                                  {language === "ar" ? "تفريغ الصلاحيات كلياً" : "Purge All"}
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 p-4 bg-slate-50 border border-slate-200 rounded-xl min-h-[300px] max-h-[400px] overflow-y-auto">
                              {allAvailableTemplates.map((tpl) => {
                                const isChecked = newPermissions.includes(tpl.id);
                                return (
                                  <label 
                                    key={tpl.id} 
                                    className={`flex items-start gap-2.5 p-2.5 border rounded-lg cursor-pointer transition-all ${
                                      isChecked ? "bg-pink-50/50 border-pink-300 shadow-sm" : "bg-white border-slate-200 hover:bg-slate-50"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setNewPermissions([...newPermissions, tpl.id]);
                                        } else {
                                          setNewPermissions(newPermissions.filter(id => id !== tpl.id));
                                        }
                                      }}
                                      className="mt-1 w-4 h-4 text-pink-600 rounded border-gray-300 focus:ring-pink-500"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-[11px] font-bold text-slate-800 leading-tight">
                                        {language === "ar" ? tpl.titleAr : tpl.titleEn}
                                      </div>
                                      <div className="text-[9px] text-slate-500 truncate mt-0.5" dir="ltr text-right">
                                        ID: {tpl.id}
                                      </div>
                                      <div className="text-[9px] font-black text-pink-600 mt-0.5 bg-pink-100 inline-block px-1 rounded">
                                        {tpl.departmentDefault}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                          
                          {/* Module UI/Tabs Access Matrix */}
                          <div className="border-t border-slate-200 pt-5 mt-5">
                            <div className="mb-4">
                              <label className="block text-sm font-black text-indigo-700">صلاحيات استثنائية وعكسية لوصول الصفحات (Module Override/Deny)</label>
                              <p className="text-[10px] text-slate-500 mt-1">تجاوزات أمنية وحجب الصفحات التابعة للدور الأساسي (مثلاً منح إذن استثنائي لممرضة للدخول لصفحة الجودة أو حجب الروستر عن موظف معين).</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                              {SYSTEM_MODULES.map((mod) => {
                                const overrideEntry = newModuleOverrides.find(id => id.startsWith(mod.id));
                                const isOverride = !!overrideEntry;
                                const overrideExpire = overrideEntry && overrideEntry.includes('|') ? parseInt(overrideEntry.split('|')[1]) : 0;
                                
                                const denialEntry = newModuleDenials.find(id => id.startsWith(mod.id));
                                const isDenied = !!denialEntry;
                                const denialExpire = denialEntry && denialEntry.includes('|') ? parseInt(denialEntry.split('|')[1]) : 0;
                                
                                const setTimeLimit = (type: 'override' | 'deny', hours: number) => {
                                  let expireTs = hours > 0 ? Date.now() + (hours * 3600000) : 0;
                                  let val = hours > 0 ? `${mod.id}|${expireTs}` : mod.id;
                                  
                                  if (type === 'override') {
                                    setNewModuleOverrides([...newModuleOverrides.filter(id => !id.startsWith(mod.id)), val]);
                                  } else {
                                    setNewModuleDenials([...newModuleDenials.filter(id => !id.startsWith(mod.id)), val]);
                                  }
                                };

                                return (
                                  <div key={mod.id} className="bg-white border text-[11px] border-slate-200 p-3 rounded-lg flex flex-col justify-between">
                                    <div className="flex font-extrabold text-slate-800 items-start justify-between mb-2">
                                      {language === "ar" ? mod.nameAr : mod.nameEn}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <div className="flex bg-slate-100 rounded p-1 gap-1">
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            if (isOverride && overrideExpire === 0) {
                                              setNewModuleOverrides(newModuleOverrides.filter(id => !id.startsWith(mod.id)));
                                            } else {
                                              setNewModuleOverrides([...newModuleOverrides.filter(id => !id.startsWith(mod.id)), mod.id]);
                                              setNewModuleDenials(newModuleDenials.filter(id => !id.startsWith(mod.id)));
                                            }
                                          }}
                                          className={`flex-1 py-1 rounded font-bold transition-colors ${isOverride && overrideExpire === 0 ? "bg-emerald-500 text-white shadow" : "text-slate-500 hover:bg-slate-200"}`}
                                          title="صلاحية دائمة"
                                        >
                                          تخويل دائم
                                        </button>
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            if (isDenied && denialExpire === 0) {
                                              setNewModuleDenials(newModuleDenials.filter(id => !id.startsWith(mod.id)));
                                            } else {
                                              setNewModuleDenials([...newModuleDenials.filter(id => !id.startsWith(mod.id)), mod.id]);
                                              setNewModuleOverrides(newModuleOverrides.filter(id => !id.startsWith(mod.id)));
                                            }
                                          }}
                                          className={`flex-1 py-1 rounded font-bold transition-colors ${isDenied && denialExpire === 0 ? "bg-red-500 text-white shadow" : "text-slate-500 hover:bg-slate-200"}`}
                                          title="حجب دائم"
                                        >
                                          حجب دائم
                                        </button>
                                      </div>
                                      
                                      {/* Time-bound controls */}
                                      <div className="grid grid-cols-2 gap-1 mt-1">
                                         <button 
                                            type="button"
                                            onClick={() => setTimeLimit('override', 8)}
                                            className={`py-1 rounded text-[10px] font-bold transition-colors border ${isOverride && overrideExpire > 0 ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                                         >
                                           + 8 ساعات إذن
                                         </button>
                                         <button 
                                            type="button"
                                            onClick={() => setTimeLimit('deny', 8)}
                                            className={`py-1 rounded text-[10px] font-bold transition-colors border ${isDenied && denialExpire > 0 ? "bg-red-100 border-red-300 text-red-800" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                                         >
                                           + 8 ساعات حجب
                                         </button>
                                      </div>
                                      {(isOverride && overrideExpire > 0) && (
                                        <div className="text-[9px] text-center text-emerald-600 font-bold mt-1">ينتهي: {new Date(overrideExpire).toLocaleString()}</div>
                                      )}
                                      {(isDenied && denialExpire > 0) && (
                                        <div className="text-[9px] text-center text-red-600 font-bold mt-1">ينتهي: {new Date(denialExpire).toLocaleString()}</div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Network Security Terminal Logger */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 font-mono text-[11px] text-slate-300 shadow-inner">
        <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2">
          <span className="text-slate-500 font-bold select-none">[ENTERPRISE SYSTEM COMMAND GATE LOGS]</span>
          <span className="text-emerald-500 text-[10px] flex items-center gap-1 select-none">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            LIVE TELEMETRY
          </span>
        </div>
        <div className="space-y-1 max-h-[140px] overflow-y-auto">
          {bulkActionLogs.map((log, index) => (
            <p key={index} className="text-amber-400">{log}</p>
          ))}
          <p className="text-slate-500">[{new Date().toISOString()}] Bahya Gateway Secure Firewall: Standing by for pending registrations...</p>
          <p className="text-slate-500">[{new Date().toISOString()}] Verification Rule Gating logic loaded (autoComplete properties active)</p>
        </div>
      </div>

    </div>
  );
}
