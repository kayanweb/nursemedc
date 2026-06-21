import React, { useState } from 'react';
import { DatabaseBackup, ShieldCheck } from 'lucide-react';

interface Props {
  language: 'ar' | 'en';
  // Props needed for state management:
  itStrictComplianceMode: boolean;
  setItStrictComplianceMode: (val: boolean) => void;
  itConflictResolutionWithNewest: boolean;
  setItConflictResolutionWithNewest: (val: boolean) => void;
}

export default function AdminSupport({ language, itStrictComplianceMode, setItStrictComplianceMode, itConflictResolutionWithNewest, setItConflictResolutionWithNewest }: Props) {
  const [itSubTab, setItSubTab] = useState<'admin_ops' | 'it_infra' | 'dev_sandbox' | 'dr_backup' | 'system_settings' | 'auth_settings' | 'rbac' | 'cloud_settings'>('admin_ops');
  const isAr = language === 'ar';

  return (
    <div className="space-y-6 animate-fade font-sans text-right" dir="rtl">
        {/* Placeholder for tabs and content */}
        <p>Admin Support Component. Currently displaying: {itSubTab}</p>
        {itSubTab === 'admin_ops' && (
             <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-sm">
             <h3 className="font-extrabold text-slate-800 border-b pb-2 flex items-center gap-2 justify-end">
               <span>الرقابة والامتثال (Legacy Compliance & Historical Audit)</span>
               <span className="text-pink-600">🛡️</span>
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="border p-4 rounded-xl space-y-3 bg-slate-50 text-right">
                 <span className="font-bold text-slate-700 block">🔒 قفل تاريخ الجرد السريري للميدان (Strict Compliance)</span>
                 <p className="text-[11px] text-slate-500">منع التعديلات ذات التواريخ الراجعة وحصر الجرد باليوم الحالي للسلامة السريرية.</p>
                 <label className="relative inline-flex items-center cursor-pointer">
                   <input
                     type="checkbox"
                     checked={itStrictComplianceMode}
                     onChange={(e) => setItStrictComplianceMode(e.target.checked)}
                     className="sr-only peer"
                   />
                   <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                   <span className="mr-3 text-xs font-bold text-slate-600">تفعيل القاعدة الصارمة</span>
                 </label>
               </div>
               
               <div className="border p-4 rounded-xl space-y-3 bg-slate-50 text-right">
                 <span className="font-bold text-slate-700 block">🔄 علاج تعارض البيانات التلقائي (Anti-Drift)</span>
                 <p className="text-[11px] text-slate-500">معالجة تعارضات الكتابة مع السقوف السحابية بشكل آلي باستخدام الطوابع الزمنية.</p>
                 <label className="relative inline-flex items-center cursor-pointer">
                   <input
                     type="checkbox"
                     checked={itConflictResolutionWithNewest}
                     onChange={(e) => setItConflictResolutionWithNewest(e.target.checked)}
                     className="sr-only peer"
                   />
                   <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                   <span className="mr-3 text-xs font-bold text-slate-600">تفعيل دمج الطوابع الزمنية</span>
                 </label>
               </div>
             </div>
             </div>
        )}
    </div>
  );
}
