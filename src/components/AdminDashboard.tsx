import React, { useState } from 'react';
import { Info, Database, Shield } from 'lucide-react';
import AboutDeveloper from './AboutDeveloper';
import DatabaseSettingsView from './DatabaseSettingsView';
import AdminSupport from './AdminSupport';

interface Props {
  language: 'ar' | 'en';
  itStrictComplianceMode: boolean;
  setItStrictComplianceMode: (val: boolean) => void;
  itConflictResolutionWithNewest: boolean;
  setItConflictResolutionWithNewest: (val: boolean) => void;
}

export default function AdminDashboard({ language, itStrictComplianceMode, setItStrictComplianceMode, itConflictResolutionWithNewest, setItConflictResolutionWithNewest }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<'about' | 'db' | 'support'>('about');
  const isAr = language === 'ar';

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">{isAr ? "لوحة الإدارة والدعم والبرمجة" : "Admin, Support & Programming Dashboard"}</h1>
      
      <div className="flex gap-4 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('about')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold transition ${
            activeSubTab === 'about' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Info size={20} />
          {isAr ? "عن المطور" : "About Developer"}
        </button>
        <button
          onClick={() => setActiveSubTab('db')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold transition ${
            activeSubTab === 'db' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database size={20} />
          {isAr ? "إعدادات قاعدة البيانات" : "Database Settings"}
        </button>
        <button
          onClick={() => setActiveSubTab('support')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold transition ${
            activeSubTab === 'support' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield size={20} />
          {isAr ? "لوحة الإدارة والدعم" : "Admin & Support"}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {activeSubTab === 'about' && <AboutDeveloper language={language} />}
        {activeSubTab === 'db' && <DatabaseSettingsView language={language} />}
        {activeSubTab === 'support' && (
            <AdminSupport 
                language={language}
                itStrictComplianceMode={itStrictComplianceMode}
                setItStrictComplianceMode={setItStrictComplianceMode}
                itConflictResolutionWithNewest={itConflictResolutionWithNewest}
                setItConflictResolutionWithNewest={setItConflictResolutionWithNewest}
            />
        )}
      </div>
    </div>
  );
}
