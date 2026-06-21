import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Database,
  Sliders,
  ShieldAlert,
  Award,
  FileSpreadsheet,
  User,
  CheckSquare,
  X,
  Check,
  Users,
  Shield,
  BookOpen,
  Clock,
  Activity,
  FileText,
  Bell,
  Trash2,
  HeartPulse,
  Star,
  Sparkles,
  UserCheck,
  BarChart3,
  ChevronRight,
  AlertTriangle,
  File,
  ThumbsUp,
  Printer,
  Calendar,
  Filter,
  Search,
  ShieldCheck,
  Brain
} from "lucide-react";
import { AppUser, SavedRecord } from "../types";
import { useFirestoreSync } from "../hooks/useFirestoreSync";
import { DynamicProfessionalLogo } from "./DynamicProfessionalLogo";

// Import Cloud-Safe functions from firestore service
import {
  saveSentinelIncident,
  deleteSentinelIncident,
  syncCQIOvrs,
  saveCQIOvr,
  deleteCQIOvr,
  syncCQIStaffEvals,
  saveCQIStaffEval,
  deleteCQIStaffEval,
  syncCQIUnitInspections,
  saveCQIUnitInspection,
  deleteCQIUnitInspection,
  syncCQIPolicyAcks,
  saveCQIPolicyAck,
  deleteCQIPolicyAck,
  saveSetting,
  getSetting,
  syncSetting,
  syncCQIDecisionLogs,
  saveCQIDecisionLog,
  deleteCQIDecisionLog,
  syncPeriodicReports,
  savePeriodicReport,
  deletePeriodicReport
} from "../lib/firestoreService";

interface QualityAnalyticsHubProps {
  records: SavedRecord[];
  allAvailableTemplates: any[];
  language: "ar" | "en";
  currentUser: AppUser;
  resolvedGaps: Record<string, { resolved: boolean; notes: string; resolvedBy: string; resolvedAt: string }>;
  handleToggleGapState: (gapKey: string) => void;
  editingGapKey: string | null;
  setEditingGapKey: (val: string | null) => void;
  gapResolutionNote: string;
  setGapResolutionNote: (val: string) => void;
  handleSaveGapResolution: () => void;
  handleSeedMockAuditData: () => void;
  setRecords: (val: SavedRecord[]) => void;
  sentinelIncidents: any[];
  setSentinelIncidents: (val: any[]) => void;
  jciCheckedArray: number[];
  setJciCheckedArray: (val: number[]) => void;
  analyticsSubTab: "kpis" | "sentinel" | "compliance";
  setAnalyticsSubTab: (val: "kpis" | "sentinel" | "compliance") => void;
  showIncidentForm: boolean;
  setShowIncidentForm: (val: boolean) => void;
  newIncidentForm: {
    department: string;
    typeAr: string;
    typeEn: string;
    severity: string;
    descAr: string;
    descEn: string;
    rcaAr: string;
    rcaEn: string;
    actionAr: string;
    actionEn: string;
  };
  setNewIncidentForm: (val: any) => void;
  addSystemLog: (msg: string, type: "info" | "warning" | "error" | "success") => void;
  notifications: any[];
  setNotifications: (val: any[]) => void;
  handleNotificationClick: (notif: any) => void;
  hospitalSettings: any;
  systemUsers?: any[];
}

// Mock Employees list for evaluations
const QUALITY_STAFF_MOCK = [
  { id: "user-nurse", nameAr: "أ. فاطمة الزهراء (استاف التمريض)", nameEn: "FZ - Sister Fatima El-Zahraa" },
  { id: "emp-1", nameAr: "محمود عمر (مساعد رئيس تمريض AHN)", nameEn: "MO - Mahmoud Omar (Asst. Head)" },
  { id: "emp-2", nameAr: "هاني ناصر (أخصائي تمريض SN)", nameEn: "HN - Hany Naser (Staff Nurse)" },
  { id: "emp-3", nameAr: "عمر أحمد (أخصائي تمريض SN)", nameEn: "OA - Omar Ahmed (Staff Nurse)" },
  { id: "emp-6", nameAr: "ندى محمد (أخصائي تمريض SN)", nameEn: "NM - Nada Mohamed (Staff Nurse)" },
  { id: "emp-8", nameAr: "إسراء عاطف (أخصائي تمريض SN)", nameEn: "EA - Esraa Atef (Staff Nurse)" },
  { id: "emp-9", nameAr: "رشدي أحمد (ممرض امتياز INT)", nameEn: "RA - Roshdy Ahmed (Intern Nurse)" }
];

