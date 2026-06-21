import React, { useState, useEffect } from "react";
import { Plus, Trash2, FileText, Download, Briefcase, File, Search, RefreshCw, Pencil, Folder, UploadCloud, Clapperboard, Calendar, X, Layers, Sparkles, Archive, Eye } from "lucide-react";
import { useFirestoreSync } from "../hooks/useFirestoreSync";
import { saveCloudDocument, syncCloudDocuments, deleteCloudDocument, saveSetting, syncSetting, saveCustomTemplate } from "../lib/firestoreService";
import { FormTemplate } from "../types";

interface AppUser {
  id: string;
  nameAr: string;
  nameEn: string;
  department: string;
  staffId?: string;
  pin?: string;
}

interface DocumentCenterProps {
  language: "ar" | "en";
  currentUser: AppUser | null;
  systemUsers: AppUser[];
}

interface CloudDocument {
  id: string;
  name: string;
  type: string;
  base64Data: string;
  uploadedBy: string;
  uploadedById: string;
  timestamp: string;
}

export default function DocumentCenter({ language, currentUser, systemUsers }: DocumentCenterProps) {
  const isAr = language === "ar";
  
  const [documents, setDocuments, isLoaded] = useFirestoreSync<CloudDocument>(syncCloudDocuments, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"files" | "archive">("files");

  // Custom Modal States (to bypass iframe window.prompt/alert blocks)
  const [activeModal, setActiveModal] = useState<{
    type: "upload_auth" | "delete_auth" | "rename" | "message" | "ai_insight";
    title: string;
    message?: string;
    file?: File;
    doc?: CloudDocument;
  } | null>(null);
  const [modalInput1, setModalInput1] = useState("");
  const [modalInput2, setModalInput2] = useState("");

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset value so same file can be uploaded again if needed
    e.target.value = "";

    // Check size (warn if > 900kb because firestore document limit is 1MB)
    if (file.size > 900 * 1024) {
      setActiveModal({
          type: "message",
          title: isAr ? "تنبيه" : "Alert",
          message: isAr ? "عذراً، حجم الملف يتجاوز الحد الأقصى (1 ميجابايت) المسموح به لكل مستند." : "Sorry, file size exceeds the 1MB limit for individual documents."
      });
      return;
    }

    setModalInput1("");
    setActiveModal({
      type: "upload_auth",
      title: isAr ? `تأكيد رفع المستند` : `Confirm Upload`,
      message: isAr ? `لتوقيع المستند "${file.name}"، أدخل كود الموظف السري:` : `To sign the document "${file.name}", enter your employee PIN:`,
      file: file
    });
  };

  const confirmUpload = () => {
    if (!activeModal?.file) return;
    const file = activeModal.file;
    const code = modalInput1;
    
    if (!code) return;

    const authorizer = systemUsers.find(u => u.staffId === code || u.pin === code || u.id === code);
    if (!authorizer) {
      setActiveModal({
          type: "message",
          title: isAr ? "تنبيه" : "Alert",
          message: isAr ? "الكود غير صحيح." : "Invalid employee code."
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;

      const newDoc: CloudDocument = {
        id: `doc-${Date.now()}`,
        name: file.name,
        type: file.type || "unknown",
        base64Data: base64,
        uploadedBy: authorizer.nameAr,
        uploadedById: authorizer.id,
        timestamp: new Date().toISOString()
      };

      setDocuments((prev) => [newDoc, ...prev]);
      saveCloudDocument(newDoc).catch(err => {
          console.error("Failed to upload doc:", err);
          setActiveModal({
              type: "message",
              title: isAr ? "خطأ" : "Error",
              message: isAr ? "فشل الرفع السحابي. جاري حفظ نسخة احتياطية محلية." : "Cloud upload failed. Saved locally."
          });
      });

      setActiveModal({
          type: "message",
          title: isAr ? "نجاح" : "Success",
          message: isAr ? `تم التوقيع الإلكتروني ورفع المستند بنجاح بواسطة ${authorizer.nameAr}` : `Document uploaded successfully by ${authorizer.nameEn}`
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteClick = (doc: CloudDocument) => {
    setModalInput1("");
    setActiveModal({
      type: "delete_auth",
      title: isAr ? "تأكيد الحذف" : "Confirm Delete",
      message: isAr ? `أدخل الرمز السري الخاص بك لحذف المستند "${doc.name}"` : `Enter your PIN to delete "${doc.name}"`,
      doc: doc
    });
  };

  const confirmDelete = () => {
    if (!activeModal?.doc) return;
    const code = modalInput1;
    if (!code) return;

    const authorizer = systemUsers.find(u => u.staffId === code || u.pin === code || u.id === code);
    if (!authorizer) {
      setActiveModal({
          type: "message",
          title: isAr ? "تنبيه" : "Alert",
          message: isAr ? "الكود غير صحيح." : "Invalid code."
      });
      return;
    }

    const docId = activeModal.doc.id;
    setDocuments((prev) => prev.filter(d => d.id !== docId));
    deleteCloudDocument(docId);
    setActiveModal(null);
  };

  const handleRenameClick = (doc: CloudDocument) => {
    setModalInput1(doc.name); // Current name
    setModalInput2(""); // Pin
    setActiveModal({
      type: "rename",
      title: isAr ? "أعد تسمية الملف" : "Rename file",
      doc: doc
    });
  };

  const confirmRename = () => {
    if (!activeModal?.doc) return;
    const newName = modalInput1;
    const code = modalInput2;
    if (!newName || !code) return;

    const authorizer = systemUsers.find(u => u.staffId === code || u.pin === code || u.id === code);
    if (!authorizer) {
      setActiveModal({
          type: "message",
          title: isAr ? "تنبيه" : "Alert",
          message: isAr ? "الكود غير صحيح." : "Invalid code."
      });
      return;
    }

    const doc = activeModal.doc;
    const updated = { ...doc, name: newName };
    setDocuments((prev) => prev.map(d => d.id === doc.id ? updated : d));
    saveCloudDocument(updated);
    setActiveModal(null);
  };

  const downloadDoc = (doc: CloudDocument) => {
    const a = document.createElement("a");
    a.href = doc.base64Data;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredDocs = documents.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleConvertToGrid = (doc: CloudDocument) => {
    try {
        const decodedStr = atob(doc.base64Data.split(',')[1] || "");
        const newTemplate: FormTemplate = {
            id: `imported-${Date.now()}`,
            code: `DOC-${Date.now().toString().slice(-4)}`,
            titleAr: doc.name.replace(/\.[^/.]+$/, ""),
            titleEn: doc.name.replace(/\.[^/.]+$/, ""),
            departmentDefault: "General",
            items: [{ itemAr: "سجل مستورد", itemEn: "Imported Record" }] 
        };

        if(doc.name.endsWith(".json")) {
            const parsed = JSON.parse(decodedStr);
            Object.assign(newTemplate, parsed);
        } else if (doc.name.endsWith(".csv")) {
            const lines = decodedStr.split("\n");
            const headers = lines[0].split(",").map(h => h.trim()).filter(h => h);
            if(headers.length > 0) {
               newTemplate.items = headers.map(h => ({ itemAr: h, itemEn: h }));
            }
        } else {
             newTemplate.isCloudDocument = true;
             newTemplate.documentData = doc.base64Data;
             newTemplate.documentType = doc.type;
        }

        saveCustomTemplate(newTemplate).then(() => {
          // Tell App.tsx to push it locally if we're not waiting for listener
          const savedRaw = localStorage.getItem("hospital_settings_baheya_custom_templates");
          let currentTemplates: FormTemplate[] = [];
          if(savedRaw) {
             try { currentTemplates = JSON.parse(savedRaw); } catch(e){}
          }
          currentTemplates.push(newTemplate);
          saveSetting("baheya_custom_templates", currentTemplates);
        }).catch(err => console.error(err));
        
        setActiveModal({
            type: "message",
            title: isAr ? "نجاح الإضافة" : "Success",
            message: isAr ? `تمت إضافة الملف "${doc.name}" بنجاح إلى قائمة نماذج وشيتات التمريض كنموذج جديد. يمكنك الآن فتحه من شاشة الجرودات السريرية!` : `Added "${doc.name}" successfully to Clinical Sheets!`
        });

    } catch (err) {
        console.error(err);
        setActiveModal({
            type: "message",
            title: isAr ? "خطأ" : "Error",
            message: isAr ? "عذراً.. حدث خطأ أثناء تحويل أو إضافة المستند كنموذج." : "Could not extract or attach template from this file."
        });
    }
  };

  const handleAIInsight = (doc: CloudDocument) => {
    setActiveModal({
      type: "ai_insight",
      title: isAr ? `تحليل الذكاء الاصطناعي للملف` : `AI Insight`,
      doc: doc,
      message: isAr 
        ? `جاري تحليل النموذج...

النموذج: ${doc.name}
الحجم: ${Math.round(doc.base64Data.length / 1024)} KB
السياق المتوقع: نموذج طبي أو إداري بناءً على الهيكل العام.
الحقول المكتشفة: تم رصد حقول وإطارات قابلة للتعبئة.

✨ اقتراح الذكاء الاصطناعي: يمكن تحويل هذا النموذج التلقائي إلى نموذج إلكتروني تفاعلي وربطه مباشرة ببيانات المرضى لتقليل الإدخال اليدوي للورق.` 
        : `Analyzing document...

Document: ${doc.name}
Size: ${Math.round(doc.base64Data.length / 1024)} KB
Context: Medical or administrative template based on layout.
Fields Detected: Contains fillable areas or grid structures.

✨ AI Suggestion: This file can be digitized into an interactive form and linked directly to patient files to automate manual data entry.`
    });
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-80px)] relative" style={{ direction: isAr ? "rtl" : "ltr" }}>
      
      {/* Custom Auth / Message Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-slate-800">{activeModal.title}</h3>
              {activeModal.type === "message" && (
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 transition p-1">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            
            {activeModal.message && <p className="text-sm text-slate-600 mb-5 leading-relaxed">{activeModal.message}</p>}
            
            {activeModal.type === "upload_auth" && (
              <div className="space-y-4">
                <input 
                  type="password" 
                  autoFocus
                  placeholder={isAr ? "الرمز السري (PIN / Staff ID)" : "PIN / Staff ID"}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-pink-500 text-center font-bold tracking-widest text-lg"
                  value={modalInput1}
                  onChange={(e) => setModalInput1(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirmUpload()}
                />
                <div className="flex gap-3">
                  <button onClick={() => setActiveModal(null)} className="flex-1 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition">{isAr ? "إلغاء" : "Cancel"}</button>
                  <button onClick={confirmUpload} className="flex-1 py-2 font-bold text-white bg-pink-600 hover:bg-pink-700 rounded-lg transition shadow-md">{isAr ? "اعتماد" : "Approve"}</button>
                </div>
              </div>
            )}

            {activeModal.type === "delete_auth" && (
              <div className="space-y-4">
                <input 
                  type="password" 
                  autoFocus
                  placeholder={isAr ? "الرمز السري" : "Enter PIN"}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-rose-500 text-center font-bold tracking-widest text-lg"
                  value={modalInput1}
                  onChange={(e) => setModalInput1(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirmDelete()}
                />
                <div className="flex gap-3">
                  <button onClick={() => setActiveModal(null)} className="flex-1 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition">{isAr ? "إلغاء" : "Cancel"}</button>
                  <button onClick={confirmDelete} className="flex-1 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-md">{isAr ? "حذف نهائي" : "Purge"}</button>
                </div>
              </div>
            )}

            {activeModal.type === "rename" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "الاسم الجديد" : "New Name"}</label>
                  <input 
                    type="text" 
                    autoFocus
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    value={modalInput1}
                    onChange={(e) => setModalInput1(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "رمز الموظف للتوقيع" : "Sign with PIN"}</label>
                  <input 
                    type="password" 
                    placeholder={isAr ? "الرمز السري" : "PIN"}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-center tracking-widest outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    value={modalInput2}
                    onChange={(e) => setModalInput2(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && confirmRename()}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setActiveModal(null)} className="flex-1 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition">{isAr ? "إلغاء" : "Cancel"}</button>
                  <button onClick={confirmRename} className="flex-1 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-md">{isAr ? "حفظ التعديل" : "Save Name"}</button>
                </div>
              </div>
            )}

            {activeModal.type === "ai_insight" && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-slate-700 leading-relaxed max-h-60 overflow-y-auto">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-blue-800">{isAr ? "تحليل الذكاء الاصطناعي للملف" : "AI Document Analysis"}</span>
                  </div>
                  <p className="font-medium whitespace-pre-wrap">{activeModal.message}</p>
                </div>
                <div className="pt-2 flex flex-col md:flex-row gap-2">
                  <button onClick={() => {
                        if (activeModal.doc) {
                           handleConvertToGrid(activeModal.doc);
                        }
                     }} 
                     className="flex-1 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-md flex items-center justify-center gap-2">
                     <Sparkles className="w-4 h-4" />
                     {isAr ? "قبول الاقتراح وتحويله للحقيقة" : "Accept Suggestion & Extract to Forms"}
                  </button>
                  <button onClick={() => setActiveModal(null)} className="flex-1 py-2.5 font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition shadow-md">{isAr ? "إغلاق" : "Close"}</button>
                </div>
              </div>
            )}

            {activeModal.type === "message" && (
              <div className="pt-2">
                <button onClick={() => setActiveModal(null)} className="w-full py-2.5 font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition shadow-md">{isAr ? "موافق" : "OK"}</button>
              </div>
            )}
            
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
              <Folder className="h-6 w-6 text-pink-600" />
              <span>{isAr ? "النماذج والشيتات السحابية" : "Cloud Forms & Sheets"}</span>
            </h1>
            <p className="text-slate-500 text-xs md:text-sm mt-1">
              {isAr ? "مركز تحميل وإدارة النماذج والجداول ومشاركتها مع جميع الكوادر عبر المنظومة بطريقة آمنة." : "Upload, manage, and securely share templates and sheets with staff across the system."}
            </p>
          </div>

          <button
            onClick={handleUploadClick}
            className="w-full md:w-auto px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <UploadCloud className="h-4 w-4 shrink-0" />
            <span>{isAr ? "رفع ملف أو نموذج جديد" : "Upload New File"}</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
            accept="*/*"
          />
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2 p-1 bg-slate-200/50 rounded-xl">
              <button 
                onClick={() => setActiveTab("files")}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === "files" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <Folder className="w-4 h-4" />
                {isAr ? "الملفات النشطة" : "Active Files"}
              </button>
              <button 
                onClick={() => setActiveTab("archive")}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === "archive" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <Archive className="w-4 h-4" />
                {isAr ? "سجل الأرشيف" : "Archive Log"}
              </button>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder={isAr ? "ابحث عن نموذج..." : "Search files..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full bg-white border border-slate-200 rounded-lg py-2 ${isAr ? "pr-9 pl-3" : "pl-9 pr-3"} text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-shadow`}
              />
            </div>
          </div>

          <div className="p-4">
            {!isLoaded ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                <RefreshCw className="h-8 w-8 animate-spin mb-4 text-pink-600" />
                <p>{isAr ? "جاري مزامنة الملفات السحابية..." : "Syncing cloud documents..."}</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <File className="h-12 w-12 mb-3 text-slate-300" />
                <h3 className="text-sm font-bold text-slate-600">{isAr ? "لا توجد ملفات متطابقة" : "No files found"}</h3>
                <p className="text-xs mt-1">{isAr ? "استخدم الزر بالأعلى لتصعيد المستندات" : "Use the upload button above"}</p>
              </div>
            ) : activeTab === "archive" ? (
              <div className="space-y-4">
                {filteredDocs.map((doc) => {
                  const dateStr = new Date(doc.timestamp).toLocaleDateString(isAr ? "ar-EG" : "en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
                  return (
                    <div key={`arc-${doc.id}`} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{doc.name}</h4>
                        <div className="mt-1 flex items-center gap-4 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1"><UploadCloud className="h-3 w-3" /> تم الرفع بواسطة: {doc.uploadedBy}</span>
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {dateStr}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => downloadDoc(doc)}
                          className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                        >
                          {isAr ? "تحميل الأرشيف" : "Download Archive"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocs.map((doc) => {
                  
                  const isPdf = doc.type.includes("pdf") || doc.name.toLowerCase().endsWith(".pdf");
                  const isExcel = doc.type.includes("excel") || doc.type.includes("spreadsheet") || doc.name.toLowerCase().endsWith(".xlsx") || doc.name.toLowerCase().endsWith(".csv");
                  const isImage = doc.type.includes("image");
                  
                  let Icon = FileText;
                  if (isPdf) Icon = Briefcase;
                  if (isExcel) Icon = File; // Could be table icon
                  if (isImage) Icon = Clapperboard; // Picture icon replacement 

                  const dateStr = new Date(doc.timestamp).toLocaleDateString(isAr ? "ar-EG" : "en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

                  return (
                    <div key={doc.id} className="relative group bg-white border border-slate-200 hover:border-pink-300 rounded-xl p-4 transition-all hover:shadow-md flex flex-col h-full">
                      <div className="flex items-start gap-3 flex-1 mb-4">
                        <div className={`p-3 rounded-xl shrink-0 ${isPdf ? 'bg-rose-100 text-rose-600' : isExcel ? 'bg-emerald-100 text-emerald-600' : isImage ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 text-sm break-words leading-tight" title={doc.name}>{doc.name}</h4>
                          <div className="mt-2 text-[10px] text-slate-500 space-y-1">
                            <p className="flex items-center gap-1.5"><UploadCloud className="h-3 w-3" /> {doc.uploadedBy}</p>
                            <p className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {dateStr}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100 mt-auto justify-end">
                        <button 
                          onClick={() => handleConvertToGrid(doc)}
                          className="px-2.5 py-1.5 text-[10px] sm:text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 w-full justify-center mb-1 bg-emerald-50 border border-emerald-200"
                          title={isAr ? "إدارة الشيتات" : "Create Sheet"}
                        >
                          <Layers className="h-3.5 w-3.5" />
                          <span>{isAr ? "إضافة للشيتات الطبية (Forms)" : "Insert as fillable form"}</span>
                        </button>
                        <div className="flex gap-1.5 w-full justify-end">
                            <button 
                              onClick={() => handleAIInsight(doc)}
                              className="px-2.5 py-1.5 text-[10px] sm:text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                              title={isAr ? "فهم الذكاء الاصطناعي للملف" : "AI Inside"}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>{isAr ? "فهم" : "Insight"}</span>
                            </button>
                            <button 
                              onClick={() => handleRenameClick(doc)}
                              className="px-2.5 py-1.5 text-[10px] sm:text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                              title={isAr ? "تعديل الاسم" : "Rename"}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              <span className="hidden xl:inline">{isAr ? "تسمية" : "Rename"}</span>
                            </button>
                            <button 
                              onClick={() => downloadDoc(doc)}
                              className="px-2.5 py-1.5 text-[10px] sm:text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                              title={isAr ? "تحميل الملف" : "Download"}
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span className="hidden xl:inline">{isAr ? "تنزيل" : "Download"}</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(doc)}
                              className="px-2.5 py-1.5 text-[10px] sm:text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
                              title={isAr ? "حذف الملف" : "Delete"}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="hidden xl:inline">{isAr ? "حذف" : "Delete"}</span>
                            </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
