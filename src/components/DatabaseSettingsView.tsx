import React, { useState, useEffect } from 'react';
import { Database, Save, Loader2 } from 'lucide-react';
import { DB_PROVIDERS_CONFIG, switchEnvironment, ACTIVE_DB_PROVIDER } from '../lib/dbConfig';

export default function DatabaseSettingsView({ language }: { language: 'ar' | 'en' }) {
  const isAr = language === 'ar';
  const [provider, setProvider] = useState(ACTIVE_DB_PROVIDER);
  const [settings, setSettings] = useState<any>(DB_PROVIDERS_CONFIG[ACTIVE_DB_PROVIDER]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSettings(DB_PROVIDERS_CONFIG[provider]);
  }, [provider]);

  const handleSave = () => {
    setIsSaving(true);
    switchEnvironment(provider, settings);
    setTimeout(() => setIsSaving(false), 1000);
  };

  const updateSetting = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold">{isAr ? "إعدادات قاعدة البيانات" : "Database Configuration"}</h2>
      
      <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-8 h-8 text-blue-600" />
          <h3 className="text-xl font-semibold">{isAr ? "اختيار المزود" : "Select Provider"}</h3>
        </div>

        <select 
          className="w-full p-3 border rounded-lg mb-6"
          value={provider}
          onChange={(e) => setProvider(e.target.value as any)}
        >
          {Object.keys(DB_PROVIDERS_CONFIG).map((key) => (
            <option key={key} value={key}>{isAr ? (DB_PROVIDERS_CONFIG as any)[key].nameAr : (DB_PROVIDERS_CONFIG as any)[key].nameEn}</option>
          ))}
        </select>

        <div className="space-y-4 mb-6">
          {Object.entries(settings).map(([key, value]) => {
            if (['nameAr', 'nameEn', 'statusUrl', 'instanceType'].includes(key)) return null;
            return (
              <div key={key}>
                <label className="block text-sm font-medium mb-1 capitalize text-slate-700">{key}</label>
                <input 
                  type="text"
                  className="w-full p-3 border rounded-lg"
                  value={value as string}
                  onChange={(e) => updateSetting(key, e.target.value)}
                />
              </div>
            );
          })}
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
          {isAr ? "حفظ التغييرات" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
