import React, { useState } from "react";
import { Users, Activity, GraduationCap, TrendingUp, AlertTriangle, ShieldCheck, UserCheck, Stethoscope, Clock, ShieldAlert, FileBarChart, DollarSign, CalendarCheck, FileText } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import SmartNotificationCenter from "./SmartNotificationCenter";

const OCCUPANCY_DATA = [
  { day: '1', icu: 95, er: 110, ward: 80 },
  { day: '5', icu: 90, er: 120, ward: 85 },
  { day: '10', icu: 100, er: 140, ward: 82 },
  { day: '15', icu: 85, er: 100, ward: 88 },
  { day: '20', icu: 95, er: 130, ward: 90 },
  { day: '25', icu: 90, er: 115, ward: 85 },
  { day: '30', icu: 95, er: 110, ward: 85 },
];

interface Props {
  language: "ar" | "en";
}

export default function NursingDirectorDashboard({ language }: Props) {
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState<"workforce" | "kpi" | "training" | "quality" | "financial" | "department_heads">("workforce");

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen text-right font-sans flex flex-col gap-6" dir={isAr ? "rtl" : "ltr"}>
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border-r-4 border-indigo-600">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-indigo-600" />
            {isAr ? "شاشة الإدارة العليا (صناع القرار - CNO)" : "Chief Nursing Officer (CNO) Dashboard"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAr ? "رؤية شاملة للتحكم في الكفاءة، التشغيل، الجودة، الشئون المالية للتمريض" : "Comprehensive view for workforce efficiency, quality, and financial operations"}
          </p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 flex-wrap">
          <button 
            onClick={() => setActiveTab("workforce")}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "workforce" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Users className="w-4 h-4" />
            {isAr ? "القوى العاملة" : "Workforce"}
          </button>
          <button 
            onClick={() => setActiveTab("kpi")}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "kpi" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Activity className="w-4 h-4" />
            {isAr ? "مؤشرات وتنبيهات" : "KPIs & Ops"}
          </button>
          <button 
            onClick={() => setActiveTab("quality")}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "quality" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <ShieldCheck className="w-4 h-4" />
            {isAr ? "الجودة والأحداث" : "Quality"}
          </button>
          <button 
            onClick={() => setActiveTab("training")}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "training" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <GraduationCap className="w-4 h-4" />
            {isAr ? "كفاءة وتدريب" : "Training"}
          </button>
          <button 
            onClick={() => setActiveTab("financial")}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "financial" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <DollarSign className="w-4 h-4" />
            {isAr ? "موازنة" : "Budget"}
          </button>
          <button 
            onClick={() => setActiveTab("department_heads")}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "department_heads" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <ShieldCheck className="w-4 h-4" />
            {isAr ? "مدراء الأقسام والأرشيف الذكي" : "Head Nurses & Smart Archives"}
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 h-full items-stretch">
        
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {activeTab === "workforce" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-bold mb-1">{isAr ? "الإجمالي الكلي للكوادر" : "Total Nursing Staff"}</div>
                  <div className="text-2xl font-black text-slate-800">450</div>
                  <div className="text-xs text-emerald-600 font-bold mt-2">↑ 5 تعيينات جديدة هذا الشهر</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-bold mb-1">{isAr ? "على رأس العمل الآن" : "On-Duty Now"}</div>
                  <div className="text-2xl font-black text-slate-800">142</div>
                  <div className="text-xs text-slate-400 mt-2">{isAr ? "تشغيل الشفت الصباحي" : "Morning Shift"}</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-bold mb-1">{isAr ? "العجز التمريضي الحالي للمستشفى" : "Current Hospital Shortage"}</div>
                  <div className="text-2xl font-black text-rose-600">-6</div>
                  <div className="text-xs text-rose-500 font-bold mt-2">مطلوب التغطية بالطوارئ والرعاية</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-bold mb-1">{isAr ? "نسبة الغياب والإجازات المرضية" : "Absent & Sick Leaves"}</div>
                  <div className="text-2xl font-black text-amber-600">3.2%</div>
                  <div className="text-xs text-emerald-600 font-bold mt-2">↓ ضمن النطاق المقبول</div>
                </div>
              </div>

              {/* Staffing Ratio & Shortages */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-emerald-500" />
                    {isAr ? "تحليل العمالة ونسبة التمريض للمرضى (Nurse-to-Patient Ratio)" : "Staffing Analysis & Ratios"}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                          <th className="py-3 px-4 font-bold">{isAr ? "القسم" : "Department"}</th>
                          <th className="py-3 px-4 font-bold">{isAr ? "إشغال الأسرة" : "Bed Occupancy"}</th>
                          <th className="py-3 px-4 font-bold">{isAr ? "تمريض الشفت" : "Shift Staff"}</th>
                          <th className="py-3 px-4 font-bold">{isAr ? "النسبة المحققة vs المستهدفة" : "Actual vs Target Ratio"}</th>
                          <th className="py-3 px-4 font-bold">{isAr ? "حالة التشغيل" : "Status"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-center text-slate-700">
                        <tr className="hover:bg-slate-50 transition">
                          <td className="py-4 px-4 text-right">رعاية مركزة (ICU)</td>
                          <td className="py-4 px-4 font-mono">18 / 20 <span className="text-[10px] text-amber-500">(90%)</span></td>
                          <td className="py-4 px-4 font-mono">11</td>
                          <td className="py-4 px-4 font-mono">1:1.6 <span className="text-slate-400 text-[10px]">(Target: 1:1.5)</span></td>
                          <td className="py-4 px-4"><span className="bg-red-100 text-red-700 px-3 py-1 text-[10px] rounded-md font-bold text-nowrap">{isAr ? "عجز (-1)" : "Shortage"}</span></td>
                        </tr>
                        <tr className="hover:bg-slate-50 transition">
                          <td className="py-4 px-4 text-right">طوارئ (ER)</td>
                          <td className="py-4 px-4 font-mono">25 <span className="text-[10px] text-rose-500">(Overload)</span></td>
                          <td className="py-4 px-4 font-mono">8</td>
                          <td className="py-4 px-4 font-mono">1:3.1 <span className="text-slate-400 text-[10px]">(Target: 1:3)</span></td>
                          <td className="py-4 px-4"><span className="bg-emerald-100 text-emerald-700 px-3 py-1 text-[10px] rounded-md font-bold text-nowrap">متوازن</span></td>
                        </tr>
                        <tr className="hover:bg-slate-50 transition">
                          <td className="py-4 px-4 text-right">باطنة عامة (Medical Ward)</td>
                          <td className="py-4 px-4 font-mono">35 / 40 <span className="text-[10px] text-emerald-500">(87%)</span></td>
                          <td className="py-4 px-4 font-mono">5</td>
                          <td className="py-4 px-4 font-mono">1:7 <span className="text-slate-400 text-[10px]">(Target: 1:6)</span></td>
                          <td className="py-4 px-4"><span className="bg-amber-100 text-amber-700 px-3 py-1 text-[10px] rounded-md font-bold text-nowrap">{isAr ? "احتياج تدعيم (-1)" : "Borderline"}</span></td>
                        </tr>
                        <tr className="hover:bg-slate-50 transition">
                          <td className="py-4 px-4 text-right">أورام ورعاية تلطيفية (Oncology)</td>
                          <td className="py-4 px-4 font-mono">12 / 15 <span className="text-[10px] text-emerald-500">(80%)</span></td>
                          <td className="py-4 px-4 font-mono">4</td>
                          <td className="py-4 px-4 font-mono">1:3 <span className="text-slate-400 text-[10px]">(Target: 1:4)</span></td>
                          <td className="py-4 px-4"><span className="bg-indigo-100 text-indigo-700 px-3 py-1 text-[10px] rounded-md font-bold text-nowrap">{isAr ? "فائض (+1)" : "Surplus"}</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-500" />
                    {isAr ? "الاعتماد المركزي للروستر والتبديلات" : "Central Roster Approval"}
                  </h3>
                  <div className="text-[10px] text-slate-500 mb-2">{isAr ? "طلبات معلقة تحتاج تفعيل من سيادتكم" : "Pending requests needing your signature"}</div>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 hover:bg-slate-100 transition rounded-xl border border-slate-200 flex flex-col gap-2 cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-slate-800">اعتماد الكادر التشغيلي لروستر مايو</p>
                          <p className="text-[10px] text-slate-500 font-mono">قسم الرعاية المركزة (ICU)</p>
                        </div>
                        <span className="bg-pink-100 text-pink-700 text-[9px] px-2 py-0.5 rounded-full font-bold">عاجل</span>
                      </div>
                      <div className="flex gap-2 w-full mt-1">
                         <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded-md text-[10px] font-bold transition">✅ توقيع إلكتروني</button>
                         <button className="flex-1 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 py-1.5 rounded-md text-[10px] font-bold transition">استعراض</button>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 hover:bg-slate-100 transition rounded-xl border border-slate-200 flex flex-col gap-2 cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-slate-800">تبديل وردية بين سارة محمد وعبير</p>
                          <p className="text-[10px] text-slate-500 font-mono">قسم الطوارئ - 12 مايو 2026</p>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full mt-1">
                         <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-md text-[10px] font-bold transition">✅ موافقة</button>
                         <button className="flex-1 bg-rose-50 text-rose-600 hover:bg-rose-100 py-1.5 rounded-md text-[10px] font-bold transition">❌ رفض</button>
                      </div>
                    </div>
                  </div>
                  <button className="w-full text-center text-[10px] text-indigo-600 font-bold hover:underline py-2">
                     {isAr ? "عرض كل الطلبات والأذونات (34 طلب)..." : "View all requests (34)..."}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "kpi" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-r-4 border-r-indigo-500 group hover:shadow-md transition">
                  <h4 className="text-xs font-bold text-slate-500 mb-2">{isAr ? "متوسط الاستجابة لنداء المريض" : "Avg. Call Response Time"}</h4>
                  <div className="text-3xl font-black text-slate-800 font-mono">1m 45s</div>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1">↓ أسرع بـ 15ث عن الشهر الماضي</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-r-4 border-r-emerald-500 group hover:shadow-md transition">
                  <h4 className="text-xs font-bold text-slate-500 mb-2">{isAr ? "نسبة إتمام خطط الرعاية (MAR)" : "MAR Completion Rate"}</h4>
                  <div className="text-3xl font-black text-slate-800 font-mono">98.2%</div>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1">↑ مرتفع وممتاز مستشفى التميز</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-r-4 border-r-amber-500 group hover:shadow-md transition">
                  <h4 className="text-xs font-bold text-slate-500 mb-2">{isAr ? "معدل دوران التمريض الكلي" : "Staff Turnover Rate"}</h4>
                  <div className="text-3xl font-black text-slate-800 font-mono">2.4%</div>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">منتظم وثابت منذ 6 أشهر</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-r-4 border-r-purple-500 group hover:shadow-md transition">
                  <h4 className="text-xs font-bold text-slate-500 mb-2">{isAr ? "رضا المرضى عن التمريض (HCAHPS)" : "Patient Satisfaction (HCAHPS)"}</h4>
                  <div className="text-3xl font-black text-slate-800 font-mono">94%</div>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1">↑ ضمن أفضل 10% إقليميا</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-black text-slate-800 mb-4">{isAr ? "معدلات الإشغال السريرية وتنبيهات الضغط (Occupancy Trends)" : "Occupancy Rates & Bottlenecks"}</h3>
                  
                  {/* Recharts Implemented */}
                  <div className="h-64 sm:h-80 w-full mb-6 mt-4" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={OCCUPANCY_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorIcu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorEr" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorWard" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} domain={[0, 150]} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} labelStyle={{ fontWeight: 'bold', color: '#64748b', fontSize: '12px' }} />
                        <Area type="monotone" name="ER (Overload %)" dataKey="er" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorEr)" />
                        <Area type="monotone" name="ICU (Critical %)" dataKey="icu" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorIcu)" />
                        <Area type="monotone" name="Medical Wards (%)" dataKey="ward" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorWard)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="text-xs font-bold text-slate-500 mb-1">الرعاية المركزة</div>
                        <div className="font-mono font-bold text-rose-600">95% إشغال</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="text-xs font-bold text-slate-500 mb-1">الطوارئ (ترياج)</div>
                        <div className="font-mono font-bold text-sky-600">110% Overload</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="text-xs font-bold text-slate-500 mb-1">الباطنة والجراحة</div>
                        <div className="font-mono font-bold text-emerald-600">85% إشغال</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="text-xs font-bold text-slate-500 mb-1">متوسط مدة الإقامة ALOS</div>
                        <div className="font-mono font-bold text-indigo-600">4.2 Days</div>
                      </div>
                  </div>
              </div>

            </div>
          )}

          {activeTab === "quality" && (
             <div className="space-y-6 animate-fade-in">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-rose-500" />
                      {isAr ? "تقرير الأحداث العكسية العاجلة (OVRs)" : "Adverse Events & OVRs"}
                    </h3>
                    <div className="space-y-4">
                       <div className="p-4 bg-rose-50 border-r-4 border-r-rose-600 rounded-l-lg rounded-r-sm">
                          <div className="flex justify-between items-start">
                             <h4 className="font-bold text-rose-900 text-sm">خطأ دوائي Medication Error</h4>
                             <span className="bg-rose-200 text-rose-900 text-[10px] px-2 py-0.5 font-bold rounded">عالي (Sentinel Event)</span>
                          </div>
                          <p className="text-xs text-rose-700 mt-1">قسم الباطنة - المريض استلم جرعة زائدة من الإنسولين بالخطأ.</p>
                          <p className="text-[10px] text-rose-600 font-mono mt-2">منذ ساعتين | بواسطة: جودة المستشفى</p>
                          <button className="mt-3 bg-white text-rose-700 border border-rose-200 text-xs font-bold px-3 py-1.5 rounded-lg w-full">طلب تحقيق جذري (RCA)</button>
                       </div>
                       <div className="p-4 bg-amber-50 border-r-4 border-r-amber-500 rounded-l-lg rounded-r-sm">
                          <div className="flex justify-between items-start">
                             <h4 className="font-bold text-amber-900 text-sm">سقوط مريض (Patient Fall)</h4>
                             <span className="bg-amber-200 text-amber-900 text-[10px] px-2 py-0.5 font-bold rounded">متوسط المخاطر</span>
                          </div>
                          <p className="text-xs text-amber-700 mt-1">مريض منوم بعناية القلب انزلق بالحمام، لا يوجد كسور ظاهرة.</p>
                          <p className="text-[10px] text-amber-600 font-mono mt-2">الأمس | حالة المريض: مستقرة</p>
                       </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                      <FileBarChart className="w-5 h-5 text-indigo-500" />
                      {isAr ? "مؤشرات الجودة السريرية الرئيسية" : "Clinical Quality Metrics"}
                    </h3>
                    <div className="space-y-5">
                       <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-slate-700">
                             <span>قرح الفراش المكتسبة بالمستشفى (HAPIs)</span>
                             <span>0.2%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                             <div className="bg-emerald-500 h-2 rounded-full" style={{width: '95%'}}></div>
                          </div>
                          <p className="text-[9px] text-slate-400">الهدف المسموح &lt; 0.5% (ممتاز)</p>
                       </div>
                       <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-slate-700">
                             <span>العدوى المصاحبة للقساطر (CLABSI/CAUTI)</span>
                             <span>1.1%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                             <div className="bg-amber-500 h-2 rounded-full" style={{width: '15%'}}></div>
                          </div>
                          <p className="text-[9px] text-slate-400">الهدف المسموح 0% (يوجد انحراف وتحذير)</p>
                       </div>
                       <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-slate-700">
                             <span>معدل الالتزام بنظافة الأيدي (Hand Hygiene)</span>
                             <span>92%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                             <div className="bg-indigo-500 h-2 rounded-full" style={{width: '92%'}}></div>
                          </div>
                          <p className="text-[9px] text-slate-400">نتائج التفتيش الأرضي لآخر أسبوع</p>
                       </div>
                    </div>
                  </div>
               </div>
             </div>
          )}

          {activeTab === "financial" && (
             <div className="space-y-6 animate-fade-in">
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    {isAr ? "تحليل الوقت الإضافي والموازنة التشغيلية" : "Overtime & Budget Analysis"}
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-xl text-center flex flex-col justify-center">
                       <span className="text-xs font-bold text-emerald-800 mb-1">الاستهلاك الشهري للوقت الإضافي (OT)</span>
                       <span className="text-4xl font-black text-emerald-700 font-mono">1,450 Hrs</span>
                       <span className="text-[10px] text-emerald-600 font-bold mt-2 bg-emerald-200 rounded-full px-2 py-0.5 max-w-max mx-auto">وفر 15% من ميزانية الإضافي المعتمدة</span>
                     </div>
                     <div className="lg:col-span-2 space-y-3">
                        <h4 className="font-bold text-sm text-slate-800 mb-2">أعلى الأقسام استهلاكاً للإضافي (للتدخل الإداري)</h4>
                        <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                           <div>
                              <p className="font-bold text-sm text-slate-800">قسم الطوارئ (ER)</p>
                              <p className="text-xs text-slate-500">تم التغطية بصرف رواتب إضافية لسد العجز المفاجئ</p>
                           </div>
                           <div className="text-lg font-black text-rose-600 font-mono">480 Hrs</div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                           <div>
                              <p className="font-bold text-sm text-slate-800">رعاية حديثي الولادة (NICU)</p>
                              <p className="text-xs text-slate-500">حالات مرضية متعددة في الطاقم الأساسي</p>
                           </div>
                           <div className="text-lg font-black text-amber-600 font-mono">310 Hrs</div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                           <div>
                              <p className="font-bold text-sm text-slate-800">العمليات (OR)</p>
                              <p className="text-xs text-slate-500">حالات طوارئ تأخرت بعد انتهاء الشفت</p>
                           </div>
                           <div className="text-lg font-black text-slate-700 font-mono">220 Hrs</div>
                        </div>
                     </div>
                  </div>
               </div>
             </div>
          )}

          {activeTab === "training" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  {isAr ? "الشهادات الإلزامية (تنبيه انتهاء الصلاحية)" : "Mandatory Certifications Expiry"}
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {[
                    { name: "أحمد يوسف", cert: "BLS - انعاش قلب أساسي", expires: "بعد 10 أيام", dept: "ER", status: "warning" },
                    { name: "سارة محمود", cert: "ACLS - انعاش متقدم", expires: "بعد 15 يوما", dept: "ICU", status: "warning" },
                    { name: "منى علي", cert: "NRP", expires: "منتهية الصلاحية!", dept: "NICU", status: "expired" },
                    { name: "حسن ابراهيم", cert: "مكافحة عدوى دورية", expires: "بعد شهر", dept: "Ward", status: "safe" }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{item.name} <span className="text-[10px] text-slate-400">({item.dept})</span></p>
                        <p className="text-xs text-slate-500 font-medium">{item.cert}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black ${item.status === "expired" ? "bg-red-100 text-red-700" : item.status === "warning" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {item.expires}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-indigo-500" />
                  {isAr ? "تقييمات الأداء الدورية (Performance Appraisals)" : "Periodic Appraisals"}
                </h3>
                <div className="space-y-4 flex-1">
                  <div className="p-4 bg-indigo-50 rounded-xl flex items-center justify-between border border-indigo-100">
                    <div>
                      <h4 className="font-bold text-indigo-900 text-sm">تقييم النصف الأول 2026</h4>
                      <p className="text-xs text-indigo-700 mt-1">75% من التمريض تم استكمال ملف تقييمهم بنجاح.</p>
                    </div>
                    <div className="text-2xl font-black text-indigo-600 font-mono">75%</div>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                     <h4 className="font-bold text-xs text-slate-600">أقسام متأخرة في التقييم:</h4>
                     <div className="flex justify-between text-xs text-slate-800 p-2 bg-slate-50 rounded border border-slate-100 font-bold">
                        <span>العمليات (OR)</span> <span className="text-rose-600">30% مقيم فقط</span>
                     </div>
                     <div className="flex justify-between text-xs text-slate-800 p-2 bg-slate-50 rounded border border-slate-100 font-bold">
                        <span>الطوارئ (ER)</span> <span className="text-amber-600">60% مقيم فقط</span>
                     </div>
                  </div>

                  <div className="mt-auto pt-6">
                    <button className="w-full py-3 border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition text-slate-500 font-bold text-sm flex justify-center items-center gap-2">
                      <FileText className="w-4 h-4"/>
                      {isAr ? "عرض تقارير التقييم التفصيلية" : "View Detailed Appraisal Reports"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "department_heads" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  {isAr ? "إدارة مدراء الأقسام وتخصيص الصلاحيات المتقدمة" : "Head Nurses Management & Advanced Customization"}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                   <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-slate-800 text-sm">أ. منى السيد</div>
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded-full font-bold">بوابة الرعاية (ICU)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mb-3">الصلاحيات: إنشاء وتوزيع النماذج، تعديل الجداول، والموافقة على الروستر المبدئي.</p>
                      <button className="w-full bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-[10px] font-bold py-1.5 rounded transition">تخصيص الصلاحيات والأرشيف</button>
                   </div>
                   <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-slate-800 text-sm">أ. فاطمة أحمد</div>
                        <span className="bg-sky-100 text-sky-800 text-[9px] px-2 py-0.5 rounded-full font-bold">طوارئ (ER)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mb-3">الصلاحيات: إضافة الجرودات، متابعة المخزون الإسعافي السريع.</p>
                      <button className="w-full bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-[10px] font-bold py-1.5 rounded transition">تخصيص الصلاحيات والأرشيف</button>
                   </div>
                   <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-slate-800 text-sm">د. حسام الدين</div>
                        <span className="bg-amber-100 text-amber-800 text-[9px] px-2 py-0.5 rounded-full font-bold">جودة مكافحة العدوى</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mb-3">الصلاحيات: تفتيش شامل لكافة الأقسام وأرشيف الحوادث الكبرى.</p>
                      <button className="w-full bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-[10px] font-bold py-1.5 rounded transition">تخصيص الصلاحيات والأرشيف</button>
                   </div>
                </div>

                <div className="p-5 border-t border-slate-100 bg-white shadow-sm rounded-xl border">
                  <h4 className="font-black text-slate-800 text-xs mb-3 flex items-center gap-1.5">
                    <Archive className="w-4 h-4 text-emerald-500" />
                    {isAr ? "الأرشيفات الذكية واسترجاع سجلات المراجعين" : "Smart Archives & Records Retrieval"}
                  </h4>
                  <div className="flex flex-wrap gap-2 text-xs">
                     <button className="px-3 py-2 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 transition font-bold text-slate-700 flex items-center gap-2">
                       <FileText className="w-3.5 h-3.5" /> استرجاع جرودات الـ 200 شيت
                     </button>
                     <button className="px-3 py-2 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 transition font-bold text-slate-700 flex items-center gap-2">
                       <Stethoscope className="w-3.5 h-3.5" /> أرشيف السجلات السريرية
                     </button>
                     <button className="px-3 py-2 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 transition font-bold text-slate-700 flex items-center gap-2">
                       <AlertTriangle className="w-3.5 h-3.5" /> مراجعة أحداث OVRs التاريخية
                     </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right/Left Sidebar - Smart Notification Center */}
        <div className="w-full xl:w-[320px] shrink-0 xl:h-[calc(100vh-140px)] sticky top-6">
          <SmartNotificationCenter language={language} />
        </div>

      </div>
    </div>
  );
}

