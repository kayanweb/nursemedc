import React, { useState } from "react";
import { Plus, Trash2, Edit2, Check, X, Building2 } from "lucide-react";

interface Tenant {
  name: string;
  legalId: string;
  taxId: string;
}

interface MultiTenantManagerProps {
  language: "ar" | "en";
  settingsForm: {
    tenants?: Tenant[];
    [key: string]: any;
  };
  setSettingsForm: React.Dispatch<React.SetStateAction<any>>;
}

export function MultiTenantManager({ language, settingsForm, setSettingsForm }: MultiTenantManagerProps) {
  const isAr = language === "ar";
  const tenants = settingsForm.tenants || [];

  // Adding state
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTaxId, setNewTaxId] = useState("");

  // Editing state
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editTaxId, setEditTaxId] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) {
      alert(isAr ? "يرجى إدخال اسم المنشأة / الفرع" : "Please enter the branch name.");
      return;
    }
    const newId = `BHY-SUB-${Math.floor(Math.random() * 10000)}`;
    const newTenant: Tenant = {
      name: newName.trim(),
      legalId: newId,
      taxId: newTaxId.trim() || "LIVE-ACTIVE"
    };

    setSettingsForm((prev: any) => ({
      ...prev,
      tenants: [...(prev.tenants || []), newTenant]
    }));

    // Reset input fields
    setNewName("");
    setNewTaxId("");
    setIsAdding(false);
  };

  const handleStartEdit = (idx: number, tenant: Tenant) => {
    setEditingIdx(idx);
    setEditName(tenant.name);
    setEditTaxId(tenant.taxId);
  };

  const handleSaveEdit = (idx: number) => {
    if (!editName.trim()) {
      alert(isAr ? "يرجى إدخال الاسم المعدل" : "Please enter the modified name.");
      return;
    }

    setSettingsForm((prev: any) => {
      const updated = [...(prev.tenants || [])];
      updated[idx] = {
        ...updated[idx],
        name: editName.trim(),
        taxId: editTaxId.trim()
      };
      return { ...prev, tenants: updated };
    });

    setEditingIdx(null);
  };

  const handleDelete = (idx: number) => {
    const confirmMsg = isAr 
      ? `هل تريد متأكد من حذف هذه المنشأة / المبنى؟` 
      : `Are you sure you want to delete this tenant?`;
    
    if (window.confirm(confirmMsg)) {
      setSettingsForm((prev: any) => {
        const updated = [...(prev.tenants || [])];
        updated.splice(idx, 1);
        return { ...prev, tenants: updated };
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100 border border-pink-250 text-pink-700 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
        >
          {isAdding ? (
            <>
              <X className="w-3.5 h-3.5" />
              {isAr ? "إغلاق النموذج" : "Cancel"}
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              {isAr ? "إضافة منشأة أو مبنى جديد" : "Add Tenant / Building"}
            </>
          )}
        </button>

        <h4 className="text-xs font-bold text-slate-800 flex items-center justify-end gap-1.5">
          <span>{isAr ? "إدارة الفروع والمنشآت التابعة" : "Multi-Tenant Hub Settings"}</span>
          <Building2 className="w-4 h-4 text-pink-600" />
        </h4>
      </div>

      {/* Add New Tenant Form */}
      {isAdding && (
        <div className="bg-pink-50/50 border border-pink-100 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-[11px] font-bold text-pink-800">{isAr ? "تسجيل فرع أو مبنى تابع جديد" : "Register New Branch / Building"}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] text-slate-500 font-bold">{isAr ? "اسم الفرع أو المبنى (بالعربية)" : "Branch Name (Arabic)"}</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={isAr ? "مثال: مبنى التوسعة الغربية أو فرع التجمع" : "e.g. West Wing Building"}
                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-pink-500 text-right"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] text-slate-500 font-bold">{isAr ? "كود التراخيص / السجل الضريبي" : "Tax ID / License Key"}</label>
              <input
                type="text"
                value={newTaxId}
                onChange={(e) => setNewTaxId(e.target.value)}
                placeholder={isAr ? "مثال: TX-9087-BHY" : "e.g. TX-9087-BHY"}
                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-pink-500 text-right font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 text-xs pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 bg-slate-100 text-slate-650 rounded-lg hover:bg-slate-200 transition"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="px-4 py-1.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition font-bold"
            >
              {isAr ? "إضافة الفرع الآن" : "Add Branch"}
            </button>
          </div>
        </div>
      )}

      {/* Tenants List */}
      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {tenants.map((t, idx) => {
          const isEditing = editingIdx === idx;
          return (
            <div
              key={idx}
              className={`flex flex-col md:flex-row justify-between items-stretch md:items-center bg-white p-3 border rounded-xl shadow-sm hover:border-slate-300 transition gap-3 ${
                isEditing ? "ring-2 ring-pink-500/20 border-pink-500" : "border-slate-150"
              }`}
            >
              <div className="flex gap-2 items-center text-xs justify-start order-2 md:order-1">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(idx)}
                      className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold transition flex items-center gap-1 text-[11px]"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {isAr ? "حفظ" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingIdx(null)}
                      className="px-2.5 py-1.5 bg-slate-100 text-slate-550 border rounded-lg hover:bg-slate-200 text-[11px]"
                    >
                      {isAr ? "إلغاء" : "Cancel"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(idx, t)}
                      className="px-2.5 py-1.5 bg-slate-50 text-slate-600 border rounded-lg hover:bg-slate-100 transition flex items-center gap-1 text-[11px]"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                      {isAr ? "تعديل" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(idx)}
                      className="px-2.5 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-100 transition flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      {isAr ? "مسح" : "Delete"}
                    </button>
                  </>
                )}
              </div>

              <div className="text-right flex-1 order-1 md:order-2 space-y-1">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-lg py-1 px-2 text-xs font-bold text-slate-800 text-right outline-none focus:ring-1 focus:ring-pink-500"
                    />
                    <input
                      type="text"
                      value={editTaxId}
                      onChange={(e) => setEditTaxId(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-lg py-1 px-2 text-xs font-mono text-slate-700 text-right outline-none focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                ) : (
                  <>
                    <p className="font-bold text-slate-800 text-sm">{t.name}</p>
                    <p className="text-[10px] font-mono text-slate-500">
                      LEGAL_ID: <span className="font-semibold text-slate-750">{t.legalId}</span> &bull; TAX: <span className="font-semibold text-slate-750">{t.taxId}</span>
                    </p>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {tenants.length === 0 && (
          <p className="text-center text-[10.5px] text-slate-400 py-4 font-bold">
            {isAr ? "لا توجد فروع مسجلة حتى الآن." : "No registered branches or buildings currently."}
          </p>
        )}
      </div>
    </div>
  );
}