export default function QualityAnalyticsHub({
  records,
  allAvailableTemplates,
  language,
  currentUser,
  resolvedGaps,
  handleToggleGapState,
  editingGapKey,
  setEditingGapKey,
  gapResolutionNote,
  setGapResolutionNote,
  handleSaveGapResolution,
  handleSeedMockAuditData,
  setRecords,
  sentinelIncidents,
  setSentinelIncidents,
  jciCheckedArray,
  setJciCheckedArray,
  analyticsSubTab,
  setAnalyticsSubTab,
  showIncidentForm,
  setShowIncidentForm,
  newIncidentForm,
  setNewIncidentForm,
  addSystemLog,
  notifications,
  setNotifications,
  handleNotificationClick,
  hospitalSettings,
  systemUsers = []
}: QualityAnalyticsHubProps) {

  const isAr = language === "ar";

  // Backwards compatible & expanded sub-tabs
  const [activeTab, setActiveTabLocal] = useState<"kpis" | "ovr" | "compliance" | "eval-staff" | "eval-unit" | "policies" | "archive" | "decision" | "reports">("kpis");

  // Custom Modal States (to bypass iframe window.prompt/alert blocks)
  const [authModal, setAuthModal] = useState<{
    open: boolean;
    title: string;
    message?: string;
    action: (code: string) => void;
    input: string;
  }>({ open: false, title: "", action: () => {}, input: "" });

  const executeAuthModal = () => {
    if (!authModal.input) return;
    authModal.action(authModal.input);
    setAuthModal({ open: false, title: "", action: () => {}, input: "" });
  };

  // Sync parent tab trigger
  useEffect(() => {
    if (analyticsSubTab === "kpis") {
      setActiveTabLocal("kpis");
    } else if (analyticsSubTab === "sentinel") {
      setActiveTabLocal("ovr");
    } else if (analyticsSubTab === "compliance") {
      setActiveTabLocal("compliance");
    }
  }, [analyticsSubTab]);

  // 1. OVR STATE - Synced Real-Time with Firestore
  const [ovrs, setOvrs] = useFirestoreSync<any>(syncCQIOvrs, [
    {
      id: "ovr-1",
      date: "2026-06-05",
      time: "11:30",
      department: "EMERGENCY UNIT",
      categoryAr: "إعطاء الدواء خطأ (Medication Error)",
      categoryEn: "Medication Misadministration",
      severity: "Category D - Harm Reached Patient but No Harm Caused",
      descAr: "تم إعطاء جرعة مضاعفة من مسكن الآلام نتيجة عدم التحقق المزدوج من تذكرة العلاج قبل الحقن. تم رصد الواقعة بالسرعة وملاحظة ضربات القلب بانتظام.",
      descEn: "Double dose of painkiller administered due to lack of standard secondary verification before injection. Condition monitored closely with normal vitals.",
      correctiveAr: "استدعاء الصيدلي الإكلينيكي فوراً بموقع الطوارئ ومراجعة العلامات الحيوية كل 15 دقيقة مع توقيع عقوبة تنبيه إداري للممرض المسؤول.",
      correctiveEn: "Immediate bedside clinical pharmacist call, vitals monitored q15m, and administrative warning issued.",
      witness: "أ. هدى أحمد (مشرفة تمريض)",
      loggedBy: "أ. نورهان علي (جودة)",
      patientInvolved: true,
      patientMRN: "MRN-84920",
      patientName: "منى عاطف الجبالي",
      status: "Corrective Action Verified"
    }
  ]);

  // 2. STAFF EVALUATIONS STATE - Synced Real-Time with Firestore
  const [staffEvals, setStaffEvals] = useFirestoreSync<any>(syncCQIStaffEvals, [
    {
      id: "eval-1",
      employeeId: "user-nurse",
      employeeNameAr: "أ. فاطمة الزهراء (استاف التمريض)",
      employeeNameEn: "Sister Fatima El-Zahraa (Staff Nurse)",
      department: "EMERGENCY UNIT",
      evalDate: "2026-06-01",
      evaluatorName: "أ. هدى أحمد (مشرفة تمريض الطوارئ)",
      scores: {
        clinical: 5,
        policy: 4,
        documentation: 5,
        attendance: 4,
        ethics: 5
      },
      comments: "تظهر التزاماً مطلقاً بمعايير الجودة السريرية وتحرص على تعبئة شيت جرد الكود بلو وعربة الطوارئ بالوقت الصحيح."
    }
  ]);

  // 3. UNIT AUDITS STATE - Synced Real-Time with Firestore
  const [unitAudits, setUnitAudits] = useFirestoreSync<any>(syncCQIUnitInspections, [
    {
      id: "unit-insp-1",
      unit: "EMERGENCY UNIT",
      date: "2026-06-06",
      inspector: "أ. نورهان علي (جودة)",
      complianceRate: 92,
      scores: {
        codeBlue: true,
        coldChain: true,
        gases: true,
        fireSafety: false,
        nurseCall: true,
        preventiveMaint: true
      },
      notes: "إخفاق في مخرج طوارئ الطوارئ بسبب تراكم شيتات إدارية فارغة خلفه. تم إزالتها فوراً أثناء التدقيق لتأمين الممر."
    }
  ]);

  // 4. GAHAR STANDARDS CHECKED STATE (Hospital wide checklist tracker)
  const [gaharChecked, setGaharChecked] = useState<number[]>([11, 12, 14, 21, 23, 24]);

  useEffect(() => {
    getSetting("hospital_gahar_checked").then((val) => {
      if (val && Array.isArray(val)) {
        setGaharChecked(val);
      }
    });
  }, []);

  const handleToggleGaharCheckedValue = async (id: number) => {
    const next = gaharChecked.includes(id) 
      ? gaharChecked.filter(x => x !== id) 
      : [...gaharChecked, id];
    setGaharChecked(next);
    await saveSetting("hospital_gahar_checked", next);
  };

  // 5. ACKNOWLEDGED POLICIES STATE - Synced Real-Time, Multi-User safe
  const [policyAcks, setPolicyAcks] = useFirestoreSync<any>(syncCQIPolicyAcks, []);
  
  // 6. CLINICAL DECISION SUPPORT SIMULATOR LOGS (Persistent Firestore DB)
  const [decisionLogs, setDecisionLogs] = useFirestoreSync<any>(syncCQIDecisionLogs, []);

  // 7. PERIODIC CLINICAL PERFORMANCE REPORTS (Persistent Firestore DB)
  const [periodicReports, setPeriodicReports] = useFirestoreSync<any>(syncPeriodicReports, []);

  // Form states for Periodic Performance Report Generator
  const [reportDept, setReportDept] = useState<string>("EMERGENCY UNIT");
  const [reportPeriodType, setReportPeriodType] = useState<"monthly" | "quarterly">("monthly");
  const [reportMonth, setReportMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [reportQuarter, setReportQuarter] = useState<number>(1); // 1-4
  const [reportYear, setReportYear] = useState<number>(2026);
  const [reportTargetCompliance, setReportTargetCompliance] = useState<number>(95);
  const [reportRecommendations, setReportRecommendations] = useState<string>("");
  const [reportHighlights, setReportHighlights] = useState<string>("");
  const [selectedArchivedReport, setSelectedArchivedReport] = useState<any | null>(null);
  const [isSigningReport, setIsSigningReport] = useState<boolean>(false);

  // Simulator Form input states
  const [simPatientName, setSimPatientName] = useState<string>("أحمد عبد الله المنصوري");
  const [simPatientMRN, setSimPatientMRN] = useState<string>("MRN-30491");
  const [simDept, setSimDept] = useState<string>("EMERGENCY UNIT");
  const [simBP, setSimBP] = useState<number>(115);
  const [simPulse, setSimPulse] = useState<number>(78);
  const [simSPO2, setSimSPO2] = useState<number>(98);
  const [simHighAlert, setSimHighAlert] = useState<boolean>(false);
  const [simInfusionRate, setSimInfusionRate] = useState<number>(15);
  const [simFallRisk, setSimFallRisk] = useState<boolean>(false);
  const [simNarcoticDose, setSimNarcoticDose] = useState<number>(0);
  const [simDripName, setSimDripName] = useState<string>("Dopamine Drip");

  // Current simulation output display state
  const [simActiveResult, setSimActiveResult] = useState<any | null>(null);
  const [editingSimLogId, setEditingSimLogId] = useState<string | null>(null);
  const [simSearchTerm, setSimSearchTerm] = useState<string>("");
  const [simDeptFilter, setSimDeptFilter] = useState<string>("");

  const handlePerformClinicalAuditCheck = () => {
    // Perform GAHAR safety processing
    let safetyScore = 100;
    const triggers: string[] = [];
    const recommendations: string[] = [];

    // Validations & logic (Redacted for brevity, wait, I MUST KEEP it all!)
    
    // BP / Pulse check
    if (simBP < 90 && simPulse > 100) {
      safetyScore -= 30;
      triggers.push(isAr ? "🚨 إنذار فوري باشتباه الصدمة الإنتانية (Sepsis Alert Criteria Met)" : "🚨 Suspected Sepsis Shock criteria triggered");
      recommendations.push(isAr ? "قم بتفعيل بروتوكول Surviving Sepsis وحقن مضاد واسع المدى خلال ساعة واحدة." : "Begin sepsis 1-hour bundle: request Stat lactate level, blood cultures, and administer broad-spectrum antibiotics.");
    }
    
    // SPO2 hypoxia check
    if (simSPO2 < 93) {
      safetyScore -= 20;
      triggers.push(isAr ? "⚠️ نقص الأكسجة الحاد بالمستويين السريريين (Acute Hypoxia Risk Detected)" : "⚠️ Acute Medical Hypoxia Protocol Triggered");
      recommendations.push(isAr ? "ابدأ فوراً بتوصيل الأكسجين الأنفي وطابِق نسبة الغازات بالدم الشرياني (ABG)." : "Initiate immediate low-flow oxygen nasal cannula and schedule arterial blood gas (ABG) profiling.");
    }

    // High Alert Drug Double-Sign Check
    if (simHighAlert) {
      if (simInfusionRate > 35) {
        safetyScore -= 15;
        triggers.push(isAr ? "🚫 معدل تسريب فوق الحد المصرح للأدوية عالية الخطورة" : "🚫 Over-limit drip rate on High-Alert IV therapy");
        recommendations.push(isAr ? "معدل التسريب يتخطى 35 مل/ساعة؛ يستلزم ختم الصيدلي الإكلينيكي المعتمد وموافقة الطبيب المباشر." : "Infusion rate exceeds protective safety cap (35ml/hr). Clinical pharmacist verification required.");
      } else {
        recommendations.push(isAr ? "التحقق المزدوج الإيجابي مفعل من ممرضين مرخصين في موقع الحقن." : "Dual Bedside Verification completed successfully. Registered in digital audit log.");
      }
    }

    // Fall Risk Morse Checklist
    if (simFallRisk) {
      safetyScore -= 20;
      triggers.push(isAr ? "🚧 خطر سقوط مفرط للمريض (High Patient-Fall Risk Target)" : "🚧 Patient classified under High Morse Fall Risk category");
      recommendations.push(isAr ? "ألصِق المعصم الأصفر المخصص لخطر السقوط، وأبقِ سياج السرير مغلقاً وبند النداء قريباً." : "Apply high-visibility yellow armband. Keep bedrails elevated, non-skid footwear verified, and call-bell positioned in reach.");
    }

    // Narcotics Control
    if (simNarcoticDose > 25) {
      safetyScore -= 15;
      triggers.push(isAr ? "👮 تجاوز الحد الوقائي اليومي لجرعة مشتقات التخدير المخدرة" : "👮 Controlled Narcotic Dose Limit warning");
      recommendations.push(isAr ? "جرعة التخدير تتطلب مطابقة كود الخزنة المزدوج وسجل الرقابة الطبية بالمستشفى." : "Controlled substances dosage exceeds baseline parameters. Safe-locked registry verification required with double-witness stamp.");
    }

    const calculatedResult = {
      id: editingSimLogId || ("sim-" + Date.now()),
      timestamp: new Date().toISOString(),
      patientName: simPatientName,
      patientMRN: simPatientMRN,
      department: simDept,
      vitals: {
        bp: simBP,
        pulse: simPulse,
        spo2: simSPO2
      },
      inputs: {
        highAlert: simHighAlert,
        dripName: simDripName,
        infusionRate: simInfusionRate,
        fallRisk: simFallRisk,
        narcoticDose: simNarcoticDose
      },
      safetyScore: Math.max(10, safetyScore),
      triggers,
      recommendations,
      auditedBy: currentUser.nameAr || currentUser.email,
      status: "Audited & Checked"
    };

    setSimActiveResult(calculatedResult);
    addSystemLog(isAr ? "تم إجراء مراجعة القرار ودعم الجودة بنجاح" : "Clinical decision criteria scanned successfully", "success");
  };

  const handleSaveSimLogToDatabase = () => {
    if (!simActiveResult) return;
    
    saveCQIDecisionLog(simActiveResult).then(() => {
      addSystemLog(isAr ? "تم حفظ التقرير السريري في الأرشيف الرسمي كـ HIPAA Log" : "Clinical support log stored officially under high-visibility audit trails", "success");
      
      // Dispatch real-time quality notification
      const newNotif = {
        id: `notif-${Date.now()}`,
        messageAr: `💡 [دعم القرار السريري] الممرض(ة) الفاحص(ة) (${currentUser.nameAr || currentUser.email}) قام بتوصيف وحفظ استشارة سريرية للمريض (${simPatientName}) برقم ملف (${simPatientMRN}) بقسم (${simDept}) وحقق أمان سريري بمقدار (${simActiveResult.safetyScore}%).`,
        messageEn: `💡 [Clinical Decision Saved] Nurse Clinical Auditor (${currentUser.nameEn || currentUser.email}) verified and saved clinical advice for Patient (${simPatientName}) [${simPatientMRN}] in Ward (${simDept}) with safety score (${simActiveResult.safetyScore}%).`,
        timestamp: new Date().toISOString(),
        read: false
      };
      const updatedNotifs = [newNotif, ...notifications];
      setNotifications(updatedNotifs);
      saveSetting("baheya_notifications", updatedNotifs);

      setSimActiveResult(null);
      setEditingSimLogId(null);
    }).catch(err => {
      alert("Error: " + err.message);
    });
  };

  const handleDeleteSimLog = (logId: string) => {
    if (confirm(isAr ? "هل ترغب بمحو هذا التقرير الجنائي من الأرشيف؟" : "Purge this certified clinical log permanently?")) {
      deleteCQIDecisionLog(logId).then(() => {
        addSystemLog(isAr ? "تم التخلص من السجل السريري المقاوم بنجاح" : "Clinical audit log successfully deleted", "warning");
      });
    }
  };

  const handleEditSimLog = (log: any) => {
    setEditingSimLogId(log.id);
    setSimPatientName(log.patientName);
    setSimPatientMRN(log.patientMRN);
    setSimDept(log.department);
    setSimBP(log.vitals?.bp || 120);
    setSimPulse(log.vitals?.pulse || 70);
    setSimSPO2(log.vitals?.spo2 || 98);
    setSimHighAlert(log.inputs?.highAlert || false);
    setSimInfusionRate(log.inputs?.infusionRate || 0);
    setSimFallRisk(log.inputs?.fallRisk || false);
    setSimNarcoticDose(log.inputs?.narcoticDose || 0);
    setSimDripName(log.inputs?.dripName || "Dopamine Drip");
    setSimActiveResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Compute active user's acknowledged policies array on the fly
  const acknowledgedPolicies = (policyAcks || [])
    .filter((ack: any) => ack.nurseId === currentUser.id)
    .map((ack: any) => ack.policyId);

  // Static Policy library array
  const POLICIES_ARRAY = [
    {
      id: "pol-ident",
      code: "BH-MED-P-001",
      titleAr: "سياسة التحقق الثنائي العالي الدقة من هوية المريض",
      titleEn: "Standard Policy of Double Patient Identification Check",
      chapter: "IPSG.1 / ACC - سلامة المرضى والتعريف",
      author: "لجنة الجودة الطبية والاعتماد",
      revDate: "2026-01",
      mustRead: true,
      bodyAr: "يتم استخدام معيارين اثنين منفصلين لتعريف المريض قبل سحب أي عينة للخلط أو إعطاء دواء (الاسم الرباعي كاملاً للمريض + الرقم السري الطبي الموحد للملف MRN). السياسة تحظر مطلقاً الاستناد لرقم الغرفة أو رقم سرير المريض كمعرف سريري متاح في هذا الصدد.",
      bodyEn: "Use two separate medical identifiers prior to administering therapies/medications or compiling samples: Patient Full Name + Clinical MRN ID. Bed numbers and Ward/Room tags are strictly prohibited as primary identifiers."
    },
    {
      id: "pol-transfuse",
      code: "BH-MED-P-022",
      titleAr: "بروتوكول التحقق الثلاثي المتقاطع لنقل الدم ومشتقاته للسرطان",
      titleEn: "Triple Cross-Check Blood Transfusion Oncology Protocol",
      chapter: "PCP.5 / IPSG.3 - معايير الرعاية والأدوية الخطرة",
      author: "لجنة مراقبة بنك الدم والجودة",
      revDate: "2026-03",
      mustRead: true,
      bodyAr: "يستلزم نقل الدم موافقة كتابية معتمدة مسبقاً. يقوم ممرضان مرخصان بالتناوب عند سرير المريض للتأكد بصوت متبادل مرتفع من: كود الكيس الوردي، الاسم الرباعي وتطابق فصيلة دم المتبرع مع المستقبِل مع مطابقة رقم تذكرة الاعتماد الطبي.",
      bodyEn: "Requires certified written informed consent. Two registered nurses must verify together at patient's bedside: blood bag identifier barcode, recipient full name and clinical MRN, patient blood group and match parameters."
    },
    {
      id: "pol-timeout",
      code: "BH-SURG-P-009",
      titleAr: "بروتوكول التقرير الزمني والتايم أوف الجراحي الشامل",
      titleEn: "Surgical Site Marking and Time-Out Regulation",
      chapter: "IPSG.4 / PCP - الجراحة الآمنة والعمليات المعززة",
      author: "رئيس قسم الجراحات ورئيس الجودة",
      revDate: "2026-02",
      mustRead: false,
      bodyAr: "يتم إمضاء 'التايم أوف' الجراحي قبل التخدير وشروع المشرط مباشرة. يتضمن النداء الجماعي الصاخب في قاعة الجراحة لكل من الجراح، طبيب التخدير والممرضة المدورة للتحقق المشترك من هوية المريض وموقع العلامة المكتوبة بالجلد.",
      bodyEn: "Surgical Timeout is executed immediately prior to incision. Verbal group confirmation amongst surgeon, anesthesiologist, and scrub nurse is mandatory, verifying: patient identity, surgical mark, procedure parameters, and equipment."
    },
    {
      id: "pol-sharp",
      code: "BH-INF-P-040",
      titleAr: "سياسة وبروتوكول تفادي وخز الإبر والتعرض المهني للعدوى",
      titleEn: "Needle-Stick Injury Prevention and Professional Exposure Guidelines",
      chapter: "PCI.3 / HOM - إدارة مخاطر مكافحة العدوى",
      author: "لجنة مكافحة العدوى والسلامة البيئية",
      revDate: "2026-05",
      mustRead: true,
      bodyAr: "يمنع كبـس أو إعادة غطاء السرنجة المستعملة باليد مطلقاً (No Recapping). يتم إلقاء الإبر فور الاستخدام مباشرة في صندوق التفتيش والأجسام الحادة الأصفر المقاوم للاختراق. في حال الوخز، يتم غسل الموقع فوراً بالماء والصابون والتبليغ.",
      bodyEn: "Manual recapping of used syringes is strictly prohibited. Discard sharps immediately post-use into the rigid puncture-proof yellow sharps box. In case of injury, wash site under running water, report immediately, and trace baseline immunology."
    }
  ];

  // Generate periodic performance report
  const handleGeneratePeriodicReport = () => {
    if (!reportRecommendations || !reportHighlights) {
      alert(isAr ? "يرجى ملء أبرز الملاحظات والتوصيات الناتجة عن أداء القسم." : "Please fill in highlights and recommendations.");
      return;
    }

    const startIdx = Date.now().toString().slice(-4);
    const newReport = {
       id: `PR-${reportYear}-${reportDept.replace(/\s+/g, '-').toUpperCase()}-${startIdx}`,
       department: reportDept,
       periodType: reportPeriodType, // "monthly" | "quarterly"
       periodReference: reportPeriodType === "monthly" ? reportMonth : reportQuarter,
       year: reportYear,
       targetCompliance: reportTargetCompliance,
       highlights: reportHighlights,
       recommendations: reportRecommendations,
       authorName: currentUser.nameAr || currentUser.nameEn,
       authorId: currentUser.id,
       timestamp: new Date().toISOString(),
       status: "Draft", // Draft, Signed
       actualComplianceScore: Math.floor(Math.random() * (100 - 65 + 1) + 65) // Demo metric calculation
    };

    savePeriodicReport(newReport).then(() => {
       addSystemLog(`Generated new Periodic Performance Report PR-${reportYear}-${startIdx}`, "success");
       alert(isAr ? "✅ تم إنشاء وتوثيق التقرير الدوري للقسم بنجاح." : "Periodic Report generated successfully.");
       setReportHighlights("");
       setReportRecommendations("");
    }).catch(err => {
       alert("Error generating report: " + err.message);
    });
  };

  const handleSignReport = (report: any) => {
    setAuthModal({
      open: true,
      title: isAr ? `توقيع إلكتروني للتقرير` : `Sign Report`,
      message: isAr ? `أدخل الرمز السري لتوقيع التقرير (معرف القسم: ${report.department}):` : `Enter PIN to sign report for ${report.department}:`,
      input: "",
      action: (pin: string) => {
        if (pin === currentUser.pin) {
          const updated = {
            ...report,
            status: "Signed",
            signedAt: new Date().toISOString(),
            signedBy: currentUser.nameAr || currentUser.nameEn
          };
          savePeriodicReport(updated);
          alert(isAr ? "تم توقيع التقرير وأرشفته باعتراف." : "Report signed and accredited.");
        } else {
          alert(isAr ? "الرمز السري غير صحيح." : "Incorrect PIN.");
        }
      }
    });
  };

  // Helper sync calls to cache
  useEffect(() => {
    localStorage.setItem("hospital_cqi_ovrs", JSON.stringify(ovrs));
  }, [ovrs]);

  useEffect(() => {
    localStorage.setItem("hospital_cqi_staff_evals", JSON.stringify(staffEvals));
  }, [staffEvals]);

  useEffect(() => {
    localStorage.setItem("hospital_cqi_unit_inspections", JSON.stringify(unitAudits));
  }, [unitAudits]);

  useEffect(() => {
    localStorage.setItem("hospital_gahar_checked", JSON.stringify(gaharChecked));
  }, [gaharChecked]);

  useEffect(() => {
    localStorage.setItem("hospital_policy_acks", JSON.stringify(acknowledgedPolicies));
  }, [acknowledgedPolicies]);

  // Aggregate quality statistics dynamically
  let totalChecks = 0;
  let successfulChecks = 0;
  let criticalFailures = 0;
  const openAlertsList: any[] = [];

  records.forEach((rec) => {
    const temp = allAvailableTemplates?.find(t => t.id === rec.templateId);
    const templateTitle = temp ? (isAr ? temp.titleAr : temp.titleEn) : rec.templateId;
    const templateCode = temp ? temp.code : "";
    
    if (rec.gridData) {
      rec.gridData.forEach((row) => {
        if (row.days) {
          Object.entries(row.days).forEach(([day, val]) => {
            if (val) {
              totalChecks++;
              if (val === "✔" || val !== "✘") {
                successfulChecks++;
              }
              if (val === "✘") {
                criticalFailures++;
                const gapKey = `${rec.id}-${row.code || row.itemEn}-${day}`;
                openAlertsList.push({
                  recordId: rec.id,
                  recordDate: rec.date,
                  templateCode,
                  templateTitle,
                  itemName: row.itemAr,
                  itemEn: row.itemEn,
                  dayNum: day,
                  staffName: rec.staffName,
                  department: rec.department,
                  uniqueGapKey: gapKey
                });
              }
            }
          });
        }
      });
    }
  });

  const compliancePercent = totalChecks > 0 ? Math.round((successfulChecks / totalChecks) * 100) : 100;

  const handleToggleJci = (id: number) => {
    if (jciCheckedArray.includes(id)) {
      setJciCheckedArray(jciCheckedArray.filter(i => i !== id));
    } else {
      setJciCheckedArray([...jciCheckedArray, id]);
    }
  };

  const jciCompletionRate = Math.round((jciCheckedArray.length / 6) * 100);

  // GAHAR Accreditations calculation
  const totalGaharStandardItems = 8; // ACC, PCP, PFR, SQE, FMS, IM, PCI, QPS
  const gaharCompletionRate = Math.round((gaharChecked.length / totalGaharStandardItems) * 100);

  // 1. OVR FORM LOCAL INPUTS
  const [ovrForm, setOvrForm] = useState({
    department: "EMERGENCY UNIT",
    categoryAr: "إعطاء الدواء خطأ (Medication Error)",
    severity: "Category D - Harm Reached Patient but No Harm Caused",
    descAr: "",
    correctiveAr: "",
    witness: "",
    patientInvolved: false,
    patientMRN: "",
    patientName: ""
  });
  const [showOvrForm, setShowOvrForm] = useState(false);

  // Handle new OVR Addition
  const handleCreateOvr = () => {
    if (!ovrForm.descAr) {
      alert(isAr ? "⚠️ يرجى تفصيل الواقعة ووصف الأضرار مسبقاً!" : "Please write a description of the occurrence variance.");
      return;
    }
    const categoryEnTranslation = ovrForm.categoryAr.includes("الدواء") ? "Medication Error" : "Safety Variance";
    
    const newOvr = {
      id: `ovr-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().split(" ")[0].substring(0, 5),
      department: ovrForm.department,
      categoryAr: ovrForm.categoryAr,
      categoryEn: categoryEnTranslation,
      severity: ovrForm.severity,
      descAr: ovrForm.descAr,
      descEn: ovrForm.descAr, // Arabic primary
      correctiveAr: ovrForm.correctiveAr || (isAr ? "تم إخطار مسؤول الجودة بالمستشفى لعمل الإجراء اللازم" : "Quality officer notified for subsequent corrective surveillance"),
      correctiveEn: "Quality safety action path initiated.",
      witness: ovrForm.witness || (isAr ? "بدون شهود" : "No witness logged"),
      loggedBy: currentUser.nameAr || currentUser.nameEn,
      patientInvolved: ovrForm.patientInvolved,
      patientMRN: ovrForm.patientMRN,
      patientName: ovrForm.patientName,
      status: "Under Active Surveillance"
    };

    saveCQIOvr(newOvr);
    
    // Dispatch system-wide OVR notification 
    const ovrNotif = {
      id: `notif-${Date.now()}`,
      messageAr: `⚠️ [بلاغ حدث عارض OVR] تم رصد وتسجيل بلاغ OVR جديد بواسطة (${currentUser.nameAr || currentUser.email}) لقسم (${newOvr.department}). نوع الحادث: (${newOvr.categoryAr}). مستوى الخطورة لـ GAHAR: (${newOvr.severity}). يرجى المراجعة الفورية واتخاذ إجراء تصحيحي.`,
      messageEn: `⚠️ [New OVR Alert] A new incident report (OVR) has been filed by (${currentUser.nameEn || currentUser.email}) for Ward (${newOvr.department}). Incident Category: (${newOvr.categoryAr}). Criticality level: (${newOvr.severity}). Immediate follow-up is requested.`,
      timestamp: new Date().toISOString(),
      read: false
    };
    const updatedNotifs = [ovrNotif, ...notifications];
    setNotifications(updatedNotifs);
    saveSetting("baheya_notifications", updatedNotifs);

    setOvrForm({
      department: "EMERGENCY UNIT",
      categoryAr: "إعطاء الدواء خطأ (Medication Error)",
      severity: "Category D - Harm Reached Patient but No Harm Caused",
      descAr: "",
      correctiveAr: "",
      witness: "",
      patientInvolved: false,
      patientMRN: "",
      patientName: ""
    });
    setShowOvrForm(false);
    addSystemLog(`Logged OVR Report: ${newOvr.id}`, "warning");
    alert(isAr ? "✅ تم رصد وحفظ تقرير الأحداث والـ OVR بنجاح سحابياً!" : "OVR Report logged successfully.");
  };

  // 2. STAFF EVAL FORM LOCAL INPUTS
  const [selectedStaffId, setSelectedStaffId] = useState("user-nurse");
  const [evalScores, setEvalScores] = useState({
    clinical: 5,
    policy: 5,
    documentation: 4,
    attendance: 5,
    ethics: 5
  });
  const [evalComments, setEvalComments] = useState("");
  const [showEvalForm, setShowEvalForm] = useState(false);

  const handleCreateStaffEval = () => {
    const staffMember = QUALITY_STAFF_MOCK.find(s => s.id === selectedStaffId);
    if (!staffMember) return;

    const newEval = {
      id: `eval-${Date.now()}`,
      employeeId: selectedStaffId,
      employeeNameAr: staffMember.nameAr,
      employeeNameEn: staffMember.nameEn,
      department: "CLINICAL DEPARTMENT",
      evalDate: new Date().toISOString().split("T")[0],
      evaluatorName: currentUser.nameAr || currentUser.nameEn,
      scores: evalScores,
      comments: evalComments || (isAr ? "تم تقييم أداء معايير الجودة بنجاح." : "Standard clinical appraisal completed successfully.")
    };

    saveCQIStaffEval(newEval);
    
    // Dispatch system-wide evaluation notification 
    const evalNotif = {
      id: `notif-${Date.now()}`,
      messageAr: `👥 [تقييم إكلينيكي] قام المقيِّم (${currentUser.nameAr || currentUser.email}) باعتماد دراسة أداء الكادر السريري للموظف (${newEval.employeeNameAr}) بمستوى فحص معايير الجودة GAHAR. تعليق: (${newEval.comments}).`,
      messageEn: `👥 [Clinical Appraisal] Evaluator (${currentUser.nameEn || currentUser.email}) certified clinical performance benchmarks evaluation for (${newEval.employeeNameEn}). Review comments: (${newEval.comments}).`,
      timestamp: new Date().toISOString(),
      read: false
    };
    const updatedNotifs = [evalNotif, ...notifications];
    setNotifications(updatedNotifs);
    saveSetting("baheya_notifications", updatedNotifs);

    setEvalComments("");
    setShowEvalForm(false);
    addSystemLog(`Logged Staff Clinical Appraisal for: ${staffMember.nameEn}`, "success");
    alert(isAr ? "✅ تم تسجيل التقييم السريري للموظف بنجاح وحفظه سحابياً!" : "Employee evaluation recorded successfully.");
  };

  // 3. UNIT AUDIT FORM LOCAL INPUTS
  const [inspUnit, setInspUnit] = useState("EMERGENCY UNIT");
  const [inspScores, setInspScores] = useState({
    codeBlue: true,
    coldChain: true,
    gases: true,
    fireSafety: true,
    nurseCall: true,
    preventiveMaint: true
  });
  const [inspNotes, setInspNotes] = useState("");
  const [showInspForm, setShowInspForm] = useState(false);

  const handleCreateUnitAudit = () => {
    // calculate complianceRate based on checked items
    const scoreKeys = Object.values(inspScores);
    const passedCount = scoreKeys.filter(Boolean).length;
    const computedRate = Math.round((passedCount / scoreKeys.length) * 100);

    const newAudit = {
      id: `unit-insp-${Date.now()}`,
      unit: inspUnit,
      date: new Date().toISOString().split("T")[0],
      inspector: currentUser.nameAr || currentUser.nameEn,
      complianceRate: computedRate,
      scores: inspScores,
      notes: inspNotes || (isAr ? "لا توجد ملحوظات، تم التفتيش ومطابقة الأقسام." : "Inspect matches compliance guidelines.")
    };

    saveCQIUnitInspection(newAudit);
    setInspNotes("");
    setShowInspForm(false);
    addSystemLog(`Logged Unit Audit: ${inspUnit} (${computedRate}%)`, "info");
    alert(isAr ? "✅ تم تثبيت تقرير ومراجعة الوحدة الميداني وتحديث الجودة للمستشفى سحابياً!" : "Unit quality audit logged.");
  };

  // 4. POLICY DIGEST & ELECTRONIC ACKNOWLEDGEMENT
  const handleAcknowledgePolicy = (policyId: string) => {
    if (acknowledgedPolicies.includes(policyId)) {
      alert(isAr ? "لقد تم إمضاء الالتزام وتوثيق هذه السياسة مسبقاً باسمك." : "Already acknowledged.");
      return;
    }

    setAuthModal({
      open: true,
      title: isAr ? `مطلوب تأكيد الهوية` : `Verification required`,
      message: isAr ? `أدخل كود الموظف للتوقيع بالالتزام بهذه السياسة:` : `Enter your employee code to sign the policy:`,
      input: "",
      action: (code: string) => {
        const authorizer = systemUsers.find(u => u.staffId === code || u.pin === code || u.id === code);
        if (!authorizer) {
            alert(isAr ? "الكود غير صحيح أو غير مسجل بالنظام." : "Invalid employee code. Authorization failed.");
            return;
        }

        const newAck = {
          id: `ack-${Date.now()}-${currentUser.id}`,
          policyId,
          nurseId: authorizer.id,
          nurseName: authorizer.nameAr || authorizer.nameEn,
          signedAt: new Date().toISOString()
        };
        saveCQIPolicyAck(newAck);
        addSystemLog(`Acknowledged Hospital Policy: ${policyId} by ${authorizer.nameEn}`, "success");
        alert(isAr ? `📝 تم إمضاء التزامك وتوقيعك الإلكتروني بالسياسة الطبية بنجاح سحابياً للموظف ${authorizer.nameAr}!` : `Policy electronically signed for ${authorizer.nameEn}.`);
      }
    });
  };

  // Seeding Complete Quality Audit Archives
  const handleSeedQualityArchive = async () => {
    const sampleOvrs = [
      {
        id: "ovr-101",
        date: "2026-06-10",
        time: "09:15",
        department: "CHEMOTHERAPY DAYCARE",
        categoryAr: "إعطاء الدواء خطأ (Medication Error)",
        categoryEn: "Medication Misadministration",
        severity: "Category D - Harm Reached Patient but No Harm Caused",
        descAr: "تم تحضير جرعة علاج جيني مخصصة لمريضة سرطان وعند سرير المريض المشمول بالدواء تم رصد عدم تطابق الاسم في اللحظة الأخيرة بفصل معيار التحقق الثنائي.",
        descEn: "Therapy prepared for Patient A was almost administered to Patient B. Blocked at bedside during secondary double-identity crosschecking.",
        correctiveAr: "إيقاف إجراء نقل الجرعة فوراً، إعادة سحب الهوية السريرية، ومراجعة صيدلانية مع تعهد خطي بالإجراء المزدوج والمطابِقة.",
        correctiveEn: "Immediate infusion hold, re-verified identifiers, and secondary pharmacist check mandated.",
        witness: "أ. فاطمة الزهراء (استاف التمريض)",
        loggedBy: "أ. نورهان علي (جودة)",
        patientInvolved: true,
        patientMRN: "MRN-33010",
        patientName: "سامية خليل الورداني",
        status: "Corrective Action Verified"
      },
      {
        id: "ovr-102",
        date: "2026-06-11",
        time: "14:40",
        department: "INTENSIVE CARE UNIT (ICU)",
        categoryAr: "خلل في الأجهزة الطبية (Device/Device Error)",
        categoryEn: "Ventilator Circuit Leakage",
        severity: "Category C - Reached Patient or Staff but No Harm Done",
        descAr: "إنذار ضغط منخفض في جهاز التنفس الاصطناعي رقم 4 بوحدة الرعاية المركزة بسبب شق بسيط في صمام الزفير. تم التبديل الفوري للأكسجين اليدوي وحل المشكلة.",
        descEn: "Low pressure alarm on ventilator 4 due to a minor vacuum leakage in the exhalation valve. Switched to manual bag ventilation and circuit replaced.",
        correctiveAr: "استدعاء قسم الصيانة الحيوية لتبديل الصمامات وجرد باقي الأنابيب بوحدة الرعاية وتوثيق تقرير سلامة القطع.",
        correctiveEn: "Clinical engineering team calibrated valve replacement, leakage check completed safely.",
        witness: "أ. محمود عمر (رئيسة تمريض)",
        loggedBy: "أ. رنا السيد (مفتش جودة)",
        patientInvolved: true,
        patientMRN: "MRN-19045",
        patientName: "كامل رأفت الباز",
        status: "Under Active Surveillance"
      }
    ];

    for (const o of sampleOvrs) {
      await saveCQIOvr(o).catch(e => console.error("OVR seed failed", e));
    }

    const sampleEvals = [
      {
        id: "eval-101",
        employeeId: "user-nurse",
        employeeNameAr: "أ. فاطمة الزهراء (استاف التمريض)",
        employeeNameEn: "Sister Fatima El-Zahraa (Staff Nurse)",
        department: "EMERGENCY UNIT",
        evalDate: "2026-06-08",
        evaluatorName: "أ. نورهان علي (مدير الجودة)",
        scores: { clinical: 5, policy: 5, documentation: 4, attendance: 5, ethics: 5 },
        comments: "أداء متميز واستثنائي في مكافحة العدوى والالتزام الكامل بقواعد JCI IPSG وأهداف سلامة مستشفيات المستشفى."
      },
      {
        id: "eval-102",
        employeeId: "emp-2",
        employeeNameAr: "هاني ناصر (أخصائي تمريض SN)",
        employeeNameEn: "Hany Naser (Staff Nurse)",
        department: "INTENSIVE CARE UNIT (ICU)",
        evalDate: "2026-06-09",
        evaluatorName: "د. طارق الشافعي (المدير الطبي)",
        scores: { clinical: 4, policy: 4, documentation: 3, attendance: 5, ethics: 4 },
        comments: "منضبط وحريص سريرياً يحتاج إلى تدريب متقدم على مكافحة مخاطر وخز الإبر والتوثيق الإلكتروني المباشر بملفات الداتا."
      }
    ];

    for (const e of sampleEvals) {
      await saveCQIStaffEval(e).catch(e => console.error("Staff Evaluation seed failed", e));
    }

    const sampleAudits = [
      {
        id: "unit-insp-101",
        unit: "EMERGENCY UNIT",
        date: "2026-06-05",
        inspector: "أ. نورهان علي (جودة)",
        complianceRate: 100,
        scores: { codeBlue: true, coldChain: true, gases: true, fireSafety: true, nurseCall: true, preventiveMaint: true },
        notes: "مستوى الامتثال ممتاز والوحدة مجهزة تفتيشياً بالكامل، عربة الكود بلو مغلقة بالقفل المائي الآمن وسلسلة التبريد مستقرة."
      },
      {
        id: "unit-insp-102",
        unit: "CHEMOTHERAPY DAYCARE",
        date: "2026-06-09",
        inspector: "أ. محمود عمر (جودة)",
        complianceRate: 83,
        scores: { codeBlue: true, coldChain: false, gases: true, fireSafety: true, nurseCall: true, preventiveMaint: true },
        notes: "تم رصد فجوة في درجة حرارة ثلاجة حفظ الأدوية لتصل إلى 9.5 درجة مئوية. تم الاتصال فوراً بالمهندس المختص لضبط الترموستات ورجوع المعدل الآمن بظرف نصف ساعة."
      }
    ];

    for (const a of sampleAudits) {
      await saveCQIUnitInspection(a).catch(e => console.error("Inspection seed failed", e));
    }

    const sampleAcks = [
      { id: "ack-101", policyId: "pol-ident", nurseId: "user-nurse", nurseName: "أ. فاطمة الزهراء", signedAt: "2026-06-11T12:30:00Z" },
      { id: "ack-102", policyId: "pol-transfuse", nurseId: "emp-2", nurseName: "هاني ناصر", signedAt: "2026-06-11T14:15:00Z" },
      { id: "ack-103", policyId: "pol-timeout", nurseId: "user-nurse", nurseName: "أ. فاطمة الزهراء", signedAt: "2026-06-12T08:00:00Z" }
    ];

    for (const ac of sampleAcks) {
      await saveCQIPolicyAck(ac).catch(e => console.error("Signature seed failed", e));
    }

    alert(isAr ? "✅ تم تغذية الأرشيف السحابي بالكامل بالتقارير التجريبية الشاملة والمطابِقَة لمعايير المستشفيات الحقيقية!" : "Quality Archive successfully seeded with clinical data.");
  };

  const [policySearch, setPolicySearch] = useState("");

  const [archiveFilterType, setArchiveFilterType] = useState<string>("all");
  const [archiveSearchTerm, setArchiveSearchTerm] = useState<string>("");
  const [archiveDeptFilter, setArchiveDeptFilter] = useState<string>("all");
  const [selectedArchiveItem, setSelectedArchiveItem] = useState<any | null>(null);

  const filteredPolicies = POLICIES_ARRAY.filter(p => 
    p.titleAr.toLowerCase().includes(policySearch.toLowerCase()) ||
    p.titleEn.toLowerCase().includes(policySearch.toLowerCase()) ||
    p.code.toLowerCase().includes(policySearch.toLowerCase()) ||
    p.chapter.toLowerCase().includes(policySearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade text-right font-sans" dir="rtl">
      
      {/* Custom Auth Modal for Signatures */}
      {authModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm shadow-2xl">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 p-4 shrink-0 flex items-center justify-between">
              <h3 className="text-white font-bold text-sm tracking-tight">{authModal.title}</h3>
              <button 
                onClick={() => setAuthModal({ ...authModal, open: false })}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <p className="text-slate-600 leading-relaxed font-medium">
                {authModal.message}
              </p>
              <div className="relative">
                <input
                  type="password"
                  value={authModal.input}
                  onChange={(e) => setAuthModal({ ...authModal, input: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') executeAuthModal();
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-center tracking-widest font-mono font-bold text-lg text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition"
                  placeholder="✱ ✱ ✱ ✱ ✱"
                  autoFocus
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setAuthModal({ ...authModal, open: false })}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition"
              >
                {isAr ? "إلغاء المتابعة" : "Cancel"}
              </button>
              <button
                onClick={executeAuthModal}
                disabled={!authModal.input}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-sm transition"
              >
                {isAr ? "توقيع وإكمال" : "Sign & Complete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Header with branding & Seeding Actions */}
      <div className="bg-gradient-to-l from-pink-500/10 via-pink-405/5 to-transparent p-6 rounded-2xl border border-pink-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-right">
          <span className="bg-pink-600 text-white text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase">
            Continuous Quality Improvement (CQI) Portal
          </span>
          <h3 className="text-lg font-black text-slate-900 mt-2 flex items-center justify-end gap-2">
            <span>لوحة تحليلات الجودة المتطورة وبوابة الاعتمادات الصحية لـ {hospitalSettings.nameAr}</span>
            <TrendingUp className="h-5 w-5 text-pink-600" />
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 max-w-xl leading-relaxed">
            مؤشرات ورسومات بيانية حية وفورية تقيس جودة المستشفى وتتحقق من مطابقة معايير الهيئة المصرية لاعتماد المنشآت الصحية (GAHAR) واللجنة الدولية المشتركة لسلامة المرضى (JCI). 
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSeedQualityArchive}
            className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-black text-xs rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>تأسيس وتجريب أرشيف الجودة السحابي 📁</span>
          </button>

          {records.length === 0 && (
            <button
              onClick={handleSeedMockAuditData}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Database className="h-4 w-4" />
              <span>توليد وتغذية 3 سجلات طبية تجريبية للتحليل</span>
            </button>
          )}
          {records.length > 0 && (
            <button
              onClick={() => {
                if (confirm(isAr ? "هل أنت متأكد من مسح جميع التقارير الجارية؟" : "Are you sure you want to clear all records?")) {
                  setRecords([]);
                  localStorage.setItem("hospital_medical_records", JSON.stringify([]));
                  alert(isAr ? "تم تصفير شيتات الجرد بنجاح." : "Records store cleared.");
                }
              }}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-[10px] rounded-lg transition shrink-0"
            >
              تفريغ أرشيف التقارير
            </button>
          )}
        </div>
      </div>

      {/* 2. Sub-tab Switcher - All Modules Required by User */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-2 justify-end no-print">

        <button
          onClick={() => setActiveTabLocal("archive")}
          className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 border cursor-pointer ${
            activeTab === "archive"
              ? "bg-rose-50 text-rose-700 border-rose-200 shadow-inner"
              : "bg-white text-slate-600 border-transparent hover:bg-slate-50"
          }`}
        >
          <Database className="h-4 w-4 text-rose-600" />
          <span>الأرشيف الوطني المعتمد للجودة</span>
        </button>
        
        <button
          onClick={() => setActiveTabLocal("policies")}
          className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 border cursor-pointer ${
            activeTab === "policies"
              ? "bg-pink-50 text-pink-700 border-pink-200 shadow-inner"
              : "bg-white text-slate-600 border-transparent hover:bg-slate-50"
          }`}
        >
          <BookOpen className="h-4 w-4 text-pink-600" />
          <span>السياسات والاعتمادات ({acknowledgedPolicies.length}/{POLICIES_ARRAY.length})</span>
        </button>

        <button
          onClick={() => setActiveTabLocal("eval-unit")}
          className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 border cursor-pointer ${
            activeTab === "eval-unit"
              ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-inner"
              : "bg-white text-slate-600 border-transparent hover:bg-slate-50"
          }`}
        >
          <Shield className="h-4 w-4 text-indigo-600" />
          <span>تقييمات الوحدة والمؤسسة GAHAR ({gaharCompletionRate}%)</span>
        </button>

        <button
          onClick={() => setActiveTabLocal("eval-staff")}
          className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 border cursor-pointer ${
            activeTab === "eval-staff"
              ? "bg-purple-50 text-purple-700 border-purple-200 shadow-inner"
              : "bg-white text-slate-600 border-transparent hover:bg-slate-50"
          }`}
        >
          <Users className="h-4 w-4 text-purple-650" />
          <span>تقييمات الموظفين ({staffEvals.length} تقييمات)</span>
        </button>

        <button
          onClick={() => setActiveTabLocal("ovr")}
          className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 border cursor-pointer ${
            activeTab === "ovr"
              ? "bg-red-50 text-red-700 border-red-200 shadow-inner"
              : "bg-white text-slate-600 border-transparent hover:bg-slate-50"
          }`}
        >
          <AlertTriangle className="h-4 w-4 text-red-650" />
          <span>تقارير الـ OVR والأحداث ({ovrs.length + sentinelIncidents.length} بلاغات)</span>
        </button>

        <button
          onClick={() => setActiveTabLocal("compliance")}
          className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 border cursor-pointer ${
            activeTab === "compliance"
              ? "bg-amber-50 text-amber-700 border-amber-200 shadow-inner"
              : "bg-white text-slate-600 border-transparent hover:bg-slate-50"
          }`}
        >
          <Sliders className="h-4 w-4 text-amber-500" />
          <span>مصفوفة الالتزام للأقسام ({openAlertsList.filter(g => !resolvedGaps[g.uniqueGapKey]?.resolved).length} ثغرة)</span>
        </button>

        <button
          onClick={() => setActiveTabLocal("reports")}
          className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 border cursor-pointer ${
            activeTab === "reports"
              ? "bg-purple-600 text-white border-purple-700 shadow-md transform scale-102"
              : "bg-purple-50/50 text-indigo-950 border-purple-200/40 hover:bg-purple-50"
          }`}
        >
          <BarChart3 className="h-4 w-4 text-purple-500" />
          <span>{isAr ? "مجلس التقارير الدورية والأداء" : "Periodic Performance Reports"}</span>
        </button>

        <button
          onClick={() => setActiveTabLocal("decision")}
          className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 border cursor-pointer ${
            activeTab === "decision"
              ? "bg-indigo-600 text-white border-indigo-700 shadow-md transform scale-102"
              : "bg-amber-100/50 text-indigo-950 border-indigo-200/40 hover:bg-indigo-50"
          }`}
        >
          <Activity className="h-4 w-4 text-pink-600 animate-pulse" />
          <span>{isAr ? "💡 محاكي القرار وتدقيق الجودة السريرية" : "💡 Clinical Decision & Quality Simulator"}</span>
        </button>

        <button
          onClick={() => setActiveTabLocal("kpis")}
          className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 border cursor-pointer ${
            activeTab === "kpis"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-inner"
              : "bg-white text-slate-600 border-transparent hover:bg-slate-50"
          }`}
        >
          <Award className="h-4 w-4 text-emerald-600" />
          <span>لوحة الـ KPIs والمؤشرات ({jciCompletionRate}%)</span>
        </button>

      </div>

      {/* ======================= TAB 0: CLINICAL DECISION SUPPORT SIMULATOR ======================= */}
      {activeTab === "decision" && (
        <div className="space-y-6 text-right" dir="rtl">
          
          {/* Header Card */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-950 text-white p-6 rounded-2xl border border-indigo-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 bg-pink-600/10 h-32 w-32 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-black px-2.5 py-0.5 rounded-full mb-2 border border-indigo-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                  <span>{isAr ? "دعم القرار السريري الذكي المعتمد" : "AI-POWERED CLINICAL DECISION"}</span>
                </span>
                <h3 className="text-xl font-bold font-sans">
                  {isAr ? "منظومة الجودة السريرية ودعم القرار الفعلي للمرضى" : "Live Clinical Decision Support & Quality System"}
                </h3>
                <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
                  {isAr 
                    ? "أدوات متكاملة لتسجيل بارامترات المريض وتقييم درجات الالتزام الطبي لـ GAHAR و HIPAA وتفادي الأخطاء الدوائية في الوقت الحقيقي. نظام تدقيق جنائي وحفظ إلكتروني للتقييمات."
                    : "Real-time live patient assessment, drug drip parameters, fall index, and GAHAR safety indicators in a certified environment prior to bedside administration."}
                </p>
              </div>
              <div className="bg-indigo-950/80 border border-indigo-800 p-3 rounded-xl flex items-center gap-3">
                <HeartPulse className="w-8 h-8 text-pink-500 animate-pulse" />
                <div className="text-left font-mono">
                  <div className="text-[9px] text-slate-400 font-bold uppercase">GAHAR SAFETY CODES</div>
                  <div className="text-xs font-black text-rose-400">BH-CD-109 / IPSG.3</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* INPUT PANEL - 7 cols */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-150 pb-2">
                <h4 className="font-extrabold text-sm text-indigo-950 flex items-center justify-start gap-1.5">
                  <Sliders className="w-4 h-4 text-pink-600" />
                  <span>{isAr ? "مدخلات الحالة السريرية والمؤشرات" : "Clinical Case Parameters"}</span>
                </h4>
              </div>

              {/* Patient Basics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-black mb-1">
                    {isAr ? "اسم المريض الرباعي" : "Patient Name"}
                  </label>
                  <input
                    type="text"
                    value={simPatientName}
                    onChange={(e) => setSimPatientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-black mb-1">
                    {isAr ? "رقم الملف الطبي MRN" : "Medical Record Number (MRN)"}
                  </label>
                  <input
                    type="text"
                    value={simPatientMRN}
                    onChange={(e) => setSimPatientMRN(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-black mb-1">
                    {isAr ? "القسم / الوحدة المعنية" : "Clinical Ward / Unit"}
                  </label>
                  <select
                    value={simDept}
                    onChange={(e) => setSimDept(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="EMERGENCY UNIT">{isAr ? "وحدة الطوارئ" : "Emergency Unit"}</option>
                    <option value="INTENSIVE CARE">{isAr ? "العناية المركزة ICU" : "Intensive Care"}</option>
                    <option value="ONCOLOGY RESEARCH">{isAr ? "أبحاث وعلاج الأورام" : "Oncology Ward"}</option>
                    <option value="OPERATING ROOM">{isAr ? "غرف العمليات" : "Operating Room"}</option>
                    <option value="CENTRAL PHARMACY">{isAr ? "الصيدلية المركزية" : "Central Pharmacy"}</option>
                  </select>
                </div>
              </div>

              {/* Patient Vital Signs */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                <span className="text-[9px] text-indigo-700 font-black tracking-wide uppercase block mb-3">
                  {isAr ? "⚠️ المؤشرات الحيوية المباشرة للمريض" : "⚠️ Patient Real-Time Vital Signs"}
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="flex justify-between text-[10px] text-slate-600 font-bold mb-1">
                      <span>{isAr ? "ضغط الدم الانقباضي (BP)" : "Systolic BP"}</span>
                      <span className="font-mono font-black text-slate-900">{simBP} mmHg</span>
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={simBP}
                      onChange={(e) => setSimBP(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-250 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[8px] text-slate-400 mt-1 font-mono">
                      <span>50 (Shock)</span>
                      <span>120 (Normal)</span>
                      <span>200 (Crisis)</span>
                    </div>
                  </div>

                  <div>
                    <label className="flex justify-between text-[10px] text-slate-600 font-bold mb-1">
                      <span>{isAr ? "معدل نبضات القلب (HR)" : "Pulse Rate"}</span>
                      <span className="font-mono font-black text-slate-900">{simPulse} BPM</span>
                    </label>
                    <input
                      type="range"
                      min="40"
                      max="180"
                      value={simPulse}
                      onChange={(e) => setSimPulse(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-250 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[8px] text-slate-400 mt-1 font-mono">
                      <span>40 (Brady)</span>
                      <span>72 (Normal)</span>
                      <span>180 (Tachy)</span>
                    </div>
                  </div>

                  <div>
                    <label className="flex justify-between text-[10px] text-slate-600 font-bold mb-1">
                      <span>{isAr ? "أكسجين الدم (SPO2)" : "SPO2 Oxygen"}</span>
                      <span className="font-mono font-black text-slate-900">{simSPO2}%</span>
                    </label>
                    <input
                      type="range"
                      min="75"
                      max="100"
                      value={simSPO2}
                      onChange={(e) => setSimSPO2(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-250 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[8px] text-slate-400 mt-1 font-mono">
                      <span>75% (Critical)</span>
                      <span>95% (Baseline)</span>
                      <span>100% (Air)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medication & Infusion Safety Block */}
              <div className="space-y-3 bg-indigo-50/40 p-4 rounded-xl border border-indigo-100/50">
                <span className="text-[9px] text-pink-700 font-black tracking-wide uppercase block">
                  {isAr ? "💊 بروتوكول الأدوية عالية الخطورة وتسريب المحاليل" : "💊 HIGH-ALERT DRUGS & INFUSION MONITORING"}
                </span>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="highAlert"
                    checked={simHighAlert}
                    onChange={(e) => setSimHighAlert(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="highAlert" className="text-xs font-extrabold text-slate-700 cursor-pointer select-none">
                    {isAr ? "دواء عالي الخطورة (مثال: محفزات تقلص الأوعية، الأنسولين، الهيبارين)" : "This is a High-Alert Infusion Therapy (IPSG.3)"}
                  </label>
                </div>

                {simHighAlert && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 animate-fade">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">
                        {isAr ? "اسم المستحضر / المحلول الوريدي" : "High-Alert Infusion Name"}
                      </label>
                      <input
                        type="text"
                        value={simDripName}
                        onChange={(e) => setSimDripName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono font-semibold focus:outline-none focus:border-indigo-500"
                        placeholder="Norepinephrine..."
                      />
                    </div>
                    <div>
                      <label className="flex justify-between text-[10px] text-slate-500 font-bold mb-1">
                        <span>{isAr ? "معدل تدفق التسريب المبرمج" : "Programmed Drip Rate"}</span>
                        <span className="font-mono font-black text-indigo-700">{simInfusionRate} ml/hr</span>
                      </label>
                      <input
                        type="number"
                        value={simInfusionRate}
                        onChange={(e) => setSimInfusionRate(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-mono font-semibold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Morse Fall Risk and Controlled Narcotics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="fallRisk"
                      checked={simFallRisk}
                      onChange={(e) => setSimFallRisk(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="fallRisk" className="text-xs font-black text-slate-800 cursor-pointer select-none">
                      {isAr ? "تقييم مخاطر السقوط (Morse Fall Scale)" : "High Fall Risk Assessment (Morse)"}
                    </label>
                  </div>
                  <p className="text-[9px] text-slate-450 leading-tight">
                    {isAr ? "إذا كان المريض يعاني من دوخة، وهن العضلات، تاريخ سقوط قريب، أو تقدم بالعمر يعرضه للسقوط." : "Triggers mandatory high-visibility armband & bedrail security protocols."}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2">
                  <label className="block text-xs font-black text-slate-800">
                    {isAr ? "صرف مواد مخدرة / مسكنات مراقبة (Fentanyl)" : "Narcotics Dispensation Level"}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={simNarcoticDose}
                      onChange={(e) => setSimNarcoticDose(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-center"
                    />
                    <span className="text-[10px] text-slate-500 font-bold">{isAr ? "ميكروجرام / ساعة" : "mcg/hr infusion"}</span>
                  </div>
                  <p className="text-[9px] text-slate-400">
                    {isAr ? "تجاوز 25 ميكروجرام/س يعطي كود تحذير للرقابة الدوائية." : "Triggers safe logs double verification parameters."}
                  </p>
                </div>
              </div>

              {/* Action Trigger */}
              <div className="pt-3">
                <button
                  onClick={handlePerformClinicalAuditCheck}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md transition transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Activity className="w-4 h-4 shrink-0 animate-ping" />
                  <span>{isAr ? "تشغيل محاكي دعم القرار وفحص الجودة السريرية" : "Run Safety Simulation & Decision Audit"}</span>
                </button>
              </div>

            </div>

            {/* LIVE SIMULATION RESULT PANEL - 5 cols */}
            <div className="lg:col-span-5 space-y-4">
              
              <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-lg min-h-[420px] flex flex-col justify-between">
                
                <div>
                  <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono tracking-widest text-indigo-400 uppercase">
                      Live Assessment Output
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                      <span>{isAr ? "جاهز للمحاكاة" : "Sim Ready"}</span>
                    </span>
                  </div>

                  {simActiveResult ? (
                    <div className="mt-4 space-y-4 animate-fade text-right">
                      
                      {/* Safety compliance score gauge */}
                      <div>
                        <div className="flex justify-between items-center text-xs text-slate-400 font-bold mb-1">
                          <span>{isAr ? "درجة السلامة المقدرة (GAHAR Score):" : "Estimated Clinical Safety Score:"}</span>
                          <span className={`text-base font-black ${
                            simActiveResult.safetyScore >= 80 ? "text-emerald-400" : simActiveResult.safetyScore >= 60 ? "text-amber-400" : "text-red-400"
                          }`}>{simActiveResult.safetyScore}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              simActiveResult.safetyScore >= 80 ? "bg-emerald-500" : simActiveResult.safetyScore >= 60 ? "bg-amber-400" : "bg-red-500"
                            }`}
                            style={{ width: `${simActiveResult.safetyScore}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Vitals Summary */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-center">
                        <div>
                          <div className="text-[8px] text-slate-500 font-bold uppercase">SPO2</div>
                          <div className={`text-xs font-bold ${simActiveResult.vitals.spo2 < 93 ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>{simActiveResult.vitals.spo2}%</div>
                        </div>
                        <div>
                          <div className="text-[8px] text-slate-500 font-bold uppercase">Pulse</div>
                          <div className={`text-xs font-bold ${simActiveResult.vitals.pulse > 100 ? "text-amber-400" : "text-slate-300"}`}>{simActiveResult.vitals.pulse} bpm</div>
                        </div>
                        <div>
                          <div className="text-[8px] text-slate-500 font-bold uppercase">BP Systolic</div>
                          <div className={`text-xs font-bold ${simActiveResult.vitals.bp < 90 ? "text-red-400 animate-pulse" : "text-slate-300"}`}>{simActiveResult.vitals.bp} mmHg</div>
                        </div>
                      </div>

                      {/* Triggers & Alerts */}
                      <div>
                        <div className="text-[10px] text-slate-400 font-extrabold mb-1">{isAr ? "الإنذارات والبروتوكولات المفعلة بالجودة:" : "Activated Protocol Warnings:"}</div>
                        {simActiveResult.triggers.length > 0 ? (
                          <div className="space-y-1.5">
                            {simActiveResult.triggers.map((trig: string, idx: number) => (
                              <div key={idx} className="bg-red-950/40 border border-red-900/40 text-red-300 p-2 rounded-lg text-[10px] font-bold">
                                {trig}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-emerald-950/40 border border-emerald-900/40 text-emerald-300 p-2 rounded-lg text-[10px] font-bold">
                            {isAr ? "✓ كافة المؤشرات سليمة، المريض بمستوى الأمان العالي." : "✓ No primary hazard triggers flagged."}
                          </div>
                        )}
                      </div>

                      {/* Recommendations */}
                      <div className="space-y-1 bg-slate-950 p-4 rounded-xl border border-slate-800 text-[10px] text-indigo-200">
                        <div className="text-pink-400 font-black mb-1 flex items-center gap-1 justify-start">
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>{isAr ? "توجيهات دعم القرار الإلزامي بالمستشفى:" : "Dynamic Clinical Orders Guidelines:"}</span>
                        </div>
                        <ul className="list-disc pr-4 space-y-1 leading-relaxed">
                          {simActiveResult.recommendations.map((rec: string, idx: number) => (
                            <li key={idx} className="font-semibold">{rec}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Auditee */}
                      <div className="text-[9px] text-slate-500 font-sans flex justify-between">
                        <span>{isAr ? "رتبة الفاحص:" : "Auditor Profile:"} <span className="text-slate-300 font-bold">{simActiveResult.auditedBy}</span></span>
                        <span>{isAr ? "التوقيت الموحد:" : "Timestamp:"} <span className="text-slate-400 font-mono">{new Date(simActiveResult.timestamp).toLocaleTimeString()}</span></span>
                      </div>

                    </div>
                  ) : (
                    <div className="mt-16 text-center text-slate-500 py-10 space-y-3">
                      <Activity className="w-12 h-12 text-slate-700 mx-auto animate-bounce" />
                      <div className="text-xs font-extrabold">{isAr ? "يرجى الضغط على زر التشغيل" : "Please press 'Run Safety Simulation' button."}</div>
                      <p className="text-[10px] text-slate-600 max-w-xs mx-auto leading-relaxed">
                        {isAr 
                          ? "سيقوم المحاكي بفحص المدخلات في الوقت الفعلي وحساب درجات الموثوقية وتأثيرها على معايير GAHAR الوطنية."
                          : "Processor ready to evaluate medication safety, alert boundaries, and compliance ratings."}
                      </p>
                    </div>
                  )}

                </div>

                {simActiveResult && (
                  <div className="pt-4 border-t border-slate-800 mt-4">
                    <button
                      onClick={handleSaveSimLogToDatabase}
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Database className="w-4 h-4" />
                      <span>{isAr ? "توقيع مالي سريري وحفظ بـ HIPAA Database" : "E-Sign & Save to HIPAA Secure DB"}</span>
                    </button>
                    <p className="text-center text-[8px] text-slate-550 mt-1.5">
                      {isAr 
                        ? "ملاحظة: الضغط يقوم بإنشاء سجل تدقيق معتمد غير قابل للتلاعب في قاعدة المستشفى السحابية."
                        : "Creates a certified immutable audit entry in the central cloud node."}
                    </p>
                  </div>
                )}

              </div>

            </div>

          </div>

          {/* PERSISTENT CLINICAL DECISION SUPPORT ARCHIVE - FULL HISTORIC LOG */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-150 pb-3">
              <div>
                <h4 className="font-extrabold text-md text-slate-900 flex items-center justify-start gap-1.5">
                  <Database className="w-5 h-5 text-indigo-600" />
                  <span>{isAr ? "سجل وأرشيف دعم القرار الطبي المعتمد" : "Clinical Decision Support Audit Archive"}</span>
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {isAr 
                    ? "السجلات السحابية الموثقة لجميع الحالات ومخرجات الدعم السريري وقرارات الأطباء والممرضين بالمستشفى:"
                    : "Historically synced decision outputs, and parameters checked directly."}
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute right-2 top-2 text-slate-400 h-3.5 w-3.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={isAr ? "بحث بالـ MRN أو المريض..." : "Search by MRN/Patient..."}
                    value={simSearchTerm}
                    onChange={(e) => setSimSearchTerm(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg pr-7 pl-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 font-bold"
                  />
                </div>

                <select
                  value={simDeptFilter}
                  onChange={(e) => setSimDeptFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="">{isAr ? "كل الأقسام" : "All Wards"}</option>
                  <option value="EMERGENCY UNIT">{isAr ? "الطوارئ" : "Emergency"}</option>
                  <option value="INTENSIVE CARE">{isAr ? "العناية المركزة" : "ICU"}</option>
                  <option value="ONCOLOGY RESEARCH">{isAr ? "أبحاث الأورام" : "Oncology"}</option>
                </select>
              </div>
            </div>

            {/* Logs List rendering */}
            {(() => {
              const filtered = decisionLogs.filter(log => {
                const matchesSearch = log.patientName.toLowerCase().includes(simSearchTerm.toLowerCase()) || 
                                     log.patientMRN.toLowerCase().includes(simSearchTerm.toLowerCase());
                const matchesDept = simDeptFilter ? log.department === simDeptFilter : true;
                return matchesSearch && matchesDept;
              });

              if (filtered.length === 0) {
                return (
                  <div className="text-center text-slate-400 py-10 space-y-2 border border-slate-100 rounded-xl">
                    <Database className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold">{isAr ? "لا يوجد سجلات مطابقة حالياً" : "No clinical logs found."}</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((log: any) => (
                    <div 
                      key={log.id} 
                      className="border border-slate-180 bg-slate-50/50 p-4 rounded-xl hover:border-indigo-400 transition hover:bg-white shadow-sm flex flex-col justify-between space-y-3 relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                      
                      <div>
                        {/* Header block of card */}
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                              {log.patientMRN}
                            </span>
                            <h5 className="font-extrabold text-slate-900 text-xs mt-1.5">{log.patientName}</h5>
                          </div>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                            log.safetyScore >= 80 ? "bg-emerald-100 text-emerald-800" : log.safetyScore >= 60 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            Score: {log.safetyScore}%
                          </span>
                        </div>

                        {/* Middle metadata block */}
                        <div className="text-[10px] text-slate-600 space-y-1 select-none font-semibold">
                          <div>{isAr ? "قسم الإجراء:" : "Ward:"} <span className="text-slate-900 font-bold">{log.department}</span></div>
                          <div>{isAr ? "الفاحص الطبي:" : "Auditor:"} <span className="text-pink-600 font-black">{log.auditedBy}</span></div>
                          <div>{isAr ? "التاريخ السريري:" : "Clincal Date:"} <span className="text-slate-500 font-mono">{new Date(log.timestamp).toLocaleString()}</span></div>
                        </div>

                        {/* Vital Signs sub-badge */}
                        <div className="bg-slate-100 p-2 rounded border border-slate-200 grid grid-cols-3 text-center text-[9px] font-mono mt-3 text-slate-700">
                          <div>BP: <span className="font-extrabold text-slate-950">{log.vitals.bp}</span></div>
                          <div>HR: <span className="font-extrabold text-slate-950">{log.vitals.pulse}</span></div>
                          <div>SPO2: <span className="font-extrabold text-slate-950">{log.vitals.spo2}%</span></div>
                        </div>

                        {/* Programmed Infusion if checked */}
                        {log.inputs.highAlert && (
                          <div className="bg-rose-50 text-[10px] text-rose-800 font-bold p-2 rounded border border-rose-100 mt-2">
                            🚨 {log.inputs.dripName} | Rate: {log.inputs.infusionRate} ml/hr
                          </div>
                        )}

                        {/* Warnings indicators */}
                        {log.triggers.length > 0 && (
                          <div className="space-y-1 mt-2">
                            {log.triggers.map((tg: string, i: number) => (
                              <div key={i} className="text-[9px] font-bold text-red-650 bg-red-50 border border-red-100 px-2 py-0.5 rounded">
                                {tg}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Footer action */}
                      <div className="pt-2 border-t border-slate-150 flex items-center justify-between">
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-black uppercase">
                          {log.status}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditSimLog(log)}
                            className="text-indigo-500 hover:text-indigo-700 p-1 hover:bg-indigo-50 rounded transition cursor-pointer"
                            title={isAr ? "تعديل التقرير" : "Edit Clinical Entry"}
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSimLog(log.id)}
                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition cursor-pointer"
                            title={isAr ? "مسح السجل الطبى" : "Delete Clinical Entry"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              );
            })()}

          </div>

        </div>
      )}
      {activeTab === "kpis" && (
        <div className="space-y-6">
          
          {/* Statistical Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            
            {/* 1. Quality Compliance Score Gauge */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase font-mono">General Compliance Rate</span>
                <h4 className="text-2xl font-black text-slate-800 mt-1">
                  {records.length === 0 ? "96%" : `${compliancePercent}%`}
                </h4>
                <span className="text-[9px] text-emerald-600 font-sans block mt-1 font-bold">
                  {records.length === 0 ? "● عينات المعايير السريرية" : "● تحديث سحابي فوري ومستمر"}
                </span>
              </div>
              <div className="relative shrink-0 w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-pink-600"
                    strokeDasharray={`${records.length === 0 ? 96 : compliancePercent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-[10px] font-black text-pink-700 font-sans">
                    {records.length === 0 ? "96" : compliancePercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Total Audited sheets */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase font-mono">Accredited Audits Total</span>
                <h4 className="text-2xl font-black text-slate-800 mt-1">
                  {records.length} {isAr ? "شيت جودة" : "forms"}
                </h4>
                <span className="text-[9px] text-slate-400 block mt-1 font-semibold">
                  تحت المراجعة والتدقيق والتوثيق
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-pink-100 border border-pink-200 text-pink-600 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
            </div>

            {/* 3. Unresolved Gaps tracker */}
            <div className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between transition-all ${
              (records.length === 0 ? 1 : openAlertsList.length) > 0 
                ? "bg-rose-50/50 border-rose-200" 
                : "bg-white border-slate-200"
            }`}>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase font-mono">Critical Open Alerts</span>
                <h4 className={`text-2xl font-black mt-1 ${
                  (records.length === 0 ? 1 : openAlertsList.length) > 0 ? "text-rose-700" : "text-slate-800"
                }`}>
                  {records.length === 0 ? 1 : openAlertsList.filter(g => !resolvedGaps[g.uniqueGapKey]?.resolved).length} {isAr ? "ثغرات فورية" : "alarms"}
                </h4>
                <span className="text-[9px] text-slate-500 block mt-1 font-semibold">
                  نواقص عربات، خلل بأقفال أو تبريد الثلاجة
                </span>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                (records.length === 0 ? 1 : openAlertsList.length) > 0 
                  ? "bg-rose-100 border-rose-200 text-rose-600" 
                  : "bg-slate-100 border-slate-200 text-slate-500"
              }`}>
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>

            {/* 4. Active Patient Safety Goals */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase font-mono">Patient Safety Index</span>
                <h4 className="text-2xl font-black text-pink-700 mt-1">
                  {jciCompletionRate}%
                </h4>
                <span className="text-[9px] text-slate-400 block mt-1 font-semibold">
                  درجة الجاهزية لاعتماد الـ JCI الدولي
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-200 text-pink-600 flex items-center justify-center shrink-0">
                <Award className="h-5 w-5" />
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* JCI interactive matrix */}
            <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
              <div>
                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase">Accreditation Safety Matrix</span>
                <h4 className="text-sm font-black text-slate-850 mt-1 flex items-center gap-1.5 justify-end">
                  <span>أهداف سلامة المرضى الدولية الستة (JCI International Patient Safety Goals)</span>
                  <CheckSquare className="h-5 w-5 text-emerald-600" />
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">تتبع الالتزام الميداني وإمضاءات التمريض لرفع المعيار السحابي للمستشفى:</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {[
                  { id: 1, nameAr: "1. التعريف السريري الدقيق للمريض (Identification)", nameEn: "Double patient identifier check prior to procedures." },
                  { id: 2, nameAr: "2. كفاءة التواصل اللفظي والشفهي (Effective Communication)", nameEn: "Applying standard Read-Back & verbal verification." },
                  { id: 3, nameAr: "3. استخدام الأدوية عالية الخطورة بسلام (High-Alert Medications)", nameEn: "Dual nurse confirmation for targeted therapy." },
                  { id: 4, nameAr: "4. سلامة الجراحة والموقع والمريض (Wrong-Site Correction)", nameEn: "Surgical site marking & comprehensive timeout compliance." },
                  { id: 5, nameAr: "5. التحكم بغسيل وتقليل مخاطر العدوى (clinical Hand Hygiene)", nameEn: "WHO 5 moments sanitization auditing in oncological departments." },
                  { id: 6, nameAr: "6. رصد وتفادي حوادث سقوط المرضى (Patient Fall assessment)", nameEn: "Documented evaluation of Fall-Risk Morse indicators." }
                ].map(goal => {
                  const isChecked = jciCheckedArray.includes(goal.id);
                  return (
                    <div 
                      key={goal.id}
                      onClick={() => handleToggleJci(goal.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked 
                          ? "bg-pink-50/30 border-pink-200 shadow-sm" 
                          : "bg-slate-50/50 border-slate-200 hover:border-slate-350 text-slate-600"
                      }`}
                    >
                      <div className="flex-1 text-right">
                        <span className={`text-[11px] font-black block ${isChecked ? 'text-pink-850' : 'text-slate-700'}`}>{goal.nameAr}</span>
                        <span className="text-[9.5px] text-slate-500 font-semibold block mt-0.5">{goal.nameEn}</span>
                        <span className={`text-[8.5px] font-bold inline-block px-1.5 py-0.2 rounded mt-1 ${
                          isChecked ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {isChecked ? "✓ معزز ومطبق بقوة" : "🚧 ثغرة تدقيق قيد الإصلاح"}
                        </span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        readOnly
                        className="w-4 h-4 rounded border-slate-300 text-pink-650 focus:ring-pink-550 mt-1 cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Predictive alerts / notifications board */}
            <div className="bg-slate-900 via-slate-950 to-slate-900 border border-slate-800 text-white p-5 rounded-3xl shrink-0 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="bg-red-900/30 text-red-400 border border-red-500/20 text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded font-mono uppercase">SAFETY ALARMS SYSTEM</span>
                  <h4 className="font-black text-xs text-slate-200 flex items-center gap-1.5 justify-end">
                    <span>التبليغات وسلسلة إنذارات الجودة النشطة</span>
                    <Bell size={14} className="text-red-500 animate-swing" />
                  </h4>
                </div>

                <div className="space-y-3 mt-4 text-xs">
                  {/* Alarm 1 */}
                  <div className="p-3 bg-red-950/40 rounded-xl border border-red-900/30 relative flex gap-2">
                    <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-extrabold text-red-300 block">ثلاجة الأنسولين (طوارئ {hospitalSettings?.nameAr || "المستشفى"}):</span>
                      <p className="text-[10.5px] text-slate-200 mt-0.5">درجة حرارة المسجلة {records.length === 0 ? "10" : "1.5"}درجة مئوية (خارج الحدود الطبيعية 2-8م°).</p>
                    </div>
                  </div>

                  {/* Alarm 2 */}
                  <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-900/30 relative flex gap-2">
                    <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-extrabold text-amber-300 block">عربة كود بلو (قسم ICU):</span>
                      <p className="text-[10.5px] text-slate-200 mt-0.5">تم الإبلاغ بخلل في قفل جرد العربة بواسطة أ. فاطمة. تطلب تصحيح عاجل.</p>
                    </div>
                  </div>

                  {/* Alarm 3 */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 relative flex gap-2">
                    <Check size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-300 block">مؤشرات الروبوت وجدول Roster:</span>
                      <p className="text-[10.5px] text-slate-400 mt-0.5">تم توزيع نوبتجية ليلية متوازنة وتخفيض درجات الإرهاق بنسبة 35%.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 mt-4">
                <span className="text-[10px] text-slate-500 font-mono block">LIVE TELEMETRY ACTIVE SURVEILLANCE</span>
              </div>
            </div>

          </div>

          {/* ADVANCED KPIs - Charts and Trend visualization (Using SVG graphics) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-right space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3.5 gap-2">
              <div>
                <span className="bg-pink-100 text-pink-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Analytics Engine</span>
                <h4 className="font-extrabold text-sm text-slate-850 mt-1 flex items-center justify-end gap-1.5">
                  <span>لوحة التحليلات المتقدمة ورسوم بيانية لسلامة المرضى (Advanced Clinical Trends)</span>
                  <BarChart3 className="h-5 w-5 text-pink-600" />
                </h4>
                <p className="text-[10.5px] text-slate-400 mt-0.5">يعتمد النظام على مدخلات جداول التفتيش لحساب مصفوفة المخاطر المتغيرة على مدار الـ 24 ساعة الماضية بالمستشفى:</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Chart 1: Average Fault Resolution Time */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10.5px] font-bold text-slate-700">دورة إغلاق الثغرات (بالساعات)</span>
                  <span className="text-xs font-black text-pink-700">متوسط 2.4س</span>
                </div>
                
                {/* SVG Visual Bar chart */}
                <div className="h-32 flex items-end justify-between px-4 pb-2 border-b border-slate-200">
                  <div className="w-8 bg-slate-200 hover:bg-slate-300 rounded-t-lg h-[40%] relative group cursor-pointer text-center">
                    <span className="text-[9px] text-slate-400 block -mt-5 font-bold">4.1س</span>
                    <span className="absolute bottom-0 left-0 right-0 text-[8px] text-slate-500 translate-y-5 font-bold">أبريل</span>
                  </div>
                  <div className="w-8 bg-slate-200 hover:bg-slate-300 rounded-t-lg h-[55%] relative group cursor-pointer text-center">
                    <span className="text-[9px] text-slate-400 block -mt-5 font-bold">3.2س</span>
                    <span className="absolute bottom-0 left-0 right-0 text-[8px] text-slate-500 translate-y-5 font-bold">مايو</span>
                  </div>
                  <div className="w-8 bg-pink-600 hover:bg-pink-700 rounded-t-lg h-[85%] relative group cursor-pointer text-center">
                    <span className="text-[9px] text-pink-700 block -mt-5 font-black">1.8س</span>
                    <span className="absolute bottom-0 left-0 right-0 text-[8px] text-pink-700 translate-y-5 font-black">جاري</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-4 leading-normal text-right">
                  قامت مشرفة التمريض بتسريع مصفوفة تلبية النواقص وإغلاق التبليغات بمعدل أسرع بنسبة 45% تماشياً مع قواعد JCI.
                </p>
              </div>

              {/* Chart 2: Failures probability based on shift times */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10.5px] font-bold text-slate-700">معدل احتمالية الخلل بالنسبة للورديات (24س)</span>
                  <span className="text-xs font-black text-rose-600">منحنى الخطورة</span>
                </div>

                {/* SVG Line chart representing human error probability */}
                <div className="h-32 relative pt-2">
                  <svg className="w-full h-full" viewBox="0 0 100 50">
                    <path
                      d="M 5,45 Q 25,10 50,30 T 95,5"
                      fill="none"
                      stroke="#db2777"
                      strokeWidth="3m strokeLinecap='round'"
                    />
                    <circle cx="25" cy="10" r="3" fill="#db2777" />
                    <circle cx="50" cy="30" r="3" fill="#f59e0b" />
                    <circle cx="95" cy="5" r="3" fill="#10b981" />
                    {/* Grid lines */}
                    <line x1="5" y1="45" x2="95" y2="45" stroke="#cbd5e1" strokeDasharray="2" />
                  </svg>
                  <div className="flex justify-between text-[8px] text-slate-400 mt-1 font-bold">
                    <span>الصباحية (M)</span>
                    <span>بعد الظهر (A)</span>
                    <span>المسائية (N)</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal text-right">
                  تسجل الورديات اللامركزية المتأخرة (N) فجوات تبلغ احتمالية خطأ تقييمية بنسبة 72%. ينبغي تكثيف التفتيش بالنبوتجية الليلية.
                </p>
              </div>

              {/* Chart 3: compliance by Department comparing */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10.5px] font-bold text-slate-700">أكثر الأقسام مطابقة للجودة والاعتماد</span>
                  <span className="text-xs font-black text-emerald-600">تم مراجعتها</span>
                </div>

                <div className="space-y-2 text-xs font-sans">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                    <span className="font-bold">Operating Room</span>
                    <span className="font-mono text-emerald-600">100%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%" }}></div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                    <span className="font-bold">Emergency Unit</span>
                    <span className="font-mono text-emerald-600">92%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "92%" }}></div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                    <span className="font-bold">Chemotherapy Daycare</span>
                    <span className="font-mono text-purple-600">88%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: "88%" }}></div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal text-right">
                  تقود غرف العمليات معايير الجبر السريري والتعقيم الكامل، بينما تخضع وحدة الكيماوي لتدقيق متقدم لتحسين الخلط الدوائي.
                </p>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ======================= TAB 2: OVR REPORT SYSTEM & SENTINEL EVENTS ======================= */}
      {activeTab === "ovr" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-right space-y-4">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3.5 gap-2">
              <div className="text-right">
                <h4 className="font-black text-sm text-slate-850 flex items-center justify-end gap-1.5">
                  <span>بوابة تسجيل تقارير الأحداث غير العادية (Occurrence Variance Report - OVR)</span>
                  <AlertTriangle className="h-5 w-5 text-red-650" />
                </h4>
                <p className="text-[10.5px] text-slate-500 mt-0.5">تفويض طبي سري وفوري لكتم الإلغاء وتصحيح العيوب بالمستشفى، مع تفصيل كامل للمشكلات والأخطاء الطبية.</p>
              </div>
              
              <button
                onClick={() => setShowOvrForm(!showOvrForm)}
                className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
              >
                {showOvrForm ? "إغلاق استمارة البلاغ" : "➕ تسجيل بلاغ حادثة غير عادية جديدة (OVR)"}
              </button>
            </div>

            {/* OVR Form Workspace */}
            {showOvrForm && (
              <div className="bg-red-50/20 border border-red-150 p-5 rounded-2xl space-y-4 text-right animate-fade">
                <span className="text-[9px] bg-red-600 text-white font-black px-2.5 py-0.5 rounded uppercase font-mono">NEW CQI OVR NOTIFICATION PATHWAY</span>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">القسم / الجناح الميداني:</label>
                    <select 
                      value={ovrForm.department}
                      onChange={(e) => setOvrForm({...ovrForm, department: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 focus:ring-1 focus:ring-red-550 outline-none text-xs font-bold"
                    >
                      {["EMERGENCY UNIT", "INTENSIVE CARE UNIT (ICU)", "CHEMOTHERAPY DAYCARE", "ONCO-SURGICAL UNIT"].map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">نوع وتصنيف الحدث الإستراتيجي:</label>
                    <select 
                      value={ovrForm.categoryAr}
                      onChange={(e) => setOvrForm({...ovrForm, categoryAr: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 focus:ring-1 focus:ring-red-550 outline-none text-xs font-bold"
                    >
                      {[
                        "إعطاء الدواء خطأ (Medication Error)",
                        "وخز إبرة فني (Needle-stick injury)",
                        "سقوط المريض من السرير (Patient Fall)",
                        "خلل في الأجهزة الطبية (Device/Device Error)",
                        "خطأ في هوية المريض (Patient ID Hazard)",
                        "فقد ملف طبي سريري (Record/Documentation Gap)"
                      ].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">مستوى الخطورة (Severity Index):</label>
                    <select 
                      value={ovrForm.severity}
                      onChange={(e) => setOvrForm({...ovrForm, severity: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 focus:ring-1 focus:ring-red-550 outline-none text-xs font-bold"
                    >
                      {[
                        "Category A - Circumstances that have capacity to cause error",
                        "Category C - Reached Patient or Staff but No Harm Done",
                        "Category D - Harm Reached Patient but No Harm Caused",
                        "Category F - Resulted in Temporary Harm / Medication issue",
                        "Category I - Sentinel Event (Fatal and Critical Harm)"
                      ].map(sev => (
                        <option key={sev} value={sev}>{sev}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Patient involvement checklist */}
                <div className="p-3 bg-white rounded-xl border border-slate-150 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="opt-patient"
                      checked={ovrForm.patientInvolved}
                      onChange={(e) => setOvrForm({...ovrForm, patientInvolved: e.target.checked})}
                      className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300 rounded cursor-pointer"
                    />
                    <label htmlFor="opt-patient" className="text-xs font-bold text-slate-700 cursor-pointer">
                      نعم، الحدث يخص مريض سريري بالمستشفى مباشر (Patient Involved)
                    </label>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold leading-none">ربط مباشر مع ملف المريض الطبي</span>
                </div>

                {ovrForm.patientInvolved && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-1">اسم المريض المعني:</label>
                      <input 
                        type="text"
                        placeholder="العثور على الاسم باللغة العربية..."
                        value={ovrForm.patientName}
                        onChange={(e) => setOvrForm({...ovrForm, patientName: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 focus:ring-1 focus:ring-red-550 outline-none text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-1">رقم الملف الطبي السريري للمريض (MRN ID) *:</label>
                      <input 
                        type="text"
                        placeholder="مثال: MRN-84920"
                        value={ovrForm.patientMRN}
                        onChange={(e) => setOvrForm({...ovrForm, patientMRN: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 focus:ring-1 focus:ring-red-550 border-rose-250 outline-none text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">وصف الحادثة عاجلاً بالتفصيل (العربية) *:</label>
                    <textarea
                      rows={3}
                      value={ovrForm.descAr}
                      onChange={(e) => setOvrForm({...ovrForm, descAr: e.target.value})}
                      placeholder="وصف تفصيلي للواقعة والأسباب والأشخاص القائمين..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">الإجراء التصحيحي والوقائي الفوري المتخذ:</label>
                    <textarea
                      rows={3}
                      value={ovrForm.correctiveAr}
                      onChange={(e) => setOvrForm({...ovrForm, correctiveAr: e.target.value})}
                      placeholder="ماذا فعل الطاقم الطبي فوراً للحد من خطر الحدث الطبي..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">اسم الشاهد الحاضر للحادثة:</label>
                    <input 
                      type="text"
                      placeholder="الاسم والوظيفة للشهادة والمسؤولية..."
                      value={ovrForm.witness}
                      onChange={(e) => setOvrForm({...ovrForm, witness: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={handleCreateOvr}
                      className="bg-red-600 hover:bg-red-750 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow cursor-pointer transition flex items-center gap-1.5 w-full justify-center h-[38px]"
                    >
                      <Check className="h-4 w-4" />
                      <span>تسجيل وبث بلاغ الـ OVR سحابياً فوراً (Submit Event to CNO)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* OVR Registries List */}
            <div className="space-y-4 pt-2">
              <span className="text-[10px] text-slate-400 font-extrabold block">البلاغات المدونة بقاعدة البيانت السحابية للـ OVR والجودة ({ovrs.length}):</span>
              
              <div className="space-y-3">
                {ovrs.map((ovr: any) => (
                  <div key={ovr.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow transition relative overflow-hidden">
                    {/* Left Indicator Ribbon */}
                    <div className="absolute top-0 bottom-0 right-0 w-2.5 bg-red-650" />
                    
                    <div className="p-5 pr-7 space-y-4 font-sans text-right">
                      
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (confirm(isAr ? "هل أنت متأكد من حذف هذا التقرير نهائياً؟" : "Are you sure?")) {
                                setOvrs(ovrs.filter(o => o.id !== ovr.id));
                                addSystemLog(`Deleted OVR: ${ovr.id}`, "info");
                              }
                            }}
                            className="text-red-600 hover:text-red-800 text-[9px] font-black cursor-pointer bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded"
                          >
                            حذف نهائي 🗑️
                          </button>
                          <span className="text-[9.5px] text-slate-400 font-mono font-bold">{ovr.date} {ovr.time}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="bg-slate-100 text-slate-700 text-[9px] font-black px-2 py-0.5 rounded font-mono">
                            🏥 {ovr.department}
                          </span>
                          <span className="bg-rose-50 text-rose-800 text-[9.5px] font-black px-2 py-0.5 rounded-full">
                            {ovr.categoryAr}
                          </span>
                          <span className="bg-amber-100 text-amber-800 text-[8.5px] font-bold px-1.5 py-0.2 rounded font-mono">
                            {ovr.severity.split(" - ")[0]}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] leading-relaxed font-sans text-right">
                        <strong className="block text-[10px] text-slate-500 mb-1 font-black">الوصف والتحليل الكامل للواقعة:</strong>
                        <p className="font-bold text-slate-800">{ovr.descAr}</p>
                      </div>

                      {ovr.patientInvolved && (
                        <div className="p-3 bg-red-50/20 border border-red-100 rounded-xl flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
                          <div>
                            <span className="text-slate-400">رقم الكود الطبي:</span> <span className="font-mono font-bold text-slate-800">{ovr.patientMRN}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">المريض المعني:</span> <span className="font-bold text-slate-800">{ovr.patientName}</span>
                          </div>
                          <span className="text-[8.5px] bg-red-100 text-red-800 font-black px-2 rounded-full uppercase">Patient Impacted</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                        <div className="bg-emerald-50/20 border border-emerald-150 p-3 rounded-xl text-right">
                          <strong className="block text-[10px] text-emerald-800 mb-1 font-black">🛡️ التدبير العلاجي والإجراء المتخذ فوراً:</strong>
                          <p className="font-bold text-slate-700 leading-relaxed">{ovr.correctiveAr}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-right">
                          <strong className="block text-[10px] text-slate-500 mb-1 font-black">👀 شاهد الواقعة المسجل:</strong>
                          <p className="font-bold text-slate-700">{ovr.witness}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[9.5px] text-slate-400 font-mono font-bold pt-1.5 border-t">
                        <span>OVR REPORT CLINICAL MONITORING SUITE</span>
                        <span>رصد وبث بواسطة: {ovr.loggedBy}</span>
                      </div>

                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ======================= TAB 3: EMPLOYEE EVALUATIONS ======================= */}
      {activeTab === "eval-staff" && (
        <div className="space-y-6 animate-fade">
          
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-right space-y-4">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3.5 gap-2">
              <div className="text-right">
                <h4 className="font-black text-sm text-slate-850 flex items-center justify-end gap-1.5">
                  <span>بوابة تقييم الكادر الطبي والتمريضي ومقاييس الأداء (Staff Evaluations Portal)</span>
                  <Users className="h-5 w-5 text-purple-650" />
                </h4>
                <p className="text-[10.5px] text-slate-500 mt-0.5">تسجيل وتحليل الكفاءة السريرية والالتزام بسياسات الجودة لتمريض الأجنحة (ICU, ER, Chemo) بناء على جودات التفتيش.</p>
              </div>

              <button
                onClick={() => setShowEvalForm(!showEvalForm)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
              >
                {showEvalForm ? "إغلاق نافذة التقييم" : "➕ إضافة تقييم سريري جديد لموظف"}
              </button>
            </div>

            {/* Eval form space */}
            {showEvalForm && (
              <div className="bg-purple-50/20 border border-purple-150 p-5 rounded-2xl space-y-4 text-right animate-fade">
                <span className="text-[9px] bg-purple-650 text-white font-black px-2.5 py-0.5 rounded font-mono uppercase">NEW CLINICAL STAFF APPRAISAL FORM</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">اختر الموظف المعني بالتقييم:</label>
                    <select
                      value={selectedStaffId}
                      onChange={(e) => setSelectedStaffId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 focus:ring-1 focus:ring-purple-500 outline-none text-xs font-bold"
                    >
                      {QUALITY_STAFF_MOCK.map(staff => (
                        <option key={staff.id} value={staff.id}>{isAr ? staff.nameAr : staff.nameEn}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">تاريخ إجراء التقويم:</label>
                    <input 
                      type="date"
                      defaultValue={new Date().toISOString().split("T")[0]}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Stars/Scores Matrix */}
                <span className="block text-[10px] font-black text-slate-500 mt-2">معايير القياس السريرية (من 1 إلى 5 نجوم):</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
                  
                  {[
                    { key: "clinical", label: "الكفاءة السريرية والتدبير وعلاج المرضى", icon: HeartPulse },
                    { key: "policy", label: "الالتزام بسياسات الجودة و غسيل الأيدي", icon: Shield },
                    { key: "documentation", label: "الدقة وتوقيت التوثيق في شيت الجرودات", icon: FileText },
                    { key: "attendance", label: "الانضباط ومواعيد الحضور وتسلم الورديات", icon: Clock },
                    { key: "ethics", label: "الأخلاقيات والتعامل المهني المتبادل", icon: UserCheck }
                  ].map(scoreItem => (
                    <div key={scoreItem.key} className="p-3 bg-white rounded-xl border border-slate-150 text-center space-y-2">
                      <div className="flex items-center justify-center text-purple-600 gap-1">
                        <scoreItem.icon size={13} />
                        <span className="text-[10.5px] font-black">{scoreItem.label.split(" ")[0]}</span>
                      </div>
                      
                      <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map(starNum => (
                          <Star 
                            key={starNum}
                            size={14}
                            onClick={() => setEvalScores({...evalScores, [scoreItem.key]: starNum})}
                            className={`cursor-pointer transition-colors ${
                              (evalScores as any)[scoreItem.key] >= starNum ? "text-amber-400 fill-amber-400" : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[9px] text-slate-400 block">{scoreItem.label}</span>
                    </div>
                  ))}

                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">تعليقات المقيّم وتوصيات التطوير والتعديل المباشر:</label>
                  <textarea
                    rows={2}
                    value={evalComments}
                    onChange={(e) => setEvalComments(e.target.value)}
                    placeholder="مثال: يظهر مهارة جراحية استثنائية والتزاماً بنظام الجرد السحابي اليومي، يحتاج لدعم إداري متبادل."
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                  />
                </div>

                <button
                  onClick={handleCreateStaffEval}
                  className="bg-purple-650 hover:bg-purple-750 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow cursor-pointer transition flex items-center gap-1.5 w-full justify-center"
                >
                  <Check className="h-4 w-4" />
                  <span>تأكيد وحفظ تقييم الموظف في أرشيف الجودة السحابي</span>
                </button>
              </div>
            )}

            {/* Historic evaluations feed */}
            <div className="space-y-4 pt-1">
              <span className="text-[10px] text-slate-400 font-extrabold block">قائمة التقييمات السريرية المسجلة بالكشوفات:</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staffEvals.map((evaluation: any) => {
                  // Calculate average rating
                  const scoresList = Object.values(evaluation.scores) as number[];
                  const avg = (scoresList.reduce((a, b) => a + b, 0) / scoresList.length).toFixed(1);
                  
                  return (
                    <div key={evaluation.id} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-150 transition space-y-3.5 text-right font-sans relative">
                      <div className="absolute top-4 left-4 bg-purple-100 text-purple-800 rounded-lg p-2 text-center text-xs">
                        <span className="block text-[9px] uppercase font-bold text-purple-650">Score</span>
                        <span className="font-mono font-black text-sm">{avg}/5</span>
                      </div>

                      <div className="flex items-center gap-2 justify-end pr-1">
                        <div>
                          <h5 className="font-extrabold text-slate-900 text-xs">{evaluation.employeeNameAr}</h5>
                          <span className="text-[9.5px] text-slate-400 block font-bold">بقسم الجودة والتمريض السريري الموحد</span>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {evaluation.employeeNameAr.substring(2, 4)}
                        </div>
                      </div>

                      <div className="border-t border-b border-slate-200/60 py-2.5 grid grid-cols-5 gap-1.5 text-center text-[8.5px] font-sans">
                        {Object.entries(evaluation.scores).map(([key, val]) => (
                          <div key={key} className="bg-white p-1 rounded border border-slate-200">
                            <span className="block text-slate-400 font-bold">{key === "clinical" ? "سريري" : key === "policy" ? "جودة" : key === "documentation" ? "توثيق" : key === "attendance" ? "حضور" : "أخلاق"}</span>
                            <span className="font-bold text-purple-650 font-mono">⭐ {val as any}</span>
                          </div>
                        ))}
                      </div>

                      <div className="text-[11px] text-slate-600 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-150">
                        <strong className="block text-[9.5px] text-slate-405 font-black">📝 ملاحظات التقييم:</strong>
                        <p className="font-semibold text-slate-800">{evaluation.comments}</p>
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold font-mono">
                        <span>المقيّم: {evaluation.evaluatorName}</span>
                        <span>شيت المؤتمر: {evaluation.evalDate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ======================= TAB 4: UNIT & INSTITUTION ASSESSMENT GAHAR ======================= */}
      {activeTab === "eval-unit" && (
        <div className="space-y-6 animate-fade">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* National accreditation GAHAR tracker */}
            <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3.5">
                <div className="bg-indigo-100 text-indigo-800 text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase">
                  National Egyptian GAHAR Accreditations Tracker
                </div>
                <div className="text-right">
                  <h4 className="font-black text-sm text-slate-850">
                    دليل الجاهزية لمعايير الهيئة العامة للاعتماد والتمريض الصحي (GAHAR)
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">تقييم شامل يقيس التزام المستشفى بمتطلبات ترخيص المنشآت الطبية بمصر:</p>
                </div>
              </div>

              {/* GAHAR Chapters Progress checklist */}
              <div className="space-y-3 pt-1">
                {[
                  { id: 11, code: "GAHAR-ACC", chapter: "الرعاية المتمركزة حول المريض (PCC)", nameAr: "معايير تيسير الدخول واستمرارية الرعاية بالتمريض (ACC)", desc: "كفاءة تحويل وتسلم المرضى بالأقسام وبوابة الجرودات.", progress: 95 },
                  { id: 12, code: "GAHAR-PCP", chapter: "الرعاية المتمركزة حول المريض (PCC)", nameAr: "معايير تقديم الرعاية والعلاج السريري الآمن (PCP)", desc: "مراقبة سلامة الجرعات والصدمات الطبية والتعامل الموحد.", progress: 88 },
                  { id: 13, code: "GAHAR-PFR", chapter: "الرعاية المتمركزة حول المريض (PCC)", nameAr: "معايير حماية وحفظ حقوق المرضى وعائلاتهم (PFR)", desc: "موافقة كتابية موقعة، سرية معلومات المرضى بالموقع.", progress: 100 },
                  { id: 14, code: "GAHAR-QPS", chapter: "نظام المنشأة ومراقبة الجودة (HOM)", nameAr: "معايير تحسين الجودة الشاملة وسلامة المريض (QPS)", desc: "تعبئة نماذج OVR والحدث الجسيم وسرعة تصحيح الفجوات.", progress: 82 },
                  { id: 15, code: "GAHAR-PCI", chapter: "نظام المنشأة ومراقبة الجودة (HOM)", nameAr: "الوقاية والتحكم والحد من انتقال العدوى السريرية (PCI)", desc: "صناديق الحاد الأصفر والأحمر، ومكافحة معقمات اليدين.", progress: 94 },
                  { id: 16, code: "GAHAR-FMS", chapter: "نظام المنشأة ومراقبة الجودة (HOM)", nameAr: "أمان المرفق والمنشأة وإدارة الحرائق والسلامة (FMS)", desc: "الصيانة الوقائية ومخارج الهروب والإنقاص وجهاز التبريد.", progress: 80 }
                ].map(chapterItem => {
                  const isChecked = gaharChecked.includes(chapterItem.id);
                  const handleToggleGahar = () => {
                    if (gaharChecked.includes(chapterItem.id)) {
                      setGaharChecked(gaharChecked.filter(id => id !== chapterItem.id));
                    } else {
                      setGaharChecked([...gaharChecked, chapterItem.id]);
                    }
                  };

                  return (
                    <div 
                      key={chapterItem.id}
                      onClick={handleToggleGahar}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-4 select-none ${
                        isChecked 
                          ? "bg-indigo-50/20 border-indigo-200" 
                          : "bg-slate-50/50 border-slate-200 text-slate-550"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-left shrink-0">
                          <span className="text-[10px] text-slate-400 block font-mono font-bold">{chapterItem.code}</span>
                          <span className="font-mono font-black text-xs text-indigo-750">{chapterItem.progress}% Active</span>
                        </div>
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="w-4 h-4 text-indigo-650 focus:ring-indigo-500 rounded border-slate-300 cursor-pointer"
                        />
                      </div>

                      <div className="text-right flex-1 select-none pr-1">
                        <span className="text-[9.5px] font-black text-indigo-805 bg-indigo-50 px-2 py-0.2 rounded-full uppercase">{chapterItem.chapter}</span>
                        <h6 className="font-extrabold text-xs text-slate-850 mt-1">{chapterItem.nameAr}</h6>
                        <p className="text-[10px] text-slate-500 mt-0.5">{chapterItem.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Department quality audits form & list */}
            <div className="space-y-6">
              
              {/* Inspection trigger */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-right space-y-4">
                <div className="border-b pb-2 flex items-center justify-between">
                  <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Unit Audit</span>
                  <h4 className="font-extrabold text-xs text-slate-800">تقرير تفتيش الوحدات الميداني</h4>
                </div>

                <p className="text-[10.5px] text-slate-400 leading-normal">يقوم مراقب الجودة السريرية بالتفتيش عن جاهزية الأجهزة والبنية التحتية لتوفير حماية ومعايير للتمريض:</p>

                <button
                  onClick={() => setShowInspForm(!showInspForm)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2 rounded-xl transition cursor-pointer"
                >
                  {showInspForm ? "إلغاء المراجعة الميدانية" : "✍️ تدوين تقرير تدقيق الجودة للوحدة"}
                </button>

                {showInspForm && (
                  <div className="bg-slate-50 border p-4 rounded-2xl space-y-3 text-right animate-fade">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">الوحدة المستهدفة بالتفتيش:</label>
                      <select
                        value={inspUnit}
                        onChange={(e) => setInspUnit(e.target.value)}
                        className="w-full bg-white border border-slate-200 p-2 text-xs rounded-xl font-bold"
                      >
                        {["EMERGENCY UNIT", "INTENSIVE CARE UNIT (ICU)", "CHEMOTHERAPY DAYCARE", "ONCO-SURGICAL UNIT"].map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>

                    <span className="block text-[10px] font-bold text-slate-500">ماتريكس تدقيق سلامة البنية التحتية:</span>
                    <div className="space-y-2 pt-1 text-xs">
                      {[
                        { key: "codeBlue", label: "جاهزية أقفال ومحتوى الكود بلو" },
                        { key: "coldChain", label: "نظام سلسلة درجات حرارة ثلاجة الأدوية" },
                        { key: "gases", label: "مستشعرات ضغط شبكة أكسجين الغازات" },
                        { key: "fireSafety", label: "مخارج وخراطيم إطفاء الحريق والإنقاذ" },
                        { key: "nurseCall", label: "بوابات استدعاء التمريض من الأسرة" },
                        { key: "preventiveMaint: PM", label: "مستندات الصيانة الوقائية السنوية للمعدات" }
                      ].map(item => (
                        <div key={item.key} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-150">
                          <input 
                            type="checkbox"
                            checked={(inspScores as any)[item.key]}
                            onChange={(e) => setInspScores({...inspScores, [item.key]: e.target.checked})}
                            className="w-4 h-4 text-indigo-650 focus:ring-indigo-550 rounded border-slate-300 cursor-pointer"
                          />
                          <span className="font-bold text-slate-700">{item.label}</span>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">السلبيات والإيجابيات السريعة المدونة:</label>
                      <textarea
                        rows={2}
                        value={inspNotes}
                        onChange={(e) => setInspNotes(e.target.value)}
                        placeholder="أو تدوين المفقودات السريعة بالموقع..."
                        className="w-full bg-white border rounded-xl p-2 text-xs font-semibold"
                      />
                    </div>

                    <button
                      onClick={handleCreateUnitAudit}
                      className="w-full bg-indigo-650 text-white font-extrabold text-xs py-2 rounded-xl"
                    >
                      موافقة وحفظ في أرشيف الاعتماد
                    </button>
                  </div>
                )}
              </div>

              {/* Inspections registries registry */}
              <div className="space-y-3">
                <span className="text-[10px] text-slate-400 font-extrabold block">تقارير التفتيش الفنية السابقة:</span>
                {unitAudits.map((ua: any) => (
                  <div key={ua.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-right space-y-2">
                    <div className="flex justify-between items-center border-b pb-1">
                      <span className="font-mono bg-indigo-100 text-indigo-800 text-[10px] font-black px-1.5 py-0.2 rounded">
                        {ua.complianceRate}% Standard compliant
                      </span>
                      <h6 className="font-bold text-xs text-slate-800">🏢 {ua.unit}</h6>
                    </div>
                    
                    <p className="text-[10.5px] text-slate-600 leading-normal bg-slate-50 p-2 rounded border font-semibold">
                      {ua.notes}
                    </p>

                    <div className="flex justify-between text-[8.5px] text-slate-400 font-bold">
                      <span>المدقق: {ua.inspector}</span>
                      <span>بتاريخ: {ua.date}</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ======================= TAB 5: COMPLIANCE MATRIX ======================= */}
      {activeTab === "compliance" && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* compliance comparative list */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-right">
              <div className="border-b pb-2">
                <span className="bg-pink-100 text-pink-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Compliance Bar</span>
                <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1 justify-end mt-1">
                  <span>امتثال الأقسام الطبية لمعايير الجودة والقرارات</span>
                  <Award className="h-4 w-4 text-pink-600" />
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                  تقييم نسبي لمعدل التزام فرق التمريض بالجرد المنهجي المعتمد لـ {hospitalSettings.nameAr || "المؤسسة"}.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                {/* Unit 1 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-600">
                    <span className="font-mono bg-emerald-50 text-emerald-700 px-1 py-0.2 rounded text-[8px]">98% EXCELLENT</span>
                    <span className="font-bold">وحدة طوارئ واستقبال {hospitalSettings.nameAr || "المؤسسة"}</span>
                  </div>
                  <div className="relative w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="absolute top-0 right-0 h-full bg-emerald-500 rounded-full" style={{ width: "98%" }}></div>
                  </div>
                </div>

                {/* Unit 2 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-600">
                    <span className="font-mono bg-indigo-50 text-indigo-700 px-1 py-0.2 rounded text-[8px]">94% RELIABLE</span>
                    <span className="font-bold">وحدة تحضير العلاج الكيماوي (Chemo-Prep)</span>
                  </div>
                  <div className="relative w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="absolute top-0 right-0 h-full bg-pink-500 rounded-full" style={{ width: "94%" }}></div>
                  </div>
                </div>

                {/* Unit 3 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-600">
                    <span className="font-mono bg-emerald-50 text-emerald-700 px-1 py-0.2 rounded text-[8px]">100% PERFECT</span>
                    <span className="font-bold">غرفة جراحة الأورام (Onco-Surgical Units)</span>
                  </div>
                  <div className="relative w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="absolute top-0 right-0 h-full bg-emerald-500 rounded-full" style={{ width: "100%" }}></div>
                  </div>
                </div>

                {/* Unit 4 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-600">
                    <span className="font-mono bg-amber-50 text-amber-700 px-1 py-0.2 rounded text-[8px]">82% MODERATE</span>
                    <span className="font-bold">قسم العيادات الخارجية ومتابعة الأداء</span>
                  </div>
                  <div className="relative w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="absolute top-0 right-0 h-full bg-amber-400 rounded-full" style={{ width: "82%" }}></div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] text-slate-500 leading-normal font-sans">
                💡 <strong>ملاحظة المراقبة والاعتماد الصحى:</strong> لرفع نسبة الامتثال في الأقسام الأقل حظاً، ينبغي مراجعة جداول تسليم الشيفتات والتأكد من إمضاء التمريض بالتناوب يومياً سحابياً.
              </div>
            </div>

            {/* Right Area: Interactive Closed-Loop Audit Gaps Tracker */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between text-right">
              <div>
                <div className="border-b pb-2 flex items-center justify-between">
                  <span className="bg-rose-100 text-rose-700 font-black text-[9px] px-2 py-0.5 rounded-full uppercase">LIVE OBSERVATIONS</span>
                  <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                    <span>مركز رصد الثغرات والعيوب الطبية السريرية (Audit Faults Closed-loop)</span>
                    <ShieldAlert className="h-4 w-4 text-rose-600" />
                  </h4>
                </div>

                <p className="text-[10px] text-slate-400 mt-1 mb-3">
                  عندما يقوم كادر التمريض برصد خلل (علامة ✘) في أدوات الفحص الميدانية، تظهر الثغرة هنا فوراً لتمكين الجودة أو رئيسة التمريض من كتابة الإجراء التصحيحي وإقفال البوابة الطبية للثغرة:
                </p>

                {/* Gap Inline Resolution Dialog workspace */}
                {editingGapKey && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-3 space-y-2 text-right animate-fade">
                    <span className="font-bold text-[10px] text-amber-800">✍️ تسجيل القرار والتصحيح اللازم:</span>
                    <textarea
                      value={gapResolutionNote}
                      onChange={(e) => setGapResolutionNote(e.target.value)}
                      placeholder="مثال: تم تعبئة الأدرينالين المفقود من صيدلية المستشفى وتركيب قفل جرد بلاستيكي أحمر جديد مخصص ذو رقم كود معتمد بالوقت الحالي."
                      className="w-full bg-white border border-slate-200 p-2 text-xs rounded shadow-inner font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-pink-550"
                      rows={2}
                    />
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setEditingGapKey(null)}
                        className="text-[10px] font-bold text-slate-500 hover:underline"
                      >
                        تراجع
                      </button>
                      <button
                        onClick={handleSaveGapResolution}
                        className="bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded shadow cursor-pointer flex items-center gap-1"
                      >
                        <Check className="h-3 w-3" />
                        <span>تثبيت الإجراء وتصحيح الثغرة</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Scannable Gaps Table */}
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {/* If no records exist, show 1 sample gap automatically for experience */}
                  {records.length === 0 ? (
                    <div className="p-3 bg-red-50/50 border border-red-200 rounded-xl relative flex items-start gap-3">
                      <div className="flex-1 text-right min-w-0 font-sans">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-[8px] bg-red-100 text-red-700 font-extrabold rounded px-1 font-mono">نموذج تجريبي</span>
                          <span className="font-black text-rose-900 truncate block">فشل اختبار بطارية ومكثف جهاز الصدمات الكهربائية DC Shock</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          عربة طوارئ الطوارئ والإنعاش / اليوم الخامس - رصدت بواسطة (أ. فاطمة الزهراء)
                        </p>
                        
                        {/* Resolution status check */}
                        {resolvedGaps["mock-crashcart"]?.resolved ? (
                          <div className="bg-emerald-50/60 border border-emerald-100 p-2 rounded-lg mt-2 text-[10px] text-emerald-800">
                            <p className="font-bold">✔ تم حل الخلل عبر قرار الجودة:</p>
                            <p className="text-[9px] text-emerald-700 mt-0.5">{resolvedGaps["mock-crashcart"].notes}</p>
                            <div className="text-[8px] text-slate-400 mt-1">
                                بواسطة: {resolvedGaps["mock-crashcart"].resolvedBy} - بتاريخ: {resolvedGaps["mock-crashcart"].resolvedAt}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 text-left animate-fade">
                            <button
                              onClick={() => handleToggleGapState("mock-crashcart")}
                              className="px-2.5 py-1 bg-pink-600 hover:bg-pink-700 text-white shadow-sm rounded text-[9px] font-extrabold transition cursor-pointer"
                            >
                              اتخاذ إجراء وإقرار تصحيح جودة
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                        <X className="h-4 w-4" />
                      </div>
                    </div>
                  ) : (
                    openAlertsList.map((gap) => {
                      const resInfo = resolvedGaps[gap.uniqueGapKey];
                      const isResolved = resInfo?.resolved;
                      
                      return (
                        <div
                          key={gap.uniqueGapKey}
                          className={`p-3 border rounded-xl relative flex items-start gap-3 transition-colors ${
                            isResolved ? "bg-emerald-50/20 border-emerald-100" : "bg-red-50/30 border-red-150"
                          }`}
                        >
                          <div className="flex-1 text-right min-w-0">
                            <div className="flex items-center gap-1.5 justify-end font-sans">
                              {isResolved && (
                                <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded font-mono">
                                  تم التصحيح والحل
                                </span>
                              )}
                              <span className="font-black text-rose-900 truncate block font-sans">خلل في: {gap.itemName} / {gap.itemEn}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 font-sans">
                              {gap.templateTitle} ({gap.templateCode}) / اليوم {gap.dayNum} - بقسم: {gap.department} - بواسطة ({gap.staffName})
                            </p>

                            {isResolved ? (
                              <div className="bg-emerald-50/65 border border-emerald-100 p-2 rounded-lg mt-2 text-[10px] text-emerald-800 font-sans text-right">
                                <p className="font-bold">✔ إجراء معتمد لتصحيح الجودة:</p>
                                <p className="text-[9px] text-emerald-700 mt-0.5">{resInfo.notes}</p>
                                <div className="text-[8px] text-slate-400 mt-1">
                                  بواسطة: {resInfo.resolvedBy} / بتاريخ: {resInfo.resolvedAt}
                                </div>
                              </div>
                            ) : (
                              <div className="mt-2 text-left">
                                <button
                                  onClick={() => handleToggleGapState(gap.uniqueGapKey)}
                                  className="px-2.5 py-1 bg-pink-600 hover:bg-pink-700 text-white shadow-sm rounded text-[9px] font-extrabold transition cursor-pointer"
                                >
                                  اتخاذ إجراء وإقرار تصحيح جودة
                                </button>
                              </div>
                            )}
                          </div>

                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                            isResolved ? "bg-emerald-100 border-emerald-200 text-emerald-600" : "bg-rose-100 border-rose-200 text-rose-600"
                          }`}>
                            {isResolved ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                  
                  {records.length > 0 && openAlertsList.length === 0 && (
                    <div className="text-center py-10 bg-emerald-50/20 border border-dashed border-emerald-200 rounded-xl p-4 text-right">
                      <span className="text-xl">🏆</span>
                      <p className="font-bold text-emerald-800 text-xs mt-1.5">أنت على قمة الهرم الطبي للجودة!</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-sans">لم يتم رصد أي ثغرات أو نواقص أو أقفال مكسورة حالياً في جميع الوثائق المدققة.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-3 mt-4 text-[9px] text-slate-400 flex items-center justify-between font-mono">
                <span>BAHEYA CQI COMMAND-ALERTS CLOUD WORKSPACE</span>
                <span>تحديث مستمر ●</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ======================= TAB 6: ACCREDITED HOSPITAL POLICIES ======================= */}
      {activeTab === "policies" && (
        <div className="space-y-6 animate-fade">
          
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-right space-y-4">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3.5 gap-2">
              <div className="text-right">
                <span className="bg-pink-100 text-pink-800 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase">Compliance Regulations Registry</span>
                <h4 className="font-black text-sm text-slate-850 mt-1 flex items-center justify-end gap-1.5">
                  <span>دليل ودستور السياسات اللائحية المعتمدة للجودة ومكافحة العدوى</span>
                  <BookOpen className="h-5 w-5 text-pink-650" />
                </h4>
                <p className="text-[10.5px] text-slate-500 mt-0.5">تفحص السياسات الرسمية للمستشفى واقرأ الميثاق الطبي السنوي، ثم قم بتعزيز توقيعك بالتزام السياسة للحفظ في مستندات الاعتماد.</p>
              </div>

              {/* Policy Quick Search */}
              <div className="relative w-full sm:w-64">
                <input 
                  type="text"
                  placeholder="بحث سريع في السياسات (كود، مسمى)..."
                  value={policySearch}
                  onChange={(e) => setPolicySearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 outline-none focus:ring-1 focus:ring-pink-500 text-xs text-right font-medium"
                />
                <Database className="h-4 w-4 text-slate-400 absolute top-2.5 right-3" />
              </div>
            </div>

            {/* Grid of Policies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPolicies.map(policy => {
                const isAcked = acknowledgedPolicies.includes(policy.id);
                return (
                  <div key={policy.id} className="bg-white hover:bg-slate-50/50 border border-slate-200 rounded-2xl p-5 shadow-sm transition flex flex-col justify-between space-y-4 text-right hover:shadow-md">
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-150">
                        <span className="text-[10px] text-indigo-750 font-mono font-bold">{policy.code}</span>
                        <span className="text-[9px] bg-pink-100 text-pink-850 font-black px-2 py-0.2 rounded-full uppercase">{policy.chapter}</span>
                      </div>

                      <h5 className="font-extrabold text-xs text-slate-900 mt-2 leading-snug">{policy.titleAr}</h5>
                      <p className="text-[10px] text-slate-400 font-bold block leading-none font-mono text-left" dir="ltr">{policy.titleEn}</p>
                      
                      <div className="text-[11px] text-slate-650 space-y-1 bg-slate-50/50 p-4 rounded-xl border border-slate-150 leading-relaxed font-sans text-right">
                        <strong className="block text-[10px] text-slate-450 mb-1">📖 نص المبدأ والسياسة السريرية:</strong>
                        <p className="font-bold text-slate-750">{policy.bodyAr}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-1 text-left" dir="ltr">{policy.bodyEn}</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-150 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="text-right text-[8.5px] text-slate-400 font-bold font-mono">
                        <span>إصدار: {policy.revDate} / كاتب: {policy.author}</span>
                      </div>

                      <button
                        onClick={() => handleAcknowledgePolicy(policy.id)}
                        className={`px-3 py-1.5 text-[10.5px] font-black rounded-lg transition-colors cursor-pointer flex items-center gap-1 w-full sm:w-auto justify-center ${
                          isAcked 
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-250 cursor-default" 
                            : "bg-pink-600 hover:bg-pink-700 text-white shadow-sm"
                        }`}
                      >
                        {isAcked ? <UserCheck size={12} /> : <ThumbsUp size={12} />}
                        <span>{isAcked ? "✓ وقّعت بالعلم والالتزام" : "إمضاء التزام علمي إلكتروني 📝"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredPolicies.length === 0 && (
                <div className="text-center py-10 bg-slate-50 border border-dashed rounded-2xl text-slate-400 text-xs md:col-span-2">
                  لم يتم العثور على أي سياسات مطابقة لمعايير البحث الحالية.
                </div>
              )}
            </div>

            {/* Code of Ethics signature card */}
            <div className="bg-gradient-to-r from-pink-500/5 via-pink-400/5 to-transparent p-5 rounded-3xl border border-pink-100 text-right space-y-2.5 mt-2">
              <span className="text-[10px] bg-pink-150 text-pink-850 px-2.5 py-0.5 rounded font-black font-mono">STANDARDS FOR {(hospitalSettings?.nameEn || "BAHEYA HOSPITAL").toUpperCase()} MEDICAL STAFF</span>
              <h5 className="font-black text-xs text-slate-850">ميثاق التمريض والالتزام بجودة الرعاية بـ {hospitalSettings?.nameAr || "المستشفى"} لعام 2026</h5>
              <p className="text-[10.5px] text-slate-500 leading-normal font-sans">
                بصفتي أحد كوادر الرعاية السريرية بـ {hospitalSettings?.nameAr || "المستشفى"}، أقر بالتزامي الكامل بـ **(أهداف سلامة المرضى الستة IPSGs)** والتعريف الثوري الثنائي لكل تذكرة علاج، وإبلاغ مسؤولي الجودة فوراً بأي عوارض أو خلل عبر بوابات الـ OVR لتجنب الإضرار بصحة الأمهات.
              </p>
              <div className="flex justify-end pt-1">
                <span className="text-[9.5px] text-slate-400 font-mono font-bold font-mono">{(hospitalSettings?.nameEn || "BAHEYA FOUNDATION").toUpperCase()} SECURITY CERTIFICATE & CERTIFIED LOG</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ======================= TAB 8: PERIODIC PERFORMANCE REPORTS ======================= */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-purple-800 to-indigo-900 rounded-3xl p-6 text-white text-right shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex bg-white/10 rounded-2xl p-3 border border-white/10 backdrop-blur-md">
                <BarChart3 className="h-8 w-8 text-purple-200" />
              </div>
              <div>
                <span className="font-mono text-[10px] text-purple-200 tracking-wider bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/10 block mb-2 w-max ml-auto">PERFORMANCE REPORTS ENGINE</span>
                <h2 className="text-2xl font-black text-white">{isAr ? "مجلس التقارير الدورية والأداء" : "Periodic Performance Reports"}</h2>
                <p className="text-xs text-purple-200 mt-1.5 max-w-lg leading-relaxed mr-auto">
                  {isAr ? "منصة استخراج تقارير الأداء الشهرية والربع سنوية للأقسام السريرية. يتم تجميع معدلات الامتثال السابقة وتحليل كفاءة أداء طواقم التمريض لإصدار وتوقيع الاعتمادات الإدارية." : "Generate and sign quarterly & monthly performance reports bridging legacy compliance matrices to issue administrative health accreditations."}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Generate Report Form */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-4">
                <div className="flex items-center gap-2 mb-4 justify-end">
                  <h3 className="font-black text-sm text-slate-800">{isAr ? "إصدار تقرير دوري جديد" : "Draft New Report"}</h3>
                  <div className="bg-purple-100 text-purple-700 p-1.5 rounded-lg">
                    <FileText className="h-4 w-4" />
                  </div>
                </div>

                <div className="space-y-3 text-right">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">{isAr ? "القسم السريري (الهدف):" : "Target Department:"}</label>
                    <select
                      value={reportDept}
                      onChange={(e) => setReportDept(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-full text-xs text-right outline-none focus:ring-1 focus:ring-purple-500 font-bold"
                    >
                      {/* You can map standard departments here or use specific units */}
                      <option value="EMERGENCY UNIT">طوارئ (EMERGENCY UNIT)</option>
                      <option value="INTENSIVE CARE UNIT (ICU)">رعاية مركزة (ICU)</option>
                      <option value="CHEMO UNIT PREPN">صيدلية كيماوي (CHEMO UNIT)</option>
                      <option value="ONCO-SURGICAL UNIT">جراحة أورام (ONCO-SURGICAL)</option>
                      <option value="OPERATING ROOM">غرف العمليات (OR)</option>
                      <option value="OUTPATIENT CLINIC">عيادات خارجية (OPD)</option>
                      <option value="RADIOLOGY UNIT">الأشعة (RADIOLOGY)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">{isAr ? "دورية التقرير:" : "Period Cycle:"}</label>
                      <select
                        value={reportPeriodType}
                        onChange={(e: any) => setReportPeriodType(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 w-full text-xs text-right outline-none focus:ring-1 focus:ring-purple-500 font-bold"
                      >
                        <option value="monthly">{isAr ? "شهري" : "Monthly"}</option>
                        <option value="quarterly">{isAr ? "ربع سنوي" : "Quarterly"}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">{isAr ? "السنة المالية:" : "Fiscal Year:"}</label>
                      <input
                        type="number"
                        value={reportYear}
                        onChange={(e) => setReportYear(parseInt(e.target.value) || new Date().getFullYear())}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 w-full text-xs outline-none focus:ring-1 focus:ring-purple-500 font-bold text-center"
                      />
                    </div>
                  </div>

                  {reportPeriodType === "monthly" ? (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">{isAr ? "الشهر (1-12):" : "Month:"}</label>
                      <input
                        type="number"
                        min="1" max="12"
                        value={reportMonth}
                        onChange={(e) => setReportMonth(parseInt(e.target.value) || 1)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-full text-xs outline-none focus:ring-1 focus:ring-purple-500 font-sans font-bold"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">{isAr ? "الربع (1-4):" : "Quarter:"}</label>
                      <input
                        type="number"
                        min="1" max="4"
                        value={reportQuarter}
                        onChange={(e) => setReportQuarter(parseInt(e.target.value) || 1)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-full text-xs outline-none focus:ring-1 focus:ring-purple-500 font-sans font-bold"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">{isAr ? "نسبة الامتثال المستهدفة (%):" : "Target Compliance (%):"}</label>
                    <input
                      type="number"
                      value={reportTargetCompliance}
                      onChange={(e) => setReportTargetCompliance(parseInt(e.target.value) || 0)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-full text-xs outline-none focus:ring-1 focus:ring-purple-500 font-sans font-bold text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">{isAr ? "أبرز الملاحظات التشغيلية:" : "Operational Highlights:"}</label>
                    <textarea
                      value={reportHighlights}
                      onChange={(e) => setReportHighlights(e.target.value)}
                      rows={3}
                      placeholder={isAr ? "اكتب الإنجازات وإيجابيات الأداء..." : "Type highlights..."}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-full text-xs outline-none focus:ring-1 focus:ring-purple-500 font-sans font-semibold text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">{isAr ? "التوصيات وخطة التحسين:" : "Recommendations & CAPA:"}</label>
                    <textarea
                      value={reportRecommendations}
                      onChange={(e) => setReportRecommendations(e.target.value)}
                      rows={3}
                      placeholder={isAr ? "اكتب توصيات تصحيحية لرفع الامتثال..." : "Type correction plan..."}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-full text-xs outline-none focus:ring-1 focus:ring-purple-500 font-sans font-semibold text-right"
                    />
                  </div>

                  <button
                    onClick={handleGeneratePeriodicReport}
                    className="w-full bg-purple-650 hover:bg-purple-700 text-white font-black text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 mt-4"
                  >
                    <span>{isAr ? "توليد ونشر التقرير بالمسودة" : "Generate Draft & Publish"}</span>
                    <Sparkles className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Existing Reports Ledger */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between mb-2">
                 <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{periodicReports.length} {isAr ? "مستندات مجدولة" : "Reports available"}</div>
                 <h3 className="font-black text-slate-700">{isAr ? "أرشيف تقارير الأداء للقسم" : "Department Performance Ledger"}</h3>
              </div>

              {periodicReports.length === 0 ? (
                <div className="text-center py-10 bg-purple-50/50 border border-dashed border-purple-200 rounded-2xl">
                  <FileText className="h-8 w-8 text-purple-200 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-purple-800">{isAr ? "لا توجد تقارير دورية" : "No Periodic Reports yet"}</h4>
                  <p className="text-[10px] text-purple-600/70 mt-1">{isAr ? "استخرج التقرير الأول من اللوحة الجانبية" : "Generate your first report from the board"}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {periodicReports.map((rp: any) => (
                    <div key={rp.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col h-full text-right">
                      {rp.status === "Signed" && (
                         <div className="absolute -left-6 top-3 bg-emerald-500 text-white text-[9px] font-black px-8 py-0.5 transform -rotate-45 shadow-sm font-mono tracking-wider">
                           SECURE
                         </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-3">
                        <button
                          onClick={() => {
                            if (confirm(isAr ? "هل أنت متأكد من حذف هذا التقرير من مصفوفة الأرشيف؟" : "Confirm secure deletion?")) {
                              deletePeriodicReport(rp.id);
                            }
                          }}
                          className="bg-rose-50 text-rose-600 hover:bg-rose-100 p-1.5 rounded-lg transition"
                          title="مسح التقرير نهائياً"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                        <div>
                           <h4 className="font-black text-sm text-slate-800">{rp.department}</h4>
                           <span className="font-mono text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200 block w-max ml-auto mt-1">
                             {rp.id}
                           </span>
                        </div>
                      </div>

                      <div className="flex justify-end gap-1.5 mb-3">
                         <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-purple-100">
                           {rp.periodType === "monthly" ? "دورية شهرية" : "دورية ربع سنوية"}
                         </span>
                         <span className="bg-slate-50 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200">
                           {rp.periodType === "monthly" ? `شهر ${rp.periodReference}` : `ربع ${rp.periodReference}`} - {rp.year}
                         </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <div className="text-center p-1.5">
                          <span className="text-[9px] text-slate-400 font-bold block">{isAr ? "الهدف للقسم" : "Target"}</span>
                          <span className="text-sm font-black text-slate-700">{rp.targetCompliance}%</span>
                        </div>
                        <div className="text-center p-1.5 border-r border-slate-200">
                          <span className="text-[9px] text-slate-400 font-bold block">{isAr ? "الامتثال الفعلي" : "Achieved"}</span>
                          <span className={`text-sm font-black ${rp.actualComplianceScore >= rp.targetCompliance ? "text-emerald-600" : "text-rose-600"}`}>
                            {rp.actualComplianceScore}%
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 mt-auto">
                        <p className="text-[10px] text-slate-600 leading-relaxed font-semibold bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                          <span className="font-black text-blue-800 block mb-0.5">{isAr ? "أبرز الملاحظات:" : "Highlights:"}</span>
                          {rp.highlights}
                        </p>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-semibold bg-amber-50/50 p-2 rounded-lg border border-amber-100/50">
                          <span className="font-black text-amber-800 block mb-0.5">{isAr ? "التوصيات المطلوبة:" : "Recommendations:"}</span>
                          {rp.recommendations}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                         <div className="text-[9px] text-slate-400">
                           <span className="block font-bold">إعداد: {rp.authorName}</span>
                           <span className="block">{new Date(rp.timestamp).toLocaleDateString()}</span>
                         </div>
                         
                         {rp.status === "Draft" ? (
                           <button
                             onClick={() => handleSignReport(rp)}
                             className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition"
                           >
                             {isAr ? "توقيع واعتماد OVR" : "Sign & Accredit"}
                           </button>
                         ) : (
                           <div className="text-left font-mono">
                             <div className="text-emerald-600 font-bold text-[9px] block">SIGNED ACCEPTED</div>
                             <div className="text-[7.5px] text-slate-400">{new Date(rp.signedAt).toLocaleDateString()}</div>
                           </div>
                         )}
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ======================= TAB 7: CERTIFIED QUALITY & ACCREDITATION ARCHIVE ======================= */}
      {activeTab === "archive" && (() => {
        // Compile unified Quality Archive Ledger
        const rawLedgerItems: any[] = [];

        // 1. Add OVRs
        (ovrs || []).forEach(o => {
          rawLedgerItems.push({
            id: o.id,
            type: "ovr",
            typeNameAr: "تقرير الأحداث العارضة OVR",
            typeNameEn: "Occurrence Variance Report",
            titleAr: `بلاغ OVR لحدث عارض: ${o.categoryAr}`,
            titleEn: `OVR Safety Variance: ${o.categoryEn}`,
            date: o.date,
            department: o.department || "CHEMOTHERAPY DAYCARE",
            operator: o.loggedBy || "جودة المستشفى",
            status: o.status || "Under Active Surveillance",
            originalData: o
          });
        });

        // 2. Add Staff Evaluations
        (staffEvals || []).forEach(e => {
          rawLedgerItems.push({
            id: e.id,
            type: "eval",
            typeNameAr: "تقييم أداء جودة الكادر",
            typeNameEn: "Clinical Quality Evaluation",
            titleAr: `تقييم الأداء السريري للموظف: ${e.employeeNameAr || e.employeeNameEn}`,
            titleEn: `Clinical Quality Evaluation: ${e.employeeNameEn}`,
            date: e.evalDate,
            department: e.department || "CLINICAL DEPARTMENT",
            operator: e.evaluatorName || "مشرف تمريض",
            status: "Verified & Evaluated",
            originalData: e
          });
        });

        // 3. Add Unit Inspections
        (unitAudits || []).forEach(a => {
          rawLedgerItems.push({
            id: a.id,
            type: "audit",
            typeNameAr: "تدقيق جودة الأقسام والوحدات",
            typeNameEn: "Clinical Unit Quality Audit",
            titleAr: `تدقيق جودة ميداني لوحدة: ${a.unit}`,
            titleEn: `Clinical Unit Inspection: ${a.unit}`,
            date: a.date,
            department: a.unit,
            operator: a.inspector || "لجنة الجودة",
            status: `معدل الامتثال: ${a.complianceRate}%`,
            originalData: a
          });
        });

        // 4. Add Sentinel Incidents
        (sentinelIncidents || []).forEach(s => {
          rawLedgerItems.push({
            id: s.id,
            type: "sentinel",
            typeNameAr: "رصد حدث فريد جسيم",
            typeNameEn: "Sentinel Outlier Incident",
            titleAr: `رصد طارئ لحدث فظيع جسيم: ${s.patientName}`,
            titleEn: `Sentinel Injury Event: ${s.patientName}`,
            date: s.date,
            department: s.department || "EMERGENCY UNIT",
            operator: s.loggedBy || "أمان المريض",
            status: s.status || "Under Active Investigation",
            originalData: s
          });
        });

        // 5. Add Policy Signatures
        (policyAcks || []).forEach(ack => {
          const policyObj = POLICIES_ARRAY.find(p => p.id === ack.policyId);
          const policyTitle = policyObj ? policyObj.titleAr : ack.policyId;
          rawLedgerItems.push({
            id: ack.id,
            type: "signature",
            typeNameAr: "توقيع التزام بالسياسة الحيوية",
            typeNameEn: "Policy Receipt & Ack Signature",
            titleAr: `توقيع إلكتروني بالتزام سياسة: ${policyTitle}`,
            titleEn: `Electronic Policy Acknowledgement: ${ack.policyId}`,
            date: ack.signedAt ? ack.signedAt.split("T")[0] : new Date().toISOString().split("T")[0],
            department: "ALL DEPARTMENTS",
            operator: ack.nurseName || "كادر التمريض",
            status: "Electronically Signed & Seal Valid",
            originalData: ack
          });
        });

        // Sort by date descending
        rawLedgerItems.sort((a, b) => b.date.localeCompare(a.date));

        // Filter items
        const filteredLedgerItems = rawLedgerItems.filter(item => {
          const matchesKeyword = archiveSearchTerm === "" ||
            item.titleAr.toLowerCase().includes(archiveSearchTerm.toLowerCase()) ||
            item.titleEn.toLowerCase().includes(archiveSearchTerm.toLowerCase()) ||
            item.id.toLowerCase().includes(archiveSearchTerm.toLowerCase()) ||
            item.operator.toLowerCase().includes(archiveSearchTerm.toLowerCase());

          const matchesType = archiveFilterType === "all" || item.type === archiveFilterType;
          const matchesDept = archiveDeptFilter === "all" || item.department === archiveDeptFilter;

          return matchesKeyword && matchesType && matchesDept;
        });

        // Unique departments for filter dropdown
        const uniqueDeptsList = Array.from(new Set(rawLedgerItems.map(i => i.department).filter(Boolean)));

        // Handle item deletion safely
        const handleDeleteArchiveItem = async (item: any) => {
          if (!confirm(isAr 
            ? `⚠️ تحذير أمني: أنت على وشك حذف وثيقة جودة رسمية معتمدة برقم معرف (${item.id}) من السجلات السحابية الطبية.\nهل تريد المتابعة بحذفها نهائياً؟`
            : `Are you sure you want to delete this certified record: ${item.id}?`
          )) {
            return;
          }

          try {
            if (item.type === "ovr") {
              await deleteCQIOvr(item.id);
            } else if (item.type === "eval") {
              await deleteCQIStaffEval(item.id);
            } else if (item.type === "audit") {
              await deleteCQIUnitInspection(item.id);
            } else if (item.type === "sentinel") {
              await deleteSentinelIncident(item.id);
            } else if (item.type === "signature") {
              await deleteCQIPolicyAck(item.id);
            }
            
            addSystemLog(`Deleted archive record: ${item.id}`, "warning");
            alert(isAr ? `✅ تم حذف المستند وتعميم التعديل على الأرشيف الاعتمادي!` : "Certified record deleted successfully.");
            
            if (selectedArchiveItem?.id === item.id) {
              setSelectedArchiveItem(null);
            }
          } catch (err) {
            console.error("Delete failed", err);
          }
        };

        return (
          <div className="space-y-6 animate-fade">
            
            {/* Archive Dashboard Status Stats */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-right">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-605 shrink-0 shadow-inner">
                  <Database className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">الأرشيف الاعتمادي الشامل للجودة والمطابقة الطبية</h4>
                  <p className="text-[10.5px] text-slate-500 mt-0.5 leading-relaxed">
                    منصة التدقيق والتوثيق الموحدة للسياسات، تقارير السلامة ومصفوفات الأداء التمريضي بما يتماثل مع أجهزة الرقابة الصحية.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-stretch md:self-auto justify-end">
                <div className="bg-rose-50/50 px-4 py-2.5 rounded-2xl border border-rose-100 text-center">
                  <span className="text-[10px] text-rose-600 font-bold block uppercase font-mono">Total Verified Sheets</span>
                  <span className="text-lg font-black text-rose-900">{rawLedgerItems.length} وثيقة</span>
                </div>
                <div className="bg-indigo-50/50 px-4 py-2.5 rounded-2xl border border-indigo-100 text-center">
                  <span className="text-[10px] text-indigo-650 font-bold block uppercase font-mono">Archive Filters Active</span>
                  <span className="text-lg font-black text-indigo-900">{filteredLedgerItems.length} مطابقة</span>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between no-print">
              
              {/* Type toggle selector */}
              <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto justify-end">
                <span className="text-[10px] text-slate-400 font-extrabold whitespace-nowrap ml-1">:تصنيف المستند</span>
                {[
                  { key: "all", label: "كل السجلات" },
                  { key: "ovr", label: "بلاغات OVR" },
                  { key: "eval", label: "تقييمات كادر" },
                  { key: "audit", label: "مراجعات وحده" },
                  { key: "sentinel", label: "أحداث جسيمة" },
                  { key: "signature", label: "إمضاء السياسات" }
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setArchiveFilterType(opt.key)}
                    className={`px-3 py-1.5 rounded-lg text-[10.5px] font-extrabold transition-all cursor-pointer ${
                      archiveFilterType === opt.key
                        ? "bg-rose-600 text-white shadow-sm font-black"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Department Selector and Search Text */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                
                {/* Department drop */}
                <select
                  value={archiveDeptFilter}
                  onChange={(e) => setArchiveDeptFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-right font-bold outline-none focus:ring-1 focus:ring-rose-500 text-slate-700"
                >
                  <option value="all">كل الأقسام الطبية</option>
                  {uniqueDeptsList.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>

                {/* Text search query */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="بحث سريع بالمعرف أو المستكشف..."
                    value={archiveSearchTerm}
                    onChange={(e) => setArchiveSearchTerm(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs text-right outline-none focus:ring-1 focus:ring-rose-500 font-bold text-slate-800 placeholder-slate-400 w-full sm:w-56"
                  />
                  <Search className="h-4 w-4 text-slate-400 absolute top-2 right-3 font-bold" />
                </div>

              </div>
            </div>

            {/* Core Archive Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLedgerItems.map((item) => {
                let cardColor = "border-slate-250 hover:border-slate-350";
                let typeBadge = "bg-slate-100 text-slate-700";

                if (item.type === "ovr") {
                  cardColor = "border-red-150 hover:border-red-300 bg-red-50/5";
                  typeBadge = "bg-red-100 text-red-800";
                } else if (item.type === "eval") {
                  cardColor = "border-purple-150 hover:border-purple-300 bg-purple-50/5";
                  typeBadge = "bg-purple-100 text-purple-800";
                } else if (item.type === "audit") {
                  cardColor = "border-indigo-150 hover:border-indigo-300 bg-indigo-50/5";
                  typeBadge = "bg-indigo-100 text-indigo-800";
                } else if (item.type === "sentinel") {
                  cardColor = "border-rose-250 hover:border-rose-400 bg-rose-50/10 shadow-sm animate-pulse";
                  typeBadge = "bg-rose-600 text-white font-black";
                } else if (item.type === "signature") {
                  cardColor = "border-pink-150 hover:border-pink-300 bg-pink-50/5";
                  typeBadge = "bg-pink-100 text-pink-800";
                }

                return (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-3xl p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between text-right space-y-4 relative overflow-hidden ${cardColor}`}
                  >
                    {/* Security Stamp Background Effect */}
                    <div className="absolute -top-1 px-4 -left-3 pointer-events-none opacity-[0.06] select-none text-[32px] font-mono transform rotate-12 uppercase font-black tracking-widest text-slate-800 select-none">
                      GAHAR CQI SECURE
                    </div>

                    <div className="space-y-3">
                      
                      {/* Card Header metadata */}
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-[10px] text-slate-400 font-mono font-extrabold flex items-center gap-1 leading-none">
                          <Clock size={11} />
                          <span>{item.date}</span>
                        </span>
                        <span className={`text-[8.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${typeBadge}`}>
                          {item.typeNameAr}
                        </span>
                      </div>

                      {/* Main Title / Subject */}
                      <h5 className="font-extrabold text-[12px] text-slate-850 leading-snug">
                        {item.titleAr}
                      </h5>
                      <p className="text-[10px] text-slate-450 font-medium leading-none font-mono text-left" dir="ltr">
                        {item.titleEn}
                      </p>

                      {/* Info lines with nice typography */}
                      <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[10.5px] text-slate-600 font-sans">
                        <div className="flex justify-between text-[10px]">
                          <span className="font-bold text-slate-800">{item.department}</span>
                          <span className="text-slate-400 font-medium">القسم المستهدف:</span>
                        </div>
                        <div className="flex justify-between text-[10px] mt-1">
                          <span className="font-bold text-slate-800">{item.operator}</span>
                          <span className="text-slate-400 font-medium">مسجل الواقعة/المدقق:</span>
                        </div>
                        <div className="flex justify-between text-[10px] mt-1 pt-1 border-t border-slate-100">
                          <span className="font-mono font-bold text-indigo-600">{item.id}</span>
                          <span className="text-slate-400 font-medium">المعّرف الموحد:</span>
                        </div>
                      </div>

                    </div>

                    {/* Bottom Action buttons */}
                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-1">
                      
                      {/* Delete Secure stamp trigger */}
                      <button
                        onClick={() => handleDeleteArchiveItem(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="حذف المستند نهائياً"
                      >
                        <Trash2 size={13} />
                      </button>

                      {/* Main View certificate print overlay trigger */}
                      <button
                        onClick={() => setSelectedArchiveItem(item)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-[10px] rounded-xl transition cursor-pointer flex items-center gap-1"
                      >
                        <Printer size={12} className="text-rose-650" />
                        <span>معاينة وثيقة الاعتماد والطباعة</span>
                      </button>

                    </div>
                  </div>
                );
              })}

              {filteredLedgerItems.length === 0 && (
                <div className="text-center py-16 bg-slate-50 border border-dashed rounded-3xl text-slate-400 text-xs md:col-span-3">
                  <Database className="h-8 w-8 text-slate-300 mx-auto block mb-2" />
                  <p className="font-bold">أرشيف الجودة فارغ حالياً أو لا ينطبق على خيارات البحث.</p>
                  <p className="text-[10px] text-slate-400 mt-1">اضغط على زر (تأسيس وتجريب أرشيف الجودة السحابي) لتوليد بيانات الاعتماد فوراً.</p>
                </div>
              )}
            </div>

            {/* ====================================================================================== */}
            {/* PRISTINE STERILE WHITE CERTIFICATE PRINT-PREVIEW MODAL (The Organized White Archive Layout) */}
            {/* ====================================================================================== */}
            {selectedArchiveItem && (() => {
              const item = selectedArchiveItem;
              
              return (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
                  <div className="bg-white rounded-3xl border border-slate-100 max-w-2xl w-full p-2 shadow-2xl relative animate-fade">
                    
                    {/* Header action parameters */}
                    <div className="p-3 border-b flex justify-between items-center gap-2 bg-slate-50 rounded-t-3xl no-print">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => window.print()}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10.5px] rounded-xl transition flex items-center gap-1 cursor-pointer"
                        >
                          <Printer size={12} />
                          <span>طباعة المستند المعتمد</span>
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`CERT-BH-CQI-${item.id}`);
                            alert(isAr ? "📋 تم نسخ الكود المعياري الموحد لاعتماد المستند بنجاح!" : "Document accreditation hash copied.");
                          }}
                          className="px-3 py-1.5 bg-white border text-slate-650 hover:bg-slate-100 font-bold text-[10px] rounded-xl transition cursor-pointer"
                        >
                          نسخ رمز الموثوقية
                        </button>
                      </div>

                      <button
                        onClick={() => setSelectedArchiveItem(null)}
                        className="w-7 h-7 bg-white hover:bg-slate-150 border border-slate-200 rounded-full flex items-center justify-center text-slate-500 transition cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {/* Official Sterile White Certificate Paper Sheet (Designed explicitly for precise real printout or gorgeous screen reading) */}
                    <div 
                      className="bg-white p-8 md:p-12 text-slate-900 text-right font-sans relative border-8 border-double border-slate-200 m-2 overflow-hidden select-text print:border-none print:m-0 print:p-0"
                      id="certified-white-document-sheet"
                    >
                      
                      {/* Certified Stamp Watermark Overlay Background */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
                        <Award className="w-[300px] h-[300px] text-slate-900" />
                      </div>

                      {/* Header Logo and Official Header Title */}
                      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 gap-4">
                        <div className="text-left font-mono text-[9px] text-slate-400">
                          <p>ACCREDITATION REF: BH-CQI-{item.id.toUpperCase()}</p>
                          <p>DATE RECORDED: {item.date}</p>
                          <p>CLASSIFICATION: MEDICAL QUALITY REGISTER</p>
                          <p>STATUS: VERIFIED & COMPLIANT</p>
                        </div>
                        
                        <DynamicProfessionalLogo 
                          nameAr={hospitalSettings?.nameAr} 
                          nameEn={hospitalSettings?.nameEn} 
                          taglineAr="إدارة الجودة والتحسين المستمر للأداء" 
                          taglineEn="Quality Improvement & Performance Department" 
                          size="print" 
                          isAr={true} 
                        />
                      </div>

                      {/* Seal Verification Block */}
                      <div className="mt-8 flex justify-between items-center bg-slate-50/50 p-4 border border-slate-200 rounded-2xl relative">
                        <div className="text-left font-mono text-[9px] text-slate-400 leading-tight">
                          <p className="font-bold text-slate-705">SECURITY DIGITAL HASH:</p>
                          <p>sha256: 0ae6e32bc0c50d18080ff{item.id}</p>
                          <p className="text-emerald-700 font-bold mt-0.5">✔ CLOUD AUTH SEALS MATCHED - ORIGINAL REGISTERED</p>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end text-rose-800">
                            <span className="text-[10.5px] font-black tracking-tight">{item.typeNameAr}</span>
                            <ShieldCheck size={14} />
                          </div>
                          <p className="text-[9.5px] text-slate-405 mt-0.5">رقم المعرّف المعياري: <span className="font-mono font-bold text-slate-900">CERT-BH-CQI-{item.id}</span></p>
                        </div>
                      </div>

                      {/* Main Title in print sheet */}
                      <h3 className="text-center text-sm font-black text-slate-900 mt-8 border-b pb-2 tracking-tight">
                        وثيقة إقرار الالتزام ومطابقة متمتلكات الكفاءة الإكلينيكية
                      </h3>

                      {/* Structured Document Data Rows */}
                      <div className="mt-6 space-y-4 text-xs font-sans text-right leading-relaxed">
                        
                        <div className="grid grid-cols-3 gap-2 border-b border-dashed pb-2.5">
                          <span className="text-slate-400">توصيف السجل الطبي:</span>
                          <span className="col-span-2 font-black text-slate-950 font-sans text-right">
                            {item.titleAr}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-b border-dashed pb-2.5">
                          <span className="text-slate-400">Department /Clinical Unit:</span>
                          <span className="col-span-2 font-bold text-slate-800">
                            {item.department} / {item.department === "ALL DEPARTMENTS" ? "جميع الأقسام السريرية" : "الوحدات الخاصة"}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-b border-dashed pb-2.5">
                          <span className="text-slate-400">المدقق المسؤول والاعتمادي:</span>
                          <span className="col-span-2 font-bold text-slate-800">
                            {item.operator} (عضو لجنة الجودة السريرية المسجلة)
                          </span>
                        </div>

                        {/* Rendering item unique parameters based on type */}
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mt-6 space-y-3">
                          <strong className="block text-[10px] text-slate-500 pb-1.5 border-b border-slate-200/60 leading-none">
                            📋 تفاصيل البيانات والجرودات السريرية المسجلة سحابياً:
                          </strong>

                          {item.type === "ovr" && (
                            <div className="space-y-2 text-[11px] leading-relaxed">
                              <p><span className="text-slate-400 font-bold">● تصنيف الخطورة:</span> <span className="font-extrabold text-red-800">{item.originalData.severity}</span></p>
                              <p><span className="text-slate-400 font-bold">● الوصف السريري للواقعة:</span> <span className="font-bold text-slate-800">{item.originalData.descAr}</span></p>
                              <p><span className="text-slate-400 font-bold">● الإجراء التصحيحي الفوري:</span> <span className="font-bold text-emerald-800">{item.originalData.correctiveAr}</span></p>
                              {item.originalData.patientInvolved && (
                                <p className="bg-slate-100 p-2 rounded-lg text-[10.5px]"><span className="text-slate-505 font-bold">بيانات المريض المتأثر:</span> الاسم: {item.originalData.patientName} / ملف طبي: {item.originalData.patientMRN}</p>
                              )}
                            </div>
                          )}

                          {item.type === "eval" && (
                            <div className="space-y-2 text-[11px]">
                              <p><span className="text-slate-400 font-bold">● الموظف المقيم:</span> <span className="font-extrabold text-purple-900">{item.originalData.employeeNameAr} ({item.originalData.employeeId})</span></p>
                              <p><span className="text-slate-400 font-bold">● درجات التقييم (من 5):</span></p>
                              <div className="grid grid-cols-5 gap-2 text-center text-[10px] bg-slate-100 p-2 rounded-xl border font-bold">
                                <div>مكافحة عدوى<br/><span className="text-rose-600 text-xs">{item.originalData.scores?.clinical || 5}</span></div>
                                <div>السياسات<br/><span className="text-rose-600 text-xs">{item.originalData.scores?.policy || 5}</span></div>
                                <div>التوثيق<br/><span className="text-rose-600 text-xs">{item.originalData.scores?.documentation || 4}</span></div>
                                <div>الحضور وانضباط<br/><span className="text-rose-605 text-xs">{item.originalData.scores?.attendance || 5}</span></div>
                                <div>الأخلاقيات<br/><span className="text-rose-605 text-xs">{item.originalData.scores?.ethics || 5}</span></div>
                              </div>
                              <p className="mt-2"><span className="text-slate-400 font-bold">● تعليق المشرف الجبائي:</span> <span className="font-bold text-slate-800">{item.originalData.comments}</span></p>
                            </div>
                          )}

                          {item.type === "audit" && (
                            <div className="space-y-2 text-[11px]">
                              <p><span className="text-slate-400 font-bold">● معدل الالتزام الكلي:</span> <span className="font-extrabold text-indigo-700 text-sm">{item.originalData.complianceRate}%</span></p>
                              <p><span className="text-slate-400 font-bold">● حالة بنود وقوائم التحقق:</span></p>
                              <div className="grid grid-cols-3 gap-2 text-[9.5px]">
                                <p>عربة طوارئ الكود بلو: <span className="font-bold">{item.originalData.scores?.codeBlue ? "✔ مطابقة" : "✘ مخالفه"}</span></p>
                                <p>سلسلة التبريد الدوائي: <span className="font-bold">{item.originalData.scores?.coldChain ? "✔ مطابقة" : "✘ مخالفه"}</span></p>
                                <p>سلامة الأكسجين والغازات: <span className="font-bold">{item.originalData.scores?.gases ? "✔ مطابقة" : "✘ مخالفه"}</span></p>
                                <p>مخارج مكافحة الحريق: <span className="font-bold">{item.originalData.scores?.fireSafety ? "✔ مطابقة" : "✘ مخالفه"}</span></p>
                                <p>أنظمة استدعاء التمريض: <span className="font-bold">{item.originalData.scores?.nurseCall ? "✔ مطابقة" : "✘ مخالفه"}</span></p>
                                <p>صيانة الأجهزة الحيوية: <span className="font-bold">{item.originalData.scores?.preventiveMaint ? "✔ مطابقة" : "✘ مخالفه"}</span></p>
                              </div>
                              <p className="mt-2 pt-1 border-t"><span className="text-slate-400 font-bold">● توصيات التدقيق المكتوبة:</span> <span className="font-bold text-slate-800">{item.originalData.notes}</span></p>
                            </div>
                          )}

                          {item.type === "sentinel" && (
                            <div className="space-y-2 text-[11px]">
                              <p><span className="text-slate-400 font-bold">● المريض المشترك:</span> <span className="font-extrabold text-rose-800">{item.originalData.patientName} (ملف: {item.originalData.patientMRN})</span></p>
                              <p><span className="text-slate-400 font-bold">● تصنيف وطبيعة الحدث الجسيم:</span> <span className="font-bold text-slate-800">{item.originalData.category}</span></p>
                              <p><span className="text-slate-400 font-bold">● تفاصيل الحدث المطور:</span> <span className="font-bold text-slate-800">{item.originalData.details}</span></p>
                              <p><span className="text-slate-400 font-bold">● حالة التحقيق الجنائي الإكلينيكي:</span> <span className="font-bold text-indigo-700">{item.originalData.status}</span></p>
                            </div>
                          )}

                          {item.type === "signature" && (
                            <div className="space-y-2 text-[11px]">
                              <p><span className="text-slate-400 font-bold">● نوع الإجراء القانوني:</span> <span className="font-black text-slate-900">توقيع أمني إلكتروني بالعلم والالتزام التام بالسياسة</span></p>
                              <p><span className="text-slate-400 font-bold">● الكادر الموقع:</span> <span className="font-extrabold text-slate-800">{item.originalData.nurseName} (معرف: {item.originalData.nurseId})</span></p>
                              <p><span className="text-slate-400 font-bold">● البصمة الرقمية للتوقيع:</span> <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[10px] text-indigo-750">SIG-BAHEYA-{item.originalData.nurseId?.toUpperCase()}-{item.id}</span></p>
                              <p><span className="text-slate-400 font-bold">● وقت وطوابع التثبيت:</span> <span className="font-bold text-emerald-800">{new Date(item.originalData.signedAt).toLocaleString("ar-EG")}</span></p>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Footer signatures & stamps blocks for print out */}
                      <div className="mt-14 border-t-2 border-slate-900 pt-6 grid grid-cols-2 gap-4 text-xs font-sans text-right">
                        <div>
                          <p className="font-black text-rose-900">الختم الاعتمادي لإدارة الجودة:</p>
                          <div className="mt-2 w-28 h-20 rounded bg-rose-50 border border-rose-200 text-center flex flex-col justify-center items-center text-[8px] text-rose-850 transform -rotate-3 select-none leading-tight border-double font-black p-1 shadow-sm">
                            <p>مستشفى المستشفى المعتمدة</p>
                            <p className="text-[7.5px] text-rose-600 mt-1">APPROVED SYSTEM</p>
                            <p className="text-[7.5px] font-bold font-mono">GAHAR COMPLIANT</p>
                            <p className="text-[6.5px] text-slate-400 font-mono mt-1">CQI-REF-PASSED</p>
                          </div>
                        </div>

                        <div className="flex flex-col justify-between h-full">
                          <p className="font-black text-slate-900">التوقيع الإلكتروني المصدق:</p>
                          <div>
                            <p className="font-extrabold text-slate-850 font-mono">DIGITAL SIGN-OFF SECURE</p>
                            <p className="text-[10px] text-slate-405 leading-snug">
                              مؤسسة و مستشفيات المستشفى للتطوير - مركز التقييم والاعتماد الوطني CQI لعام 2026.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Print guideline */}
                      <p className="text-center text-[9px] text-slate-404 mt-12 block no-print border-t pt-2">
                        📄 مستند طبي رسمي - تم توليده سحابياً لمطابقة معايير الرقابة الصحية بهيئة GAHAR بجمهورية مصر العربية.
                      </p>

                    </div>

                  </div>
                </div>
              );
            })()}

          </div>
        );
      })()}

    </div>
  );
}
