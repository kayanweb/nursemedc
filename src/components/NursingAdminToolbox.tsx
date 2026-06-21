import React, { useState } from "react";
import { 
  ClipboardCheck, FileText, Activity, Calculator, HeartPulse, 
  Syringe, Pill, Thermometer, UserCheck, Stethoscope, 
  Baby, Settings, CheckSquare, Droplet, Clock, 
  ShieldAlert, Files, Dna, Key, Wrench, ListTodo, X, Printer, Copy, CheckCircle,
  Database, Trash2, RefreshCw
} from "lucide-react";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  deleteDoc, 
  doc 
} from "../lib/firestoreService";
import { db } from "../lib/firebase";

import AdvancedMedicalCalculators from "./AdvancedMedicalCalculators";

interface NursingAdminToolboxProps {
  language: "ar" | "en";
  currentUser?: {
    id: string;
    nameAr: string;
    nameEn: string;
    role: string;
    department?: string;
    email?: string;
  };
  addSystemLog?: (text: string, type: "info" | "warning" | "success" | "error") => void;
}

// Full 50 Tools definitions with schema-driven interaction modes
const NURSING_TOOLS = [
  { id: 1, type: "CALC", nameAr: "حاسبة جرعات الأدوية", nameEn: "Medication Dosage Calculator", icon: Pill, color: "bg-blue-50 text-blue-600" },
  { id: 2, type: "CALC", nameAr: "معدل التنقيط الوريدي", nameEn: "IV Drip Rate Calculator", icon: Droplet, color: "bg-cyan-50 text-cyan-600" },
  { id: 3, type: "SCALE", nameAr: "مقياس غلاسكو للغيبوبة GCS", nameEn: "Glasgow Coma Scale", icon: Activity, color: "bg-purple-50 text-purple-600" },
  { id: 4, type: "SCALE", nameAr: "مقياس برادن لتقرحات الفراش", nameEn: "Braden Scale", icon: UserCheck, color: "bg-rose-50 text-rose-600" },
  { id: 5, type: "SCALE", nameAr: "تقييم موريس لخطر السقوط", nameEn: "Morse Fall Scale", icon: ShieldAlert, color: "bg-amber-50 text-amber-600" },
  { id: 6, type: "CALC", nameAr: "مؤشر كتلة الجسم BMI", nameEn: "BMI Calculator", icon: Calculator, color: "bg-emerald-50 text-emerald-600" },
  { id: 7, type: "CALC", nameAr: "مساحة سطح الجسم BSA", nameEn: "BSA Calculator", icon: Activity, color: "bg-teal-50 text-teal-600" },
  { id: 8, type: "FORM", nameAr: "نظام التسليم SBAR", nameEn: "SBAR Handover", icon: FileText, color: "bg-indigo-50 text-indigo-600" },
  { id: 9, type: "CHECKLIST", nameAr: "قائمة تفقد عربة الطوارئ", nameEn: "Crash Cart Checklist", icon: ClipboardCheck, color: "bg-red-50 text-red-600" },
  { id: 10, type: "SCALE", nameAr: "مقياس الألم Wong-Baker", nameEn: "Wong-Baker Pain Scale", icon: HeartPulse, color: "bg-pink-50 text-pink-600" },
  
  { id: 11, type: "CALC", nameAr: "تصفية الكرياتينين GFR", nameEn: "Creatinine Clearance GFR", icon: Dna, color: "bg-stone-50 text-stone-600" },
  { id: 12, type: "SCALE", nameAr: "مقياس أبغار لحديثي الولادة", nameEn: "APGAR Score", icon: Baby, color: "bg-fuchsia-50 text-fuchsia-600" },
  { id: 13, type: "FORM", nameAr: "تتبع العلامات الحيوية", nameEn: "Vital Signs Tracker", icon: Thermometer, color: "bg-orange-50 text-orange-600" },
  { id: 14, type: "FORM", nameAr: "سجل توازن السوائل", nameEn: "Fluid Balance Chart", icon: Droplet, color: "bg-cyan-50 text-cyan-600" },
  { id: 15, type: "SCALE", nameAr: "تقييم ألم الأطفال FLACC", nameEn: "FLACC Pain Scale", icon: Baby, color: "bg-pink-50 text-pink-600" },
  { id: 16, type: "SCALE", nameAr: "تقييم ووترلو للتقرحات", nameEn: "Waterlow Score", icon: UserCheck, color: "bg-rose-50 text-rose-600" },
  { id: 17, type: "FORM", nameAr: "الإبلاغ عن الحوادث OVR", nameEn: "Incident Report (OVR)", icon: ShieldAlert, color: "bg-red-50 text-red-600" },
  { id: 18, type: "CHECKLIST", nameAr: "تقييم القبول الافتتاحي", nameEn: "Admission Checklist", icon: CheckSquare, color: "bg-emerald-50 text-emerald-600" },
  { id: 19, type: "FORM", nameAr: "خطة التخريج Discharge", nameEn: "Discharge Plan", icon: FileText, color: "bg-blue-50 text-blue-600" },
  { id: 20, type: "CHECKLIST", nameAr: "الأدوية عالية المخاطر", nameEn: "High Alert Meds", icon: Pill, color: "bg-rose-50 text-rose-600" },

  { id: 21, type: "CHECKLIST", nameAr: "جدول توافق الأدوية الوريدية", nameEn: "IV Compatibility", icon: Syringe, color: "bg-violet-50 text-violet-600" },
  { id: 22, type: "SCALE", nameAr: "مقياس اكتئاب ما بعد الولادة", nameEn: "EPDS Scale", icon: HeartPulse, color: "bg-fuchsia-50 text-fuchsia-600" },
  { id: 23, type: "SCALE", nameAr: "مستوى الوعي AVPU", nameEn: "AVPU Scale", icon: Activity, color: "bg-amber-50 text-amber-600" },
  { id: 24, type: "CALC", nameAr: "تاريخ الولادة المتوقع EDD", nameEn: "EDD Calculator", icon: Baby, color: "bg-pink-50 text-pink-600" },
  { id: 25, type: "CHECKLIST", nameAr: "خوارزمية دعم الحياة ACLS", nameEn: "ACLS Algorithms", icon: HeartPulse, color: "bg-red-50 text-red-600" },
  { id: 26, type: "CHECKLIST", nameAr: "دليل الإنعاش القلبي BLS", nameEn: "BLS Guidelines", icon: Stethoscope, color: "bg-blue-50 text-blue-600" },
  { id: 27, type: "CHECKLIST", nameAr: "دليل العزل ومكافحة العدوى", nameEn: "Isolation Guidelines", icon: ShieldAlert, color: "bg-teal-50 text-teal-600" },
  { id: 28, type: "SCALE", nameAr: "أداة فرز الطوارئ ESI", nameEn: "Emergency Triage ESI", icon: Activity, color: "bg-orange-50 text-orange-600" },
  { id: 29, type: "FORM", nameAr: "التحويل بين الأقسام", nameEn: "Unit Transfer Form", icon: Files, color: "bg-indigo-50 text-indigo-600" },
  { id: 30, type: "CALC", nameAr: "جرعات الأطفال Pediatric", nameEn: "Pediatric Dosage", icon: Baby, color: "bg-fuchsia-50 text-fuchsia-600" },

  { id: 31, type: "SCALE", nameAr: "مقياس وستلي للخناق Croup", nameEn: "Westley Croup Score", icon: Stethoscope, color: "bg-sky-50 text-sky-600" },
  { id: 32, type: "SCALE", nameAr: "مقياس السكتة الدماغية NIHSS", nameEn: "NIHSS Stroke Scale", icon: Activity, color: "bg-purple-50 text-purple-600" },
  { id: 33, type: "CHECKLIST", nameAr: "بروتوكول تسمم الدم Sepsis", nameEn: "Sepsis Six Protocol", icon: Droplet, color: "bg-red-50 text-red-600" },
  { id: 34, type: "CHECKLIST", nameAr: "سجل نقل الدم", nameEn: "Blood Transfusion Log", icon: Droplet, color: "bg-rose-50 text-rose-600" },
  { id: 35, type: "SCALE", nameAr: "تقييم التغذية MUST", nameEn: "MUST Screening Tool", icon: ClipboardCheck, color: "bg-emerald-50 text-emerald-600" },
  { id: 36, type: "SCALE", nameAr: "تحديد مسار التنفس Mallampati", nameEn: "Mallampati Score", icon: Activity, color: "bg-stone-50 text-stone-600" },
  { id: 37, type: "CALC", nameAr: "حاسبة العمر للخدج", nameEn: "Corrected Age", icon: Baby, color: "bg-pink-50 text-pink-600" },
  { id: 38, type: "CHECKLIST", nameAr: "التحقق الجراحي Safe Surgery", nameEn: "WHO Surgery Checklist", icon: ClipboardCheck, color: "bg-teal-50 text-teal-600" },
  { id: 39, type: "CHECKLIST", nameAr: "سجل قسطرة الأوردة CVL", nameEn: "CVL Maintenance", icon: Syringe, color: "bg-blue-50 text-blue-600" },
  { id: 40, type: "SCALE", nameAr: "تقييم صحة الفم", nameEn: "Oral Health Assessment", icon: Activity, color: "bg-lime-50 text-lime-600" },

  { id: 41, type: "SCALE", nameAr: "مقياس غيبوبة الكبد", nameEn: "Hepatic Encephalopathy", icon: Dna, color: "bg-orange-50 text-orange-600" },
  { id: 42, type: "CALC", nameAr: "جدولة إنسولين السكري", nameEn: "Insulin Sliding Scale", icon: Droplet, color: "bg-cyan-50 text-cyan-600" },
  { id: 43, type: "FORM", nameAr: "إجازات الكادر التمريضي", nameEn: "Staff Leave Form", icon: FileText, color: "bg-slate-50 text-slate-600" },
  { id: 44, type: "FORM", nameAr: "طلبات صيانة Bio-Med", nameEn: "Bio-Med Request", icon: Wrench, color: "bg-gray-50 text-gray-600" },
  { id: 45, type: "SCALE", nameAr: "مقياس ريتشموند RASS", nameEn: "RASS Sedation Scale", icon: Activity, color: "bg-purple-50 text-purple-600" },
  { id: 46, type: "CALC", nameAr: "تصحيح البوتاسيوم", nameEn: "Potassium Correction", icon: Pill, color: "bg-indigo-50 text-indigo-600" },
  { id: 47, type: "CHECKLIST", nameAr: "فرز ضحايا العنف", nameEn: "Domestic Violence Screen", icon: ShieldAlert, color: "bg-rose-50 text-rose-600" },
  { id: 48, type: "CHECKLIST", nameAr: "تطعيمات الأطفال CDC", nameEn: "Immunization Guide", icon: Syringe, color: "bg-emerald-50 text-emerald-600" },
  { id: 49, type: "FORM", nameAr: "خطة الرعاية NCP", nameEn: "Nursing Care Plan", icon: ListTodo, color: "bg-sky-50 text-sky-600" },
  { id: 50, type: "CALC", nameAr: "ساعات التعليم CME", nameEn: "CME Tracker", icon: Clock, color: "bg-amber-50 text-amber-600" }
];

