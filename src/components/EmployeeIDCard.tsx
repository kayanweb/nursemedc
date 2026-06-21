import React, { useRef } from 'react';
import { Printer, MapPin, Phone, Globe, Shield, User, Info, Calendar } from 'lucide-react';
import { AppUser } from '../types';
import QRCode from 'react-qr-code';

/**
 * Professional Medical ID Card Component (CR80 Standard)
 * Dimensions: 85.60 mm x 53.98 mm (converted to pixels at 96 DPI: ~324px x ~204px)
 * For higher fidelity printing, we use larger dimensions and scale down or use print-specific CSS.
 */
export default function EmployeeIDCard({ user, language }: { user: AppUser, language: 'ar' | 'en' }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isAr = language === 'ar';

  const handlePrint = () => {
    window.print();
  };

  // Facility Info (Hardcoded as per request "Medical Center Name")
  const facilityNameAr = "مستشفى كايان التخصصي";
  const facilityNameEn = "Kayan Specialist Hospital";
  const website = "www.kayanhospital.com";
  const contactEmail = "hr@kayanhospital.com";
  const contactPhone = "+966 12 345 6789";
  const addressAr = "الرياض، المملكة العربية السعودية";
  const addressEn = "Riyadh, Saudi Arabia";

  const bloodGroup = (user as any).bloodGroup || "O+";
  const issueDate = (user as any).issueDate || "2024-01-01";
  const expiryDate = (user as any).expiryDate || "2026-01-01";

  return (
    <div className="flex flex-col items-center gap-8 py-6">
      {/* Action Bar */}
      <div className="flex gap-4 mb-4">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-full font-semibold shadow-lg hover:bg-blue-700 transition active:scale-95"
        >
          <Printer size={18} />
          {isAr ? "طباعة البطاقة" : "Print ID Card"}
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-12 print:block print:p-0">
        
        {/* FRONT SIDE */}
        <div id="id-card-front" className="relative w-[324px] h-[512px] bg-white rounded-[20px] shadow-2xl overflow-hidden border border-slate-200 flex flex-col items-center print:shadow-none print:break-after-page mb-8 mx-auto">
          {/* Header Background */}
          <div className="absolute top-0 left-0 w-full h-[140px] bg-gradient-to-br from-[#004e92] to-[#000428]">
            <div className="absolute bottom-0 left-0 w-full h-12 bg-white skew-y-[-6deg] translate-y-6"></div>
          </div>

          {/* Logo & House Name */}
          <div className="relative z-10 w-full px-4 pt-6 flex flex-col items-center text-white">
            <div className="w-12 h-12 bg-white p-2 rounded-full mb-2 shadow-md">
               <Shield className="w-full h-full text-blue-800" />
            </div>
            <h1 className="text-[14px] font-bold tracking-wide uppercase">{isAr ? facilityNameAr : facilityNameEn}</h1>
            <p className="text-[10px] opacity-80 uppercase font-medium">{isAr ? "الرعاية التخصصية" : "Specialist Care"}</p>
          </div>

          {/* User Photo Placeholder */}
          <div className="relative z-10 mt-10 w-32 h-32 border-4 border-white rounded-[24px] shadow-xl overflow-hidden bg-slate-100 flex items-center justify-center">
             <User size={64} className="text-slate-300" />
          </div>

          {/* Details */}
          <div className="mt-6 flex flex-col items-center px-6 w-full">
             <h2 className="text-xl font-black text-[#004e92] uppercase leading-tight text-center">
                {isAr ? user.nameAr : user.nameEn}
             </h2>
             <p className="text-sm font-semibold text-slate-500 uppercase mt-1">
                {user.department}
             </p>

             <div className="w-full flex justify-between mt-8 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex flex-col">
                   <span className="text-[10px] text-slate-400 font-bold uppercase">{isAr ? "الرقم الوظيفي" : "Employee ID"}</span>
                   <span className="text-sm font-bold text-[#333]">{user.staffId}</span>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[10px] text-slate-400 font-bold uppercase text-right">{isAr ? "فصيلة الدم" : "Blood Group"}</span>
                   <span className="text-sm font-black text-red-600">{bloodGroup}</span>
                </div>
             </div>

             {/* Barcode / Attendance QR */}
             <div className="mt-8 flex flex-col items-center">
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                   <QRCode value={user.staffId || "GUEST"} size={64} level="H" />
                </div>
                <span className="text-[8px] font-mono text-slate-400 mt-2 tracking-[0.2em]">{user.staffId}</span>
             </div>
          </div>

          <div className="absolute bottom-0 w-full h-2 bg-blue-600"></div>
        </div>

        {/* BACK SIDE */}
        <div id="id-card-back" className="relative w-[324px] h-[512px] bg-slate-50 rounded-[20px] shadow-2xl overflow-hidden border border-slate-200 flex flex-col print:shadow-none mx-auto">
          <div className="bg-[#004e92] p-4 text-white text-center">
             <h3 className="text-xs font-bold uppercase">{isAr ? "تعليمات المؤسسة" : "TERMS & CONDITIONS"}</h3>
          </div>

          <div className="p-6 flex-1 flex flex-col gap-4">
             <div className="flex items-start gap-3">
                <Info size={16} className="text-blue-600 mt-1 shrink-0" />
                <p className="text-[11px] text-slate-600 leading-relaxed">
                   {isAr 
                    ? "هذه البطاقة رسمية وملك للمنشأة، ويجب ارتدائها طوال ساعات العمل بشكل بارز. في حال العثور عليها، يرجى تسليمها لقسم الموارد البشرية."
                    : "This ID card is official property of the facility. It must be displayed prominently at all times during working hours. If found, please return to the HR Department."
                   }
                </p>
             </div>

             <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                   <span className="block text-[9px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1">
                      <Calendar size={10} /> {isAr ? "تاريخ الإصدار" : "Issue Date"}
                   </span>
                   <span className="text-xs font-bold text-slate-700">{issueDate}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                   <span className="block text-[9px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1">
                      <Calendar size={10} /> {isAr ? "تاريخ الانتهاء" : "Expiry Date"}
                   </span>
                   <span className="text-xs font-bold text-red-600">{expiryDate}</span>
                </div>
             </div>

             <div className="bg-red-50 p-3 rounded-lg border border-red-100 mt-2">
                <span className="block text-[9px] text-red-400 font-bold uppercase mb-1 flex items-center gap-1">
                   <Phone size={10} /> {isAr ? "للطوارئ" : "Emergency"}
                </span>
                <span className="text-xs font-bold text-red-700">{contactPhone}</span>
             </div>
          </div>

          {/* Footer Contact */}
          <div className="p-6 bg-white border-t border-slate-200 space-y-3">
             <div className="flex items-center gap-3 text-slate-500">
                <MapPin size={14} className="shrink-0" />
                <span className="text-[10px] font-medium">{isAr ? addressAr : addressEn}</span>
             </div>
             <div className="flex items-center gap-3 text-slate-500">
                <Globe size={14} className="shrink-0" />
                <span className="text-[10px] font-medium">{website}</span>
             </div>
             <div className="flex items-center gap-3 text-slate-500">
                <Phone size={14} className="shrink-0" />
                <span className="text-[10px] font-medium">{contactPhone}</span>
             </div>
          </div>

          <div className="absolute bottom-0 w-full h-8 bg-gradient-to-r from-[#004e92] to-blue-500 flex items-center justify-center">
             <span className="text-[10px] text-white font-black tracking-widest uppercase">OFFICIAL ID</span>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #id-card-front, #id-card-front *, #id-card-back, #id-card-back * {
            visibility: visible;
          }
          #id-card-front {
            position: fixed;
            left: 0;
            top: 0;
            margin: 0;
            box-shadow: none !important;
            border: 1px solid #ddd !important;
          }
          #id-card-back {
            position: fixed;
            left: 350px;
            top: 0;
            margin: 0;
            box-shadow: none !important;
            border: 1px solid #ddd !important;
          }
           @page {
            size: landscape;
            margin: 1cm;
          }
        }
      `}} />
    </div>
  );
}

