import React, { useState } from "react";
import { Plus, Trash2, FileText, Download, Briefcase, File, Search, RefreshCw, Pencil, Folder, UploadCloud, Clapperboard, Calendar } from "lucide-react";
import { useFirestoreSync } from "../hooks/useFirestoreSync";
import { saveCloudDocument, syncCloudDocuments, deleteCloudDocument } from "../lib/firestoreService";

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

    // Verification
    const code = window.prompt(isAr ? `تأكيد رفع المستند "${file.name}": أدخل كود الموظف للتوقيع` : `Confirm upload for "${file.name}": Enter your employee code`);
    if (!code) return;

    const authorizer = systemUsers.find(u => u.staffId === code || u.pin === code || u.id === code);
    if (!authorizer) {
      alert(isAr ? "الكود غير صحيح." : "Invalid employee code.");
      return;
    }

    // Check size (warn if > 900kb because firestore document limit is 1MB)
    if (file.size > 900 * 1024) {
      alert(isAr ? "عذراً، حجم الملف يتجاوز الحد الأقصى (1 ميجابايت) المسموح به لكل مستند." : "Sorry, file size exceeds the 1MB limit for individual documents.");
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
          alert(isAr ? "فشل الرفع السحابي." : "Cloud upload failed.");
      });

      alert(isAr ? `تم التوقيع الإلكتروني ورفع المستند بنجاح بواسطة ${authorizer.nameAr}` : `Document uploaded successfully by ${authorizer.nameEn}`);
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (doc: CloudDocument) => {
    const code = window.prompt(isAr ? `تأكيد الحذف: أدخل كود الموظف:` : `Confirm Delete: Enter your code:`);
    if (!code) return;
    const authorizer = systemUsers.find(u => u.staffId === code || u.pin === code || u.id === code);
    if (!authorizer) {
      alert(isAr ? "الكود غير صحيح." : "Invalid code.");
      return;
    }
    setDocuments((prev) => prev.filter(d => d.id !== doc.id));
    deleteCloudDocument(doc.id);
  };

  const handleRename = (doc: CloudDocument) => {
    const newName = window.prompt(isAr ? "أعد تسمية الملف:" : "Rename file:", doc.name);
    if (!newName) return;
    
    const code = window.prompt(isAr ? `تأكيد التعديل: أدخل كود الموظف:` : `Confirm Rename: Enter your code:`);
    if (!code) return;
    const authorizer = systemUsers.find(u => u.staffId === code || u.pin === code || u.id === code);
    if (!authorizer) {
      alert(isAr ? "الكود غير صحيح." : "Invalid code.");
      return;
    }

    const updated = { ...doc, name: newName };
    setDocuments((prev) => prev.map(d => d.id === doc.id ? updated : d));
    saveCloudDocument(updated);
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

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-80px)]" style={{ direction: isAr ? "rtl" : "ltr" }}>
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
          <div className="p-4 border-b border-slate-100 flex items-center bg-slate-50/50">
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

                      <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100 mt-auto justify-end">
                        <button 
                          onClick={() => handleRename(doc)}
                          className="px-2.5 py-1.5 text-[10px] sm:text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                          title={isAr ? "تعديل الاسم" : "Rename"}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>{isAr ? "تسمية" : "Rename"}</span>
                        </button>
                        <button 
                          onClick={() => downloadDoc(doc)}
                          className="px-2.5 py-1.5 text-[10px] sm:text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                          title={isAr ? "تحميل الملف" : "Download"}
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>{isAr ? "تنزيل" : "Download"}</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(doc)}
                          className="px-2.5 py-1.5 text-[10px] sm:text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
                          title={isAr ? "حذف الملف" : "Delete"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{isAr ? "حذف" : "Delete"}</span>
                        </button>
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
