import React, { useState, useEffect, useRef } from "react";
import { 
  Users, Calendar, Clock, ClipboardList, Activity, FileText, 
  CheckCircle2, Printer, Save, HeartPulse, RefreshCw, Layers, ShieldAlert,
  Sliders, ArrowRight, Table, Syringe, Sparkles, CheckCircle, HelpCircle, 
  ClipboardList as ClipboardIcon, Plus, Edit3, Lock, Unlock
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { useSettings } from "../context/SettingsContext";
import { DynamicProfessionalLogo } from "./DynamicProfessionalLogo";

interface Props {
  language: "ar" | "en";
}

// Helper to dynamically infer and generate logo/badge based on Institution Name in Settings
const renderDynamicLogo = (nameAr: string, nameEn: string, isAr: boolean, taglineAr?: string, taglineEn?: string) => {
  return (
    <DynamicProfessionalLogo 
      nameAr={nameAr} 
      nameEn={nameEn} 
      taglineAr={taglineAr} 
      taglineEn={taglineEn} 
      isAr={isAr} 
      size="md" 
    />
  );
};

// Default initial profiles matching the PDFs for quick seeding
const MOCK_ASSIGNMENT_INITIAL = {
  date: "2026-06-19",
  supervisor: "Mr. Amir Khedr",
  education: "Bachelor of Nursing (BScN)",
  icuStartPT: "7",
  inpatientStartPT: "9",
  departments: {
    opd: { hn: "Mona Hassan", staffDay: "Reham Ali, Samah Saad", staffNight: "Noha Fawzy", na: "Ahmed Sayed", intern: "Kareem Omar" },
    chemo: { hn: "Fatma Khaled", CN: "Sara Ahmed", staffDay: "Yasmine Maher, Ola Kamel", staffNight: "Mona Adel", intern: "Hend Mahmoud", na: "Amal Saad" },
    radio: { 
      hn: "Wafaa Nabil", CN: "Noha Aly",
      unit1_staff: "Dina Ibrahim", unit1_na: "Hanan Gamal",
      unit2_staff: "Sherihan Fawzy", unit2_na: "Zainab Ali",
      unit3_staff: "Fatma Said", unit3_na: "Eman Hassan"
    },
    navigator: "Mai Galal",
    ct: { sn: "Asmaa Gamal", na: "Reda Ahmed" },
    radiotherapy: { hn: "Somaya Ali", staff: "Nagwa Mohsen", na: "Rania Abdelrahim" },
    icu: { hn: "Tarek Kamal", CN: "Taha Mohamed", staffDay: "Ahmed Hossni, Karim Karam", staffNight: "Mohamed Awad, Yassmin", intern: "Khaled Ali", na: "Shahed Adel" },
    or: { hn: "Sahar Mahmoud", scarp: "Maha Ibrahim, Sama Hussin, Amani Ezzat", anesth: "Mohamed Hussin, Hend Nasser", intern: "Mohamed Yasser", na: "Alaa Anwer" },
    cssd: { hn: "Gamal Abdelaziz", tec: "Ayman Roshdy, Mamdouh Ali", na: "Ramy Gamal" },
    inp: { hn: "Zeinab Hassan", CN: "Dalia", staffDay: "Shahed Refaat, Samar Ramadan", staffNight: "Walaa Kamel", intern: "Eman Darwish", na: "Eman Omar" },
    er: { staffDay: "Omar Ahmed, Ahmed Mohamed", staffNight: "Shady Reda", intern: "Mina George", na: "Ebtesam" }
  }
};

const MOCK_DAILY_REPORT_INITIAL = {
  date: "2026-06-19",
  shift: "Night",
  supervisor: "Amir Khedr",
  units: {
    icu: { totalBeds: 12, start: 7, admission: 1, transferIn: 0, transferOut: 0, discharge: 0, death: 0, rrt: 0 },
    imcu: { totalBeds: 4, start: 0, admission: 0, transferIn: 0, transferOut: 0, discharge: 0, death: 0, rrt: 0 },
    inpatient: { totalBeds: 26, start: 9, admission: 0, transferIn: 0, transferOut: 0, discharge: 1, death: 0, rrt: 0 },
    ironTransfusion: { totalBeds: 0, start: 0, admission: 0, transferIn: 0, transferOut: 0, discharge: 0, death: 0, rrt: 0 }
  },
  clinics: {
    chemotherapy: 45,
    anthesis: 12,
    painManagement: 8,
    echo: 15,
    woundDressing: 24,
    assessmentSurgery: 19,
    assessmentRadiotherapy: 14,
    radiationPt: 35,
    hormone: 28,
    surgery: 22,
    nutrition: 18,
    ecg: 10,
    ctRadiology: 12,
    assessmentHermon: 9,
    ctRadiotherapy: 11
  },
  radiology: {
    unite1: 14,
    unite2: 18,
    unite3: 16
  }
};

const MOCK_NURSING_CENSUS_INITIAL = {
  date: "2026-06-19",
  shift: "Night",
  supervisor: "Amir Khedr",
  rows: {
    icu: { beds: 12, actualPt: 7, hn: 1, cn: 1, sn: 5, newHire: 0, naP: 1, is: 1, tec: 0 },
    imcu: { beds: 4, actualPt: 0, hn: 0, cn: 0, sn: 0, newHire: 0, naP: 0, is: 0, tec: 0 },
    inpatient: { beds: 26, actualPt: 9, hn: 0, cn: 1, sn: 2, newHire: 0, naP: 1, is: 1, tec: 0 },
    er: { beds: 4, actualPt: 0, hn: 0, cn: 1, sn: 1, newHire: 0, naP: 1, id: 0, tec: 0 },
    or: { beds: 4, actualPt: 0, hn: 0, cn: 1, sn: 4, newHire: 0, naP: 1, id: 1, tec: 0 },
    chemo: { beds: 18, actualPt: 0, hn: 0, cn: 0, sn: 0, newHire: 0, naP: 0, is: 0, tec: 0 },
    radio: { beds: 4, actualPt: 0, hn: 0, cn: 0, sn: 0, newHire: 0, naP: 0, is: 0, tec: 0 },
    radiotherapy: { beds: 9, actualPt: 0, hn: 0, cn: 0, sn: 0, newHire: 0, naP: 0, is: 0, tec: 0 },
    cssd: { beds: 5, actualPt: 0, hn: 0, cn: 0, sn: 0, newHire: 0, naP: 0, is: 0, tec: 1 }
  },
  ventStatus: {
    icu: { onPt: 2, free: 5, outOfOrder: 0 },
    er: { onPt: 0, free: 1, outOfOrder: 0 }
  }
};

const MOCK_CHECKLISTS_OBSERVATIONS_INITIAL = {
  date: "2026-06-19",
  auditor: "Ammar Soliman",
  wings: ["2nd Floor (INP)", "ICU Ward", "ER Trauma Zone", "Chemo Suite"],
  items: [
    { id: "assignSheet", textAr: "ورقة توزيع المهام (Assignment sheet)", textEn: "Assignment sheet", status: { 0: "DONE", 1: "DONE", 2: "DONE", 3: "DONE" } },
    { id: "infControl", textAr: "مؤشرات مكافحة العدوى (Infection control dominator)", textEn: "Infection control dominator", status: { 0: "NA", 1: "DONE", 2: "DONE", 3: "DONE" } },
    { id: "roomTemp", textAr: "درجات حرارة الغرف (Room Temp)", textEn: "Room Temp", status: { 0: "DONE", 1: "DONE", 2: "DONE", 3: "DONE" } },
    { id: "fridgeTemp", textAr: "حرارة ثلاجة الأدوية (Refrigerator temp)", textEn: "Refrigerator temp", status: { 0: "DONE", 1: "DONE", 2: "DONE", 3: "DONE" } },
    { id: "ppeKit", textAr: "توافر مستلزمات الحماية (PPE Kit)", textEn: "PPE Kit", status: { 0: "DONE", 1: "DONE", 2: "DONE", 3: "DONE" } },
    { id: "airwayKit", textAr: "جاهزية أدوات ممر الهواء (Air way kit)", textEn: "Air way kit", status: { 0: "DONE", 1: "DONE", 2: "DONE", 3: "DONE" } },
    { id: "clinicalAlarm", textAr: "فاعلية صفارات المونيتور (Clinical alarm)", textEn: "Clinical alarm", status: { 0: "DONE", 1: "DONE", 2: "DONE", 3: "DONE" } },
    { id: "fixedAssets", textAr: "فحص العهدة الثابتة (Fixed assets list)", textEn: "Fixed assets list", status: { 0: "DONE", 1: "DONE", 2: "DONE", 3: "DONE" } },
    { id: "biomedicalInv", textAr: "جرد الأجهزة الطبية (Biomedical inventory)", textEn: "Biomedical inventory", status: { 0: "DONE", 1: "DONE", 2: "DONE", 3: "DONE" } },
    { id: "emerMeds", textAr: "أدوية الطوارئ الأساسية (Emergency medication)", textEn: "Emergency medication", status: { 0: "DONE", 1: "DONE", 2: "DONE", 3: "DONE" } },
    { id: "dressingCart", textAr: "ترتيب عربة الغيارات (Dressing cart list)", textEn: "Dressing cart list", status: { 0: "DONE", 1: "DONE", 2: "DONE", 3: "DONE" } },
    { id: "dcShock", textAr: "فاحص الصدمات الكهربائية (D.C shock list)", textEn: "D.C shock list", status: { 0: "DONE", 1: "DONE", 2: "DONE", 3: "DONE" } },
    { id: "laryngoscope", textAr: "جاهزية المنظار الحنجري (Laryngoscope check)", textEn: "Laryngoscope check", status: { 0: "DONE", 1: "DONE", 2: "DONE", 3: "DONE" } },
    { id: "crashCart", textAr: "اكتمال عربة الإنعاش وقفلها (Crush cart check list)", textEn: "Crush cart check list", status: { 0: "DONE", 1: "DONE", 2: "DONE", 3: "DONE" } },
    { id: "cbgCheck", textAr: "جهاز فحص السكر السريع (CBG check list)", textEn: "CBG check list", status: { 0: "DONE", 1: "DONE", 2: "DONE", 3: "DONE" } }
  ]
};

const MOCK_CLINICAL_INDICATORS_INITIAL = {
  codeBrown: 0,
  codeYellow: 0,
  strokeCode: 0,
  needlesStickInjury: 0,
  vipCount: 0,
  vipPatients: [] as { id: string; dept: string; name: string; comments: string }[],
  ventCount: 4,
  ventPatients: [
    { id: "vent-1", dept: "ICU", name: "wedad ahmed mostaf", status: "vent" },
    { id: "vent-2", dept: "ICU", name: "heba elsaied hassan", status: "vent" },
    { id: "vent-3", dept: "ICU", name: "karima sabery ahmed", status: "vent" },
    { id: "vent-4", dept: "ICU", name: "zakia abdelnasser mohamed", status: "vent" }
  ],
  pressureUlcerHospitalCount: 0,
  pressureUlcerHospitalPatients: [] as { id: string; dept: string; name: string; degree: string }[],
  pressureUlcerCommunityCount: 9,
  pressureUlcerCommunityPatients: [
    { id: "pu-c-1", dept: "ICU", name: "wedad ahmed mostaf", degree: "2nd degree" },
    { id: "pu-c-2", dept: "ICU", name: "heba elsaied hassan", degree: "3rd degree" },
    { id: "pu-c-3", dept: "ICU", name: "fatma mohamed mohamed", degree: "1st degree" },
    { id: "pu-c-4", dept: "ICU", name: "amal lotfey youssef", degree: "1st degree" },
    { id: "pu-c-5", dept: "ICU", name: "karima sabery ahmed", degree: "2nd degree" },
    { id: "pu-c-6", dept: "ICU", name: "mona abdelnabey", degree: "2nd degree" },
    { id: "pu-c-7", dept: "ICU", name: "youssef ibrahim hussin", degree: "1st degree" },
    { id: "pu-c-8", dept: "ICU", name: "zakia abdelnasser mohamed", degree: "1st degree" },
    { id: "pu-c-9", dept: "ICU", name: "shamia emam badwey", degree: "2nd degree" }
  ],
  isolationCount: 3,
  isolationPatients: [
    { id: "iso-1", dept: "ICU", name: "wedad ahmed mostaf", type: "contact" },
    { id: "iso-2", dept: "ICU", name: "heba elsaied hassan", type: "contact" },
    { id: "iso-3", dept: "ICU", name: "mona abdelnabey", type: "contact" }
  ],
  outsideServicesCount: 0,
  fall: {
    room: { icu: 10, imcu: 0, inp: 10 },
    risk: { icu: "all", imcu: "0", inp: "all" }
  },
  bedRedden: {
    room: { icu: 10, imcu: 0, inp: 0 },
    total: 10,
    all: { icu: "all", imcu: "0", inp: "0" }
  },
  orStatus: {
    postOrRoom: { icu: 0, imcu: 0, inp: 3 },
    postOrVal: 3,
    preOrRoom: { icu: 0, imcu: 0, inp: 1 },
    preOrVal: 1
  },
  transfers: {
    in: { icu: 0, imcu: 0, inp: 0 },
    out: { icu: 0, imcu: 0, inp: 0 }
  }
};

export default function SupervisorDailySuite({ language }: Props) {
  const isAr = language === "ar";
  const { settings } = useSettings();
  const [activeFormTab, setActiveFormTab] = useState<"assignment" | "dailyReport" | "nursingCensus" | "checklists" | "clinicalIndicators">("clinicalIndicators");

  // Form State Containers
  const [assignment, setAssignment] = useState(MOCK_ASSIGNMENT_INITIAL);
  const [dailyReport, setDailyReport] = useState(MOCK_DAILY_REPORT_INITIAL);
  const [census, setCensus] = useState(MOCK_NURSING_CENSUS_INITIAL);
  const [checklists, setChecklists] = useState(MOCK_CHECKLISTS_OBSERVATIONS_INITIAL);
  const [clinicalIndicators, setClinicalIndicators] = useState(MOCK_CLINICAL_INDICATORS_INITIAL);

  // Unified Custom Controls States
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  const [showQuickAddDialog, setShowQuickAddDialog] = useState<boolean>(false);

  // Quick Add temporary inputs
  const [quickAddVipName, setQuickAddVipName] = useState("");
  const [quickAddVipDept, setQuickAddVipDept] = useState("ICU");
  const [quickAddVipComments, setQuickAddVipComments] = useState("");

  const [quickAddVentName, setQuickAddVentName] = useState("");
  const [quickAddVentDept, setQuickAddVentDept] = useState("ICU");

  const [quickAddBedsoreName, setQuickAddBedsoreName] = useState("");
  const [quickAddBedsoreDept, setQuickAddBedsoreDept] = useState("ICU");
  const [quickAddBedsoreDegree, setQuickAddBedsoreDegree] = useState("2nd degree");
  const [quickAddBedsoreType, setQuickAddBedsoreType] = useState<"hospital" | "community">("hospital");

  const [quickAddIsoName, setQuickAddIsoName] = useState("");
  const [quickAddIsoDept, setQuickAddIsoDept] = useState("ICU");
  const [quickAddIsoType, setQuickAddIsoType] = useState("contact");

  const [quickAddClinicName, setQuickAddClinicName] = useState("");
  const [quickAddClinicVal, setQuickAddClinicVal] = useState<number>(0);

  const [quickAddChecklistItemAr, setQuickAddChecklistItemAr] = useState("");
  const [quickAddChecklistItemEn, setQuickAddChecklistItemEn] = useState("");

  const [quickAddWardKey, setQuickAddWardKey] = useState("");
  const [quickAddWardBeds, setQuickAddWardBeds] = useState<number>(10);

  // Load from local storage if available
  useEffect(() => {
    const localAssign = localStorage.getItem("suite_supervisor_assignment");
    const localDaily = localStorage.getItem("suite_supervisor_daily");
    const localCensus = localStorage.getItem("suite_supervisor_census");
    const localCheck = localStorage.getItem("suite_supervisor_checklists");
    const localIndicators = localStorage.getItem("suite_supervisor_indicators");

    if (localAssign) try { setAssignment(JSON.parse(localAssign)); } catch(e){}
    if (localDaily) try { setDailyReport(JSON.parse(localDaily)); } catch(e){}
    if (localCensus) try { setCensus(JSON.parse(localCensus)); } catch(e){}
    if (localCheck) try { setChecklists(JSON.parse(localCheck)); } catch(e){}
    if (localIndicators) try { setClinicalIndicators(JSON.parse(localIndicators)); } catch(e){}
  }, []);

  const handleSaveAll = () => {
    localStorage.setItem("suite_supervisor_assignment", JSON.stringify(assignment));
    localStorage.setItem("suite_supervisor_daily", JSON.stringify(dailyReport));
    localStorage.setItem("suite_supervisor_census", JSON.stringify(census));
    localStorage.setItem("suite_supervisor_checklists", JSON.stringify(checklists));
    localStorage.setItem("suite_supervisor_indicators", JSON.stringify(clinicalIndicators));
    toast.success(isAr ? "تم حفظ جميع تعديلات ونماذج السوبرفايزر بـ Cloud Storage وقاعدة البيانات بنجاح!" : "All supervisor worksheets saved securely to database!");
  };

  const handleResetToDefaults = () => {
    if (window.confirm(isAr ? "هل أنت متأكد من استعادة بيانات المستشفى النموذجية الأصلية؟" : "Reset current worksheet to default template?")) {
      setAssignment(MOCK_ASSIGNMENT_INITIAL);
      setDailyReport(MOCK_DAILY_REPORT_INITIAL);
      setCensus(MOCK_NURSING_CENSUS_INITIAL);
      setChecklists(MOCK_CHECKLISTS_OBSERVATIONS_INITIAL);
      setClinicalIndicators(MOCK_CLINICAL_INDICATORS_INITIAL);
      toast.info(isAr ? "تم استرداد قوالب النماذج الأصلية بنجاح!" : "Original Hospital templates loaded!");
    }
  };

  // Printing engine
  const printAreaRef = useRef<HTMLDivElement>(null);
  const handlePrintForm = useReactToPrint({
    contentRef: printAreaRef,
    documentTitle: `Hospital_Supervisor_Suite_${activeFormTab}_${new Date().toISOString().split('T')[0]}`,
  });

  // Dynamic Add Event execution depending on active tab
  const executeQuickAdd = () => {
    if (activeFormTab === "clinicalIndicators") {
      // Multiple options available
    } else if (activeFormTab === "dailyReport") {
      if (!quickAddClinicName.trim()) {
        toast.error(isAr ? "يرجى كتابة اسم العيادة الجديدة" : "Clinic name required");
        return;
      }
      const camelName = quickAddClinicName.trim().replace(/\s+/g, "");
      setDailyReport({
        ...dailyReport,
        clinics: { ...dailyReport.clinics, [camelName]: quickAddClinicVal }
      });
      setQuickAddClinicName("");
      setQuickAddClinicVal(0);
      setShowQuickAddDialog(false);
      toast.success(isAr ? "تمت إضافة العيادة بنجاح!" : "Outpatient clinic added successfully!");
    } else if (activeFormTab === "nursingCensus") {
      if (!quickAddWardKey.trim()) {
        toast.error(isAr ? "يرجى تحديد درجة أو طابق طبي" : "Ward name required");
        return;
      }
      const lowerKey = quickAddWardKey.trim().toLowerCase();
      setCensus({
        ...census,
        rows: {
          ...census.rows,
          [lowerKey]: { beds: quickAddWardBeds, actualPt: 0, hn: 0, cn: 0, sn: 0, newHire: 0, naP: 0, is: 0, tec: 0 }
        } as any
      });
      setQuickAddWardKey("");
      setQuickAddWardBeds(10);
      setShowQuickAddDialog(false);
      toast.success(isAr ? "تمت إضافة جناح التعداد بنجاح!" : "Sensus ward row appended!");
    } else if (activeFormTab === "checklists") {
      if (!quickAddChecklistItemAr.trim()) {
        toast.error(isAr ? "يرجى تحديد البند باللغة العربية" : "Checklist item name required");
        return;
      }
      const newItem = {
        id: `custom_${Date.now()}`,
        textAr: quickAddChecklistItemAr.trim(),
        textEn: quickAddChecklistItemEn.trim() || quickAddChecklistItemAr.trim(),
        status: { 0: "DONE", 1: "DONE", 2: "DONE", 3: "DONE" } as any
      };
      setChecklists({
        ...checklists,
        items: [...checklists.items, newItem]
      });
      setQuickAddChecklistItemAr("");
      setQuickAddChecklistItemEn("");
      setShowQuickAddDialog(false);
      toast.success(isAr ? "تمت إضافة بند تفتيش الجودة الجديد!" : "Checklist criteria appended!");
    } else {
      toast.info(isAr ? "قسم التوزيع يحتوي على خلايا ورديات ثابتة، استخدم لوحة التمريض لإعادة مواءمة القوى والتمريض" : "Staff allocation sheet edit enabled direct grid adjustments");
      setShowQuickAddDialog(false);
    }
  };

  const handleAddVip = () => {
    if (!quickAddVipName.trim()) return;
    const newVip = { id: `vip-${Date.now()}`, dept: quickAddVipDept, name: quickAddVipName, comments: quickAddVipComments };
    const updated = [...clinicalIndicators.vipPatients, newVip];
    setClinicalIndicators({
      ...clinicalIndicators,
      vipPatients: updated,
      vipCount: updated.length
    });
    setQuickAddVipName("");
    setQuickAddVipComments("");
    setShowQuickAddDialog(false);
    toast.success(isAr ? "تمت إضافة مريض VIP بنجاح!" : "VIP Case added successfully!");
  };

  const handleAddVent = () => {
    if (!quickAddVentName.trim()) return;
    const newVent = { id: `vent-${Date.now()}`, dept: quickAddVentDept, name: quickAddVentName, status: "vent" };
    const updated = [...clinicalIndicators.ventPatients, newVent];
    setClinicalIndicators({
      ...clinicalIndicators,
      ventPatients: updated,
      ventCount: updated.length
    });
    setQuickAddVentName("");
    setShowQuickAddDialog(false);
    toast.success(isAr ? "تمت إضافة مريض تنفس اصطناعي بنجاح!" : "Ventilator patient log added!");
  };

  const handleAddBedsore = () => {
    if (!quickAddBedsoreName.trim()) return;
    const newB = { id: `pu-${Date.now()}`, dept: quickAddBedsoreDept, name: quickAddBedsoreName, degree: quickAddBedsoreDegree };
    if (quickAddBedsoreType === "hospital") {
      const updated = [...clinicalIndicators.pressureUlcerHospitalPatients, newB];
      setClinicalIndicators({
        ...clinicalIndicators,
        pressureUlcerHospitalPatients: updated,
        pressureUlcerHospitalCount: updated.length
      });
      toast.success(isAr ? "تمت إضافة قرحة فراش نشأت بالمستشفى" : "New Hospital bedsore case logged!");
    } else {
      const updated = [...clinicalIndicators.pressureUlcerCommunityPatients, newB];
      setClinicalIndicators({
        ...clinicalIndicators,
        pressureUlcerCommunityPatients: updated,
        pressureUlcerCommunityCount: updated.length
      });
      toast.success(isAr ? "تمت إضافة قرحة فراش خارجية مجتمعية" : "New external bedsore case logged!");
    }
    setQuickAddBedsoreName("");
    setShowQuickAddDialog(false);
  };

  const handleAddIsolation = () => {
    if (!quickAddIsoName.trim()) return;
    const newIso = { id: `iso-${Date.now()}`, dept: quickAddIsoDept, name: quickAddIsoName, type: quickAddIsoType };
    const updated = [...clinicalIndicators.isolationPatients, newIso];
    setClinicalIndicators({
      ...clinicalIndicators,
      isolationPatients: updated,
      isolationCount: updated.length
    });
    setQuickAddIsoName("");
    setShowQuickAddDialog(false);
    toast.success(isAr ? "تم تسجيل حالة عزل طبي بنجاح!" : "Isolation patient log added!");
  };

  // Structured sidebar item array 
  const formsNavigationMenu = [
    { id: "assignment" as const, titleAr: "ورقة توزيع المهام والمشرف", titleEn: "Supervisor Assignment Sheet", badge: "01", descAr: "توزيع ممرضي الأجنحة والورديات الصباحية والمسائية لكافة مباني المستشفى", descEn: "Day/night nursing shift allocation and supervisors schedule across all blocks." },
    { id: "dailyReport" as const, titleAr: "التقرير الإحصائي للاسرة والعيادات", titleEn: "Daily Hospital Bed Sensus", badge: "02", descAr: "عيادات اليوم الخارجية والخلايا الاحصائية ومجموع مراجعي المستشفى", descEn: "Executive outpatient census, medical clinics volumes, and total beds stats." },
    { id: "nursingCensus" as const, titleAr: "تعداد التمريض وأجهزة التنفس", titleEn: "Nursing Census Tracker", badge: "03", descAr: "مستويات التشكيل العملي للأجهزة والتمريض ومؤشرات عجز القوى", descEn: "Departmental nursing actual workforce status versus target ratios." },
    { id: "checklists" as const, titleAr: "ملاحظات جولة تدقيق الأقسام", titleEn: "Ward Audit Observations", badge: "04", descAr: "فحص حرارة الثلاجات وعربات الصدمات وتوافر مستلزمات مكافحة العدوى", descEn: "Compliance checks for medical refrigerators, code-blue crash carts, and IPC guidelines." },
    { id: "clinicalIndicators" as const, titleAr: "الحالات الحرجة والجودة السريرية", titleEn: "Clinical Quality Incidents", badge: "05", descAr: "تسجيل حالات كبار الشخصيات، قرح الفراش، حالات العزل، والرموز الأمنية", descEn: "Log of VIP clients, critical ventilators, hospital-acquired pressure ulcers, and isolation alerts." }
  ];

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-6 text-slate-800 font-sans" dir={isAr ? "rtl" : "ltr"}>
      
      {/* Global Read-Only & Mode Interactive Styles Overlay */}
      <style>{`
        .is-readonly-view input,
        .is-readonly-view select,
        .is-readonly-view textarea {
          border-color: transparent !important;
          background-color: transparent !important;
          box-shadow: none !important;
          pointer-events: none !important;
          color: #0f172a !important;
          font-weight: 800 !important;
          padding: 2px 4px !important;
          font-size: 11.5px !important;
          cursor: default !important;
          user-select: text !important;
        }
        .is-readonly-view input[type="checkbox"] {
          pointer-events: none !important;
          opacity: 0.8 !important;
        }
        .is-readonly-view .no-print-edit,
        .is-readonly-view button[title="Delete"],
        .is-readonly-view .no-print-action,
        .is-readonly-view button[type="button"]:not(.persistent-action) {
          display: none !important;
        }
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background-color: white !important;
          }
        }
      `}</style>

      {/* Modern Top Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl shadow-xs shrink-0 ring-4 ring-rose-100/50">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-rose-100 text-rose-700 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                {isAr ? "الجيل الجديد المطور" : "Advanced V2 System"}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-bold font-mono">
                {isAr ? "نظام اعتماد JCI" : "JCI Standard Compliant"}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1">
              {isAr ? "المجموعة المعتمدة لنماذج السوبرفايزر والمشرف اليومي" : "Hospital Inspector & Daily Supervisor Sheets Suite"}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
              {isAr ? "لوحة مرتبة متكاملة مجهزة بأدوات جرد العهدة والعيادات والمؤشرات الحرجة مع تفعيل وضع العرض أو التعديل والطباعة" : "Unified hospital command deck for critical care audits, nurse staff counts, and JCI compliance logs."}
            </p>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex gap-2 flex-wrap shrink-0">
          <button 
            type="button"
            onClick={handleResetToDefaults}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            title={isAr ? "استعادة استمارات المستشفى الأصلية النموذجية" : "Reset sheets with design template data"}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {isAr ? "استعادة القوالب" : "Restore Templates"}
          </button>
        </div>
      </div>

      {/* THE MAIN SPLIT WORKSPACE GRID (Left Navigation sidebar, center workspaces) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* SIDEBAR NAVIGATION: Organizes worksheets as a beautiful vertical checklist */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3 no-print select-none">
          <div className="border-b pb-3 mb-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {isAr ? "فهرس الاستمارات المعتمدة" : "Verified Worksheets Index"}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5 font-bold">
              {isAr ? "تنقل بين النماذج الرسمية الخمسة:" : "Navigate five executive files:"}
            </p>
          </div>

          <div className="space-y-2">
            {formsNavigationMenu.map((item) => {
              const isActive = activeFormTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveFormTab(item.id);
                    setShowQuickAddDialog(false);
                  }}
                  className={`w-full text-right ${isAr ? "text-right" : "text-left"} p-3 rounded-xl border transition-all duration-300 flex items-start gap-3 relative overflow-hidden group ${
                    isActive 
                      ? "bg-slate-900 text-white border-slate-950 shadow-md ring-2 ring-slate-900/15 scale-[1.01]" 
                      : "bg-slate-50 text-slate-700 border-slate-200/70 hover:bg-slate-100/70 hover:border-slate-350"
                  }`}
                >
                  <span className={`text-xs font-mono font-black rounded-lg px-2 py-1 ${isActive ? "bg-rose-500 text-white animate-pulse" : "bg-slate-200 text-slate-600"} shrink-0`}>
                    {item.badge}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-black truncate ${isActive ? "text-white" : "text-slate-800"}`}>
                      {isAr ? item.titleAr : item.titleEn}
                    </p>
                    <p className={`text-[10px] mt-1 leading-normal font-medium ${isActive ? "text-slate-300" : "text-slate-500 line-clamp-2"}`}>
                      {isAr ? item.descAr : item.descEn}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick status box on bottom of sidebar */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-250/60 text-[10px] space-y-1.5 font-bold">
            <div className="flex justify-between items-center text-slate-600">
              <span>{isAr ? "حالة المستند الحالي:" : "Current Sheet Integrity:"}</span>
              <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">VERIFIED</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>{isAr ? "أخر حفظ محلي:" : "Last Saved Timestamp:"}</span>
              <span className="text-slate-500 font-mono">Auto Logged</span>
            </div>
          </div>
        </div>

        {/* WORKSPACE & GLOBAL CONTROLS BOARD (Col span 3) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* THE MASTER INTERACTIVE ACTION BAR with Save, Edit, Add, Print */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
            
            {/* Left: Mode Indicators */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-slate-700">
                {isAr ? "خيارات التعديل والتحكم المعروضة:" : "Worksheet Control Actions:"}
              </span>
              
              {/* Dynamic Indicator Capsule */}
              <div className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold leading-none ${
                isEditMode 
                  ? "bg-rose-50 text-rose-700 border border-rose-250 animate-pulse" 
                  : "bg-emerald-50 text-emerald-700 border border-emerald-205"
              }`}>
                {isEditMode ? <Edit3 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>
                  {isEditMode 
                    ? (isAr ? "وضع تحرير وحقن البيانات نشط" : "Edit-Mode: Form Fields Enabled") 
                    : (isAr ? "وضع القراءة والمراجعة فقط" : "View-Mode: Safe Standard Printout")}
                </span>
              </div>
            </div>

            {/* Right Grouped Buttons for: SAVE, EDIT, ADD, PRINT */}
            <div className="flex items-center gap-2 flex-wrap">
              
              {/* 1. EDIT Toggle Button (تعديل) */}
              <button 
                type="button"
                onClick={() => {
                  setIsEditMode(!isEditMode);
                  toast.info(
                    isEditMode 
                      ? (isAr ? "تبديل لوضع القراءة فقط (نموذج رسمي)" : "Switched to verified read-only display!") 
                      : (isAr ? "تبديل لوضع تحرير وتعديل البيانات" : "Switched to data injection editor!")
                  );
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition-all duration-300 border ${
                  isEditMode 
                    ? "bg-slate-800 border-slate-900 hover:bg-slate-700 text-white" 
                    : "bg-white border-slate-300 hover:border-rose-450 hover:bg-rose-50/20 text-slate-800"
                }`}
                title={isAr ? "تغيير إتاحة الحقول للكتابة والتعديل" : "Toggle field input edit protection"}
              >
                {isEditMode ? <Lock className="w-4 h-4 text-emerald-450" /> : <Unlock className="w-4 h-4 text-rose-500" />}
                <span>{isAr ? "تعديل (تأمين حقول)" : "Toggle Edit/View"}</span>
              </button>

              {/* 2. ADD Button: Appears only in active edit mode (إضافة) */}
              {isEditMode && (
                <button 
                  type="button"
                  onClick={() => setShowQuickAddDialog(!showQuickAddDialog)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all duration-300 ${
                    showQuickAddDialog 
                      ? "bg-slate-200 text-slate-800 border-slate-300" 
                      : "bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-600"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? "إضافة (+)" : "Add Item (+)"}</span>
                </button>
              )}

              {/* 3. SAVE Button (حفظ) */}
              <button 
                type="button"
                onClick={handleSaveAll}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all duration-300 scale-100 hover:scale-[1.02]"
              >
                <Save className="w-4 h-4" />
                <span>{isAr ? "حفظ النماذج" : "Save All Logs"}</span>
              </button>

              {/* 4. PRINT Button (طباعة) */}
              <button 
                type="button"
                className="persistent-action flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all duration-300 scale-100 hover:scale-[1.02]"
                onClick={handlePrintForm}
              >
                <Printer className="w-4 h-4" />
                <span>{isAr ? "طباعة النموذج" : "Print Sheet"}</span>
              </button>

            </div>
          </div>

          {/* DYNAMIC QUICK ADD MODAL/PANEL (Only visible when toggled) */}
          {showQuickAddDialog && isEditMode && (
            <div className="bg-amber-50 rounded-2xl border-2 border-amber-350 p-5 shadow-inner space-y-4 animate-fade-in no-print">
              
              <div className="flex items-center justify-between border-b border-amber-250 pb-2">
                <div className="flex items-center gap-2">
                  <Plus className="w-4.5 h-4.5 text-amber-700" />
                  <h4 className="font-extrabold text-xs text-amber-900 uppercase">
                    {isAr ? `إضافة سجل جديد لـ: ` : `Append Record to `} 
                    <span className="text-rose-700 underline font-black">
                      {isAr 
                        ? (formsNavigationMenu.find(f => f.id === activeFormTab)?.titleAr) 
                        : (formsNavigationMenu.find(f => f.id === activeFormTab)?.titleEn)}
                    </span>
                  </h4>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowQuickAddDialog(false)}
                  className="text-amber-700 font-extrabold text-base hover:text-rose-600"
                >
                  ×
                </button>
              </div>

              {/* WIDGET SLOTS ADJUSTED TO CORRESPONDING TAB */}
              {activeFormTab === "clinicalIndicators" && (
                <div className="space-y-4">
                  <p className="text-[11px] text-amber-800 font-semibold">
                    {isAr ? "اختر تصنيف الحالة التي تريد إضافتها في قسم مؤشرات الجودة:" : "Select Critical Care category to register:"}
                  </p>
                  
                  {/* Grid of separate quick insertions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* VIP Category */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <strong className="text-yellow-600 block border-b pb-1">👑 {isAr ? "تسجيل شخصية VIP" : "Register VIP Client"}</strong>
                      <div className="space-y-1">
                        <input 
                          type="text" 
                          placeholder={isAr ? "اسم المريض" : "Patient Name"}
                          value={quickAddVipName}
                          onChange={(e) => setQuickAddVipName(e.target.value)}
                          className="w-full bg-slate-50 border p-1 rounded text-xs"
                        />
                        <div className="grid grid-cols-2 gap-1.5">
                          <input 
                            type="text" 
                            placeholder={isAr ? "القسم الجغرافي" : "Dept"}
                            value={quickAddVipDept}
                            onChange={(e) => setQuickAddVipDept(e.target.value)}
                            className="bg-slate-50 border p-1 rounded text-xs"
                          />
                          <input 
                            type="text" 
                            placeholder={isAr ? "ملاحظات إرشادية" : "Guidelines"}
                            value={quickAddVipComments}
                            onChange={(e) => setQuickAddVipComments(e.target.value)}
                            className="bg-slate-50 border p-1 rounded text-xs"
                          />
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={handleAddVip}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-950 text-[10px] font-bold py-1 rounded"
                      >
                        {isAr ? "إضافة VIP" : "Add VIP"}
                      </button>
                    </div>

                    {/* Ventilator Patient */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <strong className="text-sky-600 block border-b pb-1">💨 {isAr ? "مريض تنفس اصطناعي" : "Register Vent Case"}</strong>
                      <div className="space-y-1">
                        <input 
                          type="text" 
                          placeholder={isAr ? "اسم المريض" : "Vent Patient Name"}
                          value={quickAddVentName}
                          onChange={(e) => setQuickAddVentName(e.target.value)}
                          className="w-full bg-slate-50 border p-1 rounded text-xs"
                        />
                        <input 
                          type="text" 
                          placeholder={isAr ? "القسم (مثال ICU)" : "Dept (e.g. ICU)"}
                          value={quickAddVentDept}
                          onChange={(e) => setQuickAddVentDept(e.target.value)}
                          className="w-full bg-slate-50 border p-1 rounded text-xs"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={handleAddVent}
                        className="w-full bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-bold py-1 rounded"
                      >
                        {isAr ? "إضافة مريض" : "Add Vent Pt"}
                      </button>
                    </div>

                    {/* Bedsore Category */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 text-xs col-span-1 md:col-span-2">
                      <strong className="text-pink-600 block border-b pb-1">🛏️ {isAr ? "تسجيل حالة قرحة فراش (Bedsore)" : "Log Bedsore Ulcer"}</strong>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <input 
                          type="text" 
                          placeholder={isAr ? "اسم حالة المريض" : "Patient Name"}
                          value={quickAddBedsoreName}
                          onChange={(e) => setQuickAddBedsoreName(e.target.value)}
                          className="bg-slate-50 border p-1 rounded text-xs"
                        />
                        <input 
                          type="text" 
                          placeholder={isAr ? "القسم المنوم به" : "Dept"}
                          value={quickAddBedsoreDept}
                          onChange={(e) => setQuickAddBedsoreDept(e.target.value)}
                          className="bg-slate-50 border p-1 rounded text-xs"
                        />
                        <select
                          value={quickAddBedsoreDegree}
                          onChange={(e) => setQuickAddBedsoreDegree(e.target.value)}
                          className="bg-slate-50 border p-1 rounded text-xs"
                        >
                          <option value="1st degree">{isAr ? "الدرجة الأولى" : "1st degree"}</option>
                          <option value="2nd degree">{isAr ? "الدرجة الثانية" : "2nd degree"}</option>
                          <option value="3rd degree">{isAr ? "الدرجة الثالثة" : "3rd degree"}</option>
                          <option value="4th degree">{isAr ? "الدرجة الرابعة" : "4th degree"}</option>
                        </select>
                        <select
                          value={quickAddBedsoreType}
                          onChange={(e) => setQuickAddBedsoreType(e.target.value as any)}
                          className="bg-slate-50 border p-1 rounded text-xs"
                        >
                          <option value="hospital">{isAr ? "نشأت بالمستشفى (HA)" : "Hospital Acquired"}</option>
                          <option value="community">{isAr ? "خارجية مجتمعية (CA)" : "Community Acquired"}</option>
                        </select>
                      </div>
                      <button 
                        type="button"
                        onClick={handleAddBedsore}
                        className="w-full bg-pink-500 hover:bg-pink-600 text-white text-[10px] font-bold py-1.5 rounded-lg mt-1"
                      >
                        {isAr ? "إضافة قرحة الفراش للنظام" : "Add Bedsore Log"}
                      </button>
                    </div>

                    {/* Isolation Category */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 text-xs col-span-1 md:col-span-2">
                      <strong className="text-teal-600 block border-b pb-1">🛡️ {isAr ? "تسجيل مريض عزل طبي مكثف" : "Add Isolation Log"}</strong>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input 
                          type="text" 
                          placeholder={isAr ? "اسم مريض العزل" : "Patient Name"}
                          value={quickAddIsoName}
                          onChange={(e) => setQuickAddIsoName(e.target.value)}
                          className="bg-slate-50 border p-1 rounded text-xs"
                        />
                        <input 
                          type="text" 
                          placeholder={isAr ? "القسم (مثال ICU)" : "Dept (ICU)"}
                          value={quickAddIsoDept}
                          onChange={(e) => setQuickAddIsoDept(e.target.value)}
                          className="bg-slate-50 border p-1 rounded text-xs"
                        />
                        <select
                          value={quickAddIsoType}
                          onChange={(e) => setQuickAddIsoType(e.target.value)}
                          className="bg-slate-50 border p-1 rounded text-xs"
                        >
                          <option value="contact">{isAr ? "عزل تلامسي (Contact)" : "Contact"}</option>
                          <option value="airborne">{isAr ? "عزل هوائي (Airborne)" : "Airborne"}</option>
                          <option value="droplet">{isAr ? "رذاذي (Droplet)" : "Droplet"}</option>
                          <option value="protective">{isAr ? "عزل وقائي عكسي" : "Protective reverse"}</option>
                        </select>
                      </div>
                      <button 
                        type="button"
                        onClick={handleAddIsolation}
                        className="w-full bg-teal-500 hover:bg-teal-600 text-white text-[10px] font-bold py-1.5 rounded-lg mt-1"
                      >
                        {isAr ? "إضافة حالة العزل الطبي" : "Register Isolation"}
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* Form 2: Add Clinic Sensus */}
              {activeFormTab === "dailyReport" && (
                <div className="bg-white p-4 rounded-xl border border-slate-250 space-y-3 text-xs">
                  <span className="block font-black text-slate-700">{isAr ? "إدراج عيادة خارجية أو قسم علاجي جديد:" : "Add Custom Outpatient Clinic Segment:"}</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">{isAr ? "اسم العيادة (مثال: أطفال، جلدية):" : "Clinic Name:"}</label>
                      <input 
                        type="text" 
                        value={quickAddClinicName} 
                        onChange={(e) => setQuickAddClinicName(e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 p-2 rounded"
                        placeholder="e.g. Pediatrics"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">{isAr ? "عدد الحالات اليومية:" : "Daily Patient Count:"}</label>
                      <input 
                        type="number" 
                        value={quickAddClinicVal} 
                        onChange={(e) => setQuickAddClinicVal(Number(e.target.value))} 
                        className="w-full bg-slate-50 border border-slate-200 p-2 rounded"
                      />
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={executeQuickAdd} 
                    className="bg-amber-500 hover:bg-amber-600 font-bold px-4 py-2 rounded text-slate-900 mt-2"
                  >
                    {isAr ? "حقن وإدراج العيادة" : "Add Clinic to Worksheet"}
                  </button>
                </div>
              )}

              {/* Form 3: Add Custom Specialty Ward */}
              {activeFormTab === "nursingCensus" && (
                <div className="bg-white p-4 rounded-xl border border-slate-250 space-y-3 text-xs">
                  <span className="block font-black text-slate-700">{isAr ? "إدراج قسم تعداد تمريضي أو عهدة جديدة:" : "Add custom Specialty Ward or Bed Census:"}</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">{isAr ? "اسم الجناح الطبي الجديد:" : "Custom specialty ward name:"}</label>
                      <input 
                        type="text" 
                        value={quickAddWardKey} 
                        onChange={(e) => setQuickAddWardKey(e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 p-2 rounded"
                        placeholder="e.g. DayCare Surgery"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">{isAr ? "عدد الأسرة الكلي المجهزة:" : "Total Bed Capacity:"}</label>
                      <input 
                        type="number" 
                        value={quickAddWardBeds} 
                        onChange={(e) => setQuickAddWardBeds(Number(e.target.value))} 
                        className="w-full bg-slate-50 border border-slate-200 p-2 rounded"
                      />
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={executeQuickAdd} 
                    className="bg-amber-500 hover:bg-amber-600 font-bold px-4 py-2 rounded text-slate-900 mt-2"
                  >
                    {isAr ? "إضافة للجدول" : "Append Ward Census"}
                  </button>
                </div>
              )}

              {/* Form 4: Add Custom Quality checklist */}
              {activeFormTab === "checklists" && (
                <div className="bg-white p-4 rounded-xl border border-slate-250 space-y-3 text-xs">
                  <span className="block font-black text-slate-700">{isAr ? "إضافة معيار تدقيق أو فحص جودة جديد:" : "Add Custom Audit Parameter / Quality check criteria:"}</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">{isAr ? "تسمية البند بالعربية:" : "Item Label (Arabic):"}</label>
                      <input 
                        type="text" 
                        value={quickAddChecklistItemAr} 
                        onChange={(e) => setQuickAddChecklistItemAr(e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 p-2 rounded"
                        placeholder="ورقة تفويض الأنسجة"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">{isAr ? "تسمية البند بالإنجليزية:" : "Item Label (English):"}</label>
                      <input 
                        type="text" 
                        value={quickAddChecklistItemEn} 
                        onChange={(e) => setQuickAddChecklistItemEn(e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 p-2 rounded"
                        placeholder="Tissue Authorization form"
                      />
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={executeQuickAdd} 
                    className="bg-amber-500 hover:bg-amber-600 font-bold px-4 py-2 rounded text-slate-900 mt-2"
                  >
                    {isAr ? "إدراج البند الجديد لجميع الأجنحة" : "Append Checking Rule"}
                  </button>
                </div>
              )}

            </div>
          )}

          {/* THE WORKSPACE PANEL (Print scope contains headers and actual forms) */}
          <div 
            ref={printAreaRef}
            className="bg-white p-5 md:p-8 rounded-2xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:m-0 print:p-0 relative"
          >
            {/* Conditional outer wrapper to force read-only appearance via CSS classes */}
            <div className={`w-full ${isEditMode ? "is-editing" : "is-readonly-view"}`} dir={isAr ? "rtl" : "ltr"}>
              
              {/* Institutional Custom Stamp Logo on top of printed reports - Hidden by User Request */}
              <div className="hidden border-b-2 border-slate-800 pb-4 mb-6 flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                    {isAr ? (settings.institutionNameAr || "مؤسسة المستشفى للاكتشاف المبكر وعلاج الأورام") : (settings.institutionNameEn || "Hospital Foundation Cancer Institute")}
                  </h1>
                  <p className="text-xs text-pink-700 font-extrabold mt-1">
                    {isAr ? (settings.taglineAr || "في ضهر كل ست مصرية • نظام إدارة الجودة") : (settings.taglineEn || "Clinical Operations & Nursing Quality Command Suite")}
                  </p>
                  {settings.address && (
                    <p className="text-[10px] text-slate-500 font-medium mt-1">
                      {settings.address} {settings.emergencyPhone ? `• Ext: ${settings.emergencyPhone}` : ""}
                    </p>
                  )}
                </div>
                <div className="shrink-0 no-print">
                  {renderDynamicLogo(settings.institutionNameAr, settings.institutionNameEn, isAr, settings.taglineAr, settings.taglineEn)}
                </div>
              </div>

              {/* Form 1: Supervisor Daily Assignment Worksheet */}
              {activeFormTab === "assignment" && (
                <div className="space-y-6">
                  <div className="text-center bg-slate-100 py-2.5 rounded-lg border border-slate-300">
                    <h3 className="font-extrabold text-base text-slate-800 uppercase tracking-wider">
                      {isAr ? "ورقة توزيع المهام والمسؤوليات اليومية للمشرف" : "Supervisor Daily Assignment Work Sheet"}
                    </h3>
                  </div>

                  {/* Header Fields Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-slate-50 p-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">{isAr ? "التاريخ:" : "Date:"}</label>
                      <input 
                        type="date" 
                        value={assignment.date}
                        onChange={(e) => setAssignment({...assignment, date: e.target.value})}
                        className="w-full bg-white border border-slate-200 p-2 rounded outline-none text-slate-800 font-mono" 
                      />
                    </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">{isAr ? "المشرف الميداني:" : "Supervisor:"}</label>
                  <input 
                    type="text" 
                    value={assignment.supervisor}
                    onChange={(e) => setAssignment({...assignment, supervisor: e.target.value})}
                    className="w-full bg-white border border-slate-200 p-2 rounded outline-none text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">{isAr ? "التعليم / المؤهل:" : "Education:"}</label>
                  <input 
                    type="text" 
                    value={assignment.education}
                    onChange={(e) => setAssignment({...assignment, education: e.target.value})}
                    className="w-full bg-white border border-slate-200 p-2 rounded outline-none text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">{isAr ? "زيارة العناية المركزة (ICU Sensus):" : "ICU Patients Census:"}</label>
                  <input 
                    type="text" 
                    value={assignment.icuStartPT}
                    onChange={(e) => setAssignment({...assignment, icuStartPT: e.target.value})}
                    className="w-full bg-white border border-slate-200 p-2 rounded outline-none text-slate-800 font-mono" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">{isAr ? "المرضى بالقسم الداخلي (Inpatient Sensus):" : "Inpatient Census:"}</label>
                  <input 
                    type="text" 
                    value={assignment.inpatientStartPT}
                    onChange={(e) => setAssignment({...assignment, inpatientStartPT: e.target.value})}
                    className="w-full bg-white border border-slate-200 p-2 rounded outline-none text-slate-800 font-mono" 
                  />
                </div>
              </div>

              {/* Worksheet Grid representing PDFs columns */}
              <div className="overflow-x-auto border-2 border-slate-800 rounded-xl">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white text-[11px] font-black border-b-2 border-slate-900">
                      <th className="p-2 border-l border-slate-700 w-1/4">{isAr ? "القسم والمبنى" : "Department"}</th>
                      <th className="p-2 border-l border-slate-700 w-1/3">{isAr ? "دواخل العمل / الورديات الصباحية" : "Morning/Day Shift Allocation"}</th>
                      <th className="p-2 w-1/3">{isAr ? "الورديات المسائية والسهرة" : "Evening/Night Shift Allocation"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-800 font-medium text-slate-800">
                    
                    {/* ICU */}
                    <tr className="align-top">
                      <td className="p-2.5 bg-slate-50 border-l border-slate-800 font-black flex flex-col gap-1">
                        <span>ICU (الرعاية المركزة)</span>
                        <span className="text-[10px] text-slate-500">HN / CN Registered</span>
                      </td>
                      <td className="p-2 border-l border-slate-800 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">Head Nurse</span>
                            <input type="text" value={assignment.departments.icu.hn} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, icu: { ...assignment.departments.icu, hn: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded font-bold" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">Charge Nurse</span>
                            <input type="text" value={assignment.departments.icu.CN} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, icu: { ...assignment.departments.icu, CN: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded font-bold" />
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Staff On Duty</span>
                          <input type="text" value={assignment.departments.icu.staffDay} onChange={(e) => setAssignment({
                            ...assignment, departments: { ...assignment.departments, icu: { ...assignment.departments.icu, staffDay: e.target.value } }
                          })} className="w-full border border-slate-200 p-1.5 rounded" />
                        </div>
                      </td>
                      <td className="p-2 space-y-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Staff On Night Duty</span>
                          <input type="text" value={assignment.departments.icu.staffNight} onChange={(e) => setAssignment({
                            ...assignment, departments: { ...assignment.departments, icu: { ...assignment.departments.icu, staffNight: e.target.value } }
                          })} className="w-full border border-slate-200 p-1.5 rounded" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">Intern</span>
                            <input type="text" value={assignment.departments.icu.intern} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, icu: { ...assignment.departments.icu, intern: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">NA (Assistant)</span>
                            <input type="text" value={assignment.departments.icu.na} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, icu: { ...assignment.departments.icu, na: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded" />
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* OR */}
                    <tr className="align-top">
                      <td className="p-2.5 bg-slate-50 border-l border-slate-800 font-black">
                        <span>OR (غرف العمليات)</span>
                        <span className="text-[10px] text-slate-500 block font-normal">Scarp / Anesth / Intern</span>
                      </td>
                      <td className="p-2 border-l border-slate-800 space-y-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Head Nurse</span>
                          <input type="text" value={assignment.departments.or.hn} onChange={(e) => setAssignment({
                            ...assignment, departments: { ...assignment.departments, or: { ...assignment.departments.or, hn: e.target.value } }
                          })} className="w-full border border-slate-200 p-1 rounded" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Scarp Staff (التعقيم والتمريض المساعد)</span>
                          <input type="text" value={assignment.departments.or.scarp} onChange={(e) => setAssignment({
                            ...assignment, departments: { ...assignment.departments, or: { ...assignment.departments.or, scarp: e.target.value } }
                          })} className="w-full border border-slate-200 p-1 rounded" />
                        </div>
                      </td>
                      <td className="p-2 space-y-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Anesth (نواب التخدير والرعاية)</span>
                          <input type="text" value={assignment.departments.or.anesth} onChange={(e) => setAssignment({
                            ...assignment, departments: { ...assignment.departments, or: { ...assignment.departments.or, anesth: e.target.value } }
                          })} className="w-full border border-slate-200 p-1 rounded" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">Intern</span>
                            <input type="text" value={assignment.departments.or.intern} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, or: { ...assignment.departments.or, intern: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">NA (Assistant)</span>
                            <input type="text" value={assignment.departments.or.na} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, or: { ...assignment.departments.or, na: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded" />
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* ER */}
                    <tr className="align-top">
                      <td className="p-2.5 bg-slate-50 border-l border-slate-800 font-black">
                        <span>ER (الطوارئ والاستقبال)</span>
                      </td>
                      <td className="p-2 border-l border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Staff Day</span>
                          <input type="text" value={assignment.departments.er.staffDay} onChange={(e) => setAssignment({
                            ...assignment, departments: { ...assignment.departments, er: { ...assignment.departments.er, staffDay: e.target.value } }
                          })} className="w-full border border-slate-200 p-1 rounded" />
                        </div>
                      </td>
                      <td className="p-2.5 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">Staff Night</span>
                            <input type="text" value={assignment.departments.er.staffNight} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, er: { ...assignment.departments.er, staffNight: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">NA (Assistant)</span>
                            <input type="text" value={assignment.departments.er.na} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, er: { ...assignment.departments.er, na: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded" />
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* OPD */}
                    <tr className="align-top">
                      <td className="p-2.5 bg-slate-50 border-l border-slate-800 font-black">
                        <span>OPD (العيادات الخارجية)</span>
                      </td>
                      <td className="p-2 border-l border-slate-800 space-y-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Head Nurse</span>
                          <input type="text" value={assignment.departments.opd.hn} onChange={(e) => setAssignment({
                            ...assignment, departments: { ...assignment.departments, opd: { ...assignment.departments.opd, hn: e.target.value } }
                          })} className="w-full border border-slate-200 p-1 rounded" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Staff Day Allocation</span>
                          <input type="text" value={assignment.departments.opd.staffDay} onChange={(e) => setAssignment({
                            ...assignment, departments: { ...assignment.departments, opd: { ...assignment.departments.opd, staffDay: e.target.value } }
                          })} className="w-full border border-slate-200 p-1.5 rounded" />
                        </div>
                      </td>
                      <td className="p-2 space-y-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Staff Night</span>
                          <input type="text" value={assignment.departments.opd.staffNight} onChange={(e) => setAssignment({
                            ...assignment, departments: { ...assignment.departments, opd: { ...assignment.departments.opd, staffNight: e.target.value } }
                          })} className="w-full border border-slate-200 p-1 rounded" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">Intern</span>
                            <input type="text" value={assignment.departments.opd.intern} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, opd: { ...assignment.departments.opd, intern: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">NA (Assistant)</span>
                            <input type="text" value={assignment.departments.opd.na} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, opd: { ...assignment.departments.opd, na: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded" />
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Chemotherapy */}
                    <tr className="align-top">
                      <td className="p-2.5 bg-slate-50 border-l border-slate-800 font-black">
                        <span>Chemotherapy (قسم الكيماوي)</span>
                      </td>
                      <td className="p-2 border-l border-slate-800 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">Head Nurse</span>
                            <input type="text" value={assignment.departments.chemo.hn} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, chemo: { ...assignment.departments.chemo, hn: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">Charge Nurse</span>
                            <input type="text" value={assignment.departments.chemo.CN} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, chemo: { ...assignment.departments.chemo, CN: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded" />
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Chemo Infusion Staff</span>
                          <input type="text" value={assignment.departments.chemo.staffDay} onChange={(e) => setAssignment({
                            ...assignment, departments: { ...assignment.departments, chemo: { ...assignment.departments.chemo, staffDay: e.target.value } }
                          })} className="w-full border border-slate-200 p-1 rounded" />
                        </div>
                      </td>
                      <td className="p-2 space-y-2">
                        <div className="grid grid-cols-3 gap-1">
                          <div className="col-span-2">
                            <span className="text-[10px] text-slate-400 block font-bold">Intern</span>
                            <input type="text" value={assignment.departments.chemo.intern} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, chemo: { ...assignment.departments.chemo, intern: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">NA</span>
                            <input type="text" value={assignment.departments.chemo.na} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, chemo: { ...assignment.departments.chemo, na: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded" />
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Radiology Units */}
                    <tr className="align-top">
                      <td className="p-2.5 bg-slate-50 border-l border-slate-800 font-black">
                        <span>Radio (البلانوجراف والأشعة)</span>
                        <span className="text-[10px] text-slate-500 block font-normal">Units 1, 2 & 3</span>
                      </td>
                      <td className="p-2 border-l border-slate-800 space-y-2" colSpan={2}>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="border border-slate-200 p-2 rounded bg-white">
                            <span className="font-bold text-slate-700 block mb-1">Unit 1</span>
                            <span className="text-[10px] text-slate-400 block">Staff</span>
                            <input type="text" value={assignment.departments.radio.unit1_staff} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, radio: { ...assignment.departments.radio, unit1_staff: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded text-xs mb-1" />
                            <span className="text-[10px] text-slate-400 block">NA (Assistant)</span>
                            <input type="text" value={assignment.departments.radio.unit1_na} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, radio: { ...assignment.departments.radio, unit1_na: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded text-xs" />
                          </div>
                          
                          <div className="border border-slate-200 p-2 rounded bg-white">
                            <span className="font-bold text-slate-700 block mb-1">Unit 2</span>
                            <span className="text-[10px] text-slate-400 block">Staff</span>
                            <input type="text" value={assignment.departments.radio.unit2_staff} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, radio: { ...assignment.departments.radio, unit2_staff: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded text-xs mb-1" />
                            <span className="text-[10px] text-slate-400 block">NA (Assistant)</span>
                            <input type="text" value={assignment.departments.radio.unit2_na} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, radio: { ...assignment.departments.radio, unit2_na: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded text-xs" />
                          </div>

                          <div className="border border-slate-200 p-2 rounded bg-white">
                            <span className="font-bold text-slate-700 block mb-1">Unit 3</span>
                            <span className="text-[10px] text-slate-400 block">Staff</span>
                            <input type="text" value={assignment.departments.radio.unit3_staff} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, radio: { ...assignment.departments.radio, unit3_staff: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded text-xs mb-1" />
                            <span className="text-[10px] text-slate-400 block">NA (Assistant)</span>
                            <input type="text" value={assignment.departments.radio.unit3_na} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, radio: { ...assignment.departments.radio, unit3_na: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded text-xs" />
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* INP (القسم الداخلي الوردية والعيادات الداخلية المرافقة) */}
                    <tr className="align-top">
                      <td className="p-2.5 bg-slate-50 border-l border-slate-800 font-black">
                        <span>Inpatient Ward (القسم الداخلي)</span>
                        <span className="text-[10px] text-slate-500 block font-normal">Wards Patients Allocation</span>
                      </td>
                      <td className="p-2 border-l border-slate-800 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">Head Nurse</span>
                            <input type="text" value={assignment.departments.inp.hn} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, inp: { ...assignment.departments.inp, hn: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">Charge Nurse</span>
                            <input type="text" value={assignment.departments.inp.CN} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, inp: { ...assignment.departments.inp, CN: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded" />
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Inpatient Staff Day</span>
                          <input type="text" value={assignment.departments.inp.staffDay} onChange={(e) => setAssignment({
                            ...assignment, departments: { ...assignment.departments, inp: { ...assignment.departments.inp, staffDay: e.target.value } }
                          })} className="w-full border border-slate-200 p-1.5 rounded" />
                        </div>
                      </td>
                      <td className="p-2 space-y-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Staff Night</span>
                          <input type="text" value={assignment.departments.inp.staffNight} onChange={(e) => setAssignment({
                            ...assignment, departments: { ...assignment.departments, inp: { ...assignment.departments.inp, staffNight: e.target.value } }
                          })} className="w-full border border-slate-200 p-1.5 rounded" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">Intern</span>
                            <input type="text" value={assignment.departments.inp.intern} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, inp: { ...assignment.departments.inp, intern: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">NA (Assistant)</span>
                            <input type="text" value={assignment.departments.inp.na} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, inp: { ...assignment.departments.inp, na: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded" />
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* CSSD (قسم التعقيم المركزي عهدة وأفراد) */}
                    <tr className="align-top">
                      <td className="p-2.5 bg-slate-50 border-l border-slate-800 font-black">
                        <span>CSSD (قسم التعقيم المركزي)</span>
                        <span className="text-[10px] text-slate-500 block font-normal">Autoclaves and Packing</span>
                      </td>
                      <td className="p-2 border-l border-slate-800 space-y-2" colSpan={2}>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">Head Nurse</span>
                            <input type="text" value={assignment.departments.cssd.hn} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, cssd: { ...assignment.departments.cssd, hn: e.target.value } }
                            })} className="w-full border border-slate-200 p-1.5 rounded" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">Sterile Technicians</span>
                            <input type="text" value={assignment.departments.cssd.tec} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, cssd: { ...assignment.departments.cssd, tec: e.target.value } }
                            })} className="w-full border border-slate-200 p-1.5 rounded" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">NA (Assistant)</span>
                            <input type="text" value={assignment.departments.cssd.na} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, cssd: { ...assignment.departments.cssd, na: e.target.value } }
                            })} className="w-full border border-slate-200 p-1.5 rounded" />
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Radiotherapy, CT Simulator Scanner and Navigator Units */}
                    <tr className="align-top">
                      <td className="p-2.5 bg-slate-50 border-l border-slate-800 font-black">
                        <span>Specialized Cancer Care (خدمات المستشفى الإشعاعية والخاصة)</span>
                        <span className="text-[10px] text-slate-500 block font-normal">Patient Navigator, Radiotherapy & CT</span>
                      </td>
                      <td className="p-2 border-l border-slate-800 space-y-3">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Patient Navigator (مساعد المريض بالتنسيق الميداني)</span>
                          <input type="text" value={assignment.departments.navigator} onChange={(e) => setAssignment({
                            ...assignment, departments: { ...assignment.departments, navigator: e.target.value }
                          })} className="w-full border border-slate-250 p-1.5 rounded font-black text-pink-700 bg-pink-50/30" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">CT Simulator Nurse</span>
                            <input type="text" value={assignment.departments.ct.sn} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, ct: { ...assignment.departments.ct, sn: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">CT Assistant</span>
                            <input type="text" value={assignment.departments.ct.na} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, ct: { ...assignment.departments.ct, na: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="p-2 space-y-2">
                        <span className="text-[10px] text-slate-400 block font-bold">Radiotherapy Clinicians (علاج إشعائي)</span>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-bold">Head Nurse / Admin</span>
                          <input type="text" value={assignment.departments.radiotherapy.hn} onChange={(e) => setAssignment({
                            ...assignment, departments: { ...assignment.departments, radiotherapy: { ...assignment.departments.radiotherapy, hn: e.target.value } }
                          })} className="w-full border border-slate-200 p-1 rounded" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-bold">Staff On Duty</span>
                            <input type="text" value={assignment.departments.radiotherapy.staff} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, radiotherapy: { ...assignment.departments.radiotherapy, staff: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded" />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-bold">NA (Assistant)</span>
                            <input type="text" value={assignment.departments.radiotherapy.na} onChange={(e) => setAssignment({
                              ...assignment, departments: { ...assignment.departments, radiotherapy: { ...assignment.departments.radiotherapy, na: e.target.value } }
                            })} className="w-full border border-slate-200 p-1 rounded" />
                          </div>
                        </div>
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>

              {/* Navigation Footer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 no-print">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-pink-600 shrink-0" />
                  <span>
                    {isAr ? "تحقق دائماً من توزيع الورديات ومطابقة العجز لتنبيه المشرف المركزي." : "Always guarantee shifts match minimum staff targets before confirming lock-in."}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Form 2: Hospital Daily Report */}
          {activeFormTab === "dailyReport" && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center bg-slate-100 py-2.5 rounded-lg border border-slate-300">
                <h3 className="font-extrabold text-base text-slate-800 uppercase tracking-wider">
                  {isAr ? "تقرير المستشفى الميداني اليومي وإحصائيات الأسرة" : "Hospital Daily Report & Beds Census"}
                </h3>
              </div>

              {/* Informative Header Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                <div>
                  <label className="block text-slate-500 mb-1">{isAr ? "التاريخ:" : "Date:"}</label>
                  <input type="date" value={dailyReport.date} onChange={(e) => setDailyReport({...dailyReport, date: e.target.value})} className="w-full bg-white border border-slate-200 p-2 rounded outline-none text-slate-800 font-mono" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">{isAr ? "الوردية / الشيفت:" : "Shift:"}</label>
                  <select value={dailyReport.shift} onChange={(e) => setDailyReport({...dailyReport, shift: e.target.value})} className="w-full bg-white border border-slate-200 p-2 rounded outline-none text-slate-800">
                    <option value="Morning">Day Shift (صباحي)</option>
                    <option value="Night">Night Shift (سهرة)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">{isAr ? "المشرف المناوب:" : "Supervisor:"}</label>
                  <input type="text" value={dailyReport.supervisor} onChange={(e) => setDailyReport({...dailyReport, supervisor: e.target.value})} className="w-full bg-white border border-slate-200 p-2 rounded outline-none text-slate-800" />
                </div>
              </div>

              {/* Main Unit Statistics Table */}
              <div className="overflow-x-auto border-2 border-slate-800 rounded-xl">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white font-black border-b border-slate-900 text-[11px]">
                      <th className="p-3 border-l border-slate-700">{isAr ? "الوحدة الطبية" : "Unit / Word"}</th>
                      <th className="p-3 border-l border-slate-700 text-center">{isAr ? "السعة الكلية" : "Total Beds"}</th>
                      <th className="p-3 border-l border-slate-700 text-center">{isAr ? "البداية" : "Start"}</th>
                      <th className="p-3 border-l border-slate-700 text-center">{isAr ? "دخول" : "Admissions"}</th>
                      <th className="p-3 border-l border-slate-700 text-center">{isAr ? "تحويلات لداخل" : "Transfer In"}</th>
                      <th className="p-3 border-l border-slate-700 text-center">{isAr ? "تحويلات لخارج" : "Transfer Out"}</th>
                      <th className="p-3 border-l border-slate-700 text-center">{isAr ? "خروج" : "Discharges"}</th>
                      <th className="p-3 border-l border-slate-700 text-center">{isAr ? "وفاة" : "Death"}</th>
                      <th className="p-3 border-l border-slate-700 text-center">RRT</th>
                      <th className="p-3 text-center bg-slate-900 text-yellow-400 font-bold">{isAr ? "إجمالي النهاية" : "End Sensus"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-bold text-slate-800 text-center">
                    
                    {Object.entries(dailyReport.units).map(([key, u]: [string, any]) => {
                      // Autocalculated End Census matching clinical formulas
                      const endVal = Number(u.start) + Number(u.admission) + Number(u.transferIn) - Number(u.transferOut) - Number(u.discharge) - Number(u.death);

                      return (
                        <tr key={key} className="hover:bg-slate-50 transition">
                          <td className="p-3 text-right font-black bg-slate-50 border-l border-slate-200">{key.toUpperCase()}</td>
                          <td className="p-2 border-l border-slate-200 bg-slate-50/50">
                            <input 
                              type="number" 
                              value={u.totalBeds} 
                              onChange={(e) => setDailyReport({
                                ...dailyReport, 
                                units: { ...dailyReport.units, [key]: { ...u, totalBeds: e.target.value } }
                              })} 
                              className="w-16 bg-transparent text-center focus:bg-white border-0 focus:border" 
                            />
                          </td>
                          <td className="p-2 border-l border-slate-200">
                            <input type="number" value={u.start} onChange={(e) => setDailyReport({
                              ...dailyReport, units: { ...dailyReport.units, [key]: { ...u, start: e.target.value } }
                            })} className="w-14 bg-transparent text-center" />
                          </td>
                          <td className="p-2 border-l border-slate-200">
                            <input type="number" value={u.admission} onChange={(e) => setDailyReport({
                              ...dailyReport, units: { ...dailyReport.units, [key]: { ...u, admission: e.target.value } }
                            })} className="w-14 bg-transparent text-center text-indigo-700" />
                          </td>
                          <td className="p-2 border-l border-slate-200">
                            <input type="number" value={u.transferIn} onChange={(e) => setDailyReport({
                              ...dailyReport, units: { ...dailyReport.units, [key]: { ...u, transferIn: e.target.value } }
                            })} className="w-14 bg-transparent text-center" />
                          </td>
                          <td className="p-2 border-l border-slate-200">
                            <input type="number" value={u.transferOut} onChange={(e) => setDailyReport({
                              ...dailyReport, units: { ...dailyReport.units, [key]: { ...u, transferOut: e.target.value } }
                            })} className="w-14 bg-transparent text-center" />
                          </td>
                          <td className="p-2 border-l border-slate-200">
                            <input type="number" value={u.discharge} onChange={(e) => setDailyReport({
                              ...dailyReport, units: { ...dailyReport.units, [key]: { ...u, discharge: e.target.value } }
                            })} className="w-14 bg-transparent text-center text-emerald-700" />
                          </td>
                          <td className="p-2 border-l border-slate-200">
                            <input type="number" value={u.death} onChange={(e) => setDailyReport({
                              ...dailyReport, units: { ...dailyReport.units, [key]: { ...u, death: e.target.value } }
                            })} className="w-14 bg-transparent text-center text-rose-600" />
                          </td>
                          <td className="p-2 border-l border-slate-200">
                            <input type="number" value={u.rrt} onChange={(e) => setDailyReport({
                              ...dailyReport, units: { ...dailyReport.units, [key]: { ...u, rrt: e.target.value } }
                            })} className="w-14 bg-transparent text-center text-rose-500" />
                          </td>
                          <td className="p-3 font-black text-center bg-slate-900/10 text-slate-800">{endVal}</td>
                        </tr>
                      );
                    })}

                    {/* Auto total row */}
                    <tr className="bg-slate-100 font-extrabold text-[12px] text-slate-900">
                      <td className="p-3 text-right font-black border-l border-slate-200">{isAr ? "الإجمالي الكلي" : "TOTAL HOSPITAL"}</td>
                      <td className="p-3 border-l border-slate-200">{Object.values(dailyReport.units).reduce<number>((acc, current: any) => acc + Number(current.totalBeds), 0)}</td>
                      <td className="p-3 border-l border-slate-200">{Object.values(dailyReport.units).reduce<number>((acc, current: any) => acc + Number(current.start), 0)}</td>
                      <td className="p-3 border-l border-slate-200">{Object.values(dailyReport.units).reduce<number>((acc, current: any) => acc + Number(current.admission), 0)}</td>
                      <td className="p-3 border-l border-slate-200">{Object.values(dailyReport.units).reduce<number>((acc, current: any) => acc + Number(current.transferIn), 0)}</td>
                      <td className="p-3 border-l border-slate-200">{Object.values(dailyReport.units).reduce<number>((acc, current: any) => acc + Number(current.transferOut), 0)}</td>
                      <td className="p-3 border-l border-slate-200">{Object.values(dailyReport.units).reduce<number>((acc, current: any) => acc + Number(current.discharge), 0)}</td>
                      <td className="p-3 border-l border-slate-200">{Object.values(dailyReport.units).reduce<number>((acc, current: any) => acc + Number(current.death), 0)}</td>
                      <td className="p-3 border-l border-slate-200">{Object.values(dailyReport.units).reduce<number>((acc, current: any) => acc + Number(current.rrt), 0)}</td>
                      <td className="p-3 text-emerald-800 bg-slate-200 font-black">
                        {Object.values(dailyReport.units).reduce<number>((acc, current: any) => acc + (Number(current.start) + Number(current.admission) + Number(current.transferIn) - Number(current.transferOut) - Number(current.discharge) - Number(current.death)), 0)}
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>

              {/* Clinics OPD & Radiology Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                
                {/* OPD Clinics Totals */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm space-y-4">
                  <h4 className="font-black text-xs text-slate-700 border-b pb-2 flex justify-between items-center bg-slate-50 p-2 rounded">
                    <span>{isAr ? "تفصيل عيادات اليوم (OPD Clinics Sensus)" : "OPD Clinics Patient Count"}</span>
                    <span className="text-[10px] text-pink-700">Active Outpatients</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {Object.entries(dailyReport.clinics).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center border-b pb-1">
                        <span className="text-slate-600 font-medium capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                        <input 
                          type="number" 
                          value={v} 
                          onChange={(e) => setDailyReport({
                            ...dailyReport,
                            clinics: { ...dailyReport.clinics, [k]: Number(e.target.value) }
                          })}
                          className="w-12 text-slate-800 font-bold font-mono text-center bg-slate-50 rounded border p-0.5" 
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Radiology Sensus */}
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                    <h4 className="font-black text-xs text-slate-700 border-b pb-2 mb-3 flex items-center gap-1">
                      <Table className="w-4 h-4 text-indigo-500" />
                      <span>{isAr ? "قسم الأشعة التشخيصية (Radiology Units)" : "Diagnostic Radiology Units"}</span>
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 p-2 rounded text-center border">
                        <span className="block text-[10px] text-slate-500 font-bold">Unite 1</span>
                        <input type="number" value={dailyReport.radiology.unite1} onChange={(e) => setDailyReport({
                          ...dailyReport, radiology: { ...dailyReport.radiology, unite1: Number(e.target.value) }
                        })} className="w-full text-center bg-white border border-slate-200 rounded p-1 font-mono font-black text-slate-800 text-sm mt-1" />
                      </div>
                      <div className="bg-slate-50 p-2 rounded text-center border">
                        <span className="block text-[10px] text-slate-500 font-bold">Unite 2</span>
                        <input type="number" value={dailyReport.radiology.unite2} onChange={(e) => setDailyReport({
                          ...dailyReport, radiology: { ...dailyReport.radiology, unite2: Number(e.target.value) }
                        })} className="w-full text-center bg-white border border-slate-200 rounded p-1 font-mono font-black text-slate-800 text-sm mt-1" />
                      </div>
                      <div className="bg-slate-50 p-2 rounded text-center border">
                        <span className="block text-[10px] text-slate-500 font-bold">Unite 3</span>
                        <input type="number" value={dailyReport.radiology.unite3} onChange={(e) => setDailyReport({
                          ...dailyReport, radiology: { ...dailyReport.radiology, unite3: Number(e.target.value) }
                        })} className="w-full text-center bg-white border border-slate-200 rounded p-1 font-mono font-black text-slate-800 text-sm mt-1" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 opacity-10 font-mono text-[90px] font-black pointer-events-none select-none">BA</div>
                    <span className="text-[10px] bg-pink-600/45 text-pink-200 px-2 py-0.5 rounded font-black uppercase tracking-wider">Quality Operations</span>
                    <p className="text-xs font-black text-white mt-2">
                      {isAr ? "تحليل الكفاءة وإحصاء العمليات المنجزة:" : "System Operational Efficiency Summary:"}
                    </p>
                    <p className="text-[11px] text-slate-300 mt-1 max-w-sm">
                      {isAr ? "يتم تصدير هذه البيانات بشكل مباشر لتسجيل مؤشرات الامتثال اليومية لدى نظام المستشفى لتدقيق وإشراف التمريض." : "These metrics sync automatically to clinical quality charts to evaluate daily nursing workflow efficiency."}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Form 3: Nursing Staff Census & Ventilator Status */}
          {activeFormTab === "nursingCensus" && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center bg-slate-100 py-2.5 rounded-lg border border-slate-300">
                <h3 className="font-extrabold text-base text-slate-800 uppercase tracking-wider">
                  {isAr ? "تعداد طاقم التمريض وحالة أجهزة التنفس (Census & Ventura Status)" : "Nursing Staff Census & Ventilator Status"}
                </h3>
              </div>

              {/* Census Table Grid */}
              <div className="overflow-x-auto border-2 border-slate-800 rounded-xl">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white font-black border-b border-slate-900 text-[10px]">
                      <th className="p-2 border-l border-slate-700">{isAr ? "الوحدة / القسم" : "Department"}</th>
                      <th className="p-2 border-l border-slate-700 text-center">{isAr ? "سرير غطاء" : "Beds no"}</th>
                      <th className="p-2 border-l border-slate-700 text-center">{isAr ? "المرضى الحاليين (NO)" : "Patient Census (No)"}</th>
                      <th className="p-2 border-l border-slate-700 text-center">HN</th>
                      <th className="p-2 border-l border-slate-700 text-center">CN</th>
                      <th className="p-2 border-l border-slate-700 text-center">SN (Staff)</th>
                      <th className="p-2 border-l border-slate-700 text-center">{isAr ? "تدريب / جديد" : "New Hire"}</th>
                      <th className="p-2 border-l border-slate-700 text-center">NA/P</th>
                      <th className="p-2 border-l border-slate-700 text-center">IS</th>
                      <th className="p-2 text-center">Tec</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-bold text-center text-slate-800">
                    {Object.entries(census.rows).map(([key, r]: [string, any]) => (
                      <tr key={key} className="hover:bg-slate-50 transition">
                        <td className="p-2 text-right font-black bg-slate-50 border-l border-slate-200">{key.toUpperCase()}</td>
                        <td className="p-1 border-l border-slate-200 bg-slate-50/50">
                          <input type="number" value={r.beds} onChange={(e) => setCensus({
                            ...census, rows: { ...census.rows, [key]: { ...r, beds: Number(e.target.value) } }
                          })} className="w-10 text-center bg-transparent border-0" />
                        </td>
                        <td className="p-1 border-l border-slate-200">
                          <input type="number" value={r.actualPt} onChange={(e) => setCensus({
                            ...census, rows: { ...census.rows, [key]: { ...r, actualPt: Number(e.target.value) } }
                          })} className="w-10 text-center bg-transparent border-0 text-indigo-700 font-extrabold" />
                        </td>
                        <td className="p-1 border-l border-slate-200">
                          <input type="number" value={r.hn} onChange={(e) => setCensus({
                            ...census, rows: { ...census.rows, [key]: { ...r, hn: Number(e.target.value) } }
                          })} className="w-10 text-center bg-transparent border-0" />
                        </td>
                        <td className="p-1 border-l border-slate-200">
                          <input type="number" value={r.cn} onChange={(e) => setCensus({
                            ...census, rows: { ...census.rows, [key]: { ...r, cn: Number(e.target.value) } }
                          })} className="w-10 text-center bg-transparent border-0" />
                        </td>
                        <td className="p-1 border-l border-slate-200 text-emerald-700">
                          <input type="number" value={r.sn} onChange={(e) => setCensus({
                            ...census, rows: { ...census.rows, [key]: { ...r, sn: Number(e.target.value) } }
                          })} className="w-10 text-center bg-transparent border-0 font-extrabold" />
                        </td>
                        <td className="p-1 border-l border-slate-200">
                          <input type="number" value={r.newHire} onChange={(e) => setCensus({
                            ...census, rows: { ...census.rows, [key]: { ...r, newHire: Number(e.target.value) } }
                          })} className="w-10 text-center bg-transparent border-0" />
                        </td>
                        <td className="p-1 border-l border-slate-200 text-slate-500">
                          <input type="number" value={r.naP} onChange={(e) => setCensus({
                            ...census, rows: { ...census.rows, [key]: { ...r, naP: Number(e.target.value) } }
                          })} className="w-10 text-center bg-transparent border-0" />
                        </td>
                        <td className="p-1 border-l border-slate-200">
                          <input type="number" value={r.is} onChange={(e) => setCensus({
                            ...census, rows: { ...census.rows, [key]: { ...r, is: Number(e.target.value) } }
                          })} className="w-10 text-center bg-transparent border-0" />
                        </td>
                        <td className="p-1">
                          <input type="number" value={r.tec} onChange={(e) => setCensus({
                            ...census, rows: { ...census.rows, [key]: { ...r, tec: Number(e.target.value) } }
                          })} className="w-10 text-center bg-transparent border-0" />
                        </td>
                      </tr>
                    ))}

                    {/* Auto Totals Row */}
                    <tr className="bg-slate-100 font-extrabold text-slate-900 text-sm">
                      <td className="p-2 text-right font-black border-l border-slate-200">{isAr ? "المجموع الكلي" : "TOTAL STAFF"}</td>
                      <td className="p-2 border-l border-slate-200">{Object.values(census.rows).reduce((acc: number, cur: any) => acc + cur.beds, 0)}</td>
                      <td className="p-2 border-l border-slate-200 text-indigo-700">{Object.values(census.rows).reduce((acc: number, cur: any) => acc + cur.actualPt, 0)}</td>
                      <td className="p-2 border-l border-slate-200">{Object.values(census.rows).reduce((acc: number, cur: any) => acc + cur.hn, 0)}</td>
                      <td className="p-2 border-l border-slate-200">{Object.values(census.rows).reduce((acc: number, cur: any) => acc + cur.cn, 0)}</td>
                      <td className="p-2 border-l border-slate-200 text-emerald-800">{Object.values(census.rows).reduce((acc: number, cur: any) => acc + cur.sn, 0)}</td>
                      <td className="p-2 border-l border-slate-200">{Object.values(census.rows).reduce((acc: number, cur: any) => acc + cur.newHire, 0)}</td>
                      <td className="p-2 border-l border-slate-200">{Object.values(census.rows).reduce((acc: number, cur: any) => acc + cur.naP, 0)}</td>
                      <td className="p-2 border-l border-slate-200">{Object.values(census.rows).reduce((acc: number, cur: any) => acc + cur.is, 0)}</td>
                      <td className="p-2">{Object.values(census.rows).reduce((acc: number, cur: any) => acc + cur.tec, 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Ventilator Status Section */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm space-y-4">
                <h4 className="font-black text-xs text-slate-700 border-b pb-2 flex items-center justify-between">
                  <span>{isAr ? "حالة أجهزة التنفس الصناعي المقيمة بالطوارئ والعناية (Ventilator Status)" : "Ventilator Allocations & Status"}</span>
                  <span className="text-[10px] text-indigo-700">ICU & ER Emergency Equipment</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(census.ventStatus).map(([key, v]: [string, any]) => {
                    const totalVents = Number(v.onPt) + Number(v.free) + Number(v.outOfOrder);
                    return (
                      <div key={key} className="bg-slate-50 border rounded-lg p-3">
                        <span className="font-extrabold text-sm text-slate-800 capitalize block mb-2">{key.toUpperCase()} ventilators</span>
                        <div className="grid grid-cols-4 gap-2 text-center text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block">On PATIENT</span>
                            <input type="number" value={v.onPt} onChange={(e) => setCensus({
                              ...census, ventStatus: { ...census.ventStatus, [key]: { ...v, onPt: Number(e.target.value) } }
                            })} className="w-12 text-center bg-white border rounded font-mono font-bold text-indigo-700" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block">Free (جاهز)</span>
                            <input type="number" value={v.free} onChange={(e) => setCensus({
                              ...census, ventStatus: { ...census.ventStatus, [key]: { ...v, free: Number(e.target.value) } }
                            })} className="w-12 text-center bg-white border rounded font-mono font-bold text-emerald-600" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block">Broken (عطلان)</span>
                            <input type="number" value={v.outOfOrder} onChange={(e) => setCensus({
                              ...census, ventStatus: { ...census.ventStatus, [key]: { ...v, outOfOrder: Number(e.target.value) } }
                            })} className="w-12 text-center bg-white border rounded font-mono font-bold text-rose-600" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block">Total</span>
                            <span className="w-12 font-mono font-black text-slate-700 block mt-1">{totalVents}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Form 4: List Of Unit Check Lists Observations */}
          {activeFormTab === "checklists" && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center bg-slate-100 py-2.5 rounded-lg border border-slate-300">
                <h3 className="font-extrabold text-base text-slate-800 uppercase tracking-wider">
                  {isAr ? "ملاحظات وتدقيق قائمة الفحص للأقسام (List Of Unit Checklists Observations)" : "List of Unit Check Lists Observations"}
                </h3>
              </div>

              {/* Informative Header Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                <div>
                  <label className="block text-slate-500 mb-1">{isAr ? "اسم المدقق / Auditor:" : "Auditor Name:"}</label>
                  <input type="text" value={checklists.auditor} onChange={(e) => setChecklists({...checklists, auditor: e.target.value})} className="w-full bg-white border border-slate-200 p-2 rounded outline-none text-slate-800" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">{isAr ? "التاريخ / الفاصل الزمني:" : "Observation Date:"}</label>
                  <input type="text" value={checklists.date} onChange={(e) => setChecklists({...checklists, date: e.target.value})} className="w-full bg-white border border-slate-200 p-2 rounded outline-none text-slate-800 font-mono" />
                </div>
              </div>

              {/* Editable Wings Headers */}
              <div className="bg-white p-3 rounded-xl border border-dashed border-slate-300">
                <label className="block text-xs font-black text-slate-700 mb-2">
                  {isAr ? "تخصيص الأقسام / الأجنحة تحت الملاحظة (Columns):" : "Customize Department Wards under Observation:"}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {checklists.wings.map((wing, i) => (
                    <input 
                      key={i} 
                      type="text" 
                      value={wing} 
                      onChange={(e) => {
                        const updatedWings = [...checklists.wings];
                        updatedWings[i] = e.target.value;
                        setChecklists({ ...checklists, wings: updatedWings });
                      }}
                      className="border border-slate-200 p-1.5 rounded text-xs font-bold" 
                    />
                  ))}
                </div>
              </div>

              {/* Main Checklist Observational Matrix */}
              <div className="overflow-x-auto border-2 border-slate-800 rounded-xl">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white font-black border-b border-slate-900 text-[11px]">
                      <th className="p-3 border-l border-slate-700 w-2/5">{isAr ? "البنود ومعايير التدقيق" : "Checklist Audit Items"}</th>
                      {checklists.wings.map((w, idx) => (
                        <th key={idx} className="p-3 border-l border-slate-700 text-center w-1/5">{w}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-bold text-slate-800">
                    {checklists.items.map((item, itemIdx) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="p-2.5 font-bold text-slate-700 border-l border-slate-200">
                          {isAr ? item.textAr : item.textEn}
                        </td>
                        {checklists.wings.map((_, wingIdx) => {
                          const status = item.status[wingIdx as keyof typeof item.status] || "DONE";
                          return (
                            <td key={wingIdx} className="p-1 border-l border-slate-200 text-center">
                              <select 
                                value={status}
                                onChange={(e) => {
                                  const updatedItems = [...checklists.items];
                                  updatedItems[itemIdx] = {
                                    ...item,
                                    status: {
                                      ...item.status,
                                      [wingIdx]: e.target.value
                                    }
                                  };
                                  setChecklists({ ...checklists, items: updatedItems });
                                }}
                                className={`text-[11px] font-black p-1 rounded border outline-none text-center ${
                                  status === "DONE" 
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300" 
                                    : status === "NA" 
                                    ? "bg-slate-100 text-slate-600 border-slate-300" 
                                    : "bg-rose-100 text-rose-800 border-rose-350"
                                }`}
                              >
                                <option value="DONE">DONE</option>
                                <option value="NA">NA</option>
                                <option value="PENDING">PENDING</option>
                              </select>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* Form 5: Clinical Indicators & Quality Rounds */}
          {activeFormTab === "clinicalIndicators" && (
            <div className="space-y-6 animate-fade-in text-slate-800">
              <div className="text-center bg-pink-50 py-3 rounded-xl border border-pink-200">
                <h3 className="font-extrabold text-base text-pink-905 uppercase tracking-widest flex items-center justify-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-pink-700 animate-pulse" />
                  {isAr ? "مؤشرات جودة الرعاية والجولات السريرية اليومية" : "Clinical Quality Audits & Rounded Incident Indicators"}
                </h3>
                <p className="text-[10px] text-pink-700 font-bold mt-1">
                  {isAr ? "تسجيل الحالات الحرجة، الرموز الأمنية، قرح الفراش، العزل، مخاطر السقوط ونقل المرضى" : "Log critical alarms, code statuses, bedsores, isolation, fall risks, surgical states & transfers"}
                </p>
              </div>

              {/* 1. Rapid Alarm / Incident Code Counters */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { key: "codeBrown", labelAr: "كود براون (تسرب)", labelEn: "Code Brown", color: "bg-amber-50 border-amber-200 text-amber-900 border-l-4 border-l-amber-600" },
                  { key: "codeYellow", labelAr: "كود يلو (طوارئ)", labelEn: "Code Yellow", color: "bg-yellow-50 border-yellow-250 text-yellow-905 border-l-4 border-l-yellow-600" },
                  { key: "strokeCode", labelAr: "كود الجلطة الدماغية", labelEn: "Stroke Code", color: "bg-rose-50 border-rose-200 text-rose-900 border-l-4 border-l-rose-600" },
                  { key: "needlesStickInjury", labelAr: "وخز الإبر التمريضي", labelEn: "Needle Stick Injury", color: "bg-teal-50 border-teal-200 text-teal-900 border-l-4 border-l-teal-605" },
                  { key: "outsideServicesCount", labelAr: "الخدمات الخارجية", labelEn: "Outside Services", color: "bg-sky-50 border-sky-200 text-sky-900 border-l-4 border-l-sky-600" }
                ].map((item) => {
                  const val = clinicalIndicators[item.key as keyof typeof clinicalIndicators] as number;
                  return (
                    <div key={item.key} className={`p-3 rounded-xl border shadow-xs text-center ${item.color}`}>
                      <span className="block text-[11px] font-black leading-tight mb-2">
                        {isAr ? item.labelAr : item.labelEn}
                      </span>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setClinicalIndicators({
                            ...clinicalIndicators,
                            [item.key]: Math.max(0, val - 1)
                          })}
                          className="w-6 h-6 rounded-full bg-white border border-slate-205 text-center font-bold text-xs hover:bg-slate-50 transition"
                        >-</button>
                        <input
                          type="number"
                          value={val}
                          onChange={(e) => setClinicalIndicators({
                            ...clinicalIndicators,
                            [item.key]: Math.max(0, parseInt(e.target.value) || 0)
                          })}
                          className="w-12 text-center bg-transparent border-0 font-extrabold text-sm focus:ring-0"
                        />
                        <button
                          type="button"
                          onClick={() => setClinicalIndicators({
                            ...clinicalIndicators,
                            [item.key]: val + 1
                          })}
                          className="w-6 h-6 rounded-full bg-white border border-slate-205 text-center font-bold text-xs hover:bg-slate-50 transition"
                        >+</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 2. VIP & Ventilator Connected Patients - Multi-grids */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* VIP Patients Tracker */}
                <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="bg-slate-50 p-3.5 border-b border-slate-200 flex items-center justify-between">
                      <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                        {isAr ? "قائمة المرضى كبار الشخصيات VIP / مرافقين" : "VIP Patients & Accompanying Escort Tracker"}
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-bold">Total:</span>
                        <input
                          type="number"
                          value={clinicalIndicators.vipCount}
                          onChange={(e) => setClinicalIndicators({
                            ...clinicalIndicators,
                            vipCount: Math.max(0, parseInt(e.target.value) || 0)
                          })}
                          className="w-10 text-center bg-slate-100 border rounded font-mono font-bold text-xs"
                        />
                      </div>
                    </div>

                    <div className="p-3 overflow-x-auto">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b text-slate-400 font-bold">
                            <th className="py-2 px-1 text-right">{isAr ? "القسم" : "Dept"}</th>
                            <th className="py-2 px-1 text-right">{isAr ? "الاسم" : "Patient Name"}</th>
                            <th className="py-2 px-1 text-right">{isAr ? "ملاحظات وتوجيهات" : "Operational Guideline"}</th>
                            <th className="py-2 px-1 text-center text-slate-350 no-print">×</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y font-semibold">
                          {clinicalIndicators.vipPatients.map((vip, idx) => (
                            <tr key={vip.id} className="hover:bg-slate-50">
                              <td className="py-1 px-1">
                                <input
                                  type="text"
                                  value={vip.dept}
                                  onChange={(e) => {
                                    const updated = [...clinicalIndicators.vipPatients];
                                    updated[idx].dept = e.target.value;
                                    setClinicalIndicators({ ...clinicalIndicators, vipPatients: updated });
                                  }}
                                  className="w-full bg-transparent border-0 text-[11px] p-0 focus:ring-0 text-right"
                                />
                              </td>
                              <td className="py-1 px-1">
                                <input
                                  type="text"
                                  value={vip.name}
                                  onChange={(e) => {
                                    const updated = [...clinicalIndicators.vipPatients];
                                    updated[idx].name = e.target.value;
                                    setClinicalIndicators({ ...clinicalIndicators, vipPatients: updated });
                                  }}
                                  className="w-full bg-transparent border-0 text-[11px] p-0 focus:ring-0 font-bold text-right text-slate-800"
                                />
                              </td>
                              <td className="py-1 px-1">
                                <input
                                  type="text"
                                  value={vip.comments}
                                  onChange={(e) => {
                                    const updated = [...clinicalIndicators.vipPatients];
                                    updated[idx].comments = e.target.value;
                                    setClinicalIndicators({ ...clinicalIndicators, vipPatients: updated });
                                  }}
                                  className="w-full bg-transparent border-0 text-[11px] p-0 focus:ring-0 text-slate-500 text-right"
                                />
                              </td>
                              <td className="py-1 px-1 text-center no-print">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = clinicalIndicators.vipPatients.filter((_, i) => i !== idx);
                                    setClinicalIndicators({
                                      ...clinicalIndicators,
                                      vipPatients: updated,
                                      vipCount: updated.length
                                    });
                                  }}
                                  className="text-slate-350 hover:text-rose-500 font-extrabold text-sm"
                                >
                                  ×
                                </button>
                              </td>
                            </tr>
                          ))}
                          {clinicalIndicators.vipPatients.length === 0 && (
                            <tr>
                              <td colSpan={4} className="text-center py-4 text-slate-400 italic">
                                {isAr ? "لا توجد سجلات VIP مسجلة حالياً." : "No VIP entries recorded."}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="p-3 border-t bg-slate-50 no-print">
                    <button
                      type="button"
                      onClick={() => {
                        const newRow = { id: `vip-${Date.now()}`, dept: "ICU", name: "", comments: "" };
                        const updated = [...clinicalIndicators.vipPatients, newRow];
                        setClinicalIndicators({
                          ...clinicalIndicators,
                          vipPatients: updated,
                          vipCount: updated.length
                        });
                      }}
                      className="w-full py-1.5 border border-dashed border-slate-300 hover:border-indigo-400 rounded-lg text-[11px] font-black text-slate-600 hover:text-indigo-600 transition flex items-center justify-center gap-1 bg-white"
                    >
                      + {isAr ? "إضافة مريض VIP جديد" : "Add New VIP Record"}
                    </button>
                  </div>
                </div>

                {/* Ventilator (Vent) Patients List */}
                <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="bg-slate-50 p-3.5 border-b border-slate-200 flex items-center justify-between">
                      <h4 className="font-extrabold text-xs text-indigo-900 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />
                        {isAr ? "حالات أجهزة التنشن الصناعي المقيمة بالطوارئ والعناية" : "Patients with Active Mechanical Ventilator"}
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-bold">Total:</span>
                        <input
                          type="number"
                          value={clinicalIndicators.ventCount}
                          onChange={(e) => setClinicalIndicators({
                            ...clinicalIndicators,
                            ventCount: Math.max(0, parseInt(e.target.value) || 0)
                          })}
                          className="w-10 text-center bg-slate-100 border rounded font-mono font-bold text-xs"
                        />
                      </div>
                    </div>

                    <div className="p-3 overflow-x-auto">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b text-slate-400 font-bold">
                            <th className="py-2 px-1 text-right">{isAr ? "الموقع" : "Location"}</th>
                            <th className="py-2 px-1 text-right">{isAr ? "الاسم" : "Patient Name"}</th>
                            <th className="py-2 px-1 text-right">{isAr ? "الحالة" : "Vent Status"}</th>
                            <th className="py-2 px-1 text-center text-slate-350 no-print">×</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y font-semibold">
                          {clinicalIndicators.ventPatients.map((vent, idx) => (
                            <tr key={vent.id} className="hover:bg-indigo-50/20">
                              <td className="py-1 px-1">
                                <input
                                  type="text"
                                  value={vent.dept}
                                  onChange={(e) => {
                                    const updated = [...clinicalIndicators.ventPatients];
                                    updated[idx].dept = e.target.value;
                                    setClinicalIndicators({ ...clinicalIndicators, ventPatients: updated });
                                  }}
                                  className="w-full bg-transparent border-0 text-[11px] p-0 focus:ring-0 text-right"
                                />
                              </td>
                              <td className="py-1 px-1">
                                <input
                                  type="text"
                                  value={vent.name}
                                  onChange={(e) => {
                                    const updated = [...clinicalIndicators.ventPatients];
                                    updated[idx].name = e.target.value;
                                    setClinicalIndicators({ ...clinicalIndicators, ventPatients: updated });
                                  }}
                                  className="w-full bg-transparent border-0 text-[11px] p-0 focus:ring-0 font-bold text-indigo-950 text-right"
                                />
                              </td>
                              <td className="py-1 px-1">
                                <span className="bg-sky-100 text-sky-800 text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
                                  {vent.status}
                                </span>
                              </td>
                              <td className="py-1 px-1 text-center no-print">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = clinicalIndicators.ventPatients.filter((_, i) => i !== idx);
                                    setClinicalIndicators({
                                      ...clinicalIndicators,
                                      ventPatients: updated,
                                      ventCount: updated.length
                                    });
                                  }}
                                  className="text-slate-350 hover:text-rose-500 font-extrabold text-sm"
                                >
                                  ×
                                </button>
                              </td>
                            </tr>
                          ))}
                          {clinicalIndicators.ventPatients.length === 0 && (
                            <tr>
                              <td colSpan={4} className="text-center py-4 text-slate-400 italic">
                                {isAr ? "لا توجد سجلات تنفس صناعي مسجلة حالياً." : "No ventilator records."}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="p-3 border-t bg-slate-50 no-print">
                    <button
                      type="button"
                      onClick={() => {
                        const newRow = { id: `vent-${Date.now()}`, dept: "ICU", name: "", status: "vent" };
                        const updated = [...clinicalIndicators.ventPatients, newRow];
                        setClinicalIndicators({
                          ...clinicalIndicators,
                          ventPatients: updated,
                          ventCount: updated.length
                        });
                      }}
                      className="w-full py-1.5 border border-dashed border-slate-300 hover:border-indigo-400 rounded-lg text-[11px] font-black text-slate-600 hover:text-indigo-600 transition flex items-center justify-center gap-1 bg-white"
                    >
                      + {isAr ? "إضافة مريض على جهاز تنفس" : "Add New Vent Patient"}
                    </button>
                  </div>
                </div>

              </div>

              {/* 3. Pressure Ulcers & Bedsore Tracker (Hospital vs Community) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">

                {/* Hospital Acquired Pressure Ulcer */}
                <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="bg-rose-55/10 p-3.5 border-b border-rose-100 flex items-center justify-between">
                      <h4 className="font-extrabold text-xs text-rose-900 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-rose-600 animate-bounce" />
                        {isAr ? "قرح الفراش المكتسبة بالمستشفى (Hospital Acquired)" : "Hospital Acquired Pressure Ulcers"}
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-rose-500 font-bold">Total:</span>
                        <input
                          type="number"
                          value={clinicalIndicators.pressureUlcerHospitalCount}
                          onChange={(e) => setClinicalIndicators({
                            ...clinicalIndicators,
                            pressureUlcerHospitalCount: Math.max(0, parseInt(e.target.value) || 0)
                          })}
                          className="w-10 text-center bg-rose-100 border-rose-300 rounded font-mono font-bold text-xs text-rose-900"
                        />
                      </div>
                    </div>

                    <div className="p-3 overflow-x-auto">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b text-slate-400 font-bold">
                            <th className="py-2 px-1 text-right">{isAr ? "القسم" : "Dept"}</th>
                            <th className="py-2 px-1 text-right">{isAr ? "اسم المريضة" : "Patient Name"}</th>
                            <th className="py-2 px-1 text-right">{isAr ? "الدرجة" : "Degree"}</th>
                            <th className="py-2 px-1 text-center text-slate-350 no-print">×</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y font-semibold text-slate-800">
                          {clinicalIndicators.pressureUlcerHospitalPatients.map((pu, idx) => (
                            <tr key={pu.id} className="hover:bg-rose-50/20">
                              <td className="py-1 px-1 text-right">
                                <input
                                  type="text"
                                  value={pu.dept}
                                  onChange={(e) => {
                                    const updated = [...clinicalIndicators.pressureUlcerHospitalPatients];
                                    updated[idx].dept = e.target.value;
                                    setClinicalIndicators({ ...clinicalIndicators, pressureUlcerHospitalPatients: updated });
                                  }}
                                  className="w-full bg-transparent border-0 text-[11px] p-0 focus:ring-0 text-right"
                                />
                              </td>
                              <td className="py-1 px-1 text-right">
                                <input
                                  type="text"
                                  value={pu.name}
                                  onChange={(e) => {
                                    const updated = [...clinicalIndicators.pressureUlcerHospitalPatients];
                                    updated[idx].name = e.target.value;
                                    setClinicalIndicators({ ...clinicalIndicators, pressureUlcerHospitalPatients: updated });
                                  }}
                                  className="w-full bg-transparent border-0 text-[11px] p-0 focus:ring-0 font-bold text-slate-800 text-right"
                                />
                              </td>
                              <td className="py-1 px-1">
                                <select
                                  value={pu.degree}
                                  onChange={(e) => {
                                    const updated = [...clinicalIndicators.pressureUlcerHospitalPatients];
                                    updated[idx].degree = e.target.value;
                                    setClinicalIndicators({ ...clinicalIndicators, pressureUlcerHospitalPatients: updated });
                                  }}
                                  className="border bg-white text-[10px] rounded p-0.5 font-bold"
                                >
                                  <option value="1st degree">1st degree</option>
                                  <option value="2nd degree">2nd degree</option>
                                  <option value="3rd degree">3rd degree</option>
                                  <option value="4th degree">4th degree</option>
                                </select>
                              </td>
                              <td className="py-1 px-1 text-center no-print">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = clinicalIndicators.pressureUlcerHospitalPatients.filter((_, i) => i !== idx);
                                    setClinicalIndicators({
                                      ...clinicalIndicators,
                                      pressureUlcerHospitalPatients: updated,
                                      pressureUlcerHospitalCount: updated.length
                                    });
                                  }}
                                  className="text-slate-350 hover:text-rose-500 font-extrabold text-sm"
                                >
                                  ×
                                </button>
                              </td>
                            </tr>
                          ))}
                          {clinicalIndicators.pressureUlcerHospitalPatients.length === 0 && (
                            <tr>
                              <td colSpan={4} className="text-center py-4 text-slate-400 italic">
                                {isAr ? "لا توجد قرح فراش مكتسبة بالمستشفى." : "No hospital-acquired pressure ulcers recorded."}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="p-3 border-t bg-slate-50 no-print">
                    <button
                      type="button"
                      onClick={() => {
                        const newRow = { id: `pu-h-${Date.now()}`, dept: "ICU", name: "", degree: "2nd degree" };
                        const updated = [...clinicalIndicators.pressureUlcerHospitalPatients, newRow];
                        setClinicalIndicators({
                          ...clinicalIndicators,
                          pressureUlcerHospitalPatients: updated,
                          pressureUlcerHospitalCount: updated.length
                        });
                      }}
                      className="w-full py-1.5 border border-dashed border-rose-300 hover:border-rose-400 rounded-lg text-[11px] font-black text-rose-700 hover:text-rose-900 transition flex items-center justify-center gap-1 bg-white"
                    >
                      + {isAr ? "إضافة تقرير قرحة مكتسبة" : "Add New HA Bedsore Record"}
                    </button>
                  </div>
                </div>

                {/* Community Acquired Pressure Ulcer */}
                <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="bg-amber-50 p-3.5 border-b border-amber-100 flex items-center justify-between">
                      <h4 className="font-extrabold text-xs text-amber-900 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-amber-600" />
                        {isAr ? "قرح الفراش الواردة من البيئة والمجتمع (Community Acquired)" : "Community Acquired Pressure Ulcers"}
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-amber-605 font-bold">Total:</span>
                        <input
                          type="number"
                          value={clinicalIndicators.pressureUlcerCommunityCount}
                          onChange={(e) => setClinicalIndicators({
                            ...clinicalIndicators,
                            pressureUlcerCommunityCount: Math.max(0, parseInt(e.target.value) || 0)
                          })}
                          className="w-10 text-center bg-amber-100 border-amber-300 rounded font-mono font-bold text-xs text-amber-900"
                        />
                      </div>
                    </div>

                    <div className="p-3 overflow-x-auto">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b text-slate-400 font-bold">
                            <th className="py-2 px-1 text-right">{isAr ? "القسم" : "Dept"}</th>
                            <th className="py-2 px-1 text-right">{isAr ? "اسم المريضة" : "Patient Name"}</th>
                            <th className="py-2 px-1 text-right">{isAr ? "الدرجة" : "Degree"}</th>
                            <th className="py-2 px-1 text-center text-slate-350 no-print">×</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y font-semibold text-slate-800">
                          {clinicalIndicators.pressureUlcerCommunityPatients.map((pu, idx) => (
                            <tr key={pu.id} className="hover:bg-amber-50/20">
                              <td className="py-1 px-1">
                                <input
                                  type="text"
                                  value={pu.dept}
                                  onChange={(e) => {
                                    const updated = [...clinicalIndicators.pressureUlcerCommunityPatients];
                                    updated[idx].dept = e.target.value;
                                    setClinicalIndicators({ ...clinicalIndicators, pressureUlcerCommunityPatients: updated });
                                  }}
                                  className="w-full bg-transparent border-0 text-[11px] p-0 focus:ring-0 text-right"
                                />
                              </td>
                              <td className="py-1 px-1">
                                <input
                                  type="text"
                                  value={pu.name}
                                  onChange={(e) => {
                                    const updated = [...clinicalIndicators.pressureUlcerCommunityPatients];
                                    updated[idx].name = e.target.value;
                                    setClinicalIndicators({ ...clinicalIndicators, pressureUlcerCommunityPatients: updated });
                                  }}
                                  className="w-full bg-transparent border-0 text-[11px] p-0 focus:ring-0 font-bold text-slate-805 text-right"
                                />
                              </td>
                              <td className="py-1 px-1">
                                <input
                                  type="text"
                                  value={pu.degree}
                                  onChange={(e) => {
                                    const updated = [...clinicalIndicators.pressureUlcerCommunityPatients];
                                    updated[idx].degree = e.target.value;
                                    setClinicalIndicators({ ...clinicalIndicators, pressureUlcerCommunityPatients: updated });
                                  }}
                                  className="w-full bg-transparent border-0 text-[10px] p-0 focus:ring-0 text-amber-900 text-right font-black"
                                />
                              </td>
                              <td className="py-1 px-1 text-center no-print text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = clinicalIndicators.pressureUlcerCommunityPatients.filter((_, i) => i !== idx);
                                    setClinicalIndicators({
                                      ...clinicalIndicators,
                                      pressureUlcerCommunityPatients: updated,
                                      pressureUlcerCommunityCount: updated.length
                                    });
                                  }}
                                  className="text-slate-350 hover:text-rose-500 font-extrabold text-sm"
                                >
                                  ×
                                </button>
                              </td>
                            </tr>
                          ))}
                          {clinicalIndicators.pressureUlcerCommunityPatients.length === 0 && (
                            <tr>
                              <td colSpan={4} className="text-center py-4 text-slate-400 italic">
                                {isAr ? "لا توجد قرح واردة مسجلة." : "No community-acquired pressure ulcers."}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="p-3 border-t bg-slate-50 no-print">
                    <button
                      type="button"
                      onClick={() => {
                        const newRow = { id: `pu-c-${Date.now()}`, dept: "ICU", name: "", degree: "2nd degree" };
                        const updated = [...clinicalIndicators.pressureUlcerCommunityPatients, newRow];
                        setClinicalIndicators({
                          ...clinicalIndicators,
                          pressureUlcerCommunityPatients: updated,
                          pressureUlcerCommunityCount: updated.length
                        });
                      }}
                      className="w-full py-1.5 border border-dashed border-amber-300 hover:border-amber-400 rounded-lg text-[11px] font-black text-amber-700 hover:text-amber-900 transition flex items-center justify-center gap-1 bg-white"
                    >
                      + {isAr ? "إضافة تقرير قرحة واردة" : "Add New CA Bedsore Record"}
                    </button>
                  </div>
                </div>

              </div>

              {/* 4. Isolation Patients */}
              <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="bg-slate-50 p-3.5 border-b border-slate-200 flex items-center justify-between">
                    <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-slate-600" />
                      {isAr ? "حالات العزل الوقائي بالمستشفى (Isolation Categories)" : "Hospital Isolation & Infection Protection Cases"}
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-bold">Total:</span>
                      <input
                        type="number"
                        value={clinicalIndicators.isolationCount}
                        onChange={(e) => setClinicalIndicators({
                          ...clinicalIndicators,
                          isolationCount: Math.max(0, parseInt(e.target.value) || 0)
                        })}
                        className="w-10 text-center bg-slate-100 border rounded font-mono font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="p-3 overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse text-slate-800 font-semibold">
                      <thead>
                        <tr className="border-b text-slate-400 font-bold">
                          <th className="py-2 px-1 text-right">{isAr ? "القسم" : "Dept"}</th>
                          <th className="py-2 px-1 text-right">{isAr ? "اسم الحالة" : "Patient Name"}</th>
                          <th className="py-2 px-1 text-right">{isAr ? "نوع العزل" : "Isolation Protocol"}</th>
                          <th className="py-2 px-1 text-center text-slate-350 no-print">×</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {clinicalIndicators.isolationPatients.map((iso, idx) => (
                          <tr key={iso.id} className="hover:bg-slate-50">
                            <td className="py-1 px-1">
                              <input
                                type="text"
                                value={iso.dept}
                                onChange={(e) => {
                                  const updated = [...clinicalIndicators.isolationPatients];
                                  updated[idx].dept = e.target.value;
                                  setClinicalIndicators({ ...clinicalIndicators, isolationPatients: updated });
                                }}
                                className="w-full bg-transparent border-0 text-[11px] p-0 focus:ring-0 text-right"
                              />
                            </td>
                            <td className="py-1 px-1">
                              <input
                                type="text"
                                value={iso.name}
                                onChange={(e) => {
                                  const updated = [...clinicalIndicators.isolationPatients];
                                  updated[idx].name = e.target.value;
                                  setClinicalIndicators({ ...clinicalIndicators, isolationPatients: updated });
                                }}
                                className="w-full bg-transparent border-0 text-[11px] p-0 focus:ring-0 font-bold text-right text-slate-800"
                              />
                            </td>
                            <td className="py-1 px-1 text-right">
                              <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
                                {iso.type}
                              </span>
                            </td>
                            <td className="py-1 px-1 text-center no-print">
                              <button
                                type="button"
                                onClick={() => {
                                    const updated = clinicalIndicators.isolationPatients.filter((_, i) => i !== idx);
                                    setClinicalIndicators({
                                      ...clinicalIndicators,
                                      isolationPatients: updated,
                                      isolationCount: updated.length
                                    });
                                }}
                                className="text-slate-350 hover:text-rose-500 font-extrabold text-sm"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                        {clinicalIndicators.isolationPatients.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center py-4 text-slate-400 italic">
                              {isAr ? "لا توجد حالات عزل مسجلة." : "No patients in protective isolation."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-3 border-t bg-slate-50 no-print">
                  <button
                    type="button"
                    onClick={() => {
                        const newRow = { id: `iso-${Date.now()}`, dept: "ICU", name: "", type: "contact" };
                        const updated = [...clinicalIndicators.isolationPatients, newRow];
                        setClinicalIndicators({
                          ...clinicalIndicators,
                          isolationPatients: updated,
                          isolationCount: updated.length
                        });
                    }}
                    className="w-full py-1.5 border border-dashed border-slate-300 hover:border-slate-400 rounded-lg text-[11px] font-black text-slate-700 hover:text-slate-900 transition flex items-center justify-center gap-1 bg-white"
                  >
                    + {isAr ? "إضافة حالة عزل" : "Add New Isolation Case"}
                  </button>
                </div>
              </div>

              {/* 5. Fall Risk, Reddened Beds, OR Surgical Status, and Transfers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* FALL RISK */}
                <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-3">
                  <h5 className="font-extrabold text-xs text-rose-805 border-b pb-1">
                    ⚠️ {isAr ? "مخاطر السقوط للمرضى (Fall Care)" : "Fall Care Ward Status"}
                  </h5>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">ICU Room / Risk</span>
                      <div className="grid grid-cols-2 gap-1 mt-0.5">
                        <input
                          type="number"
                          value={clinicalIndicators.fall.room.icu}
                          onChange={(e) => setClinicalIndicators({
                            ...clinicalIndicators,
                            fall: { ...clinicalIndicators.fall, room: { ...clinicalIndicators.fall.room, icu: parseInt(e.target.value) || 0 } }
                          })}
                          className="p-1 border rounded text-center text-xs font-mono font-bold"
                          placeholder="Room ICU"
                        />
                        <input
                          type="text"
                          value={clinicalIndicators.fall.risk.icu}
                          onChange={(e) => setClinicalIndicators({
                            ...clinicalIndicators,
                            fall: { ...clinicalIndicators.fall, risk: { ...clinicalIndicators.fall.risk, icu: e.target.value } }
                          })}
                          className="p-1 border rounded text-center text-xs font-bold"
                          placeholder="Risk ICU"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">IMCU Room / Risk</span>
                      <div className="grid grid-cols-2 gap-1 mt-0.5">
                        <input
                          type="number"
                          value={clinicalIndicators.fall.room.imcu}
                          onChange={(e) => setClinicalIndicators({
                            ...clinicalIndicators,
                            fall: { ...clinicalIndicators.fall, room: { ...clinicalIndicators.fall.room, imcu: parseInt(e.target.value) || 0 } }
                          })}
                          className="p-1 border rounded text-center text-xs font-mono font-bold"
                          placeholder="Room IMCU"
                        />
                        <input
                          type="text"
                          value={clinicalIndicators.fall.risk.imcu}
                          onChange={(e) => setClinicalIndicators({
                            ...clinicalIndicators,
                            fall: { ...clinicalIndicators.fall, risk: { ...clinicalIndicators.fall.risk, imcu: e.target.value } }
                          })}
                          className="p-1 border rounded text-center text-xs font-bold"
                          placeholder="Risk IMCU"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">INP Room / Risk</span>
                      <div className="grid grid-cols-2 gap-1 mt-0.5">
                        <input
                          type="number"
                          value={clinicalIndicators.fall.room.inp}
                          onChange={(e) => setClinicalIndicators({
                            ...clinicalIndicators,
                            fall: { ...clinicalIndicators.fall, room: { ...clinicalIndicators.fall.room, inp: parseInt(e.target.value) || 0 } }
                          })}
                          className="p-1 border rounded text-center text-xs font-mono font-bold"
                          placeholder="Room INP"
                        />
                        <input
                          type="text"
                          value={clinicalIndicators.fall.risk.inp}
                          onChange={(e) => setClinicalIndicators({
                            ...clinicalIndicators,
                            fall: { ...clinicalIndicators.fall, risk: { ...clinicalIndicators.fall.risk, inp: e.target.value } }
                          })}
                          className="p-1 border rounded text-center text-xs font-bold"
                          placeholder="Risk INP"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* BED REDDENING */}
                <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-3">
                  <h5 className="font-extrabold text-xs text-amber-805 border-b pb-1">
                    🛏️ {isAr ? "احمرار الجلد وسائد السرير (Bed Redden)" : "Skin Care / Bedsore Signs"}
                  </h5>
                  <div className="space-y-2 text-xs font-sans">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">ICU Room / Total</span>
                      <div className="grid grid-cols-2 gap-1 mt-0.5">
                        <input
                          type="number"
                          value={clinicalIndicators.bedRedden.room.icu}
                          onChange={(e) => setClinicalIndicators({
                            ...clinicalIndicators,
                            bedRedden: { ...clinicalIndicators.bedRedden, room: { ...clinicalIndicators.bedRedden.room, icu: parseInt(e.target.value) || 0 } }
                          })}
                          className="p-1 border rounded text-center text-xs font-mono"
                        />
                        <input
                          type="text"
                          value={clinicalIndicators.bedRedden.all.icu}
                          onChange={(e) => setClinicalIndicators({
                            ...clinicalIndicators,
                            bedRedden: { ...clinicalIndicators.bedRedden, all: { ...clinicalIndicators.bedRedden.all, icu: e.target.value } }
                          })}
                          className="p-1 border rounded text-center text-xs font-bold"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">IMCU Room / Total</span>
                      <div className="grid grid-cols-2 gap-1 mt-0.5">
                        <input
                          type="number"
                          value={clinicalIndicators.bedRedden.room.imcu}
                          onChange={(e) => setClinicalIndicators({
                            ...clinicalIndicators,
                            bedRedden: { ...clinicalIndicators.bedRedden, room: { ...clinicalIndicators.bedRedden.room, imcu: parseInt(e.target.value) || 0 } }
                          })}
                          className="p-1 border rounded text-center text-xs font-mono"
                        />
                        <input
                          type="text"
                          value={clinicalIndicators.bedRedden.all.imcu}
                          onChange={(e) => setClinicalIndicators({
                            ...clinicalIndicators,
                            bedRedden: { ...clinicalIndicators.bedRedden, all: { ...clinicalIndicators.bedRedden.all, imcu: e.target.value } }
                          })}
                          className="p-1 border rounded text-center text-xs font-bold"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">INP Room / Total</span>
                      <div className="grid grid-cols-2 gap-1 mt-0.5">
                        <input
                          type="number"
                          value={clinicalIndicators.bedRedden.room.inp}
                          onChange={(e) => setClinicalIndicators({
                            ...clinicalIndicators,
                            bedRedden: { ...clinicalIndicators.bedRedden, room: { ...clinicalIndicators.bedRedden.room, inp: parseInt(e.target.value) || 0 } }
                          })}
                          className="p-1 border rounded text-center text-xs font-mono"
                        />
                        <input
                          type="text"
                          value={clinicalIndicators.bedRedden.all.inp}
                          onChange={(e) => setClinicalIndicators({
                            ...clinicalIndicators,
                            bedRedden: { ...clinicalIndicators.bedRedden, all: { ...clinicalIndicators.bedRedden.all, inp: e.target.value } }
                          })}
                          className="p-1 border rounded text-center text-xs font-bold"
                        />
                      </div>
                    </div>
                    <div className="pt-1 flex items-center justify-between font-black text-rose-900 border-t">
                      <span>{isAr ? "إجمالي المنبهات الجلدية:" : "Total Bed Reddening:"}</span>
                      <input
                        type="number"
                        value={clinicalIndicators.bedRedden.total}
                        onChange={(e) => setClinicalIndicators({
                          ...clinicalIndicators,
                          bedRedden: { ...clinicalIndicators.bedRedden, total: parseInt(e.target.value) || 0 }
                        })}
                        className="w-12 text-center border-0 p-0 font-mono font-black text-rose-700 focus:ring-0 bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* OR SURGICAL FLOW */}
                <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-3">
                  <h5 className="font-extrabold text-xs text-indigo-950 border-b pb-1">
                    🏥 {isAr ? "حالات تدفق غرف العمليات (OR Surgery)" : "Surgical OR Audits"}
                  </h5>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-[10px] text-slate-500 block mb-0.5">{isAr ? "قبل العمليات (Pre OR):" : "Pre OR Patients:"}</span>
                      <div className="grid grid-cols-3 gap-1">
                        <div>
                          <span className="text-[9px] text-slate-400 block">ICU</span>
                          <input
                            type="number"
                            value={clinicalIndicators.orStatus.preOrRoom.icu}
                            onChange={(e) => {
                              const icuVal = parseInt(e.target.value) || 0;
                              const current = clinicalIndicators.orStatus;
                              setClinicalIndicators({
                                ...clinicalIndicators,
                                orStatus: { ...current, preOrRoom: { ...current.preOrRoom, icu: icuVal }, preOrVal: icuVal + current.preOrRoom.imcu + current.preOrRoom.inp }
                              });
                            }}
                            className="w-full p-0.5 border text-center text-[10px] font-mono"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block">IMCU</span>
                          <input
                            type="number"
                            value={clinicalIndicators.orStatus.preOrRoom.imcu}
                            onChange={(e) => {
                              const imcuVal = parseInt(e.target.value) || 0;
                              const current = clinicalIndicators.orStatus;
                              setClinicalIndicators({
                                ...clinicalIndicators,
                                orStatus: { ...current, preOrRoom: { ...current.preOrRoom, imcu: imcuVal }, preOrVal: current.preOrRoom.icu + imcuVal + current.preOrRoom.inp }
                              });
                            }}
                            className="w-full p-0.5 border text-center text-[10px] font-mono"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block">INP</span>
                          <input
                            type="number"
                            value={clinicalIndicators.orStatus.preOrRoom.inp}
                            onChange={(e) => {
                              const inpVal = parseInt(e.target.value) || 0;
                              const current = clinicalIndicators.orStatus;
                              setClinicalIndicators({
                                ...clinicalIndicators,
                                orStatus: { ...current, preOrRoom: { ...current.preOrRoom, inp: inpVal }, preOrVal: current.preOrRoom.icu + current.preOrRoom.imcu + inpVal }
                              });
                            }}
                            className="w-full p-0.5 border text-center text-[10px] font-mono"
                          />
                        </div>
                      </div>
                      <div className="mt-1 font-extrabold text-[10px] text-slate-600">
                        {isAr ? "إجمالي الحالات:" : "Pre OR Count:"} <span className="font-mono text-indigo-700">{clinicalIndicators.orStatus.preOrVal}</span>
                      </div>
                    </div>

                    <div className="border-t pt-1">
                      <span className="font-bold text-[10px] text-slate-500 block mb-0.5">{isAr ? "بعد العمليات (Post OR):" : "Post OR Patients:"}</span>
                      <div className="grid grid-cols-3 gap-1">
                        <div>
                          <span className="text-[9px] text-slate-400 block">ICU</span>
                          <input
                            type="number"
                            value={clinicalIndicators.orStatus.postOrRoom.icu}
                            onChange={(e) => {
                              const icuVal = parseInt(e.target.value) || 0;
                              const current = clinicalIndicators.orStatus;
                              setClinicalIndicators({
                                ...clinicalIndicators,
                                orStatus: { ...current, postOrRoom: { ...current.postOrRoom, icu: icuVal }, postOrVal: icuVal + current.postOrRoom.imcu + current.postOrRoom.inp }
                              });
                            }}
                            className="w-full p-0.5 border text-center text-[10px] font-mono"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block">IMCU</span>
                          <input
                            type="number"
                            value={clinicalIndicators.orStatus.postOrRoom.imcu}
                            onChange={(e) => {
                              const imcuVal = parseInt(e.target.value) || 0;
                              const current = clinicalIndicators.orStatus;
                              setClinicalIndicators({
                                ...clinicalIndicators,
                                orStatus: { ...current, postOrRoom: { ...current.postOrRoom, imcu: imcuVal }, postOrVal: current.postOrRoom.icu + imcuVal + current.postOrRoom.inp }
                              });
                            }}
                            className="w-full p-0.5 border text-center text-[10px] font-mono"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block">INP</span>
                          <input
                            type="number"
                            value={clinicalIndicators.orStatus.postOrRoom.inp}
                            onChange={(e) => {
                              const inpVal = parseInt(e.target.value) || 0;
                              const current = clinicalIndicators.orStatus;
                              setClinicalIndicators({
                                ...clinicalIndicators,
                                orStatus: { ...current, postOrRoom: { ...current.postOrRoom, inp: inpVal }, postOrVal: current.postOrRoom.icu + current.orStatus.postOrRoom.imcu + inpVal }
                              });
                            }}
                            className="w-full p-0.5 border text-center text-[10px] font-mono"
                          />
                        </div>
                      </div>
                      <div className="mt-1 font-extrabold text-[10px] text-slate-600">
                        {isAr ? "إجمالي الحالات:" : "Post OR Count:"} <span className="font-mono text-indigo-700">{clinicalIndicators.orStatus.postOrVal}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TRANSFER IN & TRANSFERS OUT */}
                <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-3">
                  <h5 className="font-extrabold text-xs text-emerald-900 border-b pb-1">
                    🔄 {isAr ? "تحويلات المرضى والأقسام (Transfers)" : "Patient Transfers Flow"}
                  </h5>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-[10px] text-emerald-700 block mb-0.5">{isAr ? "محول إلى الداخل (Transfers In):" : "Transfers In:"}</span>
                      <div className="grid grid-cols-3 gap-1">
                        <div>
                          <span className="text-[9px] text-slate-400 block">ICU</span>
                          <input
                            type="number"
                            value={clinicalIndicators.transfers.in.icu}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setClinicalIndicators({
                                ...clinicalIndicators,
                                transfers: { ...clinicalIndicators.transfers, in: { ...clinicalIndicators.transfers.in, icu: val } }
                              });
                            }}
                            className="w-full p-0.5 border text-center text-[10px] font-mono"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block">IMCU</span>
                          <input
                            type="number"
                            value={clinicalIndicators.transfers.in.imcu}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setClinicalIndicators({
                                ...clinicalIndicators,
                                transfers: { ...clinicalIndicators.transfers, in: { ...clinicalIndicators.transfers.in, imcu: val } }
                              });
                            }}
                            className="w-full p-0.5 border text-center text-[10px] font-mono"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block">INP</span>
                          <input
                            type="number"
                            value={clinicalIndicators.transfers.in.inp}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setClinicalIndicators({
                                ...clinicalIndicators,
                                transfers: { ...clinicalIndicators.transfers, in: { ...clinicalIndicators.transfers.in, inp: val } }
                              });
                            }}
                            className="w-full p-0.5 border text-center text-[10px] font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-1">
                      <span className="font-bold text-[10px] text-rose-700 block mb-0.5">{isAr ? "محول إلى الخارج (Transfers Out):" : "Transfers Out:"}</span>
                      <div className="grid grid-cols-3 gap-1">
                        <div>
                          <span className="text-[9px] text-slate-400 block">ICU</span>
                          <input
                            type="number"
                            value={clinicalIndicators.transfers.out.icu}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setClinicalIndicators({
                                ...clinicalIndicators,
                                transfers: { ...clinicalIndicators.transfers, out: { ...clinicalIndicators.transfers.out, icu: val } }
                              });
                            }}
                            className="w-full p-0.5 border text-center text-[10px] font-mono"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block">IMCU</span>
                          <input
                            type="number"
                            value={clinicalIndicators.transfers.out.imcu}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setClinicalIndicators({
                                ...clinicalIndicators,
                                transfers: { ...clinicalIndicators.transfers, out: { ...clinicalIndicators.transfers.out, imcu: val } }
                              });
                            }}
                            className="w-full p-0.5 border text-center text-[10px] font-mono"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block">INP</span>
                          <input
                            type="number"
                            value={clinicalIndicators.transfers.out.inp}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setClinicalIndicators({
                                ...clinicalIndicators,
                                transfers: { ...clinicalIndicators.transfers, out: { ...clinicalIndicators.transfers.out, inp: val } }
                              });
                            }}
                            className="w-full p-0.5 border text-center text-[10px] font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* Global Supervisor Qualitative Field Notes */}
          <div className="mt-8 border-t border-slate-300 pt-6 no-print">
            <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider block mb-2">
              📝 {isAr ? "ملاحظات وتوصيات السوبرفايزر اليدوية المقيدة:" : "Supervisor Shift Handover & Field Notes:"}
            </span>
            <textarea 
              value={dailyReport.notes || ""} 
              onChange={(e) => setDailyReport({...dailyReport, notes: e.target.value})} 
              placeholder={isAr ? "اكتب هنا أي ملاحظات إضافية، طوارئ مخصصة، كسر أجهزة، إلخ..." : "Write any clinical issues, device breakdowns, emergency incidents, etc..."}
              className="w-full border border-slate-300 p-2 text-xs rounded-xl min-h-[90px] outline-none hover:border-pink-300 focus:border-pink-500 bg-slate-50/50 transition-all font-sans"
            />
          </div>

          <div className="mt-4 hidden print:block border border-slate-800 p-3 rounded-lg bg-slate-50/20 avoid-break">
            <strong className="text-xs text-slate-850 block mb-1">
              {isAr ? "الملاحظات الإدارية والسريرية الموثقة:" : "Supervisor Handover Notes:"}
            </strong>
            <p className="text-xs font-sans text-slate-700 whitespace-pre-wrap leading-relaxed">
              {dailyReport.notes || (isAr ? "لا توجد ملاحظات إضافية مسجلة." : "No additional handover remarks recorded.")}
            </p>
          </div>

          {/* Supervisor & Operational Signature Footer */}
          <div className="mt-12 pt-6 border-t-2 border-slate-800 grid grid-cols-2 gap-4 text-xs font-bold text-slate-700 avoid-break">
            <div>
              <span>{isAr ? "توقيع واعتماد السوبرفايزر:" : "Authorized Supervisor Signature:"}</span>
              <span className="inline-block w-40 border-b border-dashed border-slate-500 mx-2"></span>
            </div>
            <div className="text-left font-mono">
              <span>{isAr ? "نظام معتمد جودة المستشفيات" : "Hospital Certified Clinical Quality system"}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</div>
  );
}
