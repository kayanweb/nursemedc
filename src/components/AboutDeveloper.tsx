import React from 'react';
import { Mail, Phone, Code, Globe, User } from 'lucide-react';

export default function AboutDeveloper({ language }: { language: 'ar' | 'en' }) {
  const isAr = language === 'ar';

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold">{isAr ? "عن المطور" : "About the Developer"}</h2>
      <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Code className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">AI Assistant</h3>
            <p className="text-slate-500">{isAr ? "مساعد ذكاء اصطناعي مطور" : "AI Powered Developer Assistant"}</p>
          </div>
        </div>
        <p className="text-slate-700">
          {isAr
            ? "نحن نهدف إلى تقديم حلول برمجية مبتكرة وموثوقة لدعم الكوادر الطبية والإدارية. تم تطوير هذا النظام لتعزيز كفاءة سير العمل السريري."
            : "We aim to provide innovative and reliable software solutions to support medical and administrative staff. This system was developed to enhance clinical workflow efficiency."}
        </p>
      </div>

      <h3 className="text-2xl font-semibold">{isAr ? "تواصل معنا" : "Contact Us"}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-200">
          <Mail className="text-blue-500" />
          <span>support@example.com</span>
        </div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-200">
          <Globe className="text-blue-500" />
          <span>www.example.com</span>
        </div>
      </div>
    </div>
  );
}
