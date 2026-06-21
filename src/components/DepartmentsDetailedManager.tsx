import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Check, X, Shield, Layers, HelpCircle } from "lucide-react";

export interface DeptDetail {
  id: string;
  name: string;
  type: "medical" | "admin" | "technical" | "support";
  managerName: string;
  managerStaffId: string;
  managerPin: string;
  sealAuthority: boolean;
}

interface DepartmentsDetailedManagerProps {
  language: "ar" | "en";
  departments: string[];
  setDepartments: React.Dispatch<React.SetStateAction<string[]>>;
  systemUsers: any[];
  setSystemUsers: React.Dispatch<React.SetStateAction<any[]>>;
  saveSetting: (key: string, value: any) => Promise<void>;
}

export function DepartmentsDetailedManager({
  language,
  departments,
  setDepartments,
  systemUsers,
  setSystemUsers,
  saveSetting
}: DepartmentsDetailedManagerProps) {
  const isAr = language === "ar";

  // Detailed Dept State
  const [deptDetails, setDeptDetails] = useState<DeptDetail[]>([]);

  // Editing rows states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<"medical" | "admin" | "technical" | "support">("medical");
  const [editManagerName, setEditManagerName] = useState("");
  const [editManagerStaffId, setEditManagerStaffId] = useState("");
  const [editManagerPin, setEditManagerPin] = useState("");
  const [editSealAuthority, setEditSealAuthority] = useState(false);

  // Adding state
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"medical" | "admin" | "technical" | "support">("medical");
  const [newManagerName, setNewManagerName] = useState("");
  const [newManagerStaffId, setNewManagerStaffId] = useState("");
  const [newManagerPin, setNewManagerPin] = useState("");
  const [newSealAuthority, setNewSealAuthority] = useState(true);

  // Initialize deptDetails based on departments simple list
  useEffect(() => {
    try {
      const stored = localStorage.getItem("baheya_hospital_departments_details");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Align with current departments to ensure consistency
          const filtered = parsed.filter(d => departments.includes(d.name));
          const missing = departments.filter(d => !filtered.some((f: any) => f.name === d));
          
          const missingDetails = missing.map((d, index) => {
            // Find existing user if possible
            const supervisor = systemUsers.find(u => u.department === d && (u.role === "head_nurse" || u.role === "admin" || u.role === "supervisor"));
            return {
              id: `dept-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
              name: d,
              type: inferTypeByName(d),
              managerName: supervisor ? (isAr ? supervisor.nameAr : supervisor.nameEn) : (isAr ? "لم يعين بعد" : "Unassigned"),
              managerStaffId: supervisor ? supervisor.staffId : "BHG-TBD",
              managerPin: supervisor ? (supervisor.pin || "0000") : "----",
              sealAuthority: true
            };
          });

          setDeptDetails([...filtered, ...missingDetails] as DeptDetail[]);
          return;
        }
      }
    } catch (e) {}

    // Fallback: Generate from simple departments array
    const initial = departments.map((d, index) => {
      const supervisor = systemUsers.find(u => u.department === d && (u.role === "head_nurse" || u.role === "admin" || u.role === "supervisor"));
      return {
        id: `dept-${Date.now()}-${index}`,
        name: d,
        type: inferTypeByName(d),
        managerName: supervisor ? (isAr ? supervisor.nameAr : supervisor.nameEn) : (isAr ? "لم يعين بعد" : "Unassigned"),
        managerStaffId: supervisor ? supervisor.staffId : "BHG-TBD",
        managerPin: supervisor ? (supervisor.pin || "0000") : "----",
        sealAuthority: true
      };
    });
    setDeptDetails(initial);
  }, [departments.length]);

  const inferTypeByName = (name: string): "medical" | "admin" | "technical" | "support" => {
    const n = name.toUpperCase();
    if (n.includes("QUALITY") || n.includes("ADMIN") || n.includes("RECEPTION") || n.includes("SECRETARY")) {
      return "admin";
    }
    if (n.includes("IT") || n.includes("ENGINEERING") || n.includes("BIOMEDICAL") || n.includes("TECHNICAL")) {
      return "technical";
    }
    if (n.includes("TRANSPORT") || n.includes("MEALS") || n.includes("LAUNDRY") || n.includes("CLEANING") || n.includes("SECURITY")) {
      return "support";
    }
    return "medical";
  };

  const syncAll = (updatedDetails: DeptDetail[]) => {
    setDeptDetails(updatedDetails);
    localStorage.setItem("baheya_hospital_departments_details", JSON.stringify(updatedDetails));
    saveSetting("baheya_hospital_departments_details", updatedDetails);

    // Sync simple departments list as well
    const simpleNames = updatedDetails.map(d => d.name);
    setDepartments(simpleNames);
    localStorage.setItem("baheya_hospital_departments", JSON.stringify(simpleNames));
    saveSetting("baheya_hospital_departments", simpleNames);
  };

  const handleStartEdit = (dept: DeptDetail) => {
    setEditingId(dept.id);
    setEditName(dept.name);
    setEditType(dept.type);
    setEditManagerName(dept.managerName);
    setEditManagerStaffId(dept.managerStaffId);
    setEditManagerPin(dept.managerPin);
    setEditSealAuthority(dept.sealAuthority);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) {
      alert(isAr ? "يرجى كتابة اسم القسم/الواحدة!" : "Department name is required!");
      return;
    }

    const updated = deptDetails.map(d => {
      if (d.id === id) {
        return {
          ...d,
          name: editName.trim().toUpperCase(),
          type: editType,
          managerName: editManagerName.trim(),
          managerStaffId: editManagerStaffId.trim(),
          managerPin: editManagerPin.trim(),
          sealAuthority: editSealAuthority
        };
      }
      return d;
    });

    syncAll(updated);
    setEditingId(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (departments.length <= 1) {
      alert(isAr ? "عذراً: يجب الحفاظ على قسم أو واحدة واحدة على الأقل بالمنظومة!" : "At least one department must remain!");
      return;
    }

    const confirmMsg = isAr 
      ? `هل أنت متأكد من حذف ${name}؟ سيتم إلغاؤه من قوائم الجرد والأقسام.` 
      : `Are you sure you want to delete ${name}?`;

    if (window.confirm(confirmMsg)) {
      const updated = deptDetails.filter(d => d.id !== id);
      syncAll(updated);
    }
  };

  const handleAddDept = () => {
    if (!newName.trim()) {
      alert(isAr ? "يرجى كتابة اسم القسم أو الوحدة الجديدة" : "Please input department name.");
      return;
    }

    const nameUpper = newName.trim().toUpperCase();
    if (deptDetails.some(d => d.name === nameUpper)) {
      alert(isAr ? "هذا القسم أو الوحدة مسجلة بالفعل!" : "This unit already exists!");
      return;
    }

    const newDept: DeptDetail = {
      id: `dept-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: nameUpper,
      type: newType,
      managerName: newManagerName.trim() || (isAr ? "لم يعين بعد" : "Unassigned"),
      managerStaffId: newManagerStaffId.trim() || `BHG-${Math.floor(Math.random() * 900) + 100}`,
      managerPin: newManagerPin.trim() || "1234",
      sealAuthority: newSealAuthority
    };

    const updated = [...deptDetails, newDept];
    syncAll(updated);

    // Reset fields
    setNewName("");
    setNewManagerName("");
    setNewManagerStaffId("");
    setNewManagerPin("");
    setIsAdding(false);

    alert(isAr ? `تمت إضافة وتفعيل القسم "${nameUpper}" بنجاح!` : `Added "${nameUpper}" successfully!`);
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "medical": return isAr ? "طبية سريرية" : "Clinical Medical";
      case "admin": return isAr ? "إدارية" : "Administrative";
      case "technical": return isAr ? "فنية / تكنولوجيا" : "Technical / IT";
      case "support": return isAr ? "خدمات فنية مساندة" : "Support Services";
      default: return type;
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-right w-full" style={{ direction: isAr ? "rtl" : "ltr" }}>
      
      <div className="border-b border-slate-100 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 self-start order-2 md:order-1"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4 animate-bounce" />}
          {isAdding ? (isAr ? "إلغاء الإضافة" : "Cancel") : (isAr ? "إضافة قسم أو وحدة جديدة (طبية/إدارية)" : "Add Department / Unit")}
        </button>

        <div className="order-1 md:order-2">
          <h3 className="text-base font-black text-slate-800 flex items-center justify-end gap-2">
            <span>{isAr ? "إدارة وتعديل الأقسام والوحدات بالمستشفى" : "Hospital Departments & Units Ledger"}</span>
            <Layers className="h-5 w-5 text-indigo-650" />
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAr 
              ? "تحكم كامل بالأقسام الطبية والوحدات الإدارية والفنية والمساندة مع تكويد المشرفين وربط أختامهم الذكية."
              : "Full tracking of clinical wards, administrative sectors, and IT departments with dynamic signature seals overrides."}
          </p>
        </div>
      </div>

      {/* Adding Module */}
      {isAdding && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <p className="text-xs font-black text-indigo-805 text-indigo-700 border-b border-slate-200 pb-1.5">
            {isAr ? "✍ تسجيل وحدة أو قسم جديد بالمنظومة" : "Register a New Hospital Sector"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-slate-500">{isAr ? "اسم القسم أو الوحدة" : "Sector Name"}</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={isAr ? "مثال: IT DEPARTMENT" : "e.g. HUMAN RESOURCES"}
                className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-right font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-slate-500">{isAr ? "نوع وتصنيف القسم" : "Sector Category"}</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-right font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              >
                <option value="medical">{isAr ? "طبية سريرية (Clinical)" : "Clinical Medical"}</option>
                <option value="admin">{isAr ? "إدارية (Administrative)" : "Administrative"}</option>
                <option value="technical">{isAr ? "فنية / معلوماتية (Technical)" : "Technical / IT"}</option>
                <option value="support">{isAr ? "خدمات فنية مساندة (Support)" : "Support Services"}</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-slate-500">{isAr ? "اسم المشرف المعتمد" : "Supervisor Name"}</label>
              <input
                type="text"
                value={newManagerName}
                onChange={(e) => setNewManagerName(e.target.value)}
                placeholder={isAr ? "مثال: م. علي محمد" : "e.g. Eng. Ali Mohamed"}
                className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-right font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-slate-500">{isAr ? "كود الموظف (Staff ID)" : "Employee Code"}</label>
              <input
                type="text"
                value={newManagerStaffId}
                onChange={(e) => setNewManagerStaffId(e.target.value)}
                placeholder={isAr ? "مثال: BHY-9102" : "e.g. BHY-9102"}
                className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-right font-mono font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-slate-500">{isAr ? "الرمز السري (PIN)" : "PIN (4-6 digits)"}</label>
              <input
                type="text"
                maxLength={6}
                value={newManagerPin}
                onChange={(e) => setNewManagerPin(e.target.value)}
                placeholder="1234"
                className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-center font-mono font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>
            <div className="space-y-1 flex flex-col justify-end">
              <label className="flex items-center gap-2 justify-end cursor-pointer select-none py-2">
                <input
                  type="checkbox"
                  checked={newSealAuthority}
                  onChange={(e) => setNewSealAuthority(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-350 rounded"
                />
                <span className="text-xs font-bold text-slate-700">{isAr ? "منح صلاحية الختم الكلي التلقائي" : "Full Stamp & Certification Authority"}</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition text-xs"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              onClick={handleAddDept}
              className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow transition text-xs"
            >
              {isAr ? "تسجيل وحفظ القسم الآن" : "Register and Save"}
            </button>
          </div>
        </div>
      )}

      {/* Interactive Grid Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-inner bg-slate-50">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-900 text-slate-300 font-bold">
                <th className="p-3 text-right">{isAr ? "الواحدات والأقسام" : "Departments / Units"}</th>
                <th className="p-3 text-right">{isAr ? "نوع ومستوى القسم" : "Category"}</th>
                <th className="p-3 text-right">{isAr ? "المشرف المعتمد" : "Approved Supervisor"}</th>
                <th className="p-3 text-center">{isAr ? "كود الموظف" : "Employee Code"}</th>
                <th className="p-3 text-center">{isAr ? "الرمز السري (PIN)" : "Secret PIN"}</th>
                <th className="p-3 text-center">{isAr ? "صلاحية الختم الكلي" : "Stamp Authority"}</th>
                <th className="p-3 text-center w-40">{isAr ? "إجراءات التحكم السريعة" : "Control Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {deptDetails.map((dept) => {
                const isEditing = editingId === dept.id;

                return (
                  <tr key={dept.id} className="hover:bg-slate-50 transition">
                    
                    {/* Dept Name */}
                    <td className="p-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-bold font-sans text-xs text-right focus:ring-1 focus:ring-indigo-500 outline-none text-slate-805"
                        />
                      ) : (
                        <span className="font-extrabold text-slate-800 uppercase font-sans">{dept.name}</span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="p-3">
                      {isEditing ? (
                        <select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1 font-bold text-xs text-right focus:ring-1 focus:ring-indigo-500 outline-none text-slate-805"
                        >
                          <option value="medical">{isAr ? "طبية سريرية" : "Clinical Medical"}</option>
                          <option value="admin">{isAr ? "إدارية" : "Administrative"}</option>
                          <option value="technical">{isAr ? "فنية / تكنولوجيا" : "Technical / IT"}</option>
                          <option value="support">{isAr ? "خدمات فنية مساندة" : "Support Services"}</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          dept.type === "medical" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                          dept.type === "admin" ? "bg-purple-50 text-purple-800 border border-purple-200" :
                          dept.type === "technical" ? "bg-blue-50 text-blue-800 border border-blue-200" :
                          "bg-amber-50 text-amber-805 border border-amber-200 text-amber-800"
                        }`}>
                          {getTypeName(dept.type)}
                        </span>
                      )}
                    </td>

                    {/* Manager Name */}
                    <td className="p-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editManagerName}
                          onChange={(e) => setEditManagerName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-bold text-xs text-right focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      ) : (
                        <span className="font-bold text-indigo-900">{dept.managerName}</span>
                      )}
                    </td>

                    {/* Staff ID */}
                    <td className="p-3 text-center">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editManagerStaffId}
                          onChange={(e) => setEditManagerStaffId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-mono text-xs text-center focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      ) : (
                        <span className="font-mono text-slate-550 font-medium">{dept.managerStaffId}</span>
                      )}
                    </td>

                    {/* Secret PIN */}
                    <td className="p-3 text-center">
                      {isEditing ? (
                        <input
                          type="password"
                          maxLength={6}
                          value={editManagerPin}
                          onChange={(e) => setEditManagerPin(e.target.value)}
                          className="w-16 bg-slate-50 border border-slate-300 rounded-lg p-1 font-mono text-xs text-center focus:ring-1 focus:ring-indigo-500 outline-none font-bold"
                          placeholder="PIN"
                        />
                      ) : (
                        <span className="font-mono text-emerald-600 font-black tracking-widest">{dept.managerPin}</span>
                      )}
                    </td>

                    {/* Seal Authority */}
                    <td className="p-3 text-center">
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={editSealAuthority}
                          onChange={(e) => setEditSealAuthority(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded cursor-pointer"
                        />
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block border ${
                          dept.sealAuthority 
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}>
                          {dept.sealAuthority ? (isAr ? "✓ معتمد تلقائيا" : "✓ Subscribed") : (isAr ? "لا يملك ختم كلي" : "No stamp")}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-center">
                      <div className="flex gap-1.5 justify-center">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(dept.id)}
                              className="px-2 py-1 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700 transition flex items-center gap-1 text-[10px]"
                            >
                              <Check className="w-3 h-3" />
                              {isAr ? "حفظ" : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-305 transition text-[10px]"
                            >
                              {isAr ? "إلغاء" : "Cancel"}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(dept)}
                              className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded hover:bg-indigo-100 transition flex items-center gap-1 text-[10px]"
                            >
                              <Edit2 className="w-3 h-3 text-indigo-600" />
                              {isAr ? "تعديل" : "Edit"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(dept.id, dept.name)}
                              className="px-2 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded hover:bg-rose-100 transition flex items-center gap-1 text-[10px]"
                            >
                              <Trash2 className="w-3 h-3 text-rose-500" />
                              {isAr ? "حذف" : "Delete"}
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