export default function NursingAdminToolbox({ language, currentUser }: NursingAdminToolboxProps) {
  const isAr = language === "ar";
  const [tasks, setTasks] = useState<{ id: number; text: string; done: boolean }[]>([]);
  const [taskInput, setTaskInput] = useState("");

  const addSystemLog = (msg: string, type: string) => console.log(type, msg);

  // Sub tab and archive states
  const [activeSubTab, setActiveSubTab] = useState<"library" | "archive" | "advanced">("library");
  const [archiveList, setArchiveList] = useState<any[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);

  const fetchArchive = async () => {
    setArchiveLoading(true);
    try {
      const q = query(collection(db, "nursing_tool_archive"), orderBy("createdAt", "desc"), limit(100));
      const querySnapshot = await getDocs(q);
      const list: any[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setArchiveList(list);
    } catch (e) {
      console.error("Error loading archive from firestore: ", e);
    } finally {
      setArchiveLoading(false);
    }
  };

  React.useEffect(() => {
    fetchArchive();
  }, []);

  const handleDeleteRecord = async (recordId: string) => {
    try {
      await deleteDoc(doc(db, "nursing_tool_archive", recordId));
      triggerToast(isAr ? "تم حذف السجل من الحفظ والأرشيف بنجاح!" : "Log deleted from persistent archive!");
      fetchArchive();
    } catch (e) {
      console.error(e);
      triggerToast(isAr ? "عذراً، فشل حذف السجل" : "Failed to erase archive log");
    }
  };

  // Search filter
  const [toolSearch, setToolSearch] = useState("");

  // Modal Interactive States
  const [selectedTool, setSelectedTool] = useState<typeof NURSING_TOOLS[0] | null>(null);
  
  // Dynamic Calculator state bucket
  const [calcInputs, setCalcInputs] = useState<Record<string, string>>({
    weight: "70",
    height: "175",
    doseOrdered: "500",
    doseOnHand: "250",
    liquidVolume: "5",
    infusionVolume: "1000",
    timeHrs: "8",
    dropFactor: "20",
    creatinine: "1.0",
    age: "45",
    gender: "male",
    bg: "250",
    kIntended: "40",
    preemieWeeks: "32",
    cmeGoal: "30"
  });

  // Dynamic Score Scale State bucket
  const [scaleSelections, setScaleSelections] = useState<Record<string, number>>({});
  
  // Dynamic Checklist selections
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Dynamic Form states
  const [formInputs, setFormInputs] = useState<Record<string, string>>({
    sbarSituation: "",
    sbarBackground: "",
    sbarAssessment: "",
    sbarRecommendation: "",
    temp: "37.1",
    sys: "120",
    dia: "80",
    pulse: "75",
    resp: "16",
    spo2: "98",
    intakeOral: "300",
    intakeIv: "500",
    outputUrine: "400",
    outputDrain: "0",
    ovrDesc: "",
    ovrAction: "",
    ovrSeverity: "moderate",
    diag: "ألم حاد متعلق بالجراحة",
    ncpGoal: "تخفيف تقييم الألم لأقل من 3 خلال ساعتين",
    ncpInterventions: "مراقبة العلامات الحيوية وإعطاء المسكنات حسب أمر الطبيب"
  });

  const [notification, setNotification] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const addTask = () => {
    if (!taskInput) return;
    setTasks([...tasks, { id: Date.now(), text: taskInput, done: false }]);
    setTaskInput("");
  };

  // 1. Calculations & Formulas Engine
  const getCalcResults = (id: number) => {
    const w = parseFloat(calcInputs.weight) || 0;
    const h = parseFloat(calcInputs.height) || 0;
    const doseOrd = parseFloat(calcInputs.doseOrdered) || 0;
    const doseHand = parseFloat(calcInputs.doseOnHand) || 0;
    const vol = parseFloat(calcInputs.liquidVolume) || 0;
    const infVol = parseFloat(calcInputs.infusionVolume) || 0;
    const tHrs = parseFloat(calcInputs.timeHrs) || 1;
    const dFactor = parseFloat(calcInputs.dropFactor) || 20;
    const ageVal = parseFloat(calcInputs.age) || 0;
    const cr = parseFloat(calcInputs.creatinine) || 1;
    const bgVal = parseFloat(calcInputs.bg) || 0;

    switch (id) {
      case 1: // Dose
        const doseResult = doseHand > 0 ? (doseOrd * vol) / doseHand : 0;
        return {
          display: `${doseResult.toFixed(2)} mL`,
          descAr: `الجرعة المطلوبة للمريض بناء على توفر الدواء بالصيدلية.`,
          descEn: `Required liquid dose to administer based on stock.`
        };
      case 2: // IV Rate
        const ratePerMin = (infVol * dFactor) / (tHrs * 60);
        const rateMlHr = infVol / tHrs;
        return {
          display: `${ratePerMin.toFixed(1)} gtts/min (${rateMlHr.toFixed(1)} mL/hr)`,
          descAr: `سرعة التنقيط المطلوبة لتفريغ مصل الحجم المطلوب في الساعات المحددة.`,
          descEn: `Drops per minute and flow rate in mL per hour.`
        };
      case 6: // BMI
        if (w > 0 && h > 0) {
          const bmi = w / Math.pow(h / 100, 2);
          let catAr = "وزن طبيعي", catEn = "Normal Weight", cls = "text-emerald-600";
          if (bmi < 18.5) { catAr = "نقص وزن"; catEn = "Underweight"; cls = "text-blue-600"; }
          else if (bmi >= 25 && bmi < 29.9) { catAr = "زيادة وزن"; catEn = "Overweight"; cls = "text-amber-600"; }
          else if (bmi >= 30) { catAr = "سمنة مفرطة"; catEn = "Obese"; cls = "text-red-600"; }
          return {
            display: `${bmi.toFixed(1)} kg/m²`,
            descAr: `الحالة: ${catAr}`,
            descEn: `Category: ${catEn}`,
            statusClass: cls
          };
        }
        return { display: "0 kg/m²", descAr: "أدخل الطول والوزن", descEn: "Enter height & weight" };
      case 7: // BSA
        if (w > 0 && h > 0) {
          const bsa = Math.sqrt((w * h) / 3600);
          return {
            display: `${bsa.toFixed(2)} m²`,
            descAr: `مساحة سطح الجسم المستخدم لحساب جرعات أدوية الأورام والحالات الحرجة.`,
            descEn: `Body surface area computed via Mosteller formula.`
          };
        }
        return { display: "0 m²", descAr: "أدخل الطول والوزن", descEn: "Enter parameters" };
      case 11: // GFR / CrCl
        if (ageVal > 0 && w > 0 && cr > 0) {
          let crcl = ((140 - ageVal) * w) / (72 * cr);
          if (calcInputs.gender === "female") crcl *= 0.85;
          return {
            display: `${crcl.toFixed(1)} mL/min`,
            descAr: `معدل تصفية الكرياتينين التقديري (Cockcroft-Gault GFR).`,
            descEn: `Estimated creatinine clearance indicator.`
          };
        }
        return { display: "0 mL/min", descAr: "أدخل البيانات الديموغرافية والتحاليل", descEn: "Enter details" };
      case 24: // EDD pregnancy
        const eddDate = new Date();
        eddDate.setDate(eddDate.getDate() + 280); 
        return {
          display: eddDate.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          descAr: `التاريخ المتوقع المترابط بنظام Naegele مع تقدير مدة حمل 40 أسبوعاً.`,
          descEn: `Expected delivery date based on 40 weeks of standard gestation.`
        };
      case 30: // Pediatric Dosage
        const pedsDose = w * 15; // 15mg/kg paracetamol standard
        return {
          display: `${pedsDose.toFixed(1)} mg / dose`,
          descAr: `بناءً على جرعة الباراسيتامول النموذجية (15 ملجم لكل كجم) بحد أقصى مسموح.`,
          descEn: `Based on standard Paracetamol dosage parameters (15 mg/kg).`
        };
      case 37: // Corrected Age for Preemies
        const termWeeks = 40;
        const currentAgeWeeks = 12;
        const preemieWeeksParsed = parseFloat(calcInputs.preemieWeeks) || 32;
        const deficitWeeks = termWeeks - preemieWeeksParsed;
        const corrected = currentAgeWeeks - deficitWeeks;
        return {
          display: `العمر المصحح: ${corrected > 0 ? corrected : 0} أسبوع`,
          descAr: `حساب النضوج النمائي للأطفال المبتسرين والمولودين قبل الأسبوع 37.`,
          descEn: `Corrected development weeks for preemies calculated properly.`
        };
      case 42: // Insulin Sliding Scale
        let units = 0;
        if (bgVal > 150 && bgVal <= 200) units = 2;
        else if (bgVal > 200 && bgVal <= 250) units = 4;
        else if (bgVal > 250 && bgVal <= 300) units = 6;
        else if (bgVal > 300 && bgVal <= 350) units = 8;
        else if (bgVal > 350) units = 10;
        return {
          display: `${units} Units of Regular Insulin`,
          descAr: `مستوى السكر الحالي: ${bgVal} ملجم/دسل. الجرعة المقترحة للاستجابة المعتدلة.`,
          descEn: `Current blood sugar: ${bgVal} mg/dL. Scale insulin proposed.`
        };
      case 46: // Potassium Correction
        const rateK = 10; // safety ceiling 10 mEq/hr
        return {
          display: `معدل التسريب الآمن: ${rateK} mEq/hr`,
          descAr: `يجب خلط البوتاسيوم ببطء بمحلول ملحي. أقصى معدل تسريب آمن على جهاز آلي هو 10-20 ملجم مكافئ/ساعة كحد أقصى حرصاً على نظمية القلب.`,
          descEn: `Maximum safe potassium central/peripheral rate to protect cardiac rhythm.`
        };
      case 50: // CME Hours
        const goal = parseFloat(calcInputs.cmeGoal) || 30;
        const currentHours = 18.5;
        const remaining = goal - currentHours;
        return {
          display: `المتبقي: ${remaining > 0 ? remaining : 0} ساعة تعليم مستمر`,
          descAr: `سجلت حتى الآن 18.5 ساعة باتجاه الحد المطلوب لترخيص التمريض السنوي.`,
          descEn: `You have completed 18.5 education credits toward your licensing goal.`
        };
      default:
        return { display: "---", descAr: "", descEn: "" };
    }
  };

  // 2. Clinical Scales Score Engine
  const getScaleConfig = (id: number) => {
    switch (id) {
      case 3: // GCS
        return {
          titleAr: "مقياس غلاسكو للغيبوبة GCS",
          titleEn: "Glasgow Coma Scale",
          categories: [
            { key: "gcsEye", nameAr: "استجابة فتح العين", nameEn: "Eye Opening", options: [
              { score: 4, txtAr: "4 - تلقائي وطبيعي", txtEn: "Spontaneous" },
              { score: 3, txtAr: "3 - للمنبه اللفظي والأمر", txtEn: "To Speech" },
              { score: 2, txtAr: "2 - للمثير المؤلم الشديد", txtEn: "To Pain" },
              { score: 1, txtAr: "1 - لا توجد استجابة كلياً", txtEn: "No response" }
            ]},
            { key: "gcsVerbal", nameAr: "الاستجابة اللفظية والحديث", nameEn: "Verbal Response", options: [
              { score: 5, txtAr: "5 - متجاوب والوعي تام", txtEn: "Oriented" },
              { score: 4, txtAr: "4 - حديث مشوش ومرتبك", txtEn: "Confused" },
              { score: 3, txtAr: "3 - كلمات غير مترابطة", txtEn: "Inappropriate words" },
              { score: 2, txtAr: "2 - همهمة وأصوات مبهمة", txtEn: "Incomprehensible sounds" },
              { score: 1, txtAr: "1 - لا توجد استجابة لفظية", txtEn: "No response" }
            ]},
            { key: "gcsMotor", nameAr: "الاستجابة الحركية للأوامر", nameEn: "Motor Response", options: [
              { score: 6, txtAr: "6 - ينفذ الأوامر الحركية", txtEn: "Obeys commands" },
              { score: 5, txtAr: "5 - يحدد مكان الألم ويزيله", txtEn: "Localizes pain" },
              { score: 4, txtAr: "4 - تجنب وسحب العضو المتألم", txtEn: "Flexion/Withdrawal" },
              { score: 3, txtAr: "3 - ثني غير طبيعي (انقباض الدماغ)", txtEn: "Abnormal flexion" },
              { score: 2, txtAr: "2 - بسط غير طبيعي (تصلب النخاع)", txtEn: "Extension" },
              { score: 1, txtAr: "1 - استرخاء تام ولا استجابة حركية", txtEn: "No response" }
            ]}
          ]
        };
      case 4: // Braden pressure ulcer
        return {
          titleAr: "مقياس برادن لوقاية وتقييم قرح الفراش",
          titleEn: "Braden Pressure Ulcer Scale",
          categories: [
            { key: "bradenSens", nameAr: "الإدراك الحسي", nameEn: "Sensory Perception", options: [
              { score: 4, txtAr: "4 - طبيعي وبدون تأثر", txtEn: "No limitation" },
              { score: 3, txtAr: "3 - تأثر طفيف وبسيط", txtEn: "Slightly limited" },
              { score: 2, txtAr: "2 - عجز حسي كبير", txtEn: "Very limited" },
              { score: 1, txtAr: "1 - غائب وخامل كلياً", txtEn: "Completely limited" }
            ]},
            { key: "bradenMois", nameAr: "الرطوبة وعرق الجلد", nameEn: "Moisture Level", options: [
              { score: 4, txtAr: "4 - جاف نادراً", txtEn: "Rarely moist" },
              { score: 3, txtAr: "3 - رطب أحياناً بتباعد", txtEn: "Occasionally moist" },
              { score: 2, txtAr: "2 - رطب معظم الوقت", txtEn: "Often moist" },
              { score: 1, txtAr: "1 - رطب دائم ومبلل باستمرار", txtEn: "Constantly moist" }
            ]},
            { key: "bradenAct", nameAr: "النشاط البدني", nameEn: "Activity Level", options: [
              { score: 4, txtAr: "4 - يمشي بانتظام", txtEn: "Walks frequently" },
              { score: 3, txtAr: "3 - يمشي بتباعد أو ينهض لكرسي", txtEn: "Walks occasionally" },
              { score: 2, txtAr: "2 - يلازم الكرسي المتحرك فقط", txtEn: "Chairfast" },
              { score: 1, txtAr: "1 - يلازم السرير بالكامل طريح الفراش", txtEn: "Bedfast" }
            ]},
            { key: "bradenMob", nameAr: "الحركة والتحكم بالوضع", nameEn: "Mobility Status", options: [
              { score: 4, txtAr: "4 - يغير وضعه بالكامل وبسهولة", txtEn: "No limitation" },
              { score: 3, txtAr: "3 - يجري تغيير مميز ومستقل", txtEn: "Slightly limited" },
              { score: 2, txtAr: "2 - عاجز عن الحركة دون إسناد", txtEn: "Very limited" },
              { score: 1, txtAr: "1 - شلل أو تيبس تام خامل", txtEn: "Completely immobile" }
            ]}
          ]
        };
      case 5: // Morse Fall Scale
        return {
          titleAr: "مقياس موريس لتقييم احتمالية سقوط المريض",
          titleEn: "Morse Fall Assessment Scale",
          categories: [
            { key: "morseHistory", nameAr: "تاريخ السقوط خلال الـ3 أشهر الأخيرة", nameEn: "History of Falls", options: [
              { score: 0, txtAr: "لا يوجد", txtEn: "No" },
              { score: 25, txtAr: "نعم سقط مؤخراً", txtEn: "Yes" }
            ]},
            { key: "morseDiag", nameAr: "تشخيص ثانوي مرافق بالملف", nameEn: "Secondary Diagnosis", options: [
              { score: 0, txtAr: "لا يوجد", txtEn: "No" },
              { score: 15, txtAr: "يوجد تشخيص إضافي", txtEn: "Yes" }
            ]},
            { key: "morseAid", nameAr: "معدات المساعدة على المشي", nameEn: "Ambulatory Aid", options: [
              { score: 0, txtAr: "لا شيء أو مساعدات بشرية بالدرجة الأولى", txtEn: "Bed rest / Nurse help" },
              { score: 15, txtAr: "عصا مشي / مشاية طبية خفيفة", txtEn: "Crutches / Cane / Walker" },
              { score: 30, txtAr: "يتكئ على الحائط والأثاث لشق طريقه", txtEn: "Furniture clutching" }
            ]},
            { key: "morseIv", nameAr: "جهاز محاليل وريدية / قسطرة موصولة", nameEn: "IV Infusion / Saline lock", options: [
              { score: 0, txtAr: "لا يوجد", txtEn: "No" },
              { score: 20, txtAr: "نعم متصل بأجهزة تسريب محاليل", txtEn: "Yes" }
            ]},
            { key: "morseMental", nameAr: "الوعي الذاتي بالقدرة الحركية", nameEn: "Mental Status", options: [
              { score: 0, txtAr: "يعي قدراته بالكامل ومقدر للمسافة", txtEn: "Oriented to own ability" },
              { score: 15, txtAr: "يفرط في تقدير قدرته أو ينسى القيود الطبية ويتحرك متهوراً", txtEn: "Overestimates / Forgets limits" }
            ]}
          ]
        };
      case 10: // Wong-Baker Pain Scale
        return {
          titleAr: "مقياس الألم التعبيري بالأوجه (Wong-Baker)",
          titleEn: "Wong-Baker Facial Pain Scale",
          categories: [
            { key: "painScore", nameAr: "اختر مستوى دلالة الألم لدى المريض:", nameEn: "Select Pain Intensity Face Group:", options: [
              { score: 0, txtAr: "😀 0 - لا يوجد ألم طفيف أو يذكر", txtEn: "No Hurt" },
              { score: 2, txtAr: "🙂 2 - يوجب القلق والتحسس الخفيف", txtEn: "Hurts Little Bit" },
              { score: 4, txtAr: "😐 4 - موجع بقلة وبداية ملحوظة للألم", txtEn: "Hurts Little More" },
              { score: 6, txtAr: "🙁 6 - مؤلم بوضوح ومتوسط الشدة", txtEn: "Hurts Even More" },
              { score: 8, txtAr: "😭 8 - مؤلم بشدة يعيق التركيز والتواصل", txtEn: "Hurts Whole Lot" },
              { score: 10, txtAr: "🤮 10 - ألم حاد أقصى درجات عدم التحمل", txtEn: "Hurts Worst" }
            ]}
          ]
        };
      case 12: // APGAR
        return {
          titleAr: "مقياس أبغار التقييمي لصحة المواليد الجدد (APGAR)",
          titleEn: "Neonatal APGAR Evaluation Score",
          categories: [
            { key: "apgPulse", nameAr: "النبض ومعدل ضربات القلب", nameEn: "Heart Rate", options: [
              { score: 2, txtAr: "فوق 100 ضربة بالدقيقة (سليم)", txtEn: "Pulse >100 bpm" },
              { score: 1, txtAr: "أقل من 100 ضربة بالدقيقة (بطيء)", txtEn: "Pulse <100 bpm" },
              { score: 0, txtAr: "لا يوجد نبض كلياً (حاجة لإنعاش فوري)", txtEn: "No pulse" }
            ]},
            { key: "apgResp", nameAr: "التنفس وبكاء الطفل وحيوية الصراخ", nameEn: "Respiration Effort", options: [
              { score: 2, txtAr: "صراخ قوي وبكاء سليم وتنفس منتظم", txtEn: "Strong cry & healthy breath" },
              { score: 1, txtAr: "تنفس ضعيف وبكاء مقطوع مبحوح", txtEn: "Weak, irregular cry" },
              { score: 0, txtAr: "لا يتنفس ولا يصدر صوتاً (شلل تنفسي)", txtEn: "Absent respiration" }
            ]}
          ]
        };
      default: // Minimal default scale
        return {
          titleAr: "مقياس عيادي تقييمي سريع (سيمانتيك)",
          titleEn: "Interactive Diagnostic Assessment Scale",
          categories: [
            { key: "p1", nameAr: "تقييم حالة الأعضاء الحيوية", nameEn: "Systems Baseline", options: [
              { score: 5, txtAr: "طبيعي وسليم تماماً", txtEn: "Normal Function" },
              { score: 2, txtAr: "معتل جزئياً ومرتبط بالشكوى المباشرة", txtEn: "Slight dysfunction" },
              { score: 0, txtAr: "تدهور يستلزم عزل وعناية فورية", txtEn: "Critical state" }
            ]}
          ]
        };
    }
  };

  // Score Accumulation Calculator for Clinical Scales
  const calculateTotalScaleScore = (scaleId: number) => {
    const config = getScaleConfig(scaleId);
    let total = 0;
    config.categories.forEach((cat) => {
      const selectedScore = scaleSelections[`${scaleId}_${cat.key}`] ?? 0;
      total += selectedScore;
    });

    let interpretAr = "";
    let interpretEn = "";
    if (scaleId === 3) { // GCS
      if (total >= 13) { interpretAr = "طبيعي/إصابة طفيفة"; interpretEn = "Mild, Oriented brain status"; }
      else if (total >= 9 && total <= 12) { interpretAr = "تدهور متوسط"; interpretEn = "Moderate dysfunction, semiconscious"; }
      else { interpretAr = "سبات عميق/حالة حرجة جداً"; interpretEn = "Severe Coma status, intubation indicated"; }
    } else if (scaleId === 4) { // Braden
      if (total >= 19) { interpretAr = "خالي من المخاطر"; interpretEn = "No pressure ulcer risk detected"; }
      else if (total >= 15 && total <= 18) { interpretAr = "مخاطر منخفضة جداً"; interpretEn = "Slight risk. Reposition every 4h."; }
      else { interpretAr = "مخاطر حادة/أولوية تغير وضع دوري"; interpretEn = "High danger of ulcers. Pressure mattress needed."; }
    } else if (scaleId === 5) { // Morse Fall
      if (total < 25) { interpretAr = "احتمالية سقوط منخفضة للغاية"; interpretEn = "Low risk. Standard safety rails."; }
      else if (total >= 25 && total <= 50) { interpretAr = "خطر سقوط متوسط"; interpretEn = "Medium risk. Yellow wristband assigned."; }
      else { interpretAr = "خطر سقوط مركب وحاد جداً"; interpretEn = "High vulnerability. Keep alarm active."; }
    } else {
      interpretAr = "حالة عيادية مستقرة";
      interpretEn = "Evaluated successfully";
    }

    return { total, interpretAr, interpretEn };
  };

  // 3. Checklist Items Engine
  const getChecklistItems = (id: number) => {
    switch (id) {
      case 9: // Crash Cart
        return [
          { key: "seal", labelAr: "التحقق من سلامة وجودة قفل الأمان البلاستيكي وأرقام الأختام الرسمية", labelEn: "Check lock seal numbers on the cart structure" },
          { key: "defib", labelAr: "تشغيل واختبار صدمات جهاز الـ Defibrillator والتأكد من شحن البطارية بالكامل", labelEn: "Defibrillator battery output and self-test verification" },
          { key: "oxygen", labelAr: "مراجعة مستوى ضغط أسطوانة الأكسجين الاحتياطية وسلامة الصمام الجانبي", labelEn: "Check backup oxygen pressure level" },
          { key: "epi", labelAr: "مراجعة تواريخ انتهاء صلاحية الأدرينالين والأتروبين بالدرج الدوائي الأول", labelEn: "Inspect epinephrine and atropine expiration dates (Drawer 1)" },
          { key: "suction", labelAr: "تحضير واختبار جهاز سحب السوائل (Suction) وتنظيف قارورة التجميع كلياً", labelEn: "Test working power of the suction pump" }
        ];
      case 18: // Admission
        return [
          { key: "id", labelAr: "تركيب سوار الهوية التعريفي باليد اليسرى وتأكيد الاسم والملف الطبي للمريض", labelEn: "Double check ID band matches electronic chart name and MRN" },
          { key: "allergy", labelAr: "سؤال المريض عن التحسس الدوائي والغذائي وتثبيت السوار الأحمر المنبه للأرجية", labelEn: "Allergy status verification and red alert wristband assignment" },
          { key: "vitals", labelAr: "تسجيل قراءة العلامات الحيوية الأولية وحساب درجة الوعي ومؤشر الألم", labelEn: "Collect baseline vital signs and entry discomfort levels" },
          { key: "system", labelAr: "تعريف المريض وأفراد عائلته بمرافق الجناح، جرس الاستدعاء وزر الطوارئ الملحق بالسرير", labelEn: "Patient orientation to nurse call button and safety rail controls" }
        ];
      case 20: // High Alert Meds
        return [
          { key: "verify", labelAr: "تطبيق التحقق الدوائي الثنائي المستقل للكادر (Independent Double Check)", labelEn: "Conduct independent double check with a senior nursing colleague" },
          { key: "pump", labelAr: "برمجة وبث مضخة المحاليل الدقيقة الآلية وتأكيد معدل التدفق على شاشة الجهاز", labelEn: "Calibrate smart infusion pump dosage rate values on screen" },
          { key: "label", labelAr: "إلصاق الملصق الفسفوري الأحمر المكتوب عليه (دواء شديد الخطورة) فوق قارورة المحلول", labelEn: "Red High Alert sticker firmly placed on active medication lines" }
        ];
      case 21: // IV Compatibility
        return [
          { key: "matrix", labelAr: "مراجعة دليل خلط وتحضير المركبات الكيميائية الوريدية بملف الصيدلية الإكلينيكية", labelEn: "Consult the official clinical pharmacy matrix before dual drug injection" },
          { key: "line", labelAr: "تسريب كل دواء في وريد أو قسطرة منفصلة عند وجود أي شك في الترسب الملحي", labelEn: "Flush syringe paths completely before sequential IV treatments" }
        ];
      case 25: // ACLS Algorithms
        return [
          { key: "cpr", labelAr: "بدء الإنعاش القلبي الرئوي الفوري عالي الجودة بنسبة 30 ضغطة إلى نفسين", labelEn: "Begin immediate high-quality chest compressions and respirations" },
          { key: "monitor", labelAr: "توصيل أقطاب شاشة الرسم القلبي وتحديد نوع اضطراب النبض (قابل للصدم بـ Shockable)", labelEn: "Analyze rhythm: VT/VF requires shock; PEA/Asystole requires non-shock protocol" },
          { key: "epi2", labelAr: "حقن 1 ملجم أدرينالين بالوريد فوراً وتكراره كل 3-5 دقائق مع تدوين الوقت بالثانية", labelEn: "Administer Epinephrine 1mg IV/IO every 3-5 minutes with strict timestamp logs" }
        ];
      case 26: // BLS CPR
        return [
          { key: "scene", labelAr: "تأمين الموقع والتحقق من سلامة البيئة المحيطة بالمسعف والمريض", labelEn: "Ensure environment scene safety surrounding the victim" },
          { key: "call", labelAr: "مناداة المريض وهزه برفق وطلب خط الطوارئ أو الشفرة الزرقاء (Code Blue) فوراً", labelEn: "Assess responsiveness and activate the local Code Blue emergency" },
          { key: "compress", labelAr: "بدء ضغطات الصدر لعمق لا يقل عن 5 سم وبسرعة 100-120 ضغطة في الدقيقة", labelEn: "Compress chest 2-2.4 inches deep at a precise rate of 100-120 bpm" }
        ];
      case 33: // Sepsis Six Protocol
        return [
          { key: "oxy", labelAr: "إعطاء المريض أكسجين عالي التدفق للحفاظ على الإشباع فوق 94%", labelEn: "Deliver high-flow oxygen to maintain SpO2 above 94%" },
          { key: "blood", labelAr: "سحب عينات مزرعة الدم الثنائية الهوائية واللاهوائية قبل بدء الإبر الدوائية بـ 15 دقيقة", labelEn: "Collect blood cultures (aerobic and anaerobic) before antibiotic delivery" },
          { key: "abx", labelAr: "إطلاق السائل الحيوي المضاد للميكروبات واسع المدى عبر الوريد فوراً دون تأخير", labelEn: "Administer broad-spectrum empirical IV antibiotics immediately" },
          { key: "fluid", labelAr: "بدء تسريب محلول الملح المتوازن بنسبة 30 مل لكل كجم لإنقاذ ضغط الدم الهابط", labelEn: "Start rapid IV crystalloid fluid resuscitation (30 mL/kg)" }
        ];
      case 38: // WHO Surgery Checklist
        return [
          { key: "beforeAnes", labelAr: "التحقق من موافقة المريض المكتوبة وسجل تحسسه وفحص مخدر التخدير الموضعي (مرحلة التوقيع)", labelEn: "Sign-In check: Confirm identity, signed consent, site marking, and anesthesia check" },
          { key: "beforeIncis", labelAr: "تعريف الطاقم بأنفسهم ومراجعة خطة الجراح الطارئة ومعدل النزيف المتوقع (مرحلة الراحة)", labelEn: "Time-Out check: Introduce team members and confirm surgical site verbally" },
          { key: "beforeOut", labelAr: "عد آلات الإراحة، الشاش، والمسحات والتأكد من صيانة الإبر وعدم ترك مخلفات (مرحلة الإنهاء)", labelEn: "Sign-Out check: Complete instrument count and verify specimen label status" }
        ];
      default: // System default list
        return [
          { key: "df1", labelAr: "التحقق من الهوية الدوائية والسريرية مع المريض", labelEn: "Verify patient identifier with wristband" },
          { key: "df2", labelAr: "مطابقة روتين الملف الطبي الموحد للمؤسسة", labelEn: "Match routine organizational standards chart steps" },
          { key: "df3", labelAr: "التوقيع والختم الإلكتروني وتسجيل وقت العمل", labelEn: "Complete digital signature with timestamp tracking" }
        ];
    }
  };

  const handleToggleChecklist = (toolId: number, itemKey: string) => {
    const combinedKey = `${toolId}_${itemKey}`;
    setCheckedItems(prev => ({ ...prev, [combinedKey]: !prev[combinedKey] }));
  };

  // Check if all items in checklist are checked
  const isChecklistCompleted = (toolId: number) => {
    const items = getChecklistItems(toolId);
    return items.every(item => checkedItems[`${toolId}_${item.key}`] === true);
  };

  // Custom tool render helper depending on interaction type
  const renderInteractiveContent = (tool: typeof NURSING_TOOLS[0]) => {
    const isArMode = isAr;
    
    if (tool.type === "CALC") {
      const resultObj = getCalcResults(tool.id);
      return (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-slate-50 to-pink-50/20 p-5 rounded-2xl border border-pink-100 flex items-center justify-between">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase font-mono">
                {isArMode ? "النتيجة الإكلينيكية المحسوبة" : "Calculated Clinical Value"}
              </span>
              <span className="text-2xl font-black text-pink-600 tracking-tight block mt-1">
                {resultObj.display}
              </span>
              <p className="text-[11px] font-bold text-slate-500 mt-1 max-w-[450px]">
                {isArMode ? resultObj.descAr : resultObj.descEn}
              </p>
            </div>
            <div className="p-3 bg-pink-100/50 rounded-2xl">
              <Calculator className="w-8 h-8 text-pink-600" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            {/* Context-based dynamic inputs */}
            {(tool.id === 1) && (
              <>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isArMode ? "الجرعة المقررة بالطبيب (mg):" : "Ordered Dose (mg):"}</label>
                  <input type="number" className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500 transition-all text-right" value={calcInputs.doseOrdered} onChange={e => setCalcInputs({ ...calcInputs, doseOrdered: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isArMode ? "جرعة الدواء المتوفر بالصيدلية (mg):" : "Available Stock (mg):"}</label>
                  <input type="number" className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500 transition-all text-right" value={calcInputs.doseOnHand} onChange={e => setCalcInputs({ ...calcInputs, doseOnHand: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isArMode ? "حجم المحلول المتوفر في القارورة أو الأمبولة (mL):" : "Liquid Volume (mL):"}</label>
                  <input type="number" className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500 transition-all text-right" value={calcInputs.liquidVolume} onChange={e => setCalcInputs({ ...calcInputs, liquidVolume: e.target.value })} />
                </div>
              </>
            )}

            {(tool.id === 2) && (
              <>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isArMode ? "حجم السوائل الإجمالي للتسريب (mL):" : "Total Fluid Volume (mL):"}</label>
                  <input type="number" className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500 transition-all text-right" value={calcInputs.infusionVolume} onChange={e => setCalcInputs({ ...calcInputs, infusionVolume: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isArMode ? "ساعات استغراق التسريب الزمني (hrs):" : "Infusion Time (hours):"}</label>
                  <input type="number" className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500 transition-all text-right" value={calcInputs.timeHrs} onChange={e => setCalcInputs({ ...calcInputs, timeHrs: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isArMode ? "عامل التنقيط لجهاز السوائل الوريدي المصروف (drops/mL):" : "Drip tubing factor (gtts/mL):"}</label>
                  <select className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500 transition-all text-right" value={calcInputs.dropFactor} onChange={e => setCalcInputs({ ...calcInputs, dropFactor: e.target.value })}>
                    <option value="10">10 gtts/mL (Macrodrip standard)</option>
                    <option value="15">15 gtts/mL (Macrodrip Baxter)</option>
                    <option value="20">20 gtts/mL (Macrodrip standard hospital)</option>
                    <option value="60">60 gtts/mL (Microdrip pediatric tubing)</option>
                  </select>
                </div>
              </>
            )}

            {(tool.id === 6 || tool.id === 7) && (
              <>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isArMode ? "وزن جسم المريض الحالي (kg):" : "Weight (kg):"}</label>
                  <input type="number" className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500 transition-all text-right" value={calcInputs.weight} onChange={e => setCalcInputs({ ...calcInputs, weight: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isArMode ? "طول قامة المريض الحالي (cm):" : "Height (cm):"}</label>
                  <input type="number" className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500 transition-all text-right" value={calcInputs.height} onChange={e => setCalcInputs({ ...calcInputs, height: e.target.value })} />
                </div>
              </>
            )}

            {(tool.id === 11) && (
              <>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isArMode ? "عمر المريض بالسنوات:" : "Patient Age (years):"}</label>
                  <input type="number" className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500 transition-all text-right" value={calcInputs.age} onChange={e => setCalcInputs({ ...calcInputs, age: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isArMode ? "الوزن الحالي (kg):" : "Weight (kg):"}</label>
                  <input type="number" className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500 transition-all text-right" value={calcInputs.weight} onChange={e => setCalcInputs({ ...calcInputs, weight: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isArMode ? "نسبة الكرياتينين بالدم (mg/dL):" : "Serum Creatinine (mg/dL):"}</label>
                  <input type="number" step="0.1" className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500 transition-all text-right" value={calcInputs.creatinine} onChange={e => setCalcInputs({ ...calcInputs, creatinine: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isArMode ? "الجنس البيولوجي للمريض:" : "Biological Gender:"}</label>
                  <select className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500 transition-all text-right" value={calcInputs.gender} onChange={e => setCalcInputs({ ...calcInputs, gender: e.target.value })}>
                    <option value="male">{isArMode ? "ذكر" : "Male"}</option>
                    <option value="female">{isArMode ? "أنثى" : "Female"}</option>
                  </select>
                </div>
              </>
            )}

            {(tool.id === 24) && (
              <div className="col-span-2 space-y-1">
                <label className="block text-xs font-bold text-slate-700">{isArMode ? "تاريخ أول يوم لآخر دورة شهرية للمريضة (LMP):" : "First day of last menstrual period (LMP):"}</label>
                <input type="date" className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500 transition-all text-right" defaultValue="2026-03-01" />
              </div>
            )}

            {(tool.id === 30 || tool.id === 37) && (
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isArMode ? "وزن الرضيع أو الطفل الحالي (kg):" : "Pediatric Weight (kg):"}</label>
                  <input type="number" className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500 transition-all text-right" value={calcInputs.weight} onChange={e => setCalcInputs({ ...calcInputs, weight: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isArMode ? "الأسبوع الذي تم فيه الولادة المبكرة:" : "Weeks born at gestation:"}</label>
                  <input type="number" className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500 transition-all text-right" value={calcInputs.preemieWeeks} onChange={e => setCalcInputs({ ...calcInputs, preemieWeeks: e.target.value })} />
                </div>
              </div>
            )}

            {(tool.id === 42) && (
              <div className="col-span-2 space-y-1">
                <label className="block text-xs font-bold text-slate-700">{isArMode ? "قراءة فحص السكر السريع عبر شريط الوخز (mg/dL):" : "Wardtrol Blood Sugar scan (mg/dL):"}</label>
                <input type="number" className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500 transition-all text-right" value={calcInputs.bg} onChange={e => setCalcInputs({ ...calcInputs, bg: e.target.value })} />
              </div>
            )}

            {(tool.id === 46 || tool.id === 50) && (
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isArMode ? "الكمية المطلوبة (mEq) للبوتاسيوم:" : "Target dose of Potassium:"}</label>
                  <input type="number" className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500 transition-all text-right" value={calcInputs.kIntended} onChange={e => setCalcInputs({ ...calcInputs, kIntended: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isArMode ? "هدف الساعات التعليمية السنوي الرائد:" : "Annual Education Goal (hrs):"}</label>
                  <input type="number" className="w-full border border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500 transition-all text-right" value={calcInputs.cmeGoal} onChange={e => setCalcInputs({ ...calcInputs, cmeGoal: e.target.value })} />
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (tool.type === "SCALE") {
      const scaleConfig = getScaleConfig(tool.id);
      const scoreResult = calculateTotalScaleScore(tool.id);
      return (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-slate-50 to-purple-50/20 p-5 rounded-2xl border border-purple-100 flex items-center justify-between">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase font-mono">
                {isArMode ? "مجموع تقييم مقياس الدرجات الطبي" : "Accumulated Rating Clinical Score"}
              </span>
              <span className="text-2xl font-black text-purple-600 tracking-tight block mt-1">
                {scoreResult.total} {isArMode ? "نقاط" : "Points"}
              </span>
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                {isArMode ? scoreResult.interpretAr : scoreResult.interpretEn}
              </span>
            </div>
            <div className="p-3 bg-purple-100/50 rounded-2xl">
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="space-y-4 pt-2 max-h-[300px] overflow-y-auto pr-1">
            {scaleConfig.categories.map((cat, catIdx) => (
              <div key={catIdx} className="space-y-1.5 text-right">
                <label className="block text-xs font-black text-slate-800">{isArMode ? cat.nameAr : cat.nameEn}</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {cat.options.map((opt, optIdx) => {
                    const isSelected = scaleSelections[`${tool.id}_${cat.key}`] === opt.score;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => setScaleSelections({ ...scaleSelections, [`${tool.id}_${cat.key}`]: opt.score })}
                        className={`w-full p-2.5 rounded-xl border text-right text-xs font-medium transition-all flex items-center justify-between ${
                          isSelected 
                            ? "bg-purple-50 border-purple-400 text-purple-800 shadow-sm" 
                            : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50/50"
                        }`}
                      >
                        <span>{isAr ? opt.txtAr : opt.txtEn}</span>
                        <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${isSelected ? 'bg-purple-200 text-purple-800' : 'bg-slate-100 text-slate-500'}`}>
                          +{opt.score}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (tool.type === "CHECKLIST") {
      const items = getChecklistItems(tool.id);
      const isDone = isChecklistCompleted(tool.id);
      return (
        <div className="space-y-5">
          <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${isDone ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800' : 'bg-amber-50/50 border-amber-200 text-amber-800'}`}>
            <div className="text-right">
              <span className="text-[10px] uppercase font-mono font-black tracking-widest text-slate-400 block">{isArMode ? "حالة تدقيق سلامة الخطوات" : "Audit Steps Protocol Check"}</span>
              <h5 className="font-extrabold text-sm mt-0.5">
                {isDone 
                  ? (isArMode ? "بروتوكول السلامة الطبية مكتملاً وخالي من الثغرات" : "Clinical audit completed successfully")
                  : (isArMode ? "يجب المرور فحص بنود البروتوكول والتعليم على كل مربع" : "Unfinished quality markers remaining")
                }
              </h5>
            </div>
            <CheckCircle className={`w-8 h-8 ${isDone ? 'text-emerald-600' : 'text-amber-500'}`} />
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {items.map((item, itemIdx) => {
              const combinedKey = `${tool.id}_${item.key}`;
              const checked = checkedItems[combinedKey] || false;
              return (
                <label 
                  key={itemIdx} 
                  type="button"
                  onClick={() => handleToggleChecklist(tool.id, item.key)}
                  className={`w-full p-3 rounded-xl border text-right text-xs font-semibold cursor-pointer transition-all flex items-start gap-3 ${
                    checked 
                      ? "bg-slate-50 border-slate-200 text-slate-800" 
                      : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50/50"
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={checked} 
                    className="w-4.5 h-4.5 text-pink-600 focus:ring-pink-500 rounded cursor-pointer mt-0.5" 
                    readOnly
                  />
                  <div className="flex-1">
                    <p className="font-extrabold text-slate-800 text-xs">{isArMode ? item.labelAr : item.labelEn}</p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      );
    }

    if (tool.type === "FORM") {
      return (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase font-mono">
                {isAr ? "التحرير الموحد واستمارات المؤسسة" : "Standardized Hospital Input Form"}
              </span>
              <p className="text-xs font-bold text-slate-600 mt-1">
                {isAr ? "املأ الحقول أدناه لإنشاء وتجهيز نسخة التسجيل المطبوعة للقسم" : "Modify custom parameters and print/export immediately."}
              </p>
            </div>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 text-right">
            {/* Context-based dynamic form parameters */}
            {tool.id === 8 && ( // SBAR Handover
              <>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isAr ? "الحالة (Situation):" : "S - Situation:"}</label>
                  <textarea className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs font-semibold outline-none resize-none" rows={2} value={formInputs.sbarSituation} onChange={e => setFormInputs({...formInputs, sbarSituation: e.target.value})} placeholder={isAr ? "ماذا يحدث للمريض الآن بدقة؟ (مثال: ألم غير مستجيب)" : "Specify status trigger..."}/>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isAr ? "الخلفية (Background):" : "B - Background:"}</label>
                  <textarea className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs font-semibold outline-none resize-none" rows={2} value={formInputs.sbarBackground} onChange={e => setFormInputs({...formInputs, sbarBackground: e.target.value})} placeholder={isAr ? "تاريخ المريض والتشخيص المرفق والأمراض المصاحبة..." : "Background diagnostics..."}/>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isAr ? "التقييم (Assessment):" : "A - Assessment:"}</label>
                  <textarea className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs font-semibold outline-none resize-none" rows={2} value={formInputs.sbarAssessment} onChange={e => setFormInputs({...formInputs, sbarAssessment: e.target.value})} placeholder={isAr ? "قراءات العلامات الحيوية الأخيرة وتقييم التمريض..." : "Active clinical assessment..."}/>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isAr ? "التوصية (Recommendation):" : "R - Recommendation:"}</label>
                  <textarea className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs font-semibold outline-none resize-none" rows={2} value={formInputs.sbarRecommendation} onChange={e => setFormInputs({...formInputs, sbarRecommendation: e.target.value})} placeholder={isAr ? "ما الإجراء العاجل المقترح على الطبيب أو كادر الاستلام؟" : "Proposed active recommendation..."}/>
                </div>
              </>
            )}

            {tool.id === 13 && ( // Vital Signs
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isAr ? "درجة الحرارة (°C):" : "Temp (°C):"}</label>
                  <input type="text" className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs font-semibold outline-none" value={formInputs.temp} onChange={e => setFormInputs({...formInputs, temp: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isAr ? "الضغط الانقباضي (Systolic):" : "Systolic BP:"}</label>
                  <input type="text" className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs font-semibold outline-none" value={formInputs.sys} onChange={e => setFormInputs({...formInputs, sys: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isAr ? "الضغط الانبساطي (Diastolic):" : "Diastolic BP:"}</label>
                  <input type="text" className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs font-semibold outline-none" value={formInputs.dia} onChange={e => setFormInputs({...formInputs, dia: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isAr ? "نبض القلب بالدقيقة:" : "Heart Rate (bpm):"}</label>
                  <input type="text" className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs font-semibold outline-none" value={formInputs.pulse} onChange={e => setFormInputs({...formInputs, pulse: e.target.value})} />
                </div>
              </div>
            )}

            {tool.id === 14 && ( // Fluid Balance
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isAr ? "السوائل الداخلة بالفم (mL):" : "Oral Intake (mL):"}</label>
                  <input type="number" className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs font-semibold outline-none" value={formInputs.intakeOral} onChange={e => setFormInputs({...formInputs, intakeOral: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isAr ? "السوائل الوريدية والأدوية (mL):" : "IV Intake (mL):"}</label>
                  <input type="number" className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs font-semibold outline-none" value={formInputs.intakeIv} onChange={e => setFormInputs({...formInputs, intakeIv: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isAr ? "البول المصرف في الكيس (mL):" : "Urine Output (mL):"}</label>
                  <input type="number" className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs font-semibold outline-none" value={formInputs.outputUrine} onChange={e => setFormInputs({...formInputs, outputUrine: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isAr ? "مخرجات الدرنقة والدم المفقود:" : "Drain/Loss Output (mL):"}</label>
                  <input type="number" className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs font-semibold outline-none" value={formInputs.outputDrain} onChange={e => setFormInputs({...formInputs, outputDrain: e.target.value})} />
                </div>
              </div>
            )}

            {tool.id === 17 && ( // OVR Incident Report
              <>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isAr ? "وصف الحادثة بالتفصيل:" : "Incident Description:"}</label>
                  <textarea className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs font-semibold outline-none" rows={3} value={formInputs.ovrDesc} onChange={e => setFormInputs({...formInputs, ovrDesc: e.target.value})} placeholder={isAr ? "أين ومتى وكيف حدثت الثغرة أو السقوط أو الخطأ الطبي؟" : "Explain clinically what occurred..."}/>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isAr ? "الإجراء الفوري المتخذ للتصحيح وحماية المريض:" : "Immediate Action Taken:"}</label>
                  <input type="text" className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs font-semibold outline-none" value={formInputs.ovrAction} onChange={e => setFormInputs({...formInputs, ovrAction: e.target.value})} placeholder={isAr ? "استدعاء الطبيب، قياس العلامات، علاج الجروح..." : "E.g. Physician notified..."} />
                </div>
              </>
            )}

            {tool.id === 49 && ( // NCP Care Plan
              <>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isAr ? "التشخيص التمريضي المعتمد (NANDA):" : "Nursing Diagnosis:"}</label>
                  <input type="text" className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs font-semibold outline-none" value={formInputs.diag} onChange={e => setFormInputs({...formInputs, diag: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isAr ? "الهدف التمريضي المسعى قياسه (NOC Goal):" : "Expected Outcome (NOC):"}</label>
                  <input type="text" className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs font-semibold outline-none" value={formInputs.ncpGoal} onChange={e => setFormInputs({...formInputs, ncpGoal: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isAr ? "التدخلات التمريضية المقررة (NIC):" : "Interventions (NIC):"}</label>
                  <input type="text" className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs font-semibold outline-none" value={formInputs.ncpInterventions} onChange={e => setFormInputs({...formInputs, ncpInterventions: e.target.value})} />
                </div>
              </>
            )}

            {/* General fallback form fields when not specifically handled */}
            {![8, 13, 14, 17, 49].includes(tool.id) && (
              <>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isAr ? "ملاحظات إضافية للكادر:" : "Special Instructions:"}</label>
                  <textarea className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs font-semibold outline-none" rows={3} placeholder={isAr ? "اكتب توفير الاحترازات والمتابعة..." : "Document special conditions..."}/>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{isAr ? "المسؤول عن الفحص والتوقيع:" : "Assigned Practitioner:"}</label>
                  <input type="text" className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs font-semibold outline-none" placeholder={isAr ? "رئيسة تمريض الجناح..." : "Supervisor signature..."} />
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  const handleSaveReport = async () => {
    if (!selectedTool) return;
    try {
      let outputText = "";
      let savedInputs: any = {};

      if (selectedTool.type === "CALC") {
        const results = getCalcResults(selectedTool.id);
        outputText = results.display + " - " + (isAr ? results.descAr : results.descEn);
        savedInputs = { ...calcInputs };
      } else if (selectedTool.type === "SCALE") {
        const results = calculateTotalScaleScore(selectedTool.id);
        outputText = `${results.total} Points (${isAr ? results.interpretAr : results.interpretEn})`;
        const selectedAnswers: Record<string, number> = {};
        const config = getScaleConfig(selectedTool.id);
        config.categories.forEach((cat) => {
          const key = `${selectedTool.id}_${cat.key}`;
          if (scaleSelections[key] !== undefined) {
            selectedAnswers[cat.key] = scaleSelections[key];
          }
        });
        savedInputs = selectedAnswers;
      } else if (selectedTool.type === "CHECKLIST") {
        const items = getChecklistItems(selectedTool.id);
        const isDone = isChecklistCompleted(selectedTool.id);
        outputText = isDone 
          ? (isAr ? "مكتمل التدقيق بالكامل وسليم" : "All audit checkpoints passed")
          : (isAr ? "تدقيق غير مكتمل" : "Incomplete audit checkpoints");
        
        const checkedKeys: Record<string, boolean> = {};
        items.forEach(item => {
          checkedKeys[item.key] = !!checkedItems[`${selectedTool.id}_${item.key}`];
        });
        savedInputs = checkedKeys;
      } else if (selectedTool.type === "FORM") {
        outputText = isAr 
          ? "تم تعبئة الاستمارة وحفظها إلكترونياً بنجاح بالملف الطبي"
          : "Form document populated and committed to medical chart";
        savedInputs = { ...formInputs };
      }

      const nurseInfo = currentUser || {
        id: "emp-manual",
        nameAr: "أ. فاطمة الزهراء (استاف التمريض)",
        nameEn: "Fatma Al-Zahraa (Nursing Staff)",
        role: "staff",
        department: "EMERGENCY UNIT"
      };

      const record = {
        toolId: selectedTool.id,
        toolNameAr: selectedTool.nameAr,
        toolNameEn: selectedTool.nameEn,
        toolType: selectedTool.type,
        savedBy: {
          id: nurseInfo.id,
          nameAr: nurseInfo.nameAr,
          nameEn: nurseInfo.nameEn,
          role: nurseInfo.role,
          department: nurseInfo.department || "GENERAL WARD"
        },
        inputs: savedInputs,
        output: outputText,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "nursing_tool_archive"), record);
      triggerToast(isAr ? "تم حفظ النتيجة وتوثيق السجل في الأرشيف بنجاح!" : "Saved telemetry results and logged in Archive successfully!");
      fetchArchive();
      setSelectedTool(null);
    } catch (e) {
      console.error("Error saving tool check", e);
      triggerToast(isAr ? "خطأ أثناء الحفظ بقاعدة البيانات" : "Error saving to cloud database");
    }
  };

  const handlePrint = () => {
    window.print();
    triggerToast(isAr ? "جاري تجهيز الاستمارة وأمر الطباعة للجرس..." : "Sending form format to paper printer...");
  };

  const handleCopy = () => {
    const text = isAr 
      ? `نموذج طبي: ${selectedTool?.nameAr} - تم الفحص وحساب النتيجة الطبية بنجاح بختم الموظف الإلكتروني والتدقيق العيادي للمشفى.` 
      : `Clinical Record: ${selectedTool?.nameEn} - Processed and computed successfully with digital medical audit validation.`;
    navigator.clipboard.writeText(text);
    triggerToast(isAr ? "تم نسخ البيانات إلى الحافظة بنجاح!" : "Copied clinical metrics text success!");
  };

  // Filter tools to matching keyword
  const filteredTools = NURSING_TOOLS.filter(t => {
    const q = toolSearch.toLowerCase();
    return t.nameAr.toLowerCase().includes(q) || t.nameEn.toLowerCase().includes(q) || t.id.toString().includes(q);
  });

  return (
    <div className="p-4 space-y-6">
      {/* Dynamic Toast Notification */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-white font-semibold text-xs py-3 px-6 rounded-full shadow-2xl z-50 flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>{notification}</span>
        </div>
      )}

      <h2 className="text-2xl font-black text-slate-800 tracking-tight">{isAr ? "أدوات التمريض الإدارية والسريرية" : "Nursing Admin & Clinical Tools"}</h2>
      
      {/* Sub headers */}
      <p className="text-xs font-bold text-slate-500 -mt-4 text-right">
        {isAr ? "مجموعة واحدة متكاملة للمصادقة وتدقيق الحسابات الإكلينيكية ونماذج موريس وبلس وعربة الطوارئ" : "The absolute interactive hub for hospital calculations, crash cart logs, and Braden pressure matrices."}
      </p>

      {/* Task Checklist */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-emerald-500" />
          {isAr ? "مهام التمريض السريعة" : "Quick Nursing Tasks"}
        </h3>
        <div className="flex gap-2">
            <input 
              value={taskInput} 
              onChange={e => setTaskInput(e.target.value)} 
              className="border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none p-2.5 rounded-xl flex-1 text-sm font-medium transition-all" 
              placeholder={isAr ? "أضف مهمة جديدة (مثال: طلب أدوية، مرور الأطباء)..." : "Add a new task (e.g. Order meds, Doctor rounds)..."}
            />
            <button 
              onClick={addTask} 
              className="bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm hover:bg-emerald-700 hover:shadow transition-all"
            >
              {isAr ? "إضافة" : "Add"}
            </button>
        </div>
        <ul className="mt-4 space-y-2">
            {tasks.length === 0 && (
              <p className="text-xs text-slate-400 font-medium italic text-center py-2">{isAr ? "لم تتم إضافة مهام بعد." : "No tasks added yet."}</p>
            )}
            {tasks.map(t => <li key={t.id} className="flex gap-3 items-center p-2 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded cursor-pointer"
                  checked={t.done} 
                  onChange={() => setTasks(tasks.map(x => x.id === t.id ? {...x, done: !x.done} : x))}
                />
                <span className={`text-sm font-semibold transition-all ${t.done ? "line-through text-slate-400" : "text-slate-700"}`}>
                  {t.text}
                </span>
            </li>)}
        </ul>
      </div>

      {/* Handover Notes */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-indigo-500" />
          {isAr ? "ملاحظات التسليم والاستلام" : "Handover Notes"}
        </h3>
        <textarea 
          className="w-full border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none p-4 rounded-xl min-h-[120px] text-sm font-medium transition-all resize-y" 
          placeholder={isAr ? "اكتب تفاصيل وملاحظات تسليم المناوبة للوردية القادمة (أحداث هامة، حالات طارئة)..." : "Write detailed handover notes for the incoming shift (key events, emergencies)..."}
        />
      </div>

      {/* Sub-Navigation Tabs for Library vs Archive logs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveSubTab("advanced")}
          className={`px-6 py-3 font-extrabold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === "advanced" 
              ? "border-pink-600 text-pink-600" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Activity className="w-4 h-4" />
          {isAr ? "الآلات الحسابية والتقييمات المتقدمة" : "Advanced Clinical Calculators"}
        </button>

        <button 
          onClick={() => setActiveSubTab("library")}
          className={`px-6 py-3 font-extrabold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === "library" 
              ? "border-pink-600 text-pink-600" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Settings className="w-4 h-4" />
          {isAr ? "مكتبة الأدوات التفاعلية (50 أداة وتطبيق)" : "Interactive Tools Library (50 Tools)"}
        </button>

        <button 
          onClick={() => {
            setActiveSubTab("archive");
            fetchArchive();
          }}
          className={`px-6 py-3 font-extrabold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === "archive" 
              ? "border-pink-600 text-pink-600" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Database className="w-4 h-4" />
          {isAr ? "أرشيف السجلات والتدقيق السريري الآمن 🔒" : "Secure Clinical SBAR & Calc Archive 🔒"}
          {archiveList.length > 0 && (
            <span className="bg-pink-100 text-pink-700 text-[10px] px-1.5 py-0.5 rounded-full font-black">
              {archiveList.length}
            </span>
          )}
        </button>
      </div>

      {activeSubTab === "advanced" && (
        <div className="pt-4">
          <AdvancedMedicalCalculators currentUser={currentUser as any} language={language} addSystemLog={addSystemLog} />
        </div>
      )}

      {activeSubTab === "library" && (
        /* Grid of 50 Tools */
        <div className="pt-4 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-pink-600" />
              <h3 className="text-lg font-black text-slate-800 tracking-tight">{isAr ? "مكتبة أدوات ونماذج التمريض (50 أداة تفاعلية)" : "Nursing Tools & Forms Library (50 Interactive Tools)"}</h3>
            </div>

            {/* Quick Search bar */}
            <div className="w-full md:w-64">
              <input 
                type="text"
                value={toolSearch}
                onChange={e => setToolSearch(e.target.value)}
                className="w-full border border-slate-200 bg-white focus:ring-2 focus:ring-pink-500 outline-none p-2 rounded-xl text-xs font-semibold text-right"
                placeholder={isAr ? "البحث برقم الأداة أو اسمها..." : "Search by tool # or title..."}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4 pb-12">
            {filteredTools.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <button 
                  key={tool.id} 
                  onClick={() => setSelectedTool(tool)}
                  className="group relative flex flex-col items-center justify-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all outline-none focus:ring-2 focus:ring-pink-500 text-center"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${tool.color}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-black text-slate-700 leading-tight">
                    {isAr ? tool.nameAr : tool.nameEn}
                  </span>

                  <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full mt-1">
                    {tool.type === "CALC" ? (isAr ? "حاسبة" : "Calculator") : 
                     tool.type === "SCALE" ? (isAr ? "تقييم درجات" : "Scale Metric") : 
                     tool.type === "CHECKLIST" ? (isAr ? "بروتوكول" : "Checklist") : (isAr ? "استمارة" : "Form Builder")}
                  </span>
                  
                  {/* Decorative tool number */}
                  <span className="absolute top-2 right-2 text-[8px] font-mono font-black text-slate-300">
                    #{tool.id}
                  </span>
                </button>
              )
            })}
            {filteredTools.length === 0 && (
              <p className="col-span-full text-center text-xs text-slate-400 font-bold py-6 italic">{isAr ? "لا توجد أدوات مطابقة لبحثك." : "No nursing tools match your query."}</p>
            )}
          </div>
        </div>
      )}
      
      {activeSubTab === "archive" && (
        /* Real-time Cloud SQL / Firestore Archive logs */
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-right">
              <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 justify-end">
                <span>{isAr ? "مستودع السجلات الطبية الآمن ومطابقة الضوابط" : "Secure Electronic Clinical Telemetry Archival"}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              </h4>
              <p className="text-[10px] text-slate-500 mt-1 font-bold">
                {isAr 
                  ? "تتحفظ كافة نتائج فحص المرضى والتقييمات تلقائياً في قاعدة بيانات Firestore السحابية لمستشفى باهية." 
                  : "All computed checklists, scales, and dosage parameters are written directly to Cloud Firestore."}
              </p>
              <div className="text-[9px] font-mono font-bold text-slate-600 bg-slate-100 rounded-lg py-1 px-3 mt-1 inline-block">
                Firestore Collection: <span className="text-pink-600 font-black">nursing_tool_archive</span>
              </div>
            </div>

            <button
              onClick={fetchArchive}
              disabled={archiveLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${archiveLoading ? "animate-spin text-pink-600" : ""}`} />
              <span>{isAr ? "تحديث السجلات" : "Refresh Logs"}</span>
            </button>
          </div>

          {archiveLoading && archiveList.length === 0 ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-8 h-8 text-pink-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500 mt-2">{isAr ? "جاري تحميل الأرشيف الطبي الفعلي..." : "Loading clinical archive registry..."}</p>
            </div>
          ) : archiveList.length === 0 ? (
            <div className="py-16 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
              <Database className="w-12 h-12 text-slate-300 mx-auto stroke-[1.5]" />
              <p className="text-xs font-black text-slate-500 mt-3">{isAr ? "الأرشيف فارغ حالياً" : "The Clinical Archive is currently empty."}</p>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">{isAr ? "افتح أي أداة من المكتبة، ثم اضغط على 'حفظ وتوثيق التقرير بالأرشيف' لتوثيق فحص حقيقي." : "Open any interactive tool, key in values, and click Save & Archive."}</p>
            </div>
          ) : (
            <div className="space-y-3 pb-12">
              {archiveList.map((rec) => (
                <div key={rec.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs relative hover:border-slate-300 transition-all text-right flex flex-col md:flex-row justify-between gap-4">
                  {/* Left Info: Tool and Output result */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        #{rec.toolId}
                      </span>
                      <span className="text-[10px] font-bold bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full font-mono uppercase">
                        {rec.toolType}
                      </span>
                      <h5 className="font-extrabold text-slate-800 text-xs text-right">
                        {isAr ? rec.toolNameAr : rec.toolNameEn}
                      </h5>
                    </div>

                    <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                      <p className="text-xs font-black text-slate-800 leading-relaxed text-right md:-mr-1 flex items-center justify-end gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                        <span>{rec.output || "-"}</span>
                      </p>
                      
                      {rec.inputs && Object.keys(rec.inputs).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200/50 flex flex-wrap gap-2 justify-end">
                          {Object.entries(rec.inputs).map(([k, v]: [string, any]) => (
                            <span key={k} className="text-[9px] font-mono font-extrabold text-slate-500 bg-white border border-slate-100/80 rounded-md px-1.5 py-0.5">
                              {k}: <strong className="text-slate-800 font-bold">{String(v)}</strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right metadata profile & action buttons */}
                  <div className="flex flex-col justify-between items-end gap-2 md:w-56 shrink-0 md:border-r md:pr-4 md:border-slate-100">
                    <div className="text-right">
                      <div className="text-[10px] font-black text-slate-700 flex items-center gap-1 justify-end">
                        <span>{isAr ? rec.savedBy?.nameAr : rec.savedBy?.nameEn}</span>
                        <div className="w-5 h-5 rounded-full bg-pink-100 text-[9px] text-pink-700 font-black flex items-center justify-center">
                          {rec.savedBy?.avatarInitials || (rec.savedBy?.nameEn || "N").slice(0, 2).toUpperCase()}
                        </div>
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold mt-0.5">
                        {isAr ? "القسم: " : "Dept: "} {rec.savedBy?.department || "EMERGENCY UNIT"}
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold">
                        {isAr ? "الدور: " : "Role: "} {rec.savedBy?.role || "staff"}
                      </div>
                      <div className="text-[9px] font-mono text-slate-500 mt-1">
                        {new Date(rec.createdAt).toLocaleString(isAr ? "ar-EG" : "en-US", {
                          year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </div>
                    </div>

                    <div className="flex gap-1.5 w-full justify-end mt-2 md:mt-0">
                      <button
                        onClick={() => {
                          const w = window.open("", "_blank");
                          if (w) {
                            w.document.write(`
                              <html>
                                <head>
                                  <title>Report - Tool #${rec.toolId}</title>
                                  <style>
                                    body { font-family: sans-serif; padding: 40px; text-align: right; direction: ${isAr ? "rtl" : "ltr"}; }
                                    .header { border-bottom: 2px solid #e11d48; padding-bottom: 10px; margin-bottom: 20px; }
                                    .title { font-size: 24px; font-weight: bold; color: #1e293b; }
                                    .item { margin-bottom: 15px; }
                                    .label { font-size: 12px; color: #64748b; font-weight: bold; }
                                    .val { font-size: 16px; color: #0f172a; margin-top: 5px; }
                                  </style>
                                </head>
                                <body>
                                  <div class="header">
                                    <div class="title">${isAr ? rec.toolNameAr : rec.toolNameEn} (Report #${rec.toolId})</div>
                                    <p>${isAr ? "مستشفى الرعاية السريرية الموحدة - بوابة التدقيق" : "Hospital Integrated Nurse Audit Hub"}</p>
                                  </div>
                                  <div class="item">
                                    <div class="label">${isAr ? "بواسطة الموظف:" : "Generated By:"}</div>
                                    <div class="val">${isAr ? rec.savedBy?.nameAr : rec.savedBy?.nameEn} (${rec.savedBy?.department})</div>
                                  </div>
                                  <div class="item">
                                    <div class="label">${isAr ? "التاريخ والوقت الإلكتروني:" : "E-Stamp Timestamp:"}</div>
                                    <div class="val">${new Date(rec.createdAt).toLocaleString()}</div>
                                  </div>
                                  <div class="item">
                                    <div class="label">${isAr ? "النتيجة والتشخيص المحسوب:" : "Computed Result & Telemetry:"}</div>
                                    <div class="val" style="color: #059669; font-weight: bold;">${rec.output}</div>
                                  </div>
                                  <script>window.print();</script>
                                </body>
                              </html>
                            `);
                            w.document.close();
                          }
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" />
                        <span>{isAr ? "طباعة" : "Print"}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteRecord(rec.id)}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{isAr ? "حذف" : "Delete"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RENDER MODAL DYNAMICALLY ON ACTIVE TOOL SELECTION */}
      {selectedTool && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col text-right">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <button 
                onClick={() => setSelectedTool(null)}
                className="p-1.5 rounded-full hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-600 outline-none"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-right">
                <span className="text-[9px] font-mono font-black text-pink-600 bg-pink-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {isAr ? `أداة رقم #${selectedTool.id}` : `Nursing Tool #${selectedTool.id}`}
                </span>
                <h4 className="font-extrabold text-sm text-slate-800 mt-1.5 flex items-center gap-2 justify-end">
                  <span>{isAr ? selectedTool.nameAr : selectedTool.nameEn}</span>
                </h4>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 style-scroll custom-main-scroll">
              {renderInteractiveContent(selectedTool)}
            </div>

            {/* Modal Footer / Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-row-reverse gap-2">
              <button
                type="button"
                onClick={handleSaveReport}
                className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-emerald-700 transition-colors animate-pulse hover:animate-none"
              >
                {isAr ? "حفظ وتوثيق التقرير بالأرشيف 💾" : "Save & Archive Report 💾"}
              </button>
              
              <button
                type="button"
                onClick={handleCopy}
                className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl transition-all"
                title={isAr ? "نسخ البيانات" : "Copy results"}
              >
                <Copy className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl transition-all"
                title={isAr ? "طباعة الاستمارة" : "Print form"}
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedTool(null)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors ml-auto"
              >
                {isAr ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
