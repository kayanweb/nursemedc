import React, { useState } from "react";
import { Users, Calendar, Activity, CreditCard, UserPlus, Search, BedDouble, ArrowRightLeft, Clock, CheckCircle2, ShieldAlert, LogOut } from "lucide-react";
import { useHIS, Patient } from "../context/HISContext";
import { toast } from "sonner";

interface Props {
  language: "ar" | "en";
}

export default function PatientRegistration({ language }: Props) {
  const isAr = language === "ar";
  const [activeSubTab, setActiveSubTab] = useState<"register" | "appointments" | "adt" | "discharge">("register");
  
  const { patients, addPatient, updatePatientStatus } = useHIS();
  
  // Registration Form State
  const [firstName, setFirstName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [phone, setPhone] = useState("");
  const [insurance, setInsurance] = useState("Cash");
  const [gender, setGender] = useState("male");
  const [isSaving, setIsSaving] = useState(false);

  const handleRegister = async () => {
    if (!firstName || !phone) {
      return toast.error(isAr ? "يرجى تعبئة الحقول المطلوبة (الاسم، الهاتف)" : "Please fill required fields (Name, Phone)");
    }
    setIsSaving(true);
    const newId = "p" + Date.now();
    const newMrn = "MRN-2026-" + Math.floor(1000 + Math.random() * 9000);
    const fullName = fatherName ? `${firstName} ${fatherName}` : firstName;
    
    await addPatient({
      id: newId,
      mrn: newMrn,
      nameEn: fullName,
      nameAr: fullName, // simple fallback
      age: 30, // mock
      gender: gender,
      phone: phone,
      status: "registered",
      insurance: insurance
    });
    
    setFirstName("");
    setFatherName("");
    setPhone("");
    setIsSaving(false);
    toast.success(isAr ? `تم حفظ المريض بنجاح! : ${newMrn}` : `Patient registered successfully! MRN: ${newMrn}`);
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen font-sans text-right" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border-r-4 border-r-blue-500 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Users className="h-7 w-7 text-blue-600" />
            {isAr ? "الاستقبال والتسجيل وحجز المواعيد (Front Desk & ADT)" : "Reception & Registration (Front Desk)"}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {isAr ? "إدارة ملفات المرضى، المواعيد، وحركة الدخول والخروج والنقل والتسكين." : "Patient profiles, appointment scheduling, and ADT tracking."}
          </p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 flex-wrap">
          <button onClick={() => setActiveSubTab("register")} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeSubTab === "register" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <UserPlus className="w-4 h-4" /> {isAr ? "تسجيل ملف جديد" : "New Patient"}
          </button>
          <button onClick={() => setActiveSubTab("appointments")} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeSubTab === "appointments" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <Calendar className="w-4 h-4" /> {isAr ? "حجز المواعيد" : "Appointments"}
          </button>
          <button onClick={() => setActiveSubTab("adt")} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeSubTab === "adt" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <ArrowRightLeft className="w-4 h-4" /> {isAr ? "التسكين (ADT)" : "Bed Management"}
          </button>
          <button onClick={() => setActiveSubTab("discharge")} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeSubTab === "discharge" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <LogOut className="w-4 h-4" /> {isAr ? "نموذج الخروج" : "Discharge Form"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {activeSubTab === "register" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in flex flex-col xl:flex-row">
             <div className="flex-1 p-6 space-y-6">
                <h3 className="font-black text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-500" /> {isAr ? "تسجيل ملف طبي جديد (Patient Registration Form)" : "Patient Registration Form"}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">{isAr ? "الرقم الطبي (MRN)" : "MRN"}</label>
                    <input type="text" disabled value="2026-000045" className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-mono font-bold" />
                  </div>
                  <div className="lg:col-span-3">
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">{isAr ? "الاسم رباعي" : "Full Name (4 Parts)"}</label>
                    <div className="grid grid-cols-4 gap-2">
                      <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder={isAr ? "الاسم الأول" : "First Name"} className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg p-2.5 text-xs outline-none" />
                      <input type="text" value={fatherName} onChange={e => setFatherName(e.target.value)} placeholder={isAr ? "اسم الأب" : "Father Name"} className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg p-2.5 text-xs outline-none" />
                      <input type="text" placeholder={isAr ? "اسم الجد" : "Grandfather"} className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg p-2.5 text-xs outline-none" />
                      <input type="text" placeholder={isAr ? "اسم العائلة" : "Family Name"} className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg p-2.5 text-xs outline-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">{isAr ? "الرقم القومي / جواز السفر" : "National ID / Passport"}</label>
                    <div className="relative">
                       <input type="text" maxLength={14} placeholder="2950101..." className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg p-2.5 text-xs outline-none font-mono" />
                       <span className="absolute left-2 rtl:right-auto rtl:left-2 top-2 text-[8px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-bold">{isAr ? "معالجة تلقائية" : "Auto-parse"}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">{isAr ? "تاريخ الميلاد" : "Date of Birth"}</label>
                    <input type="date" className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg p-2.5 text-xs outline-none bg-slate-50" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">{isAr ? "الجنس" : "Gender"}</label>
                    <select value={gender} onChange={e => setGender(e.target.value)} className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg p-2.5 text-xs outline-none">
                      <option value="male">{isAr ? "ذكر" : "Male"}</option>
                      <option value="female">{isAr ? "أنثى" : "Female"}</option>
                    </select>
                  </div>
                  <div>
                     <label className="text-[10px] text-slate-500 font-bold block mb-1">{isAr ? "الديانة" : "Religion"}</label>
                     <select className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg p-2.5 text-xs outline-none">
                       <option>{isAr ? "مسلم" : "Muslim"}</option>
                       <option>{isAr ? "مسيحي" : "Christian"}</option>
                       <option>{isAr ? "أخرى" : "Other"}</option>
                     </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                     <label className="text-[10px] text-slate-500 font-bold block mb-1">{isAr ? "الوظيفة / المهنة" : "Occupation / Job"}</label>
                     <input type="text" placeholder={isAr ? "الوظيفة" : "Occupation"} className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg p-2.5 text-xs outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">{isAr ? "رقم المحمول الأساسي" : "Mobile Number"}</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01X-XXXX-XXXX" className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg p-2.5 text-xs outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">{isAr ? "رقم طوارئ (Emergency Contact)" : "Emergency Contact"}</label>
                    <input type="text" placeholder={isAr ? "الاسم - صلة القرابة - الرقم" : "Name - Relation - Number"} className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg p-2.5 text-xs outline-none" />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-4">
                   <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2"><CreditCard className="w-4 h-4 text-slate-500" /> {isAr ? "الجهة الضامنة والتغطية المالية" : "Payment & Insurance"}</h4>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                       <label className="text-[10px] text-slate-500 font-bold block mb-1">{isAr ? "نوع التغطية" : "Coverage Type"}</label>
                       <select value={insurance} onChange={e => setInsurance(e.target.value)} className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg p-2.5 text-xs outline-none">
                         <option value="Cash">{isAr ? "نقدي (Cash)" : "Cash"}</option>
                         <option value="Private Insurance">{isAr ? "شركة تأمين طبية" : "Private Insurance"}</option>
                         <option value="Govt. Coverage">{isAr ? "نفقة الدولة" : "Govt. Coverage"}</option>
                         <option value="Corporate">{isAr ? "تعاقد شركات" : "Corporate"}</option>
                       </select>
                     </div>
                     <div className="opacity-50 pointer-events-none">
                       <label className="text-[10px] text-slate-500 font-bold block mb-1">{isAr ? "رقم كارت التأمين" : "Insurance Card No."}</label>
                       <input type="text" className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs" />
                     </div>
                     <div className="opacity-50 pointer-events-none">
                       <label className="text-[10px] text-slate-500 font-bold block mb-1">{isAr ? "شبكة / درجة التغطية" : "Coverage Network"}</label>
                       <select className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs">
                         <option>Class A</option>
                       </select>
                     </div>
                   </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button onClick={handleRegister} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition disabled:opacity-50">
                    {isSaving ? "Saving..." : (isAr ? "حفظ واستخراج كارت المريض" : "Save & Generate MRN Profile")}
                  </button>
                </div>
             </div>
          </div>
        )}

        {activeSubTab === "appointments" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-fade-in space-y-6">
             <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex flex-1 items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 max-w-xl w-full">
                  <Search className="w-5 h-5 text-slate-400 ml-2" />
                  <input type="text" placeholder={isAr ? "بحث برقم الملف، التليفون، واسم الطبيب" : "Search by MRN, Phone, Doctor Name..."} className="bg-transparent border-none outline-none text-sm w-full" />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="bg-white border border-slate-300 rounded-lg p-2 text-sm outline-none" />
                  <select className="bg-white border border-slate-300 rounded-lg p-2 text-sm outline-none">
                     <option>{isAr ? "عيادة الباطنة" : "Internal Medicine Clinic"}</option>
                     <option>{isAr ? "عيادة القلب" : "Cardiology Clinic"}</option>
                  </select>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               {['09:00 AM', '09:15 AM', '09:30 AM', '09:45 AM', '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM'].map((time, idx) => {
                 let status = "available";
                 if (idx === 1 || idx === 3) status = "booked";
                 if (idx === 4) status = "pending";

                 const statusColors = {
                   available: "bg-emerald-50 border-emerald-200 hover:border-emerald-400",
                   booked: "bg-rose-50 border-rose-200 opacity-90",
                   pending: "bg-amber-50 border-amber-200"
                 };

                 return (
                   <div key={time} className={`border rounded-xl p-4 transition-colors cursor-pointer ${statusColors[status as keyof typeof statusColors]}`}>
                     <div className="flex justify-between items-start mb-2">
                       <span className="font-bold text-slate-800 text-sm font-mono">{time}</span>
                       <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                         status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                         status === 'booked' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                       }`}>
                         {status === 'available' ? (isAr ? "متاح للحجز" : "Available") : status === 'booked' ? (isAr ? "مؤكد" : "Confirmed") : (isAr ? "قيد الانتظار" : "Pending Pay")}
                       </span>
                     </div>
                     {status === 'booked' ? (
                        <div className="text-xs">
                          <p className="font-bold text-slate-800">MRN-2026-0012</p>
                          <p className="text-slate-600">عمر عبد العزيز محمود</p>
                        </div>
                     ) : status === 'pending' ? (
                        <div className="text-xs">
                          <p className="font-bold text-slate-800">MRN-2026-0044</p>
                          <p className="text-slate-600">سعاد محمد السيد</p>
                        </div>
                     ) : (
                        <button className="mt-2 w-full bg-white border border-slate-300 text-slate-600 text-[10px] font-bold py-1.5 rounded hover:bg-slate-50 transition">
                          {isAr ? "حجز موعد جديد" : "Book Slot"}
                        </button>
                     )}
                   </div>
                 )
               })}
             </div>
          </div>
        )}

        {activeSubTab === "adt" && (
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-fade-in space-y-6">
              <h3 className="font-black text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-indigo-500" /> {isAr ? "إدارة التسكين الداخلي (Bed Management Area)" : "Bed Management Area"}
              </h3>

              <div className="flex gap-4 mb-4">
                 <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div><span className="text-xs font-bold text-slate-600">{isAr ? "سرير شاغر ونظيف (Vacant)" : "Vacant & Clean"}</span></div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-500 rounded-full"></div><span className="text-xs font-bold text-slate-600">{isAr ? "سرير مشغول (Occupied)" : "Occupied"}</span></div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500 rounded-full"></div><span className="text-xs font-bold text-slate-600">{isAr ? "يحتاج تنظيف (Dirty/Setup)" : "Dirty"}</span></div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-500 rounded-full"></div><span className="text-xs font-bold text-slate-600">{isAr ? "صيانة/مغلق (Blocked)" : "Blocked/Maint."}</span></div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                 {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(bed => {
                    let bedStatus = "vacant";
                    if ([2, 5, 8, 9].includes(bed)) bedStatus = "occupied";
                    if ([3].includes(bed)) bedStatus = "dirty";
                    if ([12].includes(bed)) bedStatus = "blocked";

                    const bedColors = {
                      vacant: "bg-emerald-50 border-emerald-200 text-emerald-800 hover:border-emerald-400 cursor-pointer",
                      occupied: "bg-rose-50 border-rose-200 text-rose-800 cursor-help",
                      dirty: "bg-amber-50 border-amber-200 text-amber-800",
                      blocked: "bg-slate-100 border-slate-300 text-slate-500"
                    };

                    const dotColors = {
                      vacant: "bg-emerald-500", occupied: "bg-rose-500", dirty: "bg-amber-500", blocked: "bg-slate-500"
                    };

                    return (
                      <div key={bed} className={`border-2 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition ${bedColors[bedStatus as keyof typeof bedColors]}`}>
                         <div className="flex justify-between w-full items-center">
                           <div className={`w-2 h-2 rounded-full ${dotColors[bedStatus as keyof typeof dotColors]}`}></div>
                           <span className="text-[9px] font-black font-mono">RM-10{bed}</span>
                         </div>
                         <BedDouble className="w-6 h-6 opacity-80" />
                         <span className="font-bold text-sm">Bed {bed}</span>
                         {bedStatus === 'vacant' && <button className="text-[8px] bg-white border border-emerald-200 px-2 py-1 rounded w-full font-bold">{isAr ? "تسكين طلب دخول" : "Admit Here"}</button>}
                         {bedStatus === 'occupied' && <span className="text-[9px] font-mono font-bold bg-white/50 px-1 rounded">MRN-8821</span>}
                      </div>
                    )
                 })}
              </div>

           </div>
        )}

        {activeSubTab === "discharge" && (
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-fade-in max-w-3xl">
              <h3 className="font-black text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2 mb-6">
                <LogOut className="w-5 h-5 text-indigo-500" /> {isAr ? "نموذج الخروج والتسوية (Discharge Form)" : "Discharge Checklist & Settlement"}
              </h3>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex justify-between items-center">
                 <div>
                    <p className="text-xs text-slate-500 font-bold">Patient Details</p>
                    <p className="font-black text-slate-800 text-lg">MRN-2026-0031 | مروان أحمد عبد السلام</p>
                 </div>
                 <div className="text-right">
                    <p className="text-xs text-slate-500 font-bold">Bed Location</p>
                    <p className="font-black text-indigo-700 text-lg">Ward B - RM 205</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-white cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500" defaultChecked/>
                    <div className="flex-1">
                       <p className="text-sm font-bold text-slate-800">{isAr ? "نموذج الخروج الطبي مختوم من الطبيب" : "Medical Discharge Summary signed by attending physician"}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                 </label>
                 
                 <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-white cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500" defaultChecked/>
                    <div className="flex-1">
                       <p className="text-sm font-bold text-slate-800">{isAr ? "استلام العلاج الموصوف عند الخروج من الصيدلية" : "Discharge medications dispensed from Pharmacy"}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                 </label>

                 <label className="flex items-center gap-3 p-3 border border-rose-200 rounded-lg bg-rose-50 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500" />
                    <div className="flex-1">
                       <p className="text-sm font-bold text-rose-800">{isAr ? "تسوية الحساب الختامي في قسم الحسابات" : "Final billing settlement and financial clearance"}</p>
                    </div>
                    <ShieldAlert className="w-5 h-5 text-rose-500" />
                 </label>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
                 <button className="px-6 py-2 border border-slate-300 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50">{isAr ? "إلغاء الخروج" : "Cancel Discharge"}</button>
                 <button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md disabled:opacity-50" disabled>{isAr ? "تأكيد الخروج وطلب تنظيف السرير" : "Confirm Discharge & Request Bed Cleaning"}</button>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
