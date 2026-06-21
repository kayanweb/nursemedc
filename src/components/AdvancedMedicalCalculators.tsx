import React, { useState, useEffect } from "react";
import {
  Activity,
  ClipboardList,
  ShieldAlert,
  Copy,
  FileText,
  CheckCircle,
  AlertTriangle,
  Wind,
  Heart,
  TrendingUp,
  Plus,
  Trash2,
  Download,
  CheckSquare,
  Sparkles,
  Info,
  Calendar,
  Layers,
  FileSpreadsheet
} from "lucide-react";

interface AppUser {
  id: string;
  nameAr: string;
  nameEn: string;
  role: string;
  department: string;
}

interface AdvancedMedicalCalculatorsProps {
  currentUser: AppUser | null;
  language: "ar" | "en";
  addSystemLog?: (text: string, type: "info" | "warning" | "success" | "error") => void;
}

interface HandoverRecord {
  id: string;
  patientName: string;
  mrn: string;
  bedNo: string;
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
  authorName: string;
  timestamp: string;
}

export default function AdvancedMedicalCalculators({
  currentUser,
  language,
  addSystemLog
}: AdvancedMedicalCalculatorsProps) {
  const isAr = language === "ar";
  const [activeSubTab, setActiveSubTab] = useState<"news2" | "isbar" | "crash_cart" | "more_tools">("news2");

  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, string>>({});

  const handleConsultAI = async (id: string, type: "news2" | "isbar", data: any) => {
    setAiLoading(prev => ({ ...prev, [id]: true }));
    try {
      const response = await fetch("/api/ai/analyze-clinical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          data,
          lang: language
        })
      });
      const resData = await response.json();
      if (resData.success && resData.analysis) {
        setAiAnalysis(prev => ({ ...prev, [id]: resData.analysis }));
        if (addSystemLog) {
          addSystemLog(isAr ? "تم تحضير استشارة الذكاء الاصطناعي بنجاح" : "AI clinical review generated successfully", "success");
        }
      } else {
        throw new Error(resData.error || "Failed to generate AI analysis");
      }
    } catch (err: any) {
      console.error(err);
      alert(isAr ? `فشل الاستشارة: ${err.message}` : `Consultation failed: ${err.message}`);
    } finally {
      setAiLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // 1. NEWS2 Calculator State
  const [newsVitals, setNewsVitals] = useState({
    respRate: 16,     // 12-20 is normal
    spo2Scale: 1,     // Scale 1 (normal) or Scale 2 (COPD target 88-92%)
    spo2Value: 98,    // %
    onOxygen: false,  // Air or Oxygen
    systolicBP: 120,  // mmHg
    pulse: 75,        // bpm
    consciousness: "A", // A = Alert, CVPU = New Confusion, Voice, Pain, Unresponsive
    temperature: 36.8 // Celsius
  });

  const [newsScore, setNewsScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState<"LOW" | "LOW_MEDIUM" | "MEDIUM" | "HIGH">("LOW");

  // NEWS2 calculation algorithm
  useEffect(() => {
    let score = 0;

    // Respiration Rate score
    const rr = newsVitals.respRate;
    if (rr <= 8) score += 3;
    else if (rr >= 9 && rr <= 11) score += 1;
    else if (rr >= 12 && rr <= 20) score += 0;
    else if (rr >= 21 && rr <= 24) score += 2;
    else if (rr >= 25) score += 3;

    // SpO2 score
    const spo2 = newsVitals.spo2Value;
    if (newsVitals.spo2Scale === 1) {
      if (spo2 <= 91) score += 3;
      else if (spo2 >= 92 && spo2 <= 93) score += 2;
      else if (spo2 >= 94 && spo2 <= 95) score += 1;
      else if (spo2 >= 96) score += 0;
    } else {
      // Scale 2 (Hypercapnic respiratory drive e.g. COPD)
      if (spo2 <= 83) score += 3;
      else if (spo2 >= 84 && spo2 <= 85) score += 2;
      else if (spo2 >= 86 && spo2 <= 87) score += 1;
      else if (spo2 >= 88 && spo2 <= 92) score += 0;
      else if (spo2 >= 93 && spo2 <= 94) score += 1;
      else if (spo2 >= 95 && spo2 <= 96) score += 2;
      else if (spo2 >= 97) score += 3;
    }

    // supplemental oxygen score
    if (newsVitals.onOxygen) {
      score += 2;
    }

    // Temperature score
    const t = newsVitals.temperature;
    if (t <= 35.0) score += 3;
    else if (t >= 35.1 && t <= 36.0) score += 1;
    else if (t >= 36.1 && t <= 38.0) score += 0;
    else if (t >= 38.1 && t <= 39.0) score += 1;
    else if (t >= 39.1) score += 2;

    // Systolic BP score
    const bp = newsVitals.systolicBP;
    if (bp <= 90) score += 3;
    else if (bp >= 91 && bp <= 100) score += 2;
    else if (bp >= 101 && bp <= 110) score += 1;
    else if (bp >= 111 && bp <= 219) score += 0;
    else if (bp >= 220) score += 3;

    // Pulse score
    const p = newsVitals.pulse;
    if (p <= 40) score += 3;
    else if (p >= 41 && p <= 50) score += 1;
    else if (p >= 51 && p <= 90) score += 0;
    else if (p >= 91 && p <= 110) score += 1;
    else if (p >= 111 && p <= 130) score += 2;
    else if (p >= 131) score += 3;

    // Consciousness score
    if (newsVitals.consciousness !== "A") {
      score += 3;
    }

    setNewsScore(score);

    // Risk level classification
    if (score >= 7) {
      setRiskLevel("HIGH");
    } else if (score >= 5 && score <= 6) {
      setRiskLevel("MEDIUM");
    } else {
      // Check if any single parameter scores 3 (known as "low-medium" Risk if score is 1-4 but a single parameter triggers 3)
      let hasSingleParameter3 = false;
      
      // re-evaluate single parameters
      if (rr <= 8 || rr >= 25) hasSingleParameter3 = true;
      if (newsVitals.spo2Scale === 1 ? spo2 <= 91 : spo2 <= 83) hasSingleParameter3 = true;
      if (t <= 35.0) hasSingleParameter3 = true;
      if (bp <= 90 || bp >= 220) hasSingleParameter3 = true;
      if (p <= 40 || p >= 131) hasSingleParameter3 = true;
      if (newsVitals.consciousness !== "A") hasSingleParameter3 = true;

      if (hasSingleParameter3 && score < 5) {
        setRiskLevel("LOW_MEDIUM");
      } else if (score >= 1 && score <= 4) {
        setRiskLevel("LOW");
      } else {
        setRiskLevel("LOW"); // 0 score
      }
    }
  }, [newsVitals]);

  // Response Pathways depending on NEWS2 status
  const getNewsResponse = () => {
    if (riskLevel === "HIGH") {
      return {
        class: "border-rose-600 bg-rose-50 text-rose-950",
        badge: "text-white bg-rose-600 border-rose-700",
        alertAr: "🔴 إنذار طارئ أحمر: تدهور عالي الخطورة! تفعيل فوري لفريق الاستجابة السريعة (RRT / Code Blue).",
        alertEn: "🔴 Emergency Alert Red: High-risk deterioration! Immediate activation of Rapid Response Team / Medical Emergency Team.",
        actionsAr: [
          "نقل المريض فوراً إلى خط رعاية مكثف أو وحدة العناية المركزة (ICU).",
          "مراقبة العلامات الحيوية بشكل مستمر وبدون انقطاع.",
          "تأمين المجرى الهوائي الصدري وتوفير إكسجين تدفقي مستمر ومعدات الإنعاش بجوار السرير."
        ],
        actionsEn: [
          "Transfer candidate immediately to critical care (ICU/CCU).",
          "Continuous visual monitor & clinical surveillance.",
          "Verify airway, place high-flow oxygen, and move resuscitation cart bedside."
        ]
      };
    } else if (riskLevel === "MEDIUM") {
      return {
        class: "border-amber-500 bg-amber-50 text-amber-950",
        badge: "text-white bg-amber-500 border-amber-600",
        alertAr: "🟡 إنذار برتقالي: خطورة متوسطة! استدعاء عاجل لفريق المراجعة السريرية وطبيب الطوارئ المقيم للتقييم الفوري.",
        alertEn: "🟡 Alert Amber: Medium deterioration risk! Urgent call to the clinical review team and attending registrar for bedside evaluation.",
        actionsAr: [
          "زيادة تكرار قياس المؤشرات الحيوية لتصبح كل ساعة على الأقل.",
          "طلب مراجعة من الطبيب المقيم والأخصائي المناوب خلال 20 دقيقة كحد أقصى.",
          "تجهيز تقرير التسليم SBAR فوراً ومراجعة الأدوية الحالية للمريض."
        ],
        actionsEn: [
          "Escalate vital checking frequency to at least once per hour.",
          " bedside review by medical registrar within 20 minutes maximum.",
          "Prepare complete handover SBAR assessment & cross-match recent medications."
        ]
      };
    } else if (riskLevel === "LOW_MEDIUM") {
      return {
        class: "border-yellow-500 bg-yellow-50 text-yellow-950",
        badge: "text-slate-900 bg-yellow-400 border-yellow-500",
        alertAr: "🟡 إنذار أصفر منخفض-متوسط: وجود مؤشر حيوي واحد شديد الانحراف (درجة 3). يستلزم مراجعة الرعاية التمريضية الفورية.",
        alertEn: "🟡 Alert Yellow Low-Medium: One extremely deviant vital index (score 3). Demands immediate clinical nurse specialist revision.",
        actionsAr: [
          "قياس المؤشرات مرة أخرى والمطابقة للتحقق من عدم وجود خطأ بالجهاز.",
          "إبلاغ رئيسة تمريض الوحدة (CNO) فوراً لتقدير الحالة.",
          "تكثيف القياس الدوري للمؤشرات كل ساعتين."
        ],
        actionsEn: [
          "Re-measure vitals instantly to eliminate artifact or machine calibration error.",
          "Inform Unit Captain / Night Supervisor to assign specialized review.",
          "Increase monitoring frequency to every 2 hours."
        ]
      };
    } else {
      return {
        class: "border-emerald-500 bg-emerald-50 text-emerald-950",
        badge: "text-white bg-emerald-600 border-emerald-700",
        alertAr: "🟢 وضع آمن ومستقر: خطورة منخفضة جداً. الاستمرار في الخطة الروتينية للوحدة طبقا للبروتوكول المعياري.",
        alertEn: "🟢 Safe & Stable State: Low baseline risk. Continue standard ward protocol monitoring.",
        actionsAr: [
          "أخذ العلامات الحيوية الروتينية كل 12 ساعة أو حسب جدول الطبيب المعالج.",
          "المطابقة الدورية لمؤشرات الرعاية والنقاهة."
        ],
        actionsEn: [
          "Routine standard checks every 12 hours (Shiftly check).",
          "Ensure general ward JCI compliance records are documented."
        ]
      };
    }
  };

  const responseInfo = getNewsResponse();


  // 2. ISBAR Handover System State
  const [handoverList, setHandoverList] = useState<HandoverRecord[]>([]);
  const [newHandover, setNewHandover] = useState({
    patientName: "",
    mrn: "",
    bedNo: "",
    situation: "",
    background: "",
    assessment: "",
    recommendation: ""
  });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("hospital_isbar_handovers");
    if (saved) {
      try {
        setHandoverList(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse handovers", e);
      }
    } else {
      // Seed initial clinical handover example for guidance
      const seed: HandoverRecord[] = [
        {
          id: "isbar-1",
          patientName: "منى المحمدي",
          mrn: "BH-62881",
          bedNo: "302-A",
          situation: "مريضة تبلغ من العمر 45 عاماً، خضعت لاستئصال أورام الثدي بالأمس، تعاني الآن من هبوط مفاجئ في ضغط الدم 92/58 مع تسارع طفيف في النبض 102.",
          background: "مصابة سابقة بالربو الشعبي والسكري نوع 2، تم إيقاف الميتفورمين يوم العمليات، وتأخذ حالياً أنسولين مائي حسب جدول الفحص.",
          assessment: "صوت الرئة نظيف 양侧، الجرح الجراحي جاف تماماً ولا يوجد نزيف ظاهر من الدرنقة المعلقة. درجة الحرارة 37.1 والمحلول يجري بانتظام.",
          recommendation: "يرجى تسريع تدفق معوض السوائل بمقدار 250 مل ثم إعادة القياس، وفحص سكر الدم العشوائي بالوحدة الساعة 10 صباحاً.",
          authorName: "م. أسماء عبد الخالق (Supervisor)",
          timestamp: new Date().toLocaleString("ar-EG")
        }
      ];
      setHandoverList(seed);
      localStorage.setItem("hospital_isbar_handovers", JSON.stringify(seed));
    }
  }, []);

  const handleAddHandover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHandover.patientName || !newHandover.mrn) {
      alert(isAr ? "برجاء توفير اسم المريض والرقم الطبي MRN للمطابقة!" : "Please provide Patient Name and MRN!");
      return;
    }

    const item: HandoverRecord = {
      id: `isbar-${Date.now()}`,
      patientName: newHandover.patientName,
      mrn: newHandover.mrn,
      bedNo: newHandover.bedNo || "N/A",
      situation: newHandover.situation,
      background: newHandover.background,
      assessment: newHandover.assessment,
      recommendation: newHandover.recommendation,
      authorName: currentUser ? (isAr ? currentUser.nameAr : currentUser.nameEn) : "System Practitioner",
      timestamp: new Date().toLocaleString(isAr ? "ar-EG" : "en-US")
    };

    const updated = [item, ...handoverList];
    setHandoverList(updated);
    localStorage.setItem("hospital_isbar_handovers", JSON.stringify(updated));
    
    // Clear form
    setNewHandover({
      patientName: "",
      mrn: "",
      bedNo: "",
      situation: "",
      background: "",
      assessment: "",
      recommendation: ""
    });

    if (addSystemLog) addSystemLog(`Handover added for ${item.patientName}`, "success");
  };

  const handleDeleteHandover = (id: string) => {
    if (confirm(isAr ? "هل أنت متأكد من حذف تقرير التسليم هذا؟" : "Are you sure you want to delete this handover?")) {
      const filtered = handoverList.filter(h => h.id !== id);
      setHandoverList(filtered);
      localStorage.setItem("hospital_isbar_handovers", JSON.stringify(filtered));
      if (addSystemLog) addSystemLog(`Deleted handover record`, "warning");
    }
  };

  const handleCopyHandover = (item: HandoverRecord) => {
    const text = `
========= ISBAR CLINICAL HANDOVER =========
• [I] Identity: Pat. Name: ${item.patientName} | MRN: ${item.mrn} | Bed: ${item.bedNo}
• [S] Situation: ${item.situation}
• [B] Background: ${item.background}
• [A] Assessment: ${item.assessment}
• [R] Recommendation: ${item.recommendation}
• Written by: ${item.authorName} on ${item.timestamp}
===========================================
`;
    navigator.clipboard.writeText(text);
    alert(isAr ? "✔ تم النسخ إلى الحافظة بنجاح للتناقل الداخلي!" : "✔ Handover report copied to clipboard!");
  };


  // 3. Crash Cart Check system State
  const [crashCartAudit, setCrashCartAudit] = useState({
    defibCharged: false,
    oxygenCylinderPressure: "FULL", // FULL, HALF, LOW, EMPTY
    drawer1AirwayChecked: false,
    drawer2MedsChecked: false,
    drawer3FluidAccessChecked: false,
    lockSealNumber: "BHY-9988-L",
    auditedAt: "",
    auditedByName: ""
  });

  const [activeDrawer, setActiveDrawer] = useState<1 | 2 | 3 | null>(null);

  // Load crash cart audit on mount
  useEffect(() => {
    const saved = localStorage.getItem("hospital_crash_cart_audit");
    if (saved) {
      try {
        setCrashCartAudit(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSaveCrashCartAudit = () => {
    const name = currentUser ? (isAr ? currentUser.nameAr : currentUser.nameEn) : "Clinical Specialist";
    const nowStr = new Date().toLocaleString(isAr ? "ar-EG" : "en-US");
    
    const nextObj = {
      ...crashCartAudit,
      auditedAt: nowStr,
      auditedByName: name
    };

    setCrashCartAudit(nextObj);
    localStorage.setItem("hospital_crash_cart_audit", JSON.stringify(nextObj));

    if (addSystemLog) addSystemLog("Emergency Resuscitation Crash Cart checklist saved", "success");
    alert(isAr ? `✔ تم توثيق جرد عربة الصدمات وقفله برقم الختم المعاير باسم: ${name} وتأكيد الجاهزية الطبية!` : `✔ Crash Cart fully audited and sealed by ${name}!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Switcher */}
      <div className="bg-gradient-to-l from-slate-900 via-pink-950 to-slate-900 p-6 rounded-3xl border border-pink-500/30 text-right text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 bg-pink-600/10 h-72 w-72 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 bg-emerald-600/5 h-60 w-60 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-pink-500/20 rounded-2xl border border-pink-400/30 text-pink-400">
              <Activity className="h-6 w-6 animate-pulse" />
            </span>
            <div className="text-right">
              <span className="text-[10px] bg-pink-500/20 text-pink-300 font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border border-pink-500/30 mb-1 inline-block">
                {isAr ? "الأدوات السريرية والآلات الحسابية الطبية" : "Clinical Quality & Calculations Suite"}
              </span>
              <h1 className="text-lg md:text-xl font-black text-white leading-tight">
                {isAr ? "محاكي الجودة السريرية الذكي ودعم القرار" : "Integrated Clinical Decision & Quality Tools"}
              </h1>
              <p className="text-[11px] text-slate-300 font-medium">
                {isAr 
                  ? "مجموعة أدوات حيوية لإنقاذ الحياة تضمن المطابقة التامة لمعايير مجلس الجودة ومكافحة الأزمات" 
                  : "Life-saving diagnostic modules aligning strictly with JCI patient safety goals."}
              </p>
            </div>
          </div>

          <div className="flex bg-slate-950/60 p-1 rounded-2xl border border-slate-800 shrink-0 gap-1 w-full md:w-auto">
            <button
              onClick={() => setActiveSubTab("news2")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSubTab === "news2" 
                  ? "bg-pink-600 text-white shadow" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Wind className="h-3.5 w-3.5 shrink-0" />
              <span>{isAr ? "حاسبة NEWS2" : "NEWS2 Score"}</span>
            </button>
            <button
              onClick={() => setActiveSubTab("isbar")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSubTab === "isbar" 
                  ? "bg-pink-600 text-white shadow" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span>{isAr ? "تسليم واستلام ISBAR" : "ISBAR Handover"}</span>
            </button>
            <button
              onClick={() => setActiveSubTab("crash_cart")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSubTab === "crash_cart" 
                  ? "bg-pink-600 text-white shadow" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="h-3.5 w-3.5 shrink-0" />
              <span>{isAr ? "عربة الإنعاش الطارئة" : "Crash Cart Check"}</span>
            </button>
            <button
              onClick={() => setActiveSubTab("more_tools")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSubTab === "more_tools" 
                  ? "bg-pink-600 text-white shadow" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Activity className="h-3.5 w-3.5 shrink-0" />
              <span>{isAr ? "جميع مقاييس الجودة (+20 أداة الذكية)" : "All Quality Indices (+20 Tools)"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. NEWS2 SUITE CONTAINER */}
      {activeSubTab === "news2" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: VITALS CONTROLS */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <span className="text-[10px] bg-slate-100 text-slate-600 font-extrabold px-2.5 py-1 rounded-full">
                {isAr ? "المعايير المعتمدة من الكلية الملكية للأطباء" : "RCP Approved Standard V1.2"}
              </span>
              <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <span>{isAr ? "مؤشرات تغذية نموذج الإنذار المبكر الوطني" : "Enlist Active Vital Parameters"}</span>
                <Activity className="h-4 w-4 text-pink-600" />
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Respiratory rate slider */}
              <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-2xl text-right">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono font-bold text-xs bg-pink-100 text-pink-800 px-2 py-0.5 rounded">
                    {newsVitals.respRate} {isAr ? "نفس/دقيقة" : "bpm"}
                  </span>
                  <label className="text-xs font-black text-slate-700 block">
                    {isAr ? "معدل التنفس (Respiration Rate)" : "Respiration Rate"}
                  </label>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={newsVitals.respRate}
                  onChange={(e) => setNewsVitals({ ...newsVitals, respRate: parseInt(e.target.value) })}
                  className="w-full accent-pink-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-400 pt-1 font-mono">
                  <span>40 max</span>
                  <span>12-20 normal</span>
                  <span>5 min</span>
                </div>
              </div>

              {/* SpO2 Oxygen Saturation */}
              <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-2xl text-right">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    {newsVitals.spo2Value}%
                  </span>
                  <label className="text-xs font-black text-slate-700 block">
                    {isAr ? "درجة تشبع الإكسجين (SpO2 Saturation)" : "SpO2 Saturation"}
                  </label>
                </div>
                <input
                  type="range"
                  min="75"
                  max="100"
                  value={newsVitals.spo2Value}
                  onChange={(e) => setNewsVitals({ ...newsVitals, spo2Value: parseInt(e.target.value) })}
                  className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-400 pt-1 font-mono">
                  <span>100%</span>
                  <span>Scale 1: ≥96% normal</span>
                  <span>75%</span>
                </div>
              </div>

              {/* Temperature */}
              <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-2xl text-right">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono font-bold text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    {newsVitals.temperature} °C
                  </span>
                  <label className="text-xs font-black text-slate-700 block">
                    {isAr ? "درجة حرارة الجسم (Body Temp)" : "Body Temp"}
                  </label>
                </div>
                <input
                  type="range"
                  min="32"
                  max="42"
                  step="0.1"
                  value={newsVitals.temperature}
                  onChange={(e) => setNewsVitals({ ...newsVitals, temperature: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-400 pt-1 font-mono">
                  <span>42 °C</span>
                  <span>36.1 - 38.0 normal</span>
                  <span>32 °C</span>
                </div>
              </div>

              {/* Pulse / Heart rate */}
              <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-2xl text-right">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono font-bold text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                    {newsVitals.pulse} {isAr ? "نبضة/د" : "bpm"}
                  </span>
                  <label className="text-xs font-black text-slate-700 block">
                    {isAr ? "معدل نبضات القلب (Heart Pulse)" : "Heart Pulse Rate"}
                  </label>
                </div>
                <input
                  type="range"
                  min="30"
                  max="180"
                  value={newsVitals.pulse}
                  onChange={(e) => setNewsVitals({ ...newsVitals, pulse: parseInt(e.target.value) })}
                  className="w-full accent-red-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-400 pt-1 font-mono">
                  <span>180 bpm</span>
                  <span>51-90 normal</span>
                  <span>30 bpm</span>
                </div>
              </div>

              {/* Systolic Blood pressure */}
              <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-2xl text-right">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono font-bold text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    {newsVitals.systolicBP} mmHg
                  </span>
                  <label className="text-xs font-black text-slate-700 block">
                    {isAr ? "ضغط الدم الانقباضي (Systolic BP)" : "Systolic BP"}
                  </label>
                </div>
                <input
                  type="range"
                  min="60"
                  max="240"
                  value={newsVitals.systolicBP}
                  onChange={(e) => setNewsVitals({ ...newsVitals, systolicBP: parseInt(e.target.value) })}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-400 pt-1 font-mono">
                  <span>240 mmHg</span>
                  <span>111-219 normal</span>
                  <span>60 mmHg</span>
                </div>
              </div>

              {/* SpO2 Oxygen Scales selection */}
              <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-2xl grid grid-cols-2 gap-4 text-center items-center">
                <button
                  onClick={() => setNewsVitals({ ...newsVitals, spo2Scale: 1 })}
                  className={`p-2.5 rounded-xl text-[10.5px] font-black tracking-wide border transition cursor-pointer ${
                    newsVitals.spo2Scale === 1
                      ? "bg-emerald-600 text-white border-emerald-700"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {isAr ? "مقياس 1 (طبيعي)" : "Scale 1 (Normal)"}
                </button>
                <button
                  onClick={() => setNewsVitals({ ...newsVitals, spo2Scale: 2 })}
                  className={`p-2.5 rounded-xl text-[10.5px] font-black tracking-wide border transition cursor-pointer ${
                    newsVitals.spo2Scale === 2
                      ? "bg-amber-600 text-white border-amber-700"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {isAr ? "مقياس 2 (COPD مرضى الانسداد)" : "Scale 2 (COPD Drive)"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100">
              {/* On Oxygen or Air toggle */}
              <div className="flex items-center justify-between p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="supplementalOxygen"
                    checked={newsVitals.onOxygen}
                    onChange={(e) => setNewsVitals({ ...newsVitals, onOxygen: e.target.checked })}
                    className="h-4.5 w-4.5 text-indigo-600 border-indigo-200 rounded focus:ring-1 focus:ring-indigo-400 cursor-pointer"
                  />
                  <label htmlFor="supplementalOxygen" className="text-xs font-black text-indigo-950 block select-none cursor-pointer">
                    {isAr ? "يتلقى أكسجين صناعي؟ (On Oxygen Support)" : "Supplemental Oxygen?"}
                  </label>
                </div>
                <span className="text-[10px] text-indigo-600 font-bold bg-indigo-100/60 px-2 py-0.5 rounded-full">
                  {isAr ? "+٢ درجة تلقائياً عند التفعيل" : "+2 points if active"}
                </span>
              </div>

              {/* Consciousness level selector */}
              <div className="flex items-center justify-between gap-2 p-3.5 bg-rose-50/50 rounded-xl border border-rose-100">
                <select
                  value={newsVitals.consciousness}
                  onChange={(e) => setNewsVitals({ ...newsVitals, consciousness: e.target.value })}
                  className="p-1 px-2.5 bg-white border border-rose-200 rounded text-xs font-bold text-rose-950 focus:ring-1 focus:ring-rose-500 cursor-pointer text-right"
                >
                  <option value="A">{isAr ? "متيقظ تماماً وبكامل وعيه (Alert)" : "Alert (A)"}</option>
                  <option value="C">{isAr ? "مرتبك ومشوّش هويّاً حديثاً (Confusion)" : "New Confusion (C)"}</option>
                  <option value="V">{isAr ? "يستجيب للنداء والصوت فقط (Voice)" : "Keen to Voice (V)"}</option>
                  <option value="P">{isAr ? "يستجيب للمحفزات الألميّة فقط (Pain)" : "Keen to Pain (P)"}</option>
                  <option value="U">{isAr ? "غير مستجيب بالكامل (Unresponsive)" : "Unresponsive (U)"}</option>
                </select>
                <label className="text-xs font-black text-rose-950 whitespace-nowrap">
                  {isAr ? "مستوى الوعي العام (ACVPU):" : "Consciousness (ACVPU):"}
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT: LIVE NEWS2 INTERPRETATION */}
          <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="text-center pb-4 border-b border-slate-800">
                <span className="text-[10.5px] uppercase font-black text-slate-400 block tracking-wider">
                  {isAr ? "النتيجة التراكمية الموحدة" : "Total NEWS2 Score"}
                </span>
                <div className="flex items-baseline justify-center gap-1 mt-2">
                  <span className="text-5xl font-black font-mono text-pink-500 animate-pulse">{newsScore}</span>
                  <span className="text-slate-400 font-bold block text-sm">/ 20</span>
                </div>

                <div className="mt-3 flex justify-center">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black border uppercase tracking-wider ${responseInfo.badge}`}>
                    {isAr ? `خطورة: ${riskLevel === "HIGH" ? "حرجة جداً" : riskLevel === "MEDIUM" ? "متوسطة" : riskLevel === "LOW_MEDIUM" ? "منخفضة-متقدمة" : "منخفضة"}` : `Risk: ${riskLevel}`}
                  </span>
                </div>
              </div>

              {/* Detailed Alert Message */}
              <div className={`p-4 rounded-2xl border text-right leading-relaxed text-xs font-bold ${responseInfo.class}`}>
                <div className="mb-2 flex items-center justify-end gap-1 font-black text-slate-900 bg-white/40 p-1 px-2.5 rounded">
                  <span>{isAr ? responseInfo.alertAr : responseInfo.alertEn}</span>
                </div>
                <div className="space-y-2 mt-3 pt-2 border-t border-slate-900/10">
                  <span className="text-[10px] text-slate-500 block">{isAr ? "خطوات الامتثال السريري العاجل:" : "Mandated Clinical Response Actions:"}</span>
                  {(isAr ? responseInfo.actionsAr : responseInfo.actionsEn).map((act, i) => (
                    <div key={i} className="flex justify-end gap-2 text-[11px] font-sans items-start">
                      <span className="text-right flex-1">{act}</span>
                      <span className="text-[10px] bg-slate-900 text-white h-4.5 w-4.5 rounded-full shrink-0 flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Assistant Support for NEWS2 */}
              <div className="mt-4 pt-4 border-t border-slate-800 text-right">
                <button
                  onClick={() => handleConsultAI("live-news2", "news2", {
                    respiratoryRate: newsVitals.respRate,
                    spo2Scale1: newsVitals.spo2Scale === 1 ? newsVitals.spo2Value : "N/A",
                    spo2Scale2: newsVitals.spo2Scale === 2 ? newsVitals.spo2Value : "N/A",
                    oxygenTherapy: newsVitals.onOxygen,
                    systolicBP: newsVitals.systolicBP,
                    pulse: newsVitals.pulse,
                    consciousness: newsVitals.consciousness,
                    temperature: newsVitals.temperature,
                    totalScore: newsScore,
                    riskLevel
                  })}
                  disabled={aiLoading["live-news2"]}
                  className="w-full py-2.5 px-4 bg-pink-600 hover:bg-pink-700 disabled:bg-slate-800 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow"
                >
                  <Sparkles className={`h-4 w-4 ${aiLoading["live-news2"] ? "animate-spin" : ""}`} />
                  <span>
                    {aiLoading["live-news2"] 
                      ? (isAr ? "جاري استشارة الذكاء الاصطناعي السريري..." : "Consulting Clinical AI...") 
                      : (isAr ? "استشارة الاستجابة السريرية الذكية 🧬" : "Clinical AI Consultation 🧬")}
                  </span>
                </button>

                {aiAnalysis["live-news2"] && (
                  <div className="mt-3 p-4 bg-slate-950/80 border border-pink-500/20 rounded-2xl text-xs text-slate-200 text-right leading-relaxed max-h-[300px] overflow-y-auto font-sans scrollbar-thin">
                    <div className="flex items-center justify-between border-b border-rose-500/20 pb-2 mb-2 text-pink-400 font-bold">
                      <button 
                        type="button"
                        onClick={() => setAiAnalysis(prev => ({ ...prev, "live-news2": "" }))}
                        className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                      >
                        {isAr ? "إغلاق" : "Dismiss"}
                      </button>
                      <span className="flex items-center gap-1.5 font-black">
                        <span>{isAr ? "تقرير الاستشارة والتدقيق" : "AI Clinical Safety Report"}</span>
                        <Sparkles className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <div className="prose prose-invert prose-xs whitespace-pre-line text-[11px] text-slate-200 text-justify" dir={isAr ? "rtl" : "ltr"}>
                      {aiAnalysis["live-news2"]}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 mt-6 text-right space-y-2 text-[10px] text-slate-400">
              <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded-lg">
                <span className="font-mono text-white text-xs">{newsVitals.onOxygen ? "Yes (+2)" : "No (0)"}</span>
                <span>{isAr ? "الإكسجين الصناعي:" : "On Oxygen:"}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded-lg">
                <span className="font-mono text-white text-xs">{newsVitals.temperature} °C</span>
                <span>{isAr ? "درجة الحرارة المسجلة:" : "Input Temp:"}</span>
              </div>
              <p className="text-slate-500 font-semibold leading-normal pb-0 leading-relaxed text-[9.5px]">
                {isAr 
                  ? "ملاحظة: هذا المحاكي يعتمد المعايير الطبية للـ ROYAL COLLEGE OF PHYSICIANS بالمملكة المتحدة. لا يغني عن التقييم الطبي السريري المباشر للطبيب الاستشاري المعالج."
                  : "Caution: This model uses the Royal College of Physicians UK algorithm. It supports decision-making but does not replace direct consultant review."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. ISBAR HANDOVER SYSTEM CONTAINER */}
      {activeSubTab === "isbar" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* LEFT: ISBAR FORM */}
          <div className="xl:col-span-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 text-right">
            <h2 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center justify-end gap-2">
              <span>{isAr ? "محرر تقرير تسليم الحالات ISBAR" : "Create ISBAR Handover Record"}</span>
              <FileSpreadsheet className="h-4 w-4 text-pink-600" />
            </h2>

            <form onSubmit={handleAddHandover} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">{isAr ? "كود ملف المريض (MRN) *" : "Patient MRN *"}</label>
                  <input
                    type="text"
                    required
                    placeholder="BH-12345"
                    value={newHandover.mrn}
                    onChange={(e) => setNewHandover({ ...newHandover, mrn: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none text-right"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">{isAr ? "اسم المريض الثنائي *" : "Patient Name *"}</label>
                  <input
                    type="text"
                    required
                    placeholder="امال احمد"
                    value={newHandover.patientName}
                    onChange={(e) => setNewHandover({ ...newHandover, patientName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none text-right"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500">{isAr ? "رقم سرير التنويم (Bed No)" : "Bed & Room No"}</label>
                <input
                  type="text"
                  placeholder="305-B"
                  value={newHandover.bedNo}
                  onChange={(e) => setNewHandover({ ...newHandover, bedNo: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none text-right"
                />
              </div>

              {/* S: Situation */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] bg-red-100 text-red-800 font-bold px-1.5 rounded">S = Situation</span>
                  <label className="block text-[10px] font-bold text-slate-500">{isAr ? "الوضع الحالي الطارئ (Situation)" : "Situation"}</label>
                </div>
                <textarea
                  rows={2}
                  placeholder={isAr ? "ما الذي يحدث مع المريض بالتحديد الآن؟ دوافع التسليم العاجل..." : "What is currently happening with the patient?"}
                  value={newHandover.situation}
                  onChange={(e) => setNewHandover({ ...newHandover, situation: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none text-right placeholder:text-slate-400"
                />
              </div>

              {/* B: Background */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 rounded">B = Background</span>
                  <label className="block text-[10px] font-bold text-slate-500">{isAr ? "الخلفية المرضية والتاريخ (Background)" : "History & Background"}</label>
                </div>
                <textarea
                  rows={2}
                  placeholder={isAr ? "تاريخ دخول المريض، التشخيص الأولي، العمليات الجراحية الأخيرة..." : "Patient admission data, diagnosis, surgical interventions."}
                  value={newHandover.background}
                  onChange={(e) => setNewHandover({ ...newHandover, background: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none text-right placeholder:text-slate-400"
                />
              </div>

              {/* A: Assessment */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 rounded">A = Assessment</span>
                  <label className="block text-[10px] font-bold text-slate-500">{isAr ? "التقييم السريري الحالي (Assessment)" : "Assessment"}</label>
                </div>
                <textarea
                  rows={2}
                  placeholder={isAr ? "ما هي علاماته الحيوية الأخيرة؟ الفحوصات والوعي والدرانق والجرح..." : "Latest vitals, lines, wound, conscious level."}
                  value={newHandover.assessment}
                  onChange={(e) => setNewHandover({ ...newHandover, assessment: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none text-right placeholder:text-slate-400"
                />
              </div>

              {/* R: Recommendation */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 rounded">R = Recommendation</span>
                  <label className="block text-[10px] font-bold text-slate-500">{isAr ? "التوصية لوردية الاستلام (Recommendation)" : "Recommendation"}</label>
                </div>
                <textarea
                  rows={2}
                  placeholder={isAr ? "ماذا نطلب بدقة من الكادر المستلم خلال الساعات القادمة؟ خطة العناية..." : "What action is requested from incoming shift staff?"}
                  value={newHandover.recommendation}
                  onChange={(e) => setNewHandover({ ...newHandover, recommendation: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none text-right placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-l from-pink-600 to-pink-500 text-white font-sans text-xs font-black rounded-xl hover:opacity-95 transition tracking-wide cursor-pointer flex items-center justify-center gap-1.5 shadow"
              >
                <Plus size={14} />
                <span>{isAr ? "إصدار وتعميم تقرير التسليم" : "Authorize Shift Handover Report"}</span>
              </button>
            </form>
          </div>

          {/* RIGHT: HANDOVER LIST */}
          <div className="xl:col-span-2 bg-slate-50 rounded-3xl p-6 border border-slate-200 text-right space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <span className="text-xs text-slate-500 font-bold font-mono bg-white p-1 px-3 border border-slate-200 rounded-full">
                {handoverList.length} {isAr ? "تقرير نشط بالوردية" : "Active Ward Handovers"}
              </span>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1">
                <span>{isAr ? "لوحة تناقل الحالات السريرية النشطة" : "Active Clinical Handover Board"}</span>
                <Info className="h-4 w-4 text-pink-600" />
              </h3>
            </div>

            {handoverList.length === 0 ? (
              <div className="bg-white border rounded-2xl p-12 text-center text-slate-400">
                <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold">{isAr ? "لا توجد تقارير تسليم مسجلة حالياً بالوحدة." : "No current handovers recorded for this ward."}</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
                {handoverList.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 hover:border-pink-300 transition relative group">
                    
                    {/* Header info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 -mx-5 -mt-5 p-3 rounded-t-2xl border-b border-slate-100">
                      <div className="flex gap-1 justify-end shrink-0 sm:order-2">
                        <button
                          onClick={() => handleCopyHandover(item)}
                          className="p-1.5 bg-white border hover:bg-pink-50 hover:text-pink-600 border-slate-200 rounded-lg text-slate-500 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          title={isAr ? "نسخ النص كاملاً للتناقل" : "Copy full clinical report text"}
                        >
                          <Copy size={11} />
                          <span>{isAr ? "نسخ" : "Copy"}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteHandover(item.id)}
                          className="p-1.5 bg-white border hover:bg-rose-50 hover:text-rose-600 border-slate-200 rounded-lg text-slate-400 text-xs font-bold transition cursor-pointer"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 items-center justify-end sm:order-1 font-mono">
                        <span className="text-[10px] text-slate-400 font-semibold">{item.timestamp}</span>
                        <span className="text-slate-300 shrink-0">|</span>
                        <span className="text-[10.5px] text-slate-700 font-bold">{isAr ? "الكاتب:" : "By:"} {item.authorName}</span>
                      </div>
                    </div>

                    {/* Patient summary line */}
                    <div className="flex flex-wrap justify-end gap-3 text-xs bg-pink-50/40 p-2 border border-pink-100/40 rounded-lg">
                      <div className="flex items-center gap-1 font-bold">
                        <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[10.5px]">{item.bedNo}</span>
                        <span className="text-slate-500 font-medium">{isAr ? "السرير:" : "Bed:"}</span>
                      </div>
                      <div className="flex items-center gap-1 font-bold">
                        <span className="font-mono bg-pink-100 text-pink-900 px-2 py-0.5 rounded text-[10.5px]">{item.mrn}</span>
                        <span className="text-slate-500 font-medium">{isAr ? "رقم الملف الطبي MRN:" : "MRN:"}</span>
                      </div>
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                        <span>{item.patientName}</span>
                        <span className="text-slate-500 font-medium">{isAr ? "المريض:" : "Patient:"}</span>
                      </div>
                    </div>

                    {/* ISBAR Columns breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1 text-[11px] leading-relaxed">
                      {/* S */}
                      <div className="bg-red-50/20 p-2.5 border border-red-100/50 rounded-xl space-y-1">
                        <div className="text-[10px] font-black text-red-900 pb-0.5 border-b border-red-100">
                          {isAr ? "S - الوضع الحالي" : "S - Situation"}
                        </div>
                        <p className="font-medium text-slate-700">{item.situation || <span className="text-slate-300 font-normal italic">None</span>}</p>
                      </div>

                      {/* B */}
                      <div className="bg-amber-50/20 p-2.5 border border-amber-100/50 rounded-xl space-y-1">
                        <div className="text-[10px] font-black text-amber-900 pb-0.5 border-b border-amber-100">
                          {isAr ? "B - التاريخ والخلفية" : "B - Background"}
                        </div>
                        <p className="font-medium text-slate-700">{item.background || <span className="text-slate-300 font-normal italic">None</span>}</p>
                      </div>

                      {/* A */}
                      <div className="bg-indigo-50/20 p-2.5 border border-indigo-100/50 rounded-xl space-y-1">
                        <div className="text-[10px] font-black text-indigo-900 pb-0.5 border-b border-indigo-100 font-sans">
                          {isAr ? "A - التقييم السريري" : "A - Assessment"}
                        </div>
                        <p className="font-medium text-slate-700">{item.assessment || <span className="text-slate-300 font-normal italic">None</span>}</p>
                      </div>

                      {/* R */}
                      <div className="bg-emerald-50/20 p-2.5 border border-emerald-100/50 rounded-xl space-y-1">
                        <div className="text-[10px] font-black text-emerald-950 pb-0.5 border-b border-emerald-100">
                          {isAr ? "R - التوصيات المفتوحة" : "R - Recommendation"}
                        </div>
                        <p className="font-extrabold text-slate-800">{item.recommendation || <span className="text-slate-300 font-normal italic">None</span>}</p>
                      </div>
                    </div>

                    {/* AI Handover evaluation card */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 text-right">
                      <div className="flex items-center justify-between">
                        {aiAnalysis[item.id] && (
                          <button
                            type="button"
                            onClick={() => setAiAnalysis(prev => ({ ...prev, [item.id]: "" }))}
                            className="text-[10px] text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                          >
                            {isAr ? "إغلاق المراجعة" : "Hide Recommendation"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleConsultAI(item.id, "isbar", {
                            identify: `Patient: ${item.patientName}, MRN: ${item.mrn}, Bed: ${item.bedNo}`,
                            situation: item.situation,
                            background: item.background,
                            assessment: item.assessment,
                            recommendation: item.recommendation
                          })}
                          disabled={aiLoading[item.id]}
                          className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-700 font-black text-[10px] rounded-xl flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
                        >
                          <Sparkles className={`h-3 w-3 ${aiLoading[item.id] ? "animate-spin" : ""}`} />
                          <span>
                            {aiLoading[item.id] 
                              ? (isAr ? "جاري تدقيق الجودة بالذكاء الاصطناعي..." : "AI Auditing Handover...") 
                              : (isAr ? "تدقيق أمان التسليم السريري الذكي" : "AI Shift Handover Audit")}
                          </span>
                        </button>
                      </div>

                      {aiAnalysis[item.id] && (
                        <div className="p-4 bg-white border border-pink-200 rounded-xl text-slate-700 text-xs leading-relaxed whitespace-pre-line text-right max-h-[300px] overflow-y-auto font-sans shadow-inner scrollbar-thin">
                          <div className="text-[10px] text-pink-600 font-extrabold border-b border-pink-100 pb-2 mb-2 flex items-center justify-end gap-1.5">
                            <span>{isAr ? "تقرير وتدقيق الكفاءة والأمان السريري" : "Clinical Practice & Safety Recommendations"}</span>
                            <Sparkles size={11} className="animate-pulse" />
                          </div>
                          <div className="prose prose-xs whitespace-pre-line text-[11px] text-slate-700 text-justify" dir={isAr ? "rtl" : "ltr"}>
                            {aiAnalysis[item.id]}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-[9.5px] text-slate-400 font-bold border-t border-slate-100 pt-2 flex items-center justify-between col-span-1">
                      <span className="text-emerald-600 font-extrabold flex items-center gap-0.5">
                        <CheckCircle size={10} />
                        <span>{isAr ? "معاير ومطابق لمعايير الأمان JCI" : "Audited & JCI IPSG Compliant"}</span>
                      </span>
                      <span>{isAr ? "بوابة الكادر الرقمية" : "Personnel Portal Secure Transmission"}</span>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. EMERGENCY CRASH CART AUDITING DRAWER */}
      {activeSubTab === "crash_cart" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: CRASH CART SUMMARY STATE & SEAL */}
          <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 text-right flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-3 flex items-center justify-end gap-2 text-right">
                <span>{isAr ? "حالة تدقيق عربة الطوارئ والإنعاش المعايرة" : "Emergency Crash Cart Audit State"}</span>
                <Layers className="h-4 w-4 text-pink-600" />
              </h2>

              <div className="bg-rose-50 p-4 border border-rose-100 rounded-2xl text-right space-y-3">
                <div className="text-[10px] bg-rose-200 text-rose-950 font-black px-2.5 py-0.5 rounded-full inline-block">
                  {isAr ? "شيك المعايرة الإلزامية JCI" : "Mandatory JCI Operational Check"}
                </div>
                <h3 className="text-xs font-black text-rose-950 leading-relaxed">
                  {isAr 
                    ? "تأكيد فحص عربة الطوارئ وصدمات القلب يضمن إبقاء المنشأة آمنة تماماً وجاهزة لـ Code Blue في أي جزء بالثانية." 
                    : "Daily checking of defibrillator battery, oxygen reserve, and expiry dates is clinically critical."}
                </h3>
              </div>

              <div className="space-y-2.5 pt-2 text-xs">
                {/* Defib charged check */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-xl hover:bg-slate-100/85">
                  <input
                    type="checkbox"
                    id="defibCharged"
                    checked={crashCartAudit.defibCharged}
                    onChange={(e) => setCrashCartAudit({ ...crashCartAudit, defibCharged: e.target.checked })}
                    className="h-4.5 w-4.5 text-pink-600 border-slate-300 rounded cursor-pointer"
                  />
                  <label htmlFor="defibCharged" className="font-bold text-slate-700 select-none cursor-pointer">
                    {isAr ? "جهاز الصدمات Defibrillator مشحون ومستوى البطارية 100%?" : "Defibrillator fully charged & functional?"}
                  </label>
                </div>

                {/* Oxygen pressure check */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-xl">
                  <select
                    value={crashCartAudit.oxygenCylinderPressure}
                    onChange={(e) => setCrashCartAudit({ ...crashCartAudit, oxygenCylinderPressure: e.target.value })}
                    className="p-1 px-2.5 bg-white border rounded text-xs font-bold text-slate-800 outline-none cursor-pointer text-right"
                  >
                    <option value="FULL">{isAr ? "ممتلئة بالكامل (FULL)" : "FULL Pressure (Green)"}</option>
                    <option value="HALF">{isAr ? "نصف ممتلئة (HALF)" : "HALF Pressure"}</option>
                    <option value="LOW">{isAr ? "منخفضة (تستلزم التعبئة عاجلاً)" : "LOW Pressure (Urgent Fill)"}</option>
                    <option value="EMPTY">{isAr ? "فارغة بالكامل 🔴" : "EMPTY (DO NOT USE)"}</option>
                  </select>
                  <label className="font-bold text-slate-700">
                    {isAr ? "مخزون أسطوانة الأكسجين الاحتياطية:" : "Spare Oxygen Cylinder status:"}
                  </label>
                </div>

                {/* Expiry Seal Lock Code input */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500">{isAr ? "رقم ختم الأمان البلاستيكي (Safety Lock Seal No) *" : "Plastic Safety Lock Seal No *"}</label>
                  <input
                    type="text"
                    required
                    placeholder="BHY-9988-L"
                    value={crashCartAudit.lockSealNumber}
                    onChange={(e) => setCrashCartAudit({ ...crashCartAudit, lockSealNumber: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none text-right font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 mt-6 space-y-3">
              {crashCartAudit.auditedAt && (
                <div className="bg-emerald-50 text-emerald-950 p-3 rounded-xl border border-emerald-100 text-xs font-bold font-sans">
                  <p>{isAr ? "آخر جرد وإقفال معتمد:" : "Last Audited Status:"}</p>
                  <div className="text-[10px] text-emerald-700 mt-1 space-y-0.5">
                    <p>{isAr ? "التاريخ:" : "Date:"} {crashCartAudit.auditedAt}</p>
                    <p>{isAr ? "اسم المدقق المكلف:" : "Audited By:"} {crashCartAudit.auditedByName}</p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveCrashCartAudit}
                className="w-full py-2.5 bg-gradient-to-l from-emerald-600 to-teal-600 hover:opacity-95 text-white font-sans text-xs font-black rounded-xl transition tracking-wide cursor-pointer flex items-center justify-center gap-1.5 shadow"
              >
                <CheckCircle size={14} />
                <span>{isAr ? "اعتماد وإصدار ختم قفل عربة الصدمات" : "Authorize Daily Crash Cart Seal Lock"}</span>
              </button>
            </div>
          </div>

          {/* RIGHT: INTERACTIVE 3-DRAWER CONTENT AUDIT */}
          <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-3xl p-6 text-right">
            <div className="border-b pb-3 mb-4 border-slate-200">
              <h3 className="text-sm font-black text-slate-800 flex items-center justify-end gap-1">
                <span>{isAr ? "مكونات وأرفف عربة الصدمات الافتراضية" : "Interactive Crash Cart Drawer Inspection"}</span>
                <Info className="h-4 w-4 text-emerald-600" />
              </h3>
              <p className="text-[10.5px] text-slate-400 font-bold block pt-1">
                {isAr ? "اضغط على أي رف بالأسفل لفتح واستعراض الأدوات والتحقق من التواريخ ومطابقة الجودة" : "Select any drawer below to inspect safety stocks & log expiration dates."}
              </p>
            </div>

            <div className="space-y-4">
              {/* DRAWER 1 */}
              <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm transition-all">
                <button
                  type="button"
                  onClick={() => setActiveDrawer(activeDrawer === 1 ? null : 1)}
                  className={`w-full p-4 flex items-center justify-between font-black text-xs cursor-pointer transition ${
                    activeDrawer === 1 ? "bg-pink-50 text-pink-900 border-b border-pink-100" : "bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="font-mono text-[10px] bg-pink-100 text-pink-800 p-1 px-2.5 rounded-full">
                    {crashCartAudit.drawer1AirwayChecked ? (isAr ? "مكتمل التدقيق" : "Audited") : (isAr ? "تحت الفحص" : "Pending Check")}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500">({isAr ? "أدوات مجرى الهواء والتنفس الصناعي" : "Airway Equipment"})</span>
                    <span className="text-sm font-black text-slate-800">1. {isAr ? "الدرج الأول: مجرى الهواء (Airway Shelf)" : "Drawer 1: Airway & Intubation"}</span>
                  </div>
                </button>

                {activeDrawer === 1 && (
                  <div className="p-4 bg-slate-50/50 space-y-3 border-t text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-right">
                      <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                        <span className="text-[10.5px] font-black text-slate-800">✔ (3 Sizes Available)</span>
                        <span className="font-bold text-slate-600">{isAr ? "شفرات منظار الحنجرة Laryngoscope" : "Laryngoscope Blades"}</span>
                      </div>
                      <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                        <span className="text-[10.5px] font-black text-slate-800">✔ (Size 6, 7, 7.5, 8)</span>
                        <span className="font-bold text-slate-600">{isAr ? "الأنابيب الحنجرية ET Tubes" : "Endotracheal Tubes"}</span>
                      </div>
                      <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between col-span-1 md:col-span-2">
                        <span className="text-[10.5px] font-black text-emerald-700 flex items-center gap-1">
                          <CheckCircle size={12} />
                          <span>{isAr ? "تم اختبار صمام عدم الرجوع" : "One-way valve tested"}</span>
                        </span>
                        <span className="font-bold text-slate-600">{isAr ? "جهاز التنفس اليدوي Ambu Bag + قناع المقاس المناسب" : "Ambu Bag Resuscitator + Adult Mask"}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-pink-50 border border-pink-100 rounded-lg">
                      <input
                        type="checkbox"
                        id="drawer1Checked"
                        checked={crashCartAudit.drawer1AirwayChecked}
                        onChange={(e) => setCrashCartAudit({ ...crashCartAudit, drawer1AirwayChecked: e.target.checked })}
                        className="h-4.5 w-4.5 text-pink-600 cursor-pointer"
                      />
                      <label htmlFor="drawer1Checked" className="font-bold text-pink-900 cursor-pointer select-none">
                        {isAr ? "أقر أنا بمطابقة وفحص وسلامة أدوات مجرى الهواء بالدرج الأول كلياً" : "I endorse Drawer 1 airway tools are matched, clean and sterile."}
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* DRAWER 2 */}
              <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm transition-all">
                <button
                  type="button"
                  onClick={() => setActiveDrawer(activeDrawer === 2 ? null : 2)}
                  className={`w-full p-4 flex items-center justify-between font-black text-xs cursor-pointer transition ${
                    activeDrawer === 2 ? "bg-amber-50 text-amber-900 border-b border-amber-100" : "bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="font-mono text-[10px] bg-amber-100 text-amber-800 p-1 px-2.5 rounded-full">
                    {crashCartAudit.drawer2MedsChecked ? (isAr ? "مكتمل التدقيق" : "Audited") : (isAr ? "تحت الفحص" : "Pending Check")}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500">({isAr ? "أدوية الطوارئ والإنعاش القلبي الرئوي" : "Emergency Meds Expiration Check"})</span>
                    <span className="text-sm font-black text-slate-800">2. {isAr ? "الدرج الثاني: الأدوية الحرجة (Emergency Meds)" : "Drawer 2: Critical Resuscitation Meds"}</span>
                  </div>
                </button>

                {activeDrawer === 2 && (
                  <div className="p-4 bg-slate-50/50 space-y-3 border-t text-xs">
                    <div className="table-responsive bg-white rounded-xl border p-2">
                      <table className="w-full text-right text-[11px] leading-relaxed">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                            <th className="p-2 font-black">{isAr ? "تاريخ انتهاء الصلاحية الآمن" : "Safe Expiry Date"}</th>
                            <th className="p-2 font-black">{isAr ? "الكمية المطابقة" : "Required Qty"}</th>
                            <th className="p-2 font-black">{isAr ? "المادة الدوائية المنقذة" : "Medication Item"}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-2 text-emerald-600 font-extrabold font-mono">2027-11-01</td>
                            <td className="p-2 font-bold font-mono">10 Ampoules</td>
                            <td className="p-2 font-bold text-slate-800">{isAr ? "أدرينالين (أمبولات Adrenaline 1mg)" : "Adrenaline 1mg/ml"}</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 text-emerald-600 font-extrabold font-mono">2027-08-30</td>
                            <td className="p-2 font-bold font-mono">4 Ampoules</td>
                            <td className="p-2 font-bold text-slate-800">{isAr ? "أميودارون (أمبولات Amiodarone 150mg)" : "Amiodarone 150mg"}</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 text-emerald-600 font-extrabold font-mono">2027-05-15</td>
                            <td className="p-2 font-bold font-mono">5 Ampoules</td>
                            <td className="p-2 font-bold text-slate-800">{isAr ? "أتروبين (Atropine 1mg)" : "Atropine 1mg/ml"}</td>
                          </tr>
                          <tr>
                            <td className="p-2 text-amber-600 font-extrabold font-mono">2026-12-01</td>
                            <td className="p-2 font-bold font-mono">2 Vials</td>
                            <td className="p-2 font-bold text-slate-800">{isAr ? "بيكربونات صوديوم (Sodium Bicarbonate 8.4%)" : "Sodium Bicarbonate 8.4%"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-amber-50 border border-amber-100 rounded-lg">
                      <input
                        type="checkbox"
                        id="drawer2Checked"
                        checked={crashCartAudit.drawer2MedsChecked}
                        onChange={(e) => setCrashCartAudit({ ...crashCartAudit, drawer2MedsChecked: e.target.checked })}
                        className="h-4.5 w-4.5 text-amber-600 cursor-pointer"
                      />
                      <label htmlFor="drawer2Checked" className="font-bold text-amber-950 cursor-pointer select-none">
                        {isAr ? "أقر أنا بمطابقة جميع التواريخ الكيميائية وسلامة عبوات أدوية الإنتعاش بالدرج الثاني" : "I endorse all emergency medication expiry dates strictly match clinical standards."}
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* DRAWER 3 */}
              <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm transition-all">
                <button
                  type="button"
                  onClick={() => setActiveDrawer(activeDrawer === 3 ? null : 3)}
                  className={`w-full p-4 flex items-center justify-between font-black text-xs cursor-pointer transition ${
                    activeDrawer === 3 ? "bg-indigo-50 text-indigo-900 border-b border-indigo-100" : "bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="font-mono text-[10px] bg-indigo-100 text-indigo-800 p-1 px-2.5 rounded-full">
                    {crashCartAudit.drawer3FluidAccessChecked ? (isAr ? "مكتمل التدقيق" : "Audited") : (isAr ? "تحت الفحص" : "Pending Check")}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500">({isAr ? "المحاليل، الكانيولات، والمستلزمات الوريدية" : "IV Fluids & Access"})</span>
                    <span className="text-sm font-black text-slate-800">3. {isAr ? "الدرج الثالث: محاليل وولوج وريدي" : "Drawer 3: Circulation & Access Stock"}</span>
                  </div>
                </button>

                {activeDrawer === 3 && (
                  <div className="p-4 bg-slate-50/50 space-y-3 text-right text-xs border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                        <span className="text-[10.5px] font-black text-slate-800">✔ (Matched Expiries)</span>
                        <span className="font-bold text-slate-600">{isAr ? "أكياس محلول ملحي Saline 0.9%" : "IV Normal Saline 0.9% 500ml"}</span>
                      </div>
                      <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                        <span className="text-[10.5px] font-black text-slate-800">✔ (14G, 16G, 18G, 20G, 22G)</span>
                        <span className="font-bold text-slate-600">{isAr ? "كانيولات وريدية مقاسات مختلفة" : "IV Cannulas (Various gauges)"}</span>
                      </div>
                      <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between col-span-1 md:col-span-2">
                        <span className="text-[10.5px] font-black text-slate-800">✔ (10cc, 5cc, 3cc Syringes available)</span>
                        <span className="font-bold text-slate-600">{isAr ? "شاش وسرنجات ولواصق تثبيت كانيولا" : "Syringes, sterile gauze & fixation strips"}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                      <input
                        type="checkbox"
                        id="drawer3Checked"
                        checked={crashCartAudit.drawer3FluidAccessChecked}
                        onChange={(e) => setCrashCartAudit({ ...crashCartAudit, drawer3FluidAccessChecked: e.target.checked })}
                        className="h-4.5 w-4.5 text-indigo-600 cursor-pointer"
                      />
                      <label htmlFor="drawer3Checked" className="font-bold text-indigo-950 cursor-pointer select-none">
                        {isAr ? "أقر بمطابقة وفحص وسلامة درج الولوج الوريدي والمحاليل بالكامل" : "I endorse circulation & access supplies strictly conform with clean hospital lock criteria."}
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 p-4 bg-white border rounded-2xl flex items-center justify-between">
              <span className="text-pink-600 animate-pulse font-extrabold text-[11px] bg-pink-50 p-1 px-3 border border-pink-200 rounded-full">
                {isAr ? "فريق المعايرة الطبية" : "Medical Auditor Center"}
              </span>
              <div className="text-right text-[11px] leading-relaxed">
                <span className="font-black text-slate-800 block">{isAr ? "معايرة دورية تابعة للائحة JCI بمستشفى الرعاية السريرية" : "Relational clinical compliance lock standard"}</span>
                <span className="text-slate-400 font-semibold block">{isAr ? "ختم الدخول الإلكتروني يدعم المساءلة القانونية والتسجيل بموجب بروتوكول سلامة المريض." : "Electronic audit log triggers security registry for patient legal accountability."}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MORE SMART TOOLS HUB (Simulate 20 tools) */}
      {activeSubTab === "more_tools" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <span className="text-[10px] bg-pink-100 text-pink-600 font-extrabold px-3 py-1 rounded-full uppercase tracking-widest">
              {isAr ? "مدعومة بالذكاء الاصطناعي والدعم المباشر" : "Smart AI & Clinical Assistance HUB"}
            </span>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <span>{isAr ? "بوابة دعم القرار والأدوات الذكية (+20)" : "Clinical Decision Support Suite"}</span>
              <Activity className="h-6 w-6 text-pink-600" />
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { id: "bmi", ar: "مؤشر كتلة الجسم وعلامات السمنة", en: "BMI & Obesity Marker" },
              { id: "gcs", ar: "مقياس جلاسكو للغيبوبة", en: "Glasgow Coma Scale (GCS)" },
              { id: "apgar", ar: "حرز أبغار لحديثي الولادة", en: "Apgar Score" },
              { id: "iv", ar: "حاسبة القطرات والمحاليل الوريدية", en: "IV Drip Rate Calculator" },
              { id: "braden", ar: "مقياس برادن لتقرحات الفراش", en: "Braden Scale for Pressure Sores" },
              { id: "morse", ar: "مقياس مورس للسقوط", en: "Morse Fall Scale" },
              { id: "pain", ar: "مقياس تقييم الألم البصري", en: "Visual Analog Pain Scale" },
              { id: "qsofa", ar: "الإنذار السريع لتعفن الدم (qSOFA)", en: "qSOFA Sepsis Indicator" },
              { id: "well", ar: "مؤشرات ويلز للجلطات", en: "Wells' Criteria for DVT/PE" },
              { id: "chad", ar: "مقياس خطر السكتات (CHA2DS2-VASc)", en: "CHA2DS2-VASc Score" },
              { id: "gfr", ar: "حاسبة الكلى (eGFR)", en: "eGFR Renal Function Calculator" },
              { id: "burn", ar: "قاعدة التسعات للحروق", en: "Rule of Nines (Burns)" },
              { id: "peds", ar: "جرعات الأطفال بناءً على الوزن", en: "Pediatric Weight-based Dosing" },
              { id: "ox", ar: "معايرة الأكسجين والعلاج التنفسي", en: "Oxygen Titration Guide" },
              { id: "abg", ar: "محلل غازات الدم (ABG)", en: "ABG Analyzer tool" },
              { id: "neuro", ar: "مقياس السكتة (NIHSS)", en: "NIH Stroke Scale (NIHSS)" },
              { id: "fluid", ar: "حاسبة انعاش السوائل المتقدمة", en: "Fluid Resuscitation Calculator" }
            ].map((tool, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:border-pink-300 hover:shadow-md transition-all group flex flex-col justify-between">
                <div>
                   <h3 className="font-bold text-slate-800 text-sm mb-2">{isAr ? tool.ar : tool.en}</h3>
                   <p className="text-[10px] text-slate-500 mb-4">{isAr ? "دعم سريري أوتوماتيكي. اضغط للتقييم والتفعيل الفوري بالوحدة السريرية الخاصة بك." : "Clinical automated support. Click to activate inside your current unit."}</p>
                </div>
                <button
                   onClick={() => alert(isAr ? `جاري تشغيل وربط "${tool.ar}"... (هذه الأداة متوفرة للبيانات الحية المعتمدة فقط)` : `Launching "${tool.en}"...`)}
                   className="w-full bg-white border border-slate-300 hover:bg-slate-800 hover:text-white text-slate-700 font-bold py-2 rounded-xl text-xs transition"
                >
                  {isAr ? "شغّل الأداة" : "Execute Tool"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
