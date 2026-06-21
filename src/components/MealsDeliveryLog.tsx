import React, { useState, useRef, useEffect } from "react";
import { DepartmentRoster } from "../types";
import { Printer, Calendar, Coffee, Moon, Search, Plus, Save, Archive, Download, Trash2, Edit2, HeartPulse } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useSettings } from "../context/SettingsContext";

interface MealsDeliveryLogProps {
  language: "ar" | "en";
  rosterList: DepartmentRoster[];
  departments: string[];
}

export default function MealsDeliveryLog({ language, rosterList, departments }: MealsDeliveryLogProps) {
  const isAr = language === "ar";
  const { settings } = useSettings();
  
  // States
  const [selectedDept, setSelectedDept] = useState<string>(departments?.[0] || "");
  const [selectedDay, setSelectedDay] = useState<string>(String(new Date().getDate()));
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-05");
  const [mealType, setMealType] = useState<"lunch" | "dinner">("lunch");
  
  // Working list
  const [mealStaffList, setMealStaffList] = useState<any[]>([]);
  
  // Archive
  const [archive, setArchive] = useState<any[]>([]);
  const [showArchive, setShowArchive] = useState(false);
  
  useEffect(() => {
    const saved = localStorage.getItem("hospital_meals_archive");
    if (saved) {
      try { setArchive(JSON.parse(saved)); } catch(e) {}
    }
  }, []);

  const saveToArchive = () => {
    if (mealStaffList.length === 0) return;
    const newRecord = {
      id: Date.now().toString(),
      dateUpdated: new Date().toISOString(),
      department: selectedDept,
      day: selectedDay,
      month: selectedMonth,
      mealType: mealType,
      staffList: mealStaffList
    };
    const updated = [newRecord, ...archive];
    setArchive(updated);
    localStorage.setItem("hospital_meals_archive", JSON.stringify(updated));
    alert(isAr ? "تم حفظ الكشف بنجاح في الأرشيف!" : "Sheet saved to archive successfully!");
  };

  const loadFromArchive = (record: any) => {
    setSelectedDept(record.department);
    setSelectedDay(record.day);
    setSelectedMonth(record.month || "2026-05");
    setMealType(record.mealType);
    setMealStaffList(record.staffList);
    setShowArchive(false);
  };
  
  const deleteArchiveRecord = (id: string) => {
    if (window.confirm(isAr ? "تأكيد حذف السجل؟" : "Confirm delete?")) {
      const updated = archive.filter(a => a.id !== id);
      setArchive(updated);
      localStorage.setItem("hospital_meals_archive", JSON.stringify(updated));
    }
  };

  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Meals_List_${selectedDept}_${selectedDay}_${selectedMonth}`,
  });

  const batchComponentRef = useRef<HTMLDivElement>(null);
  const handlePrintAll = useReactToPrint({
    contentRef: batchComponentRef,
    documentTitle: `All_Depts_Meals_${selectedDay}_${selectedMonth}`,
  });

  const getMealStaffListForDept = (dept: string, type: "lunch" | "dinner") => {
    const activeRoster = rosterList.find((r: any) => r.departmentName === dept && r.month === selectedMonth) 
      || rosterList.find((r: any) => r.departmentName === dept && !r.month && selectedMonth === "2026-05");
      
    if (!activeRoster) return [];
    
    return activeRoster.rows.filter(row => {
      const shiftForDay = row.shifts[selectedDay];
      if (!shiftForDay) return false;
      
      const s = shiftForDay.toUpperCase();
      if (type === "lunch") {
        return s === "D" || s === "DN" || s === "M";
      } else {
        return s === "N" || s === "DN" || s === "A";
      }
    }).map(row => ({
      id: row.employeeId || Math.random().toString(),
      employeeNameAr: row.employeeNameAr || row.employeeNameEn,
      employeeNameEn: row.employeeNameEn || row.employeeNameAr,
      employeeCode: row.employeeCode || "",
      shiftForDay: row.shifts[selectedDay] || "",
      department: dept
    }));
  };

  const PrintableMealPage = ({ dept, type, staffList }: { dept: string, type: "lunch"|"dinner", staffList: any[] }) => {
    if (staffList.length === 0) return null;
    return (
      <div className="space-y-8 w-full bg-white print:p-8 shrink-0 break-after-page" style={{ pageBreakAfter: "always" }}>
        {/* Header Document */}
        <div className="flex justify-between items-start pb-6 w-full px-4">
          <div className="text-center flex-1 pt-6 text-right">
            <h2 className="text-3xl font-black text-slate-900 mb-1">{isAr ? "جدول تسليم وجبات الموظفين" : "Employee Meal Delivery Log"}</h2>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-1.5 border border-pink-200 bg-pink-50/25 px-3 py-1.5 rounded-xl">
              <span className="font-mono font-black text-pink-700 text-xs tracking-wider border border-pink-300 px-1 py-0.5 rounded leading-none shrink-0">
                {settings.nameEn ? settings.nameEn.split(/\s+/).map((w: string) => w[0]).filter((c: string) => /^[a-zA-Z\u0600-\u06FF]$/.test(c)).slice(0, 2).join("").toUpperCase() : "BH"}
              </span>
              <div className="text-right">
                <span className="font-sans font-black text-slate-800 text-xs block leading-none">
                  {isAr ? (settings.institutionNameAr || "مؤسسة المستشفى") : (settings.institutionNameEn || "Hospital Foundation")}
                </span>
                <span className="text-[8px] font-bold text-pink-700 block mt-1 tracking-wider leading-none">
                  {isAr ? "نظام تغذية الكادر" : "NURSE MEAL LOG"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Document Info Metadata row */}
        <div className="flex justify-between w-full pb-4 text-sm font-bold text-slate-800 px-4 text-right">
          <div className="space-y-4">
              <p className="flex items-center gap-1">
              <span>{isAr ? "القسم :" : "Department:"}</span> 
              <span className="inline-block w-64 border-b border-dashed border-slate-600 px-2 font-black text-slate-900">{dept}</span>
            </p>
          </div>
          <div className="space-y-4">
            <p className="flex items-center gap-1 justify-end">
              <span className="inline-block w-16 border-b border-dashed border-slate-600 text-center text-slate-900 font-mono">{selectedMonth.split('-')[0] || '2026'}</span>/
              <span className="inline-block w-12 border-b border-dashed border-slate-600 text-center text-slate-900 font-mono">{selectedMonth.split('-')[1] || '05'}</span>/
              <span className="inline-block w-12 border-b border-dashed border-slate-600 text-center text-slate-900 font-mono">{selectedDay.padStart(2, '0')}</span> 
              <span className="mr-2">{isAr ? ":التاريخ" : "Date:"}</span>
            </p>
            <p className="flex items-center gap-1 justify-end">
              <span className="inline-block w-48 border-b border-dashed border-slate-600 px-2 text-slate-900">{isAr ? `يوم ${selectedDay}` : `Day ${selectedDay}`}</span> 
              <span className="mr-2">{isAr ? ":اليوم" : "Day:"}</span>
            </p>
          </div>
        </div>

        {/* Meals Roster Table */}
        <table className="w-full text-center border-collapse text-xs font-sans mt-4 rtl" dir="rtl">
          <thead>
            <tr className="bg-slate-50 border-t border-b-2 border-l border-r border-slate-800 text-slate-900 print:bg-white border-2">
              <th className="border-2 border-slate-800 px-2 py-4 w-12 font-black text-base">{isAr ? "رقم" : "No."}</th>
              <th className="border-2 border-slate-800 px-3 py-4 font-black text-base text-right">{isAr ? "الاسم" : "Name"}</th>
              <th className="border-2 border-slate-800 px-2 py-4 w-28 font-black text-base">{isAr ? "كود الموظف" : "Staff ID"}</th>
              <th className="border-2 border-slate-800 px-2 py-4 font-black w-24 text-base">{isAr ? "القسم" : "Dept"}</th>
              <th className="border-2 border-slate-800 px-2 py-4 font-black w-24 text-base">{isAr ? "الوردية" : "Shift"}</th>
              <th className="border-2 border-slate-800 px-2 py-4 font-black w-32 text-base">{isAr ? "نوع الوجبة" : "Meal Course"}</th>
              <th className="border-2 border-slate-800 px-2 py-4 font-black w-28 text-base">{isAr ? "وقت التسليم" : "Time"}</th>
              <th className="border-2 border-slate-800 px-2 py-4 font-black w-32 text-base">{isAr ? "التوقيع" : "Signature"}</th>
              <th className="border-2 border-slate-800 px-3 py-4 font-black text-right w-40 text-base">{isAr ? "ملاحظات" : "Notes"}</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map((staff, idx) => (
              <tr key={staff.id} className="hover:bg-slate-50 border-b border-slate-800 h-10 group">
                <td className="border-2 border-slate-800 px-2 font-bold">{idx + 1}</td>
                <td className="border-2 border-slate-800 px-2 text-right font-black text-sm">{isAr ? staff.employeeNameAr : staff.employeeNameEn}</td>
                <td className="border-2 border-slate-800 px-1 font-mono font-bold text-[11px]">{staff.employeeCode}</td>
                <td className="border-2 border-slate-800 px-1 font-semibold text-[11px]">{staff.department}</td>
                <td className="border-2 border-slate-800 px-1 font-black">{staff.shiftForDay}</td>
                <td className="border-2 border-slate-800 px-2 font-bold">{type === "lunch" ? (isAr ? "غداء" : "Lunch") : (isAr ? "عشاء" : "Dinner")}</td>
                <td className="border-2 border-slate-800 px-2"></td>
                <td className="border-2 border-slate-800 px-2"></td>
                <td className="border-2 border-slate-800 px-3 text-right"></td>
              </tr>
            ))}
            {/* Add a few extra empty rows */}
            {Array.from({ length: Math.max(8, 20 - staffList.length) }).map((_, i) => (
              <tr key={`empty-${i}`} className="h-10">
                <td className="border-2 border-slate-800 px-2 font-bold">{staffList.length + i + 1}</td>
                <td className="border-2 border-slate-800 px-3"></td>
                <td className="border-2 border-slate-800 px-2"></td>
                <td className="border-2 border-slate-800 px-2"></td>
                <td className="border-2 border-slate-800 px-2"></td>
                <td className="border-2 border-slate-800 px-2 font-bold"></td>
                <td className="border-2 border-slate-800 px-2"></td>
                <td className="border-2 border-slate-800 px-2"></td>
                <td className="border-2 border-slate-800 px-3"></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer Form Info and Sig */}
        <div className="flex flex-col pt-8 avoid-break text-sm text-slate-800 print:text-black w-full font-bold px-4">
          <div className="flex items-center gap-2 mb-12">
            <span>{isAr ? "مدير القسم :" : "Department Manager:"}</span>
            <span className="inline-block w-80 border-b border-dashed border-slate-600"></span>
          </div>
          
          <div className="flex items-center justify-between text-[10px] font-mono font-normal text-slate-600 print:text-black mt-8">
            <span>Page 1 of 1</span>
            <span>Issue Date:07.2025</span>
            <span>Version No: 01</span>
            <span>BHG-BZ-FR-HPT-003- {isAr ? "جدول تسليم وجبات الموظفين - كل الأقسام" : "Meals Delivery - All"}</span>
          </div>
        </div>
      </div>
    );
  };

  const handleSmartImport = () => {
    const activeRoster = rosterList.find((r: any) => r.departmentName === selectedDept && r.month === selectedMonth) 
      || rosterList.find((r: any) => r.departmentName === selectedDept && !r.month && selectedMonth === "2026-05");
      
    if (!activeRoster) {
      alert(isAr ? "لا يوجد روستر لهذا القسم في هذا الشهر." : "No roster found for this department/month.");
      return;
    }
    
    const imported = activeRoster.rows.filter(row => {
      const shiftForDay = row.shifts[selectedDay];
      if (!shiftForDay) return false;
      
      const s = shiftForDay.toUpperCase();
      
      if (mealType === "lunch") {
        return s === "D" || s === "DN";
      } else {
        return s === "N" || s === "DN";
      }
    }).map(row => ({
      id: row.employeeId || Math.random().toString(),
      employeeNameAr: row.employeeNameAr || row.employeeNameEn,
      employeeNameEn: row.employeeNameEn || row.employeeNameAr,
      employeeCode: row.employeeCode || "",
      shiftForDay: row.shifts[selectedDay] || "",
      department: selectedDept
    }));

    setMealStaffList(imported);
  };

  const addManualRow = () => {
    setMealStaffList([...mealStaffList, {
      id: Math.random().toString(),
      employeeNameAr: "",
      employeeNameEn: "",
      employeeCode: "",
      shiftForDay: "",
      department: selectedDept
    }]);
  };
  
  const updateRow = (id: string, field: string, value: string) => {
    setMealStaffList(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };
  
  const removeRow = (id: string) => {
    setMealStaffList(prev => prev.filter(r => r.id !== id));
  };

  const daysInMonth = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const months = ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12"];

  if (showArchive) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen text-right font-sans" dir={isAr ? "rtl" : "ltr"}>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Archive className="text-indigo-600 h-6 w-6" />
              {isAr ? "أرشيف كشوفات الوجبات المسجلة" : "Meals Delivery Archives"}
            </h1>
            <button 
              onClick={() => setShowArchive(false)}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-xl font-bold text-sm transition"
            >
              {isAr ? "الرجوع" : "Back"}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archive.map(rec => (
              <div key={rec.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2 border-b pb-2">
                    <span className="font-bold text-sm text-slate-900">{rec.department}</span>
                    <span className="text-[10px] font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">{new Date(rec.dateUpdated).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-700 flex justify-between">
                    <span>{isAr ? "اليوم:" : "Day:"} {rec.day} ({rec.month})</span>
                    <span className="text-indigo-600">{rec.mealType === "lunch" ? (isAr ? "غداء" : "Lunch") : (isAr ? "عشاء" : "Dinner")}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    {isAr ? "عدد الموظفين المجردين:" : "Staff Count:"} <span className="font-bold">{rec.staffList?.length || 0}</span>
                  </div>
                </div>
                <div className="flex gap-2 border-t pt-3">
                  <button onClick={() => loadFromArchive(rec)} className="flex-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 py-1.5 rounded-lg text-xs font-bold transition flex justify-center items-center gap-1">
                    <Download className="w-3.5 h-3.5" />
                    {isAr ? "استرجاع وعرض" : "Load & View"}
                  </button>
                  <button onClick={() => deleteArchiveRecord(rec.id)} className="bg-red-50 text-red-600 hover:bg-red-100 p-1.5 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {archive.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 font-bold bg-white rounded-2xl border border-slate-200">
                {isAr ? "لا توجد سجلات محفوظة في الأرشيف" : "No archives found"}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-right font-sans" dir={isAr ? "rtl" : "ltr"}>
      
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Block */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 no-print">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <UtensilsIcon className="h-7 w-7 text-pink-600" />
              {isAr ? "إدارة وتوليد وجبات الموظفين" : "Employee Meals Generator"}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isAr 
                ? "سحب وتوليد كشوفات استلام الوجبات اليومية تلقائياً من الروستر مع إمكانية التعديل والأرشفة." 
                : "Generate daily meal delivery sheets derived from the clinical rosters with editing and archiving."}
            </p>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <button 
              onClick={() => setShowArchive(true)}
              className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors text-sm"
            >
              <Archive className="h-4 w-4" />
              <span>{isAr ? "الأرشيف" : "Archive"}</span>
            </button>
            <button 
              onClick={saveToArchive}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors text-sm"
            >
              <Save className="h-4 w-4" />
              <span>{isAr ? "حفظ" : "Save"}</span>
            </button>
            <button 
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md transition-colors text-sm"
            >
              <Printer className="h-4 w-4" />
              <span>{isAr ? "طباعة" : "Print"}</span>
            </button>
            <button 
              onClick={handlePrintAll}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md transition-colors text-sm"
            >
              <Printer className="h-4 w-4" />
              <span>{isAr ? "طباعة كل الأقسام" : "Print All Depts"}</span>
            </button>
          </div>
        </div>

        {/* Controls Block */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <h3 className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-indigo-500" />
              {isAr ? "القسم الإكلينيكي" : "Department"}
            </h3>
            <select
              value={selectedDept}
              onChange={(e) => { setSelectedDept(e.target.value); setMealStaffList([]); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none focus:border-indigo-500"
            >
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <h3 className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" />
              {isAr ? "الشهر" : "Month"}
            </h3>
            <select
              value={selectedMonth}
              onChange={(e) => { setSelectedMonth(e.target.value); setMealStaffList([]); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none focus:border-indigo-500"
            >
              {months.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <h3 className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" />
              {isAr ? "اليوم" : "Day"}
            </h3>
            <select
              value={selectedDay}
              onChange={(e) => { setSelectedDay(e.target.value); setMealStaffList([]); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none focus:border-indigo-500"
            >
              {daysInMonth.map(d => (
                <option key={d} value={d}>{isAr ? `يوم ${d}` : `Day ${d}`}</option>
              ))}
            </select>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 md:col-span-1">
            <h3 className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
              <Coffee className="h-3.5 w-3.5 text-indigo-500" />
              {isAr ? "الوجبة" : "Meal Type"}
            </h3>
            <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
              <button 
                onClick={() => { setMealType("lunch"); setMealStaffList([]); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-bold transition-colors ${
                  mealType === "lunch" ? "bg-white border border-slate-200 shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Coffee className="h-3.5 w-3.5" />
                {isAr ? "الغداء (D / DN)" : "Lunch"}
              </button>
              <button 
                onClick={() => { setMealType("dinner"); setMealStaffList([]); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-bold transition-colors ${
                  mealType === "dinner" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                {isAr ? "العشاء (N / DN)" : "Dinner"}
              </button>
            </div>
          </div>
        </div>
        
        {/* Actions bar */}
        <div className="flex gap-3 justify-end no-print">
           <button 
            onClick={addManualRow}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{isAr ? "إضافة صف يدوياً" : "Add Row"}</span>
          </button>
          <button 
            onClick={handleSmartImport}
            className="bg-pink-100 hover:bg-pink-200 text-pink-700 border border-pink-200 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Coffee className="h-4 w-4" />
            <span>{isAr ? "الإضافة والاستيراد الذكي من الروستر" : "Smart Import from Roster"}</span>
          </button>
        </div>

        {/* Print Content Reference Area */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg overflow-x-auto print:border-none print:shadow-none print:p-0 print:m-0" ref={componentRef}>
          <div className="space-y-8 print:w-full w-full">
            
            {/* Header Document */}
            <div className="flex justify-between items-start pb-6 w-full px-4">
              <div className="text-center flex-1 pt-6 text-right">
                <h2 className="text-3xl font-black text-slate-900 mb-1">{isAr ? "جدول تسليم وجبات الموظفين" : "Employee Meal Delivery Log"}</h2>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-1.5 border border-pink-200 bg-pink-50/25 px-3 py-1.5 rounded-xl">
                  <span className="font-mono font-black text-pink-700 text-xs tracking-wider border border-pink-300 px-1 py-0.5 rounded leading-none shrink-0">
                    {settings.nameEn ? settings.nameEn.split(/\s+/).map((w: string) => w[0]).filter((c: string) => /^[a-zA-Z\u0600-\u06FF]$/.test(c)).slice(0, 2).join("").toUpperCase() : "BH"}
                  </span>
                  <div className="text-right">
                    <span className="font-sans font-black text-slate-800 text-xs block leading-none">
                      {isAr ? (settings.institutionNameAr || "مؤسسة المستشفى") : (settings.institutionNameEn || "Hospital Foundation")}
                    </span>
                    <span className="text-[8px] font-bold text-pink-700 block mt-1 tracking-wider leading-none">
                      {isAr ? "نظام تغذية الكادر" : "NURSE MEAL LOG"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Info Metadata row */}
            <div className="flex justify-between w-full pb-4 text-sm font-bold text-slate-800 px-4 text-right">
              <div className="space-y-4">
                 <p className="flex items-center gap-1">
                  <span>{isAr ? "القسم :" : "Department:"}</span> 
                  <span className="inline-block w-64 border-b border-dashed border-slate-600 px-2 font-black text-slate-900">{selectedDept}</span>
                </p>
              </div>
              <div className="space-y-4">
                <p className="flex items-center gap-1 justify-end">
                  <span className="inline-block w-16 border-b border-dashed border-slate-600 text-center text-slate-900 font-mono">{selectedMonth.split('-')[0] || '2026'}</span>/
                  <span className="inline-block w-12 border-b border-dashed border-slate-600 text-center text-slate-900 font-mono">{selectedMonth.split('-')[1] || '05'}</span>/
                  <span className="inline-block w-12 border-b border-dashed border-slate-600 text-center text-slate-900 font-mono">{selectedDay.padStart(2, '0')}</span> 
                  <span className="mr-2">{isAr ? ":التاريخ" : "Date:"}</span>
                </p>
                <p className="flex items-center gap-1 justify-end">
                  <span className="inline-block w-48 border-b border-dashed border-slate-600 px-2 text-slate-900">{isAr ? `يوم ${selectedDay}` : `Day ${selectedDay}`}</span> 
                  <span className="mr-2">{isAr ? ":اليوم" : "Day:"}</span>
                </p>
              </div>
            </div>

            {/* Meals Roster Table */}
            <table className="w-full text-center border-collapse text-xs font-sans mt-4 rtl" dir="rtl">
              <thead>
                <tr className="bg-slate-50 border-t border-b-2 border-l border-r border-slate-800 text-slate-900 print:bg-white border-2">
                  <th className="border-2 border-slate-800 px-2 py-4 w-12 font-black text-base">{isAr ? "رقم" : "No."}</th>
                  <th className="border-2 border-slate-800 px-3 py-4 font-black text-base text-right">{isAr ? "الاسم" : "Name"}</th>
                  <th className="border-2 border-slate-800 px-2 py-4 w-28 font-black text-base">{isAr ? "كود الموظف" : "Staff ID"}</th>
                  <th className="border-2 border-slate-800 px-2 py-4 font-black w-24 text-base">{isAr ? "القسم" : "Dept"}</th>
                  <th className="border-2 border-slate-800 px-2 py-4 font-black w-24 text-base">{isAr ? "الوردية" : "Shift"}</th>
                  <th className="border-2 border-slate-800 px-2 py-4 font-black w-32 text-base">{isAr ? "نوع الوجبة" : "Meal Course"}</th>
                  <th className="border-2 border-slate-800 px-2 py-4 font-black w-28 text-base">{isAr ? "وقت التسليم" : "Time"}</th>
                  <th className="border-2 border-slate-800 px-2 py-4 font-black w-32 text-base">{isAr ? "التوقيع" : "Signature"}</th>
                  <th className="border-2 border-slate-800 px-3 py-4 font-black text-right w-40 text-base">{isAr ? "ملاحظات" : "Notes"}</th>
                  <th className="border-2 border-slate-800 px-1 py-4 font-black w-10 no-print w-10">{isAr ? "حذف" : "Del"}</th>
                </tr>
              </thead>
              <tbody>
                {mealStaffList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="border-2 border-slate-800 py-10 text-slate-400 font-bold bg-slate-50">
                      {isAr ? "قم بالضغط على 'الإضافة والاستيراد الذكي من الروستر' لتوليد القائمة." : "Click Smart Import to generate the list."}
                    </td>
                  </tr>
                ) : (
                  mealStaffList.map((staff, idx) => (
                    <tr key={staff.id} className="hover:bg-slate-50 border-b border-slate-800 h-10 group">
                      <td className="border-2 border-slate-800 px-2 font-bold">{idx + 1}</td>
                      <td className="border-2 border-slate-800 px-2 text-right font-black text-sm">
                        <input 
                          type="text" 
                          value={isAr ? staff.employeeNameAr : staff.employeeNameEn} 
                          onChange={(e) => updateRow(staff.id, isAr ? 'employeeNameAr' : 'employeeNameEn', e.target.value)}
                          className="w-full bg-transparent outline-none focus:bg-white focus:ring-1 ring-indigo-200 border-none print:p-0 print:border-none"
                          placeholder={isAr ? "الاسم" : "Name"}
                        />
                      </td>
                      <td className="border-2 border-slate-800 px-1 font-mono font-bold text-[11px]">
                        <input 
                          type="text" 
                          value={staff.employeeCode} 
                          onChange={(e) => updateRow(staff.id, 'employeeCode', e.target.value)}
                          className="w-full bg-transparent outline-none text-center focus:bg-white focus:ring-1 ring-indigo-200 border-none"
                          placeholder={isAr ? "الكود" : "ID"}
                        />
                      </td>
                      <td className="border-2 border-slate-800 px-1 font-semibold text-[11px]">
                        <input 
                          type="text" 
                          value={staff.department} 
                          onChange={(e) => updateRow(staff.id, 'department', e.target.value)}
                          className="w-full bg-transparent outline-none text-center focus:bg-white border-none"
                        />
                      </td>
                      <td className="border-2 border-slate-800 px-1 font-black">
                        <input 
                          type="text" 
                          value={staff.shiftForDay} 
                          onChange={(e) => updateRow(staff.id, 'shiftForDay', e.target.value)}
                          className="w-full bg-transparent outline-none text-center focus:bg-white border-none"
                        />
                      </td>
                      <td className="border-2 border-slate-800 px-2 font-bold">
                        {mealType === "lunch" ? (isAr ? "غداء" : "Lunch") : (isAr ? "عشاء" : "Dinner")}
                      </td>
                      <td className="border-2 border-slate-800 px-2"></td>
                      <td className="border-2 border-slate-800 px-2"></td>
                      <td className="border-2 border-slate-800 px-3 text-right"></td>
                      <td className="border-2 border-slate-800 px-1 no-print">
                        <button onClick={() => removeRow(staff.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition p-1">
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                {/* Add a few extra empty rows for manual additions */}
                {Array.from({ length: Math.max(8, 20 - mealStaffList.length) }).map((_, i) => (
                  <tr key={`empty-${i}`} className="h-10">
                    <td className="border-2 border-slate-800 px-2 font-bold">{mealStaffList.length + i + 1}</td>
                    <td className="border-2 border-slate-800 px-3"></td>
                    <td className="border-2 border-slate-800 px-2"></td>
                    <td className="border-2 border-slate-800 px-2"></td>
                    <td className="border-2 border-slate-800 px-2"></td>
                    <td className="border-2 border-slate-800 px-2 font-bold"></td>
                    <td className="border-2 border-slate-800 px-2"></td>
                    <td className="border-2 border-slate-800 px-2"></td>
                    <td className="border-2 border-slate-800 px-3"></td>
                    <td className="border-2 border-slate-800 px-1 no-print"></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer Form Info and Sig */}
            <div className="flex flex-col pt-8 avoid-break text-sm text-slate-800 print:text-black w-full font-bold px-4">
              <div className="flex items-center gap-2 mb-12">
                <span>{isAr ? "مدير القسم :" : "Department Manager:"}</span>
                <span className="inline-block w-80 border-b border-dashed border-slate-600"></span>
              </div>
              
              <div className="flex items-center justify-between text-[10px] font-mono font-normal text-slate-600 print:text-black mt-8">
                <span>Page 1 of 1</span>
                <span>Issue Date:07.2025</span>
                <span>Version No: 01</span>
                <span>BHG-BZ-FR-HPT-003- {isAr ? "جدول تسليم وجبات الموظفين" : "Meals Delivery"}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
      
      {/* Hidden Batch Print Container */}
      <div style={{ display: "none" }}>
        <div ref={batchComponentRef}>
          {departments.map((dept) => (
            <React.Fragment key={dept}>
              {['lunch', 'dinner'].map((type) => {
                const staff = getMealStaffListForDept(dept, type as any);
                if (staff.length === 0) return null;
                return (
                  <div key={`${dept}-${type}`}>
                    <PrintableMealPage 
                      dept={dept} 
                      type={type as any} 
                      staffList={staff} 
                    />
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// Simple icon utility
function UtensilsIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  )
}

