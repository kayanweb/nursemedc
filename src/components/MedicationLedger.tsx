import React, { useState, useEffect } from "react";
import { 
  Search, Save, AlertTriangle, AlertCircle, Loader2, 
  Layers, Shuffle, Activity, ClipboardCheck, ArrowLeftRight, 
  Trash2, Plus, CheckCircle, Printer, Sparkles, BookOpen, UserCheck, ShieldAlert 
} from "lucide-react";
import { db } from "../lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, query, orderBy } from "firebase/firestore";

interface MedicationLedgerProps {
  language: "ar" | "en";
}

export default function MedicationLedger({ language }: MedicationLedgerProps) {
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState<"analyze" | "interaction" | "calculator" | "idc" | "iv_compatibility" | "counseling">("analyze");

  // IV Compatibility States
  const [drug1Iv, setDrug1Iv] = useState("");
  const [drug2Iv, setDrug2Iv] = useState("");
  const [fluidIv, setFluidIv] = useState("");
  const [loadingIv, setLoadingIv] = useState(false);
  const [ivResult, setIvResult] = useState<any>(null);
  const [errorIv, setErrorIv] = useState<string | null>(null);

  // Counseling States
  const [counselInput, setCounselInput] = useState("");
  const [loadingCounsel, setLoadingCounsel] = useState(false);
  const [counselStatus, setCounselStatus] = useState<any>(null);
  const [errorCounsel, setErrorCounsel] = useState<string | null>(null);
  
  // Tab 1: Analyzer States
  const [queryInput, setQueryInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [medication, setMedication] = useState<any>(null);  
  const [error, setError] = useState<string | null>(null);
  const [approvedList, setApprovedList] = useState<any[]>([]);
  const [savingApproved, setSavingApproved] = useState(false);

  // Tab 2: Interaction States
  const [med1, setMed1] = useState("");
  const [med2, setMed2] = useState("");
  const [loadingInt, setLoadingInt] = useState(false);
  const [interactionResult, setInteractionResult] = useState<any>(null);
  const [errorInt, setErrorInt] = useState<string | null>(null);

  // Tab 3: Infusion Prep States
  const [selectedInfusion, setSelectedInfusion] = useState("insulin");
  const [orderedDoseUnit, setOrderedDoseUnit] = useState("units_hr"); // units_hr, mcg_min, mcg_kg_min
  const [orderedDoseVal, setOrderedDoseVal] = useState("5"); // e.g. 5 units/hr or 10 mcg/min
  const [patientWeight, setPatientWeight] = useState("70");
  const [bagDrugGrams, setBagDrugGrams] = useState("50"); // units or mg
  const [bagVolumeMl, setBagVolumeMl] = useState("50"); // mL
  const [calcResult, setCalcResult] = useState<any>(null);

  // Tab 4: IDC Double Verification Form States
  const [idcPatientName, setIdcPatientName] = useState("");
  const [idcMRN, setIdcMRN] = useState("");
  const [idcMedName, setIdcMedName] = useState("Regular Insulin (وردي)");
  const [idcDose, setIdcDose] = useState("");
  const [idcRate, setIdcRate] = useState("");
  const [idcPrimaryNurse, setIdcPrimaryNurse] = useState("");
  const [idcCoNurse, setIdcCoNurse] = useState("");
  const [fiveRightsChecked, setFiveRightsChecked] = useState(false);
  const [savingIdc, setSavingIdc] = useState(false);
  const [idcLogs, setIdcLogs] = useState<any[]>([]);

  // List of pre-filled clinical values for High Alert infusions
  const INFUSION_PRESETS: Record<string, any> = {
    insulin: {
      nameAr: "إنسولين عادي سريع المفعول (Regular Insulin)",
      nameEn: "Regular Human Insulin",
      prepAr: "قم بوضع 50 وحدة إنسولين في 50 مل محلول ملحي 0.9% (التركيز: 1 وحدة/مل)",
      prepEn: "Mix 50 Units of Regular Insulin in 50 mL NaCl 0.9% (Concentration: 1 Unit / 1 mL)",
      typicalDoseUnit: "units_hr",
      defaultDose: "5",
      defaultAmount: "50",
      defaultVolume: "50"
    },
    heparin: {
      nameAr: "هيبارين مانع التجلط (Heparin Lock Infusion)",
      nameEn: "Unfractionated Heparin Infusion",
      prepAr: "قم بخلط 25,000 وحدة هيبارين في 250 مل جلوكوز 5% أو محلول ملحي (التركيز: 100 وحدة/مل)",
      prepEn: "Mix 25,000 Units of Heparin in 250 mL D5W or NaCl 0.9% (Concentration: 100 Units / mL)",
      typicalDoseUnit: "units_hr",
      defaultDose: "1000",
      defaultAmount: "25000",
      defaultVolume: "250"
    },
    dopamine: {
      nameAr: "دوبامين منشط القلب والضغط (Dopamine)",
      nameEn: "Dopamine cardiac support",
      prepAr: "قم بخلط 400 ملجم دوبامين في 250 مل جلوكوز 5% (التركيز: 1600 ميكروجرام/مل)",
      prepEn: "Mix 400 mg of Dopamine in 250 mL D5W (Concentration: 1,600 mcg / mL)",
      typicalDoseUnit: "mcg_kg_min",
      defaultDose: "5",
      defaultAmount: "400",
      defaultVolume: "250"
    },
    amiodarone: {
      nameAr: "أميودارون لمنع اضطراب النظم (Amiodarone)",
      nameEn: "Amiodarone Antiarrhythmic",
      prepAr: "قم بخلط 450 ملجم أميودارون (3 أمبولات) في 250 مل جلوكوز 5% (التركيز: 1.8 ملجم/مل)",
      prepEn: "Mix 450 mg (3 ampoules) of Amiodarone in 250 mL D5W (Concentration: 1.8 mg / mL)",
      typicalDoseUnit: "mcg_min",
      defaultDose: "1000",
      defaultAmount: "450",
      defaultVolume: "250"
    },
    norepinephrine: {
      nameAr: "نورأدرينالين لرفع الضغط الشديد (Norepinephrine)",
      nameEn: "Norepinephrine Vasopressor",
      prepAr: "قم بخلط 4 ملجم نورأدرينالين في 50 مل جلوكوز 5% (التركيز: 80 ميكروجرام/مل)",
      prepEn: "Mix 4 mg of Norepinephrine in 50 mL D5W (Concentration: 80 mcg / mL)",
      typicalDoseUnit: "mcg_min",
      defaultDose: "8",
      defaultAmount: "4",
      defaultVolume: "50"
    }
  };

  // Safe fetch approved medicines and IDC logs from real Firestore
  useEffect(() => {
    const qApproved = query(collection(db, "baheya_approved_medications"));
    const unsubApproved = onSnapshot(qApproved, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setApprovedList(list);
    }, (err) => {
      console.warn("Real-time approved drugs list offline fallback triggered:", err);
    });

    const qIdc = query(collection(db, "baheya_idc_logs"));
    const unsubIdc = onSnapshot(qIdc, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Sort client-side by timestamp descending
      list.sort((a,b) => b.timestamp - a.timestamp);
      setIdcLogs(list);
    }, (err) => {
      console.warn("Real-time IDC logs list offline fallback triggered:", err);
    });

    return () => {
      unsubApproved();
      unsubIdc();
    };
  }, []);

  // Update calculator inputs when selected preset changes
  useEffect(() => {
    const preset = INFUSION_PRESETS[selectedInfusion];
    if (preset) {
      setOrderedDoseUnit(preset.typicalDoseUnit);
      setOrderedDoseVal(preset.defaultDose);
      setBagDrugGrams(preset.defaultAmount);
      setBagVolumeMl(preset.defaultVolume);
    }
  }, [selectedInfusion]);

  // Recalculate Infusion Rate dynamically
  useEffect(() => {
    calculateInfusionRate();
  }, [selectedInfusion, orderedDoseUnit, orderedDoseVal, patientWeight, bagDrugGrams, bagVolumeMl]);

  const calculateInfusionRate = () => {
    const doseVal = parseFloat(orderedDoseVal) || 0;
    const weight = parseFloat(patientWeight) || 70;
    const drugAmt = parseFloat(bagDrugGrams) || 1; // mg or units
    const volMl = parseFloat(bagVolumeMl) || 1;

    if (doseVal <= 0 || drugAmt <= 0 || volMl <= 0) {
      setCalcResult(null);
      return;
    }

    let infusionRateMlHr = 0;
    let concentrationText = "";

    if (selectedInfusion === "insulin") {
      // 50 Units in 50 mL -> Concentration: 1 Unit / mL
      // orderedDoseVal is Units/hr
      const concentration = drugAmt / volMl; // Units/mL
      infusionRateMlHr = doseVal / concentration;
      concentrationText = `${concentration.toFixed(2)} Unit / mL`;
    } 
    else if (selectedInfusion === "heparin") {
      // 25000 Units in 250 mL -> Concentration: 100 Units / mL
      // orderedDoseVal is Units/hr
      const concentration = drugAmt / volMl; // Units/mL
      infusionRateMlHr = doseVal / concentration;
      concentrationText = `${concentration.toFixed(0)} Unit / mL`;
    }
    else if (selectedInfusion === "dopamine") {
      // 400 mg in 250 mL -> Concentration: 1.6 mg / mL = 1600 mcg / mL
      // orderedDoseVal is mcg/kg/min
      // Total dose per min = doseVal * weight mcg/min
      // Total dose per hour = doseVal * weight * 60 mcg/hour = (doseVal * weight * 60) / 1000 mg/hour
      const concentrationMgMl = drugAmt / volMl; // mg/mL
      const concentrationMcgMl = concentrationMgMl * 1000; // mcg/mL
      const doseMcgMin = doseVal * weight;
      const doseMcgHr = doseMcgMin * 60;
      infusionRateMlHr = doseMcgHr / concentrationMcgMl;
      concentrationText = `${concentrationMgMl.toFixed(2)} mg/mL (${concentrationMcgMl.toFixed(0)} mcg/mL)`;
    }
    else if (selectedInfusion === "amiodarone") {
      // 450 mg in 250 mL -> 1.8 mg/mL = 1800 mcg/mL
      // Dose is typically mcg/min (e.g. 1000 mcg/min or 1 mg/min)
      const concentrationMgMl = drugAmt / volMl; // mg/mL
      const concentrationMcgMl = concentrationMgMl * 1000; // mcg/mL
      
      let doseMcgMin = doseVal;
      if (orderedDoseUnit === "units_hr") { // fallback
        doseMcgMin = (doseVal * 1000) / 60;
      }
      
      const doseMcgHr = doseMcgMin * 60;
      infusionRateMlHr = doseMcgHr / concentrationMcgMl;
      concentrationText = `${concentrationMgMl.toFixed(2)} mg/mL (${concentrationMcgMl.toFixed(0)} mcg/mL)`;
    }
    else if (selectedInfusion === "norepinephrine") {
      // 4 mg in 50 mL -> 0.08 mg/mL = 80 mcg/mL
      // Dose is mcg/min (e.g. 5-15 mcg/min) or mcg/kg/min
      const concentrationMgMl = drugAmt / volMl; // mg/mL
      const concentrationMcgMl = concentrationMgMl * 1000; // mcg/mL
      
      let doseMcgMin = doseVal;
      if (orderedDoseUnit === "mcg_kg_min") {
        doseMcgMin = doseVal * weight;
      }
      
      const doseMcgHr = doseMcgMin * 60;
      infusionRateMlHr = doseMcgHr / concentrationMcgMl;
      concentrationText = `${concentrationMgMl.toFixed(3)} mg/mL (${concentrationMcgMl.toFixed(0)} mcg/mL)`;
    }

    setCalcResult({
      rate: infusionRateMlHr.toFixed(2),
      concentration: concentrationText,
      explanationAr: `لتسريب ${doseVal} ${orderedDoseUnit === 'mcg_kg_min' ? 'ميكروجرام/كجم/دقيقة' : orderedDoseUnit === 'mcg_min' ? 'ميكروجرام/دقيقة' : 'وحدة/ساعة'} بتركيز ${concentrationText}، اضبط مضخة المحاليل الآلية على سرعة ${infusionRateMlHr.toFixed(2)} مل/ساعة.`,
      explanationEn: `To deliver ${doseVal} ${orderedDoseUnit === 'mcg_kg_min' ? 'mcg/kg/min' : orderedDoseUnit === 'mcg_min' ? 'mcg/min' : 'Units/hr'} at concentration of ${concentrationText}, set the volumetric infusion pump to flow at exactly ${infusionRateMlHr.toFixed(2)} mL/hour.`
    });
  };

  // Ask AI to analyze a drug (Spelling correction, labels, etc.)
  const analyzeMedication = async () => {
    if (!queryInput.trim()) return;
    setLoading(true);
    setError(null);
    setMedication(null);
    try {
        const response = await fetch("/api/ai/analyze-medication", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ search_query: queryInput }),
        });
        const data = await response.json();
        if (data.success) {
            setMedication(data.medication);
        } else {
            setError(data.error || (isAr ? "حدث خطأ غير متوقع." : "An unexpected error occurred."));
        }
    } catch (e) {
        setError(isAr ? "تعذر الاتصال بالخادم. يرجى المحاولة لاحقاً." : "Failed to connect to server. Please try again later.");
    } finally {
        setLoading(false);
    }
  };

  // Add analyzed drug to Approved department stock registry in Firestore
  const saveApprovedMedication = async () => {
    if (!medication) return;
    setSavingApproved(true);
    try {
      await addDoc(collection(db, "baheya_approved_medications"), {
        originalQuery: medication.search_result.original_query,
        correctedName: medication.search_result.corrected_name_trade,
        genericName: medication.search_result.generic_name,
        drugClass: medication.search_result.drug_class,
        isHighAlert: !!medication.required_labels.high_alert_status.is_high_alert,
        highAlertReason: medication.required_labels.high_alert_status.reason || "",
        hasLasaRisk: !!medication.required_labels.lasa_status.has_lasa_risk,
        lasaConfused: medication.required_labels.lasa_status.confused_with || [],
        routes: medication.clinical_guidelines.administration_routes || [],
        vitals: medication.clinical_guidelines.vital_signs_to_monitor || [],
        timestamp: Date.now(),
        verifiedBy: isAr ? "د. رانيا محمد - صيدلي إكلينيكي" : "Dr. Rania Mohamed - Clinical Pharmacist"
      });
      alert(isAr ? "✅ تم اعتماد الدواء وحفظه بنجاح بقائمة أدوية القسم السحابية!" : "✅ Medication approved and added to department cloud stock successfully!");
      setQueryInput("");
      setMedication(null);
    } catch (e) {
      alert(isAr ? "تعذر حفظ الدواء سحابياً. تم الاحتفاظ به مؤقتاً." : "Failed to save medication to cloud.");
    } finally {
      setSavingApproved(false);
    }
  };

  const deleteApprovedMedication = async (id: string) => {
    if (!confirm(isAr ? "هل أنت متأكد من حذف هذا الدواء المعتمد؟" : "Are you sure you want to delete this approved medication?")) return;
    try {
      await deleteDoc(doc(db, "baheya_approved_medications", id));
    } catch (e) {
      alert("Error deleting record.");
    }
  };

  // Interactive Drug Interaction Checker API call
  const checkInteraction = async () => {
    if (!med1.trim() || !med2.trim()) return;
    setLoadingInt(true);
    setErrorInt(null);
    setInteractionResult(null);

    try {
      const response = await fetch("/api/ai/check-interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ med1, med2, lang: language }),
      });
      const data = await response.json();
      if (data.success) {
        setInteractionResult(data.analysis);
      } else {
        setErrorInt(data.error || (isAr ? "حدث خطأ أثناء فحص التداخلات." : "An error occurred checking interactions."));
      }
    } catch (e) {
      setErrorInt(isAr ? "فشل الاتصال بالخادم لمطابقة التداخل الدوائي." : "Failed to contact database interaction resolver.");
    } finally {
      setLoadingInt(false);
    }
  };

  const checkIvCompatibility = async () => {
    if (!drug1Iv.trim() || !drug2Iv.trim()) return;
    setLoadingIv(true);
    setErrorIv(null);
    setIvResult(null);

    try {
      const response = await fetch("/api/ai/iv-compatibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drug1: drug1Iv, drug2: drug2Iv, fluid: fluidIv, lang: language }),
      });
      const data = await response.json();
      if (data.success) {
        setIvResult(data.result);
      } else {
        setErrorIv(data.error || "An error occurred.");
      }
    } catch (e) {
      setErrorIv("Failed to contact API.");
    } finally {
      setLoadingIv(false);
    }
  };

  const generateCounseling = async () => {
    if (!counselInput.trim()) return;
    setLoadingCounsel(true);
    setErrorCounsel(null);
    setCounselStatus(null);
    
    try {
      const response = await fetch("/api/ai/medication-counseling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medication: counselInput, lang: language }),
      });
      const data = await response.json();
      if (data.success) {
        setCounselStatus(data.counseling);
      } else {
        setErrorCounsel(data.error || "An error occurred.");
      }
    } catch(e) {
      setErrorCounsel("Failed to contact API");
    } finally {
      setLoadingCounsel(false);
    }
  };

  // Save Co-signed IDC log to Firestore
  const submitIdcVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idcPatientName || !idcMRN || !idcDose || !idcRate || !idcPrimaryNurse || !idcCoNurse) {
      alert(isAr ? "يرجى ملء جميع الحقول الإلزامية للتحقق الثنائي!" : "Please fill out all mandatory fields for the double check clearance!");
      return;
    }
    if (!fiveRightsChecked) {
      alert(isAr ? "يجب تأكيد وبث ميثاق الحقوق الخمسة السريرية أولاً!" : "You must confirm compliance with the 5 Rights of Medication Safety!");
      return;
    }

    setSavingIdc(true);
    try {
      await addDoc(collection(db, "baheya_idc_logs"), {
        patientName: idcPatientName,
        mrn: idcMRN,
        medication: idcMedName,
        dose: idcDose,
        rate: idcRate,
        primaryNurse: idcPrimaryNurse,
        coNurse: idcCoNurse,
        timestamp: Date.now(),
        verified: true,
        seal: `IDC-SEAL-${Math.floor(100000 + Math.random() * 900000)}`
      });

      alert(isAr ? "🎉 تم توثيق التحقق الثنائي المستقل آمن وحفظه بختم الإدارة السحابية بنجاح!" : "🎉 Independent Double Check (IDC) logged and certified securely on the ledger!");
      
      // Clear form
      setIdcPatientName("");
      setIdcMRN("");
      setIdcDose("");
      setIdcRate("");
      setFiveRightsChecked(false);
    } catch (e) {
      alert(isAr ? "فشل حفظ التحقق سحرياً." : "Failed to record IDC log.");
    } finally {
      setSavingIdc(false);
    }
  };

  const deleteIdcLog = async (id: string) => {
    if (!confirm(isAr ? "حذف هذا السجل التوثيقي للتحقق الثنائي؟" : "Delete this IDC verification trail?")) return;
    try {
      await deleteDoc(doc(db, "baheya_idc_logs", id));
    } catch (e) {
      alert("Error.");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Title Header */}
      <div className="bg-gradient-to-r from-pink-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="space-y-1 text-center md:text-right">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <Sparkles className="text-pink-400 h-6 w-6 animate-pulse" />
            <h2 className="text-xl md:text-2xl font-black font-sans">
              {isAr ? "سجل ذكاء الأدوية المتكامل وبوابة الصيدلية الذكية" : "AI Clinical Medication Intelligence & Safety Ledger"}
            </h2>
          </div>
          <p className="text-xs text-pink-100 max-w-2xl">
            {isAr 
              ? "تفقد الأدوية عالية الخطورة، فحص تفاعلات العقاقير بدعم الذكاء الاصطناعي، حسابات التسريب الوريدي الدقيق، وإلزامية توثيق التحقق الثنائي المستقل للتمريض (Double Check)." 
              : "Verify High-Alert medications, execute AI interaction audits, calibrate micro-infusions, and satisfy compliance rules via Independent Co-Signing logs."}
          </p>
        </div>
        <div className="px-4 py-2 bg-pink-900/50 rounded-xl border border-pink-700 text-xs font-bold font-mono">
          {isAr ? "مستوى الأمان: مفعّل 🟢" : "Security Level: ACTIVE 🟢"}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("analyze")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-black transition cursor-pointer ${activeTab === "analyze" ? "bg-pink-600 text-white shadow-md" : "bg-white text-slate-700 hover:bg-pink-50 border border-slate-200"}`}
        >
          <Search className="h-4 w-4" />
          <span>{isAr ? "تحليل وتصنيف الأدوية" : "AI Drug Analyzer"}</span>
        </button>

        <button
          onClick={() => setActiveTab("interaction")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-black transition cursor-pointer ${activeTab === "interaction" ? "bg-pink-600 text-white shadow-md" : "bg-white text-slate-700 hover:bg-pink-50 border border-slate-200"}`}
        >
          <Shuffle className="h-4 w-4" />
          <span>{isAr ? "فاحص تفاعلات العقاقير" : "AI Drug Interaction Checker"}</span>
        </button>

        <button
          onClick={() => setActiveTab("calculator")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-black transition cursor-pointer ${activeTab === "calculator" ? "bg-pink-600 text-white shadow-md" : "bg-white text-slate-700 hover:bg-pink-50 border border-slate-200"}`}
        >
          <Activity className="h-4 w-4" />
          <span>{isAr ? "حاسبة تمديد ومعدل تسريب الأدوية" : "Infusion Rate & Dilution"}</span>
        </button>

        <button
          onClick={() => setActiveTab("idc")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-black transition cursor-pointer ${activeTab === "idc" ? "bg-pink-600 text-white shadow-md font-bold" : "bg-white text-slate-700 hover:bg-pink-50 border border-slate-200"}`}
        >
          <ClipboardCheck className="h-4 w-4" />
          <span>{isAr ? "سجل التحقق الثنائي المستقل (IDC)" : "Independent Double Check (IDC)"}</span>
        </button>

        <button
          onClick={() => setActiveTab("iv_compatibility")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-black transition cursor-pointer ${activeTab === "iv_compatibility" ? "bg-pink-600 text-white shadow-md font-bold" : "bg-white text-slate-700 hover:bg-pink-50 border border-slate-200"}`}
        >
          <Layers className="h-4 w-4" />
          <span>{isAr ? "توافق حقن الوريد المستمر (Y-Site)" : "IV Y-Site Compatibility"}</span>
        </button>
        
        <button
          onClick={() => setActiveTab("counseling")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-black transition cursor-pointer ${activeTab === "counseling" ? "bg-pink-600 text-white shadow-md font-bold" : "bg-white text-slate-700 hover:bg-pink-50 border border-slate-200"}`}
        >
          <BookOpen className="h-4 w-4" />
          <span>{isAr ? "دليل توعية المريض" : "Patient Education Leaflet"}</span>
        </button>
      </div>

      {/* TAB 1: AI Drug Analyzer */}
      {activeTab === "analyze" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Search Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Search className="text-pink-600 h-5 w-5" />
                <span>{isAr ? "البحث الذكي في الأدوية والسموم الوريدية" : "Drug Safety Search & Labeling"}</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {isAr 
                  ? "اكتب اسم المادة الفعالة أو التجاري للدواء. سيقوم محرك الذكاء الاصطناعي بتصحيحه وتفسير تصنيفه، وسيقوم بفحص مخاطر LASA والدواء عالي الأهمية فوراً لتأمين المرضى."
                  : "Enter active generic or brand name. AI will auto-correct spelling, classify, and isolate High-Alert warnings."}
              </p>

              <div className="flex gap-2">
                <input 
                  value={queryInput} 
                  onChange={(e) => setQueryInput(e.target.value)}
                  className="flex-1 border border-slate-200 focus:border-pink-500 p-3 rounded-xl text-xs bg-slate-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-pink-500/20 text-right font-semibold"
                  placeholder={isAr ? "اكتب اسم الدواء هنا (مثال: Insulin, Amidarone, SoluCortef, lasix)..." : "Type drug name (e.g., Amiodarone, Dopamine, Heparin)..."}
                  onKeyDown={(e) => e.key === "Enter" && analyzeMedication()}
                />
                <button 
                  onClick={analyzeMedication}
                  disabled={loading}
                  className="bg-pink-600 hover:bg-pink-700 text-white font-extrabold px-6 rounded-xl flex items-center gap-2 transition disabled:opacity-50 cursor-pointer text-xs"
                >
                  {loading ? <Loader2 className="animate-spin h-4 w-4"/> : <Search className="h-4 w-4"/>}
                  <span>{isAr ? "فحص وتصنيف" : "Analyze"}</span>
                </button>
              </div>

              {/* Quick links */}
              <div className="pt-2 flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-bold text-slate-400">{isAr ? "عقاقير شائعة الفحص:" : "Quick High-Alerts:"}</span>
                {["Insulin", "Heparin", "Amiodarone", "Dopamine", "Potassium Chloride"].map((m, idx) => (
                  <button 
                    key={idx}
                    onClick={() => { setQueryInput(m); }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-pink-50 hover:text-pink-700 text-slate-600 text-[10px] font-bold rounded-lg transition"
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
                <AlertTriangle className="text-red-600 h-5 w-5 shrink-0"/>
                <p className="text-xs font-semibold">{error}</p>
              </div>
            )}

            {/* Analyzed Result Card */}
            {medication && (
              <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-pink-600 space-y-6 animate-in fade-in zoom-in duration-200">
                
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-pink-600 px-2 py-0.5 bg-pink-100/50 rounded-full uppercase tracking-wide">
                      {medication.search_result.drug_class || "Pharmacological Class"}
                    </span>
                    <h4 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <span>{medication.search_result.corrected_name_trade}</span>
                      {medication.search_result.is_corrected && (
                        <span className="text-xs font-medium text-slate-400">({isAr ? `تم تصحيح الإملاء من ${medication.search_result.original_query}` : `corrected spelling from ${medication.search_result.original_query}`})</span>
                      )}
                    </h4>
                    <p className="text-xs font-bold text-slate-500">
                      {isAr ? `الاسم العلمي الموحد: ${medication.search_result.generic_name}` : `Generic: ${medication.search_result.generic_name}`}
                    </p>
                  </div>

                  {/* Safety Status Badges */}
                  <div className="flex flex-wrap gap-2">
                    {medication.required_labels.high_alert_status.is_high_alert && (
                      <div className="bg-red-50 text-red-700 border border-red-200 px-3.5 py-1.5 rounded-xl font-extrabold text-[10px] flex items-center gap-1.5 shadow-sm animate-pulse">
                        <AlertTriangle className="h-4 w-4 text-red-600 shrink-0"/>
                        <span>HIGH-ALERT</span>
                      </div>
                    )}
                    {medication.required_labels.lasa_status.has_lasa_risk && (
                      <div className="bg-amber-50 text-amber-700 border border-amber-200 px-3.5 py-1.5 rounded-xl font-extrabold text-[10px] flex items-center gap-1.5 shadow-sm">
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0"/>
                        <span>LASA RISK</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub panels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* High Alert info */}
                  {medication.required_labels.high_alert_status.is_high_alert && (
                    <div className="bg-red-50/20 border border-red-100 p-4 rounded-xl space-y-2">
                      <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">{isAr ? "مقتضيات الأدوية عالية المخاطر" : "High-Alert Protocols"}</span>
                      <p className="text-xs text-slate-700 font-semibold font-sans">
                        {medication.required_labels.high_alert_status.reason || (isAr ? "دواعي تحذيرية: مستويات خطر عالية وتستلزم رقابة لصيقة وسحب مستقل دقيق." : "Requires stringent security check protocols.")}
                      </p>
                    </div>
                  )}

                  {/* LASA (Look alike Sound alike) confusion details */}
                  {medication.required_labels.lasa_status.has_lasa_risk && (
                    <div className="bg-amber-50/20 border border-amber-100 p-4 rounded-xl space-y-2">
                      <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">{isAr ? "مخاطر الالتباس الشكلي والصوتي (LASA)" : "LASA Sound-Alike Risk"}</span>
                      <div className="space-y-1">
                        {medication.required_labels.lasa_status.confused_with?.map((item: any, idx: number) => (
                          <div key={idx} className="text-xs text-slate-700">
                            <strong>{item.name}</strong>: {item.reason_of_confusion} <span className="text-red-500 font-bold">({item.danger_level})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Guidelines & Administration info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-right">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 justify-end">
                      <span>{isAr ? "طرق الإعطاء وعناية المريض" : "Administration Routes"}</span>
                      <BookOpen className="text-slate-500 h-4 w-4" />
                    </h4>
                    <ul className="list-disc pr-4 text-xs text-slate-600 font-semibold space-y-1" dir="rtl">
                      {medication.clinical_guidelines.administration_routes?.map((r: string, i: number) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-right">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 justify-end">
                      <span>{isAr ? "المؤشرات الحيوية الواجب مراقبتها" : "Monitoring Requirements"}</span>
                      <Activity className="text-slate-500 h-4 w-4" />
                    </h4>
                    <ul className="list-disc pr-4 text-xs text-slate-600 font-semibold space-y-1" dir="rtl">
                      {medication.clinical_guidelines.vital_signs_to_monitor?.map((r: string, i: number) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                </div>

                {/* Approve Button */}
                <button 
                  onClick={saveApprovedMedication}
                  disabled={savingApproved}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white w-full py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow transition cursor-pointer"
                >
                  {savingApproved ? <Loader2 className="animate-spin h-4 w-4"/> : <CheckCircle className="h-4.5 w-4.5" />}
                  <span>{isAr ? "اعتماد الدواء وإضافته لدليل أدوية القسم" : "Approve and Add to Department Shared Registry"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Real-time Approved Stock in Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-2 mb-3">
                <CheckCircle className="text-emerald-500 h-5 w-5" />
                <span>{isAr ? "الأدوية المعتمدة بالقسم" : "Approved Med Stock"}</span>
              </h3>
              <p className="text-[10px] text-slate-500 mb-4">
                {isAr 
                  ? "قائمة الأدوية التي تم مطابقتها وتدقيق سلامتها السريرية للمستشفى." 
                  : "List of certified drugs with verified clinical guidelines."}
              </p>

              {approvedList.length === 0 ? (
                <div className="text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <PillIcon className="mx-auto text-slate-300 h-8 w-8 mb-2" />
                  <p className="text-xs text-slate-400 font-bold">{isAr ? "لا يوجد أدوية معتمدة بعد" : "No approved medicines yet."}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {approvedList.map((m) => (
                    <div key={m.id} className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 transition flex items-start justify-between gap-2">
                      <div className="space-y-1 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <span className="font-bold text-slate-800 text-xs">{m.correctedName}</span>
                          {m.isHighAlert && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>}
                        </div>
                        <p className="text-[9px] text-slate-500 font-mono" dir="ltr">{m.genericName}</p>
                        <div className="flex gap-1 justify-end">
                          {m.isHighAlert && <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[7px] font-black">HIGH</span>}
                          {m.hasLasaRisk && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[7px] font-black">LASA</span>}
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteApprovedMedication(m.id)}
                        className="text-slate-400 hover:text-red-650 p-1 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title={isAr ? "حذف" : "Delete"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI Interaction Checker */}
      {activeTab === "interaction" && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5 justify-center">
              <Shuffle className="text-pink-600 h-5 w-5" />
              <span>{isAr ? "فاحص تفاعلات الأدوية المتطور بالذكاء الاصطناعي" : "AI Drug-Drug Interaction Screen"}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {isAr 
                ? "أدخل عقارين طبيين لفحصهما عيادياً بنقرة واحدة للحصول على تقرير علمي موثق ومخلوق للممرضات لمراقبة التفاعلات الخطرة." 
                : "Screen multiple drugs sequentially. Gemini will evaluate pharmacological pathways, warnings, and nursing safety guidelines."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 text-right">
              <label className="block text-xs font-black text-slate-700">{isAr ? "الدواء الأول (العقار أ):" : "First Medication (Drug A):"}</label>
              <input 
                value={med1}
                onChange={(e) => setMed1(e.target.value)}
                placeholder="e.g. Amiodarone, Gentamicin, Warfarin..."
                className="w-full border border-slate-200 focus:border-pink-500 rounded-xl p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500/20"
              />
            </div>

            <div className="space-y-1 text-right">
              <label className="block text-xs font-black text-slate-700">{isAr ? "الدواء الثاني (العقار ب):" : "Second Medication (Drug B):"}</label>
              <input 
                value={med2}
                onChange={(e) => setMed2(e.target.value)}
                placeholder="e.g. Digoxin, Furosemide, Heparin..."
                className="w-full border border-slate-200 focus:border-pink-500 rounded-xl p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500/20"
              />
            </div>
          </div>

          <button
            onClick={checkInteraction}
            disabled={loadingInt || !med1 || !med2}
            className="w-full bg-pink-650 hover:bg-pink-700 text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow disabled:opacity-40 cursor-pointer"
          >
            {loadingInt ? <Loader2 className="animate-spin h-4.5 w-4.5" /> : <ArrowLeftRight className="h-4.5 w-4.5" />}
            <span>{isAr ? "فحص تداخل العقارين وتأكيد الأمان" : "Check Synergy & Interactions"}</span>
          </button>

          {errorInt && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
              <AlertTriangle className="text-red-600 h-5 w-5 shrink-0"/>
              <p className="text-xs font-semibold">{errorInt}</p>
            </div>
          )}

          {/* Interaction Results Screen */}
          {interactionResult && (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in slide-in-from-bottom-3">
              
              <div className="flex flex-col sm:flex-row justify-between items-center pb-2 border-b border-slate-200 gap-2">
                <span className="text-xs font-bold text-slate-500">
                  {isAr ? `تفاعل: ${med1} ⇎ ${med2}` : `Interaction: ${med1} ⇎ ${med2}`}
                </span>
                
                {/* Severity pill decoration */}
                <span className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase shadow-sm ${
                  interactionResult.interaction_severity === "High" ? "bg-red-100 text-red-800 border border-red-200 animate-pulse" :
                  interactionResult.interaction_severity === "Moderate" ? "bg-orange-100 text-orange-850 border border-orange-200" :
                  interactionResult.interaction_severity === "Minor" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                  "bg-green-100 text-green-800 border border-green-200"
                }`}>
                  {isAr 
                    ? `مستوى الخطورة: ${
                      interactionResult.interaction_severity === "High" ? "عالي الفتك 🔴" :
                      interactionResult.interaction_severity === "Moderate" ? "متوسط الأهمية 🟠" :
                      interactionResult.interaction_severity === "Minor" ? "طفيف الأثر 🟡" :
                      "آمن ومتوافق 🟢"
                    }`
                    : `Severity: ${interactionResult.interaction_severity}`
                  }
                </span>
              </div>

              {/* Mechanism */}
              <div className="space-y-1 text-right">
                <h4 className="text-xs font-extrabold text-slate-800">{isAr ? "ميكانيكية التأثير والامتصاص:" : "Pharmacological Mechanism:"}</h4>
                <p className="text-xs text-slate-650 font-sans leading-relaxed bg-white p-3 rounded-xl border border-slate-100">{interactionResult.mechanism}</p>
              </div>

              {/* Clinical Effects */}
              <div className="space-y-1 text-right">
                <h4 className="text-xs font-extrabold text-slate-800">{isAr ? "الأعراض والآثار العيادية المحتملة:" : "Expected Clinical Effects:"}</h4>
                <p className="text-xs text-red-800 bg-red-50/50 p-3 rounded-xl border border-red-100 leading-relaxed">{interactionResult.clinical_effects}</p>
              </div>

              {/* Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-1 text-right">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1 justify-end">
                    <span>{isAr ? "توصيات الصيدلي الإكلينيكي للتمريض" : "Clinical Practice Guide"}</span>
                    <UserCheck className="text-pink-600 h-4 w-4" />
                  </h4>
                  <p className="text-xs text-slate-650 font-semibold leading-relaxed">{interactionResult.recommendation}</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-1 text-right">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1 justify-end">
                    <span>{isAr ? "المؤشرات وعناصر الرقابة السريرية" : "Critical Monitoring Targets"}</span>
                    <ShieldAlert className="text-amber-500 h-4 w-4" />
                  </h4>
                  <p className="text-xs text-slate-650 font-semibold leading-relaxed">{interactionResult.monitoring_guidelines}</p>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* TAB 3: Infusion Prep & Dilution Rate Calculator */}
      {activeTab === "calculator" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Config Panel */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Activity className="text-pink-600 h-5 w-5" />
              <span>{isAr ? "حاسبة تمديد ومعايرة معدلات الأدوية الوريدية عالية المخاطر" : "Critical Infusion Calibrator"}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 text-right">
                <label className="block text-xs font-black text-slate-700">{isAr ? "الدواء عالي الخطورة المراد تجهيزه:" : "Target High-Alert Medication:"}</label>
                <select 
                  value={selectedInfusion}
                  onChange={(e) => setSelectedInfusion(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500 text-right"
                >
                  <option value="insulin">Regular Insulin (إنسولين عادي مائي)</option>
                  <option value="heparin">Heparin (هيبارين مانع التجلط)</option>
                  <option value="dopamine">Dopamine (دوبامين رافع للضغط)</option>
                  <option value="amiodarone">Amiodarone (سيلوكاردين لمنع الاضطرابات القلبية)</option>
                  <option value="norepinephrine">Norepinephrine (أدرينالين مائي للضغط الحرجي)</option>
                </select>
              </div>

              {orderedDoseUnit === "mcg_kg_min" && (
                <div className="space-y-1 text-right">
                  <label className="block text-xs font-black text-slate-700">{isAr ? "وزن جسم المريض (كجم):" : "Patient Weight (kg):"}</label>
                  <input 
                    type="number"
                    value={patientWeight}
                    onChange={(e) => setPatientWeight(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-pink-500 text-right"
                  />
                </div>
              )}
            </div>

            {/* Standard preparation directives */}
            <div className="p-4 bg-pink-50/40 rounded-xl border border-pink-100 text-right space-y-1 text-slate-850">
              <span className="text-[9px] font-black text-pink-700 uppercase tracking-widest">{isAr ? "بروتوكول التمديد المعتمد للمستشفى" : "Standard Dilution Guideline"}</span>
              <p className="text-xs font-extrabold">{isAr ? INFUSION_PRESETS[selectedInfusion].prepAr : INFUSION_PRESETS[selectedInfusion].prepEn}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1 text-right">
                <label className="block text-[11px] font-bold text-slate-700">{isAr ? "الجرعة الموصوفة:" : "Ordered Dose:"}</label>
                <input 
                  type="number"
                  value={orderedDoseVal}
                  onChange={(e) => setOrderedDoseVal(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2 font-bold text-xs focus:ring-2 focus:ring-pink-500 text-right"
                />
              </div>

              <div className="space-y-1 text-right">
                <label className="block text-[11px] font-bold text-slate-700">{isAr ? "وحدة الجرعة:" : "Unit:"}</label>
                <span className="w-full bg-slate-100 p-2 rounded-xl text-xs font-extrabold block text-center truncate select-none border border-slate-150">
                  {orderedDoseUnit === "units_hr" ? (isAr ? "وحدة/ساعة" : "Units/hr") : 
                   orderedDoseUnit === "mcg_min" ? "mcg/min" : "mcg/kg/min"}
                </span>
              </div>

              <div className="space-y-1 text-right">
                <label className="block text-[11px] font-bold text-slate-700">{isAr ? "كمية الدواء المضافة:" : "Drug Amt:"}</label>
                <input 
                  type="number"
                  value={bagDrugGrams}
                  onChange={(e) => setBagDrugGrams(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2 font-bold text-xs focus:ring-2 focus:ring-pink-500 text-right"
                />
              </div>

              <div className="space-y-1 text-right">
                <label className="block text-[11px] font-bold text-slate-700">{isAr ? "حجم المحلل الكلي (mL):" : "Total Vol (mL):"}</label>
                <input 
                  type="number"
                  value={bagVolumeMl}
                  onChange={(e) => setBagVolumeMl(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2 font-bold text-xs focus:ring-2 focus:ring-pink-500 text-right"
                />
              </div>
            </div>
          </div>

          {/* Calibrator Results */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-pink-400 block tracking-widest uppercase font-mono">
                {isAr ? "معايرة معدل مضخة المحاليل" : "Volumetric Rate Clearance"}
              </span>

              {calcResult ? (
                <div className="space-y-4 text-right">
                  <div className="space-y-1">
                    <span className="text-3xl font-black text-pink-500 font-mono tracking-tight">{calcResult.rate}</span>
                    <span className="text-xs font-bold text-slate-400 block">mL/hour (مل في الساعة)</span>
                  </div>

                  <div className="p-3.5 bg-slate-800 rounded-xl border border-slate-750 text-xs leading-relaxed space-y-1 font-semibold">
                    <div className="flex justify-between font-mono text-[10px] text-pink-300">
                      <span>{calcResult.concentration}</span>
                      <span>{isAr ? "التركيز الناتج:" : "Concentration:"}</span>
                    </div>
                    <p className="text-slate-300 antialiased pt-1 text-[11px]">
                      {isAr ? calcResult.explanationAr : calcResult.explanationEn}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-450">{isAr ? "أدخل مقادير الجرعات لحساب المعايرة." : "Enter dosage parameters to output volumetric settings."}</p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex gap-2">
              <button 
                onClick={() => {
                  if (calcResult) {
                    setIdcMedName(`${INFUSION_PRESETS[selectedInfusion].nameAr} / ${INFUSION_PRESETS[selectedInfusion].nameEn}`);
                    setIdcDose(`${orderedDoseVal} ${orderedDoseUnit}`);
                    setIdcRate(`${calcResult.rate} mL/hr`);
                    setActiveTab("idc");
                    alert(isAr ? "🚀 تم نقل الحساب بنجاح لنموذج التحقق والاعتماد المزدوج!" : "🚀 Dynamic clinical rates transferred directly to double checking log!");
                  }
                }}
                disabled={!calcResult}
                className="flex-1 bg-pink-600 hover:bg-pink-700 disabled:opacity-40 text-white py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ClipboardCheck className="h-4 w-4" />
                <span>{isAr ? "نقل لتسجيل IDC" : "Send to Double Check Log"}</span>
              </button>
              
              <button 
                onClick={() => window.print()}
                className="px-3 bg-slate-800 hover:bg-slate-755 text-slate-200 rounded-xl transition border border-slate-750 cursor-pointer"
                title="Print Label"
              >
                <Printer className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Independent Double Check (IDC) Security Log */}
      {activeTab === "idc" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* IDC Co-signing Form */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4">
              <ClipboardCheck className="text-pink-600 h-5 w-5 animate-pulse" />
              <span>{isAr ? "بوابة توثيق التحقق الثنائي المستقل (IDC)" : "Independent Cross-Verification Workspace"}</span>
            </h3>
            
            <p className="text-[11px] text-slate-500 mb-6">
              {isAr 
                ? "طبقاً لمعايير سلامة المرضى الدولية، تتطلب الأدوية عالية الخطورة (مثل الإنسولين، الهيبارين، المحاليل المركزة) التحقق المستقل من ممرضين منفصلين وتوقيعهما معاً بالرمز السري قبل حقن المريض."
                : "Standardizes the double verification process. Both the prepared nurse and clinical checker must certify the 5 clinical rights."}
            </p>

            <form onSubmit={submitIdcVerification} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-right">
                  <label className="block text-xs font-black text-slate-700">{isAr ? "اسم المريضة الكريم رباعياً:" : "Patient Full Name:"} <span className="text-red-500">*</span></label>
                  <input 
                    required
                    value={idcPatientName}
                    onChange={(e) => setIdcPatientName(e.target.value)}
                    placeholder={isAr ? "مثال: فاطمة أحمد الشافعي" : "e.g. Rachel Miller"}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-right"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="block text-xs font-black text-slate-700">{isAr ? "الرقم الطبي (MRN):" : "Medical Record Number (MRN):"} <span className="text-red-500">*</span></label>
                  <input 
                    required
                    value={idcMRN}
                    onChange={(e) => setIdcMRN(e.target.value)}
                    placeholder="e.g. MRN-708125"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1 text-right">
                  <label className="block text-xs font-black text-slate-700">{isAr ? "العقار عالي الخطورة:" : "Medication:"} <span className="text-red-500">*</span></label>
                  <input 
                    required
                    value={idcMedName}
                    onChange={(e) => setIdcMedName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-right bg-slate-50"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="block text-xs font-black text-slate-700">{isAr ? "الجرعة المقررة (الطلب):" : "Ordered Dose:"} <span className="text-red-500">*</span></label>
                  <input 
                    required
                    value={idcDose}
                    onChange={(e) => setIdcDose(e.target.value)}
                    placeholder="e.g. 5 Units/hr"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-center"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="block text-xs font-black text-slate-700">{isAr ? "سرعة المضخة المحسوبة (mL/hr):" : "Calculated Pump Rate:"} <span className="text-red-500">*</span></label>
                  <input 
                    required
                    value={idcRate}
                    onChange={(e) => setIdcRate(e.target.value)}
                    placeholder="e.g. 5.15 mL/hr"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-right">
                  <label className="block text-xs font-black text-slate-700">{isAr ? "الممرض المجهز (المسؤول الأول):" : "Prepared By (First Nurse):"} <span className="text-red-500">*</span></label>
                  <input 
                    required
                    value={idcPrimaryNurse}
                    onChange={(e) => setIdcPrimaryNurse(e.target.value)}
                    placeholder={isAr ? "أ. منى السيد - كادر تمريض" : "Nurse Sarah Jenkins"}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-right"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="block text-xs font-black text-slate-700">{isAr ? "الممرض المدقق (الشريك الثنائي):" : "Verified By (Independent Co-Signer):"} <span className="text-red-500">*</span></label>
                  <input 
                    required
                    value={idcCoNurse}
                    onChange={(e) => setIdcCoNurse(e.target.value)}
                    placeholder={isAr ? "أ. هناء أحمد - مشرف القسم" : "Nurse Charge Mona Ali"}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-right"
                  />
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-3">
                <input 
                  type="checkbox"
                  id="five-rights"
                  checked={fiveRightsChecked}
                  onChange={(e) => setFiveRightsChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 bg-white text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="five-rights" className="text-xs text-slate-700 font-bold leading-relaxed text-right cursor-pointer select-none">
                  {isAr 
                    ? "أشهد أنا الكادر المدقق بصفتي الطبية المستقلة أنني قمت بالتحقق البدني والرياضي المستقل من الدواء المناسب والجرعة والمريض الصحيح ومعدل تسريب السوائل ونسبة التمديد ومطابقتها لوصفة الطبيب والإدارة."
                    : "I certify that I have conducted an independent double clinical calculation and verified the 5 Rights: Right Patient, Medication, Concentration, Dose, and Setup Flow."}
                </label>
              </div>

              <button
                type="submit"
                disabled={savingIdc}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow transition cursor-pointer"
              >
                {savingIdc ? <Loader2 className="animate-spin h-4.5 w-4.5" /> : <Save className="h-4.5 w-4.5" />}
                <span>{isAr ? "توقيق والحفظ المركزي لشهادة الأمان السحابية" : "Log double certification & seal on blockchain"}</span>
              </button>
            </form>
          </div>

          {/* Active Ledger List */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-2 mb-3">
                <UserCheck className="text-emerald-500 h-5 w-5" />
                <span>{isAr ? "شهادات التحقق المعتمدة (IDC)" : "Certified Checks Ledger"}</span>
              </h3>
              <p className="text-[10px] text-slate-500 mb-4">
                {isAr 
                  ? "تسجيلات سحابية حية تثبت مطابقة الأدوية وتأمين المريضات." 
                  : "Verified cross-signature audit trails logged directly on Cloud storage."}
              </p>

              {idcLogs.length === 0 ? (
                <div className="text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <ClipboardCheck className="mx-auto text-slate-300 h-8 w-8 mb-2" />
                  <p className="text-xs text-slate-400 font-bold">{isAr ? "بدون شهادات مسجلة اليوم" : "No double checks registered yet."}</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {idcLogs.map((log) => (
                    <div key={log.id} className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-xl space-y-2 text-right relative overflow-hidden">
                      {/* Watermark certificate */}
                      <div className="absolute left-2 bottom-2 text-emerald-450 opacity-10">
                        <CheckCircle className="h-16 w-16" />
                      </div>

                      <div className="flex justify-between items-center pb-1.5 border-b border-emerald-100 gap-2">
                        <span className="text-[8px] px-1.5 py-0.5 bg-emerald-500 text-white rounded font-mono font-black select-none">
                          {log.seal}
                        </span>
                        <span className="text-[10px] text-slate-650 font-bold">
                          {log.patientName} &bull; {log.mrn}
                        </span>
                      </div>

                      <div className="text-[10.5px] text-slate-700 space-y-1 font-semibold">
                        <p>{isAr ? "العقار المستهدف:" : "Target Drug:"} <span className="font-bold text-slate-800">{log.medication}</span></p>
                        <p>{isAr ? "الجرعة ومعدل المضخة:" : "Dose / Rate:"} <span className="font-mono bg-white px-1.5 py-0.5 border rounded text-emerald-700 font-bold">{log.dose} @ {log.rate}</span></p>
                      </div>

                      <div className="pt-1 select-none flex justify-between text-[9px] text-slate-450 font-bold text-center">
                        <span>{isAr ? `توقيع الشريك: ${log.coNurse}` : `Checked by: ${log.coNurse}`}</span>
                        <span>{isAr ? `توقيع المجهز: ${log.primaryNurse}` : `Prepared by: ${log.primaryNurse}`}</span>
                      </div>

                      <div className="flex justify-between pt-1 border-t border-emerald-100/50">
                        <button 
                          onClick={() => window.print()}
                          className="text-[9px] text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="h-3 w-3" />
                          <span>{isAr ? "طبع لاصقة السيرنج" : "Print Label"}</span>
                        </button>

                        <button 
                          onClick={() => deleteIdcLog(log.id)}
                          className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: IV Compatibility */}
      {activeTab === "iv_compatibility" && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5 justify-center">
              <Layers className="text-pink-600 h-5 w-5" />
              <span>{isAr ? "فاحص التوافق الوريدي المشترك (Y-Site)" : "Y-Site IV Compatibility Checker"}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {isAr 
                ? "يتحقق الذكاء الاصطناعي من إمكانية أو خطورة دمج عقارين معاً في وريد واحد."
                : "AI determines if two IV medications can be safely infused into the same line."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1 text-right">
              <label className="block text-xs font-black text-slate-700">{isAr ? "الدواء الأول (IV):" : "First Drug (IV):"}</label>
              <input value={drug1Iv} onChange={(e) => setDrug1Iv(e.target.value)} className="w-full border border-slate-200 focus:border-pink-500 rounded-xl p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500/20" />
            </div>
            <div className="space-y-1 text-right">
              <label className="block text-xs font-black text-slate-700">{isAr ? "الدواء الثاني (IV):" : "Second Drug (IV):"}</label>
              <input value={drug2Iv} onChange={(e) => setDrug2Iv(e.target.value)} className="w-full border border-slate-200 focus:border-pink-500 rounded-xl p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500/20" />
            </div>
            <div className="space-y-1 text-right">
              <label className="block text-xs font-black text-slate-700">{isAr ? "السائل المغذي الاختياري:" : "Base Fluid (Optional):"}</label>
              <input value={fluidIv} onChange={(e) => setFluidIv(e.target.value)} placeholder="e.g. 0.9% NaCl, D5W..." className="w-full border border-slate-200 focus:border-pink-500 rounded-xl p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500/20" />
            </div>
          </div>

          <button onClick={checkIvCompatibility} disabled={loadingIv || !drug1Iv || !drug2Iv} className="w-full bg-pink-650 hover:bg-pink-700 text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow disabled:opacity-40 cursor-pointer">
            {loadingIv ? <Loader2 className="animate-spin h-4.5 w-4.5" /> : <ShieldAlert className="h-4.5 w-4.5" />}
            <span>{isAr ? "فحص التوافق الوريدي" : "Check Compatibility"}</span>
          </button>

          {errorIv && (
             <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs font-semibold">{errorIv}</div>
          )}

          {ivResult && (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 shadow-inner">
               <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-500">{isAr ? "نتيجة التوافق" : "Compatibility Status"}</span>
                  <span className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase shadow-sm ${
                    ivResult.compatibility_status === 'Compatible' ? 'bg-green-100 text-green-800' :
                    ivResult.compatibility_status === 'Incompatible' ? 'bg-red-100 text-red-800 animate-pulse' :
                    'bg-orange-100 text-orange-850'
                  }`}>
                    {ivResult.compatibility_status}
                  </span>
               </div>
               <div className="space-y-1 text-right">
                <h4 className="text-xs font-extrabold text-slate-800">{isAr ? "الشرح المفصل:" : "Explanation:"}</h4>
                <p className="text-xs text-slate-650 font-sans leading-relaxed">{ivResult.explanation}</p>
              </div>
              <div className="space-y-1 text-right">
                <h4 className="text-xs font-extrabold text-slate-800">{isAr ? "التوصية التمريضية:" : "Nursing Recommendation:"}</h4>
                <p className="text-xs text-slate-650 font-sans leading-relaxed bg-white p-3 rounded-xl border border-slate-100">{ivResult.recommendation}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: Patient Counseling */}
      {activeTab === "counseling" && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5 justify-center">
              <BookOpen className="text-pink-600 h-5 w-5" />
              <span>{isAr ? "دليل توعية وتثقيف المريض المبسط" : "Patient Education & Counseling Generator"}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {isAr 
                ? "يولد تعليمات خروج مبسطة باللغة السهلة للمرضى وأسرهم، بعيداً عن المصطلحات المعقدة."
                : "Creates a plain-language patient education sheet for discharge instructions and daily use."}
            </p>
          </div>

          <div className="flex gap-2">
            <input value={counselInput} onChange={(e) => setCounselInput(e.target.value)} placeholder={isAr ? "اسم الدواء..." : "Medication name..."} className="flex-1 w-full border border-slate-200 focus:border-pink-500 rounded-xl p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500/20 text-right" />
            <button onClick={generateCounseling} disabled={loadingCounsel || !counselInput} className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-40 cursor-pointer">
              {loadingCounsel ? <Loader2 className="animate-spin h-4 w-4" /> : <Printer className="h-4 w-4" />}
              <span>{isAr ? "توليد النشرة" : "Generate Learner Sheet"}</span>
            </button>
          </div>
          
          {errorCounsel && (
             <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs font-semibold">{errorCounsel}</div>
          )}

          {counselStatus && (
            <div className="p-8 bg-amber-50/30 rounded-2xl border-2 border-slate-200 shadow space-y-6" id="counsel-sheet">
               <div className="text-center space-y-2 border-b-2 border-slate-200 pb-4">
                  <h1 className="text-2xl font-black text-slate-900">{counselStatus.drug_name}</h1>
                  <p className="text-slate-600 font-bold text-sm bg-white inline-block px-4 py-1 border border-slate-200 rounded-full">{isAr ? "بطاقة تعليمات المريض" : "Patient Medication Guide"}</p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right dir-rtl">
                 <div className="space-y-2 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                   <h3 className="text-xs font-black text-slate-800 border-b border-pink-100 pb-2">{isAr ? "لماذا أتناول هذا الدواء؟" : "What is it for?"}</h3>
                   <p className="text-xs text-slate-600 leading-relaxed font-semibold">{counselStatus.what_is_it_for}</p>
                 </div>
                 <div className="space-y-2 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                   <h3 className="text-xs font-black text-slate-800 border-b border-pink-100 pb-2">{isAr ? "كيفية الاستخدام:" : "How to take it:"}</h3>
                   <p className="text-xs text-slate-600 leading-relaxed font-semibold">{counselStatus.how_to_take}</p>
                 </div>
                 <div className="space-y-2 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                   <h3 className="text-xs font-black text-slate-800 border-b border-pink-100 pb-2">{isAr ? "تداخلات مع الطعام والأدوية:" : "Food and Drug Interactions:"}</h3>
                   <p className="text-xs text-slate-600 leading-relaxed font-semibold">{counselStatus.food_drug_interactions}</p>
                 </div>
                 <div className="space-y-2 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                   <h3 className="text-xs font-black text-slate-800 border-b border-pink-100 pb-2">{isAr ? "ماذا أفعل لو نسيت جرعة؟" : "What if I miss a dose?"}</h3>
                   <p className="text-xs text-slate-600 leading-relaxed font-semibold">{counselStatus.forgot_dose_instruction}</p>
                 </div>
               </div>

               <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-right space-y-4">
                 <div>
                  <h3 className="text-xs font-black text-rose-800 mb-2">{isAr ? "آثار جانبية متوقعة (شائعة):" : "Common Side Effects:"}</h3>
                  <ul className="list-disc pr-5 space-y-1 text-rose-700 text-xs font-semibold">
                    {counselStatus.common_side_effects?.map((s:string, i:number) => <li key={i}>{s}</li>)}
                  </ul>
                 </div>
                 <div>
                  <h3 className="text-xs font-black text-red-600 mb-2 flex justify-end gap-1"><AlertTriangle className="w-4 h-4"/>{isAr ? "متى يجب الاتصال بالطبيب فوراً للطوارئ:" : "When to call the doctor immediately:"}</h3>
                  <ul className="list-disc pr-5 space-y-1 text-red-700 text-xs font-bold">
                    {counselStatus.when_to_call_doctor?.map((s:string, i:number) => <li key={i}>{s}</li>)}
                  </ul>
                 </div>
               </div>

               <div className="pt-4 flex justify-center">
                  <button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-900 text-white px-8 py-2 rounded-xl text-xs font-bold flex gap-2 items-center cursor-pointer shadow hover:shadow-lg transition">
                    <Printer className="w-4 h-4"/>
                    {isAr ? "طباعة الوثيقة للمريض" : "Print Patient Slip"}
                  </button>
               </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// Simple fallback icon
function PillIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <path d="m8.5 8.5 7 7" />
    </svg>
  );
}
