import { db } from "../firebase";
import {
  collection,
  doc,
  setDoc as fbSetDoc,
  deleteDoc as fbDeleteDoc,
  onSnapshot as fbOnSnapshot,
  getDoc as fbGetDoc,
  query,
  where
} from "firebase/firestore";
import { getActiveDbProvider } from "./dbConfig";
import { subscribeToClinicalData, saveDataPermanently, deleteDataPermanently } from "./realTimeService";

// Helper to extract collection name robustly from any query or document reference
function getCollectionName(ref: any): string {
  if (!ref) return "unknown_collection";
  if (ref.id && !ref.path) return ref.id; // e.g. collection reference itself

  let path = ref.path || "";
  if (!path && ref._path) {
    path = ref._path.toString();
  }
  if (!path && ref.collection) {
    path = ref.collection.path;
  }

  // Extract nested segment structure if available
  if (!path) {
    try {
      const segs = ref?._query?.path?.segments || ref?.query?.path?.segments || ref?.collection?.path?.segments;
      if (segs && segs.length > 0) return segs[0];
    } catch (e) {}
  }

  if (path) {
    return path.split('/')[0];
  }

  return "unknown_collection";
}

// Graceful local-first / offline-safe wrappers
async function setDoc(docRef: any, data: any, options?: any) {
  if (getActiveDbProvider() !== "FIREBASE") {
    const colName = getCollectionName(docRef);
    const result = await saveDataPermanently(colName, data);
    if (!result.success) {
      throw new Error(result.error || "Failed to save to dynamic provider");
    }
    return;
  }
  if ((window as any).firestoreQuotaExceeded) {
    console.log("Firestore write quota exceeded: setDoc skipped for offline local sandbox mode.", docRef?.path);
    return;
  }
  return fbSetDoc(docRef, data, options);
}

async function deleteDoc(docRef: any) {
  if (getActiveDbProvider() !== "FIREBASE") {
    const colName = getCollectionName(docRef);
    const result = await deleteDataPermanently(colName, docRef.id);
    if (!result.success) {
      throw new Error(result.error || "Failed to delete from dynamic provider");
    }
    return;
  }
  if ((window as any).firestoreQuotaExceeded) {
    console.log("Firestore delete quota exceeded: deleteDoc skipped for offline local sandbox mode.", docRef?.path);
    return;
  }
  return fbDeleteDoc(docRef);
}

async function getDoc(docRef: any) {
  if (getActiveDbProvider() !== "FIREBASE") {
    const provider = getActiveDbProvider();
    const colName = getCollectionName(docRef);
    try {
      const response = await fetch(`/api/db/${provider.toLowerCase()}/${colName}`);
      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          const item = json.data.find((x: any) => x.id === docRef.id);
          return {
            exists: () => !!item,
            data: () => item
          } as any;
        }
      }
    } catch (e) {
      console.error("Local database getDoc simulation error:", e);
    }
    return { exists: () => false, data: () => null } as any;
  }
  if ((window as any).firestoreQuotaExceeded) {
    console.log("Firestore get quota exceeded: getDoc skipped for offline local sandbox mode.", docRef?.path);
    return { exists: () => false, data: () => null } as any;
  }
  return fbGetDoc(docRef);
}

// Intercept low-level onSnapshot subscriptions for multi-provider live syncing
function onSnapshot(queryRef: any, onNext: (snapshot: any) => void, onError?: (error: any) => void) {
  if (getActiveDbProvider() !== "FIREBASE") {
    const colName = getCollectionName(queryRef);
    return subscribeToClinicalData(
      colName,
      (data) => {
        // Format incoming database objects into a compatible Firestore snapshot representation
        const mockSnapshot = {
          forEach: (callback: (doc: any) => void) => {
            data.forEach((item: any) => {
              callback({
                data: () => item,
                id: item.id
              });
            });
          }
        };
        onNext(mockSnapshot);
      },
      (err) => {
        if (onError) onError(err);
      }
    );
  }
  return fbOnSnapshot(queryRef, onNext, onError);
}

import { SavedRecord, AppUser, UnitDailyChecklist, SystemLog, Notification, DailyDutyTask, FormTemplate, Role, Permission, AccessMatrix, AuditLog } from "../types";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

// --- Robust Local-First Resilient Fallback Storage ---
export function getLocalStore(collectionName: string): any[] {
  try {
    const raw = localStorage.getItem(`erpx_fallback_${collectionName}`);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.warn("Error reading local fallback store for", collectionName, e);
    return [];
  }
}

export function setLocalStore(collectionName: string, list: any[]) {
  try {
    localStorage.setItem(`erpx_fallback_${collectionName}`, JSON.stringify(list));
  } catch (e) {
    console.warn("Error writing local fallback store for", collectionName, e);
  }
}

export function saveLocalItem(collectionName: string, id: string, data: any) {
  const current = getLocalStore(collectionName);
  const filtered = current.filter((item: any) => item && item.id !== id);
  const enriched = { ...data, id, localUpdatedAt: Date.now() };
  filtered.push(enriched);
  setLocalStore(collectionName, filtered);
}

export function deleteLocalItem(collectionName: string, id: string) {
  const current = getLocalStore(collectionName);
  const filtered = current.filter((item: any) => item && item.id !== id);
  setLocalStore(collectionName, filtered);
}

export function saveLocalDoc(collectionName: string, docId: string, data: any) {
  try {
    localStorage.setItem(`erpx_fallback_doc_${collectionName}_${docId}`, JSON.stringify({ ...data, localUpdatedAt: Date.now() }));
  } catch (e) {
    console.warn("Error saving local doc", collectionName, docId, e);
  }
}

export function getLocalDoc(collectionName: string, docId: string, defaultValue: any = null): any {
  try {
    const raw = localStorage.getItem(`erpx_fallback_doc_${collectionName}_${docId}`);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    console.warn("Error reading local doc", collectionName, docId, e);
    return defaultValue;
  }
}

export function mergeWithLocal(firestoreList: any[], collectionName: string, idKey: string = "id"): any[] {
  const localList = getLocalStore(collectionName);
  if (!localList || localList.length === 0) return firestoreList;

  const map = new Map<string, any>();
  
  firestoreList.forEach(item => {
    if (item && item[idKey]) {
      map.set(item[idKey], item);
    }
  });

  localList.forEach(item => {
    if (item && item[idKey]) {
      const existing = map.get(item[idKey]);
      if (!existing || (item.localUpdatedAt && (!existing.updatedAt || item.localUpdatedAt > new Date(existing.updatedAt).getTime()))) {
        map.set(item[idKey], item);
      }
    }
  });

  return Array.from(map.values());
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const message = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: message,
    authInfo: {
      userId: null,
      email: null,
    },
    operationType,
    path,
  };
  console.warn("Firestore Operation Warning (System will use offline mode/local state): ", JSON.stringify(errInfo));
  
  if (
    message.toLowerCase().includes("quota") || 
    message.toLowerCase().includes("exhausted") || 
    message.toLowerCase().includes("resource-exhausted") ||
    message.toLowerCase().includes("billing") ||
    message.toLowerCase().includes("limit")
  ) {
    (window as any).firestoreQuotaExceeded = true;
    window.dispatchEvent(new CustomEvent("firestore-quota-exceeded", { detail: { error: message } }));
  }
}

// Helper to safely get doc
async function safeGetDoc(docRef: any) {
  try {
    return await getDoc(docRef);
  } catch (error) {
    console.warn("Firestore offline or inaccessible (getDoc): ", error);
    return null;
  }
}

// 1. Connection check
export async function testConnection(): Promise<boolean> {
  try {
    const docRef = doc(db, "hospital_clinical_records", "test-connection");
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.warn("Firestore offline or inaccessible: ", error);
    return false;
  }
}

// 2. Clinical Records Sync (Real-time)
export function syncClinicalRecords(onData: (records: SavedRecord[]) => void) {
  const path = "hospital_clinical_records";
  // Emit local copy immediately to ensure seamless instant load
  onData(mergeWithLocal([], path));
  
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const records: SavedRecord[] = [];
      snapshot.forEach((doc) => {
        records.push(doc.data() as SavedRecord);
      });
      onData(mergeWithLocal(records, path));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onData(getLocalStore(path));
    }
  );
}

export async function saveClinicalRecord(record: SavedRecord): Promise<void> {
  const path = `hospital_clinical_records/${record.id}`;
  saveLocalItem("hospital_clinical_records", record.id, record);
  try {
    await setDoc(doc(db, "hospital_clinical_records", record.id), record);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteClinicalRecord(recordId: string): Promise<void> {
  const path = `hospital_clinical_records/${recordId}`;
  deleteLocalItem("hospital_clinical_records", recordId);
  try {
    await deleteDoc(doc(db, "hospital_clinical_records", recordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 3. Staff Registry Sync (Real-time)
export function syncStaffRegistry(onData: (users: AppUser[]) => void) {
  const path = "hospital_staff_registry";
  onData(mergeWithLocal([], path));
  
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const users: AppUser[] = [];
      snapshot.forEach((doc) => {
        users.push(doc.data() as AppUser);
      });
      onData(mergeWithLocal(users, path));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onData(getLocalStore(path));
    }
  );
}

export async function saveStaffMember(user: AppUser): Promise<void> {
  const path = `hospital_staff_registry/${user.id}`;
  saveLocalItem("hospital_staff_registry", user.id, user);
  try {
    await setDoc(doc(db, "hospital_staff_registry", user.id), user);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteStaffMember(userId: string): Promise<void> {
  const path = `hospital_staff_registry/${userId}`;
  deleteLocalItem("hospital_staff_registry", userId);
  try {
    await deleteDoc(doc(db, "hospital_staff_registry", userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 4. Daily Supervisor Audits Sync (Real-time)
export function syncDailyAudits(onData: (audits: UnitDailyChecklist[]) => void) {
  const path = "hospital_daily_audits";
  onData(mergeWithLocal([], path));
  
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const audits: UnitDailyChecklist[] = [];
      snapshot.forEach((doc) => {
        audits.push(doc.data() as UnitDailyChecklist);
      });
      onData(mergeWithLocal(audits, path));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onData(getLocalStore(path));
    }
  );
}

export async function saveDailyAudit(audit: UnitDailyChecklist): Promise<void> {
  const path = `hospital_daily_audits/${audit.id}`;
  saveLocalItem("hospital_daily_audits", audit.id, audit);
  try {
    await setDoc(doc(db, "hospital_daily_audits", audit.id), audit);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 5. System Troubleshooting / IT Logs Sync (Real-time and persistent)
export function syncSystemLogs(onData: (logs: SystemLog[]) => void) {
  const path = "hospital_system_logs";
  onData(mergeWithLocal([], path));
  
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const logs: SystemLog[] = [];
      snapshot.forEach((doc) => {
        logs.push(doc.data() as SystemLog);
      });
      // Sort by timestampMs descending so most recent is first
      logs.sort((a, b) => b.timestampMs - a.timestampMs);
      onData(mergeWithLocal(logs, path));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onData(getLocalStore(path).sort((a: any, b: any) => b.timestampMs - a.timestampMs));
    }
  );
}

export async function saveSystemLog(log: SystemLog): Promise<void> {
  const path = `hospital_system_logs/${log.id}`;
  saveLocalItem("hospital_system_logs", log.id, log);
  try {
    await setDoc(doc(db, "hospital_system_logs", log.id), log);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSystemLog(logId: string): Promise<void> {
  const path = `hospital_system_logs/${logId}`;
  deleteLocalItem("hospital_system_logs", logId);
  try {
    await deleteDoc(doc(db, "hospital_system_logs", logId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 7. Duty Tasks Sync
export function syncDutyTasks(onData: (tasks: DailyDutyTask[]) => void) {
  const path = "hospital_daily_duty_tasks";
  onData(mergeWithLocal([], path));
  
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const tasks: DailyDutyTask[] = [];
      snapshot.forEach((doc) => {
        tasks.push(doc.data() as DailyDutyTask);
      });
      onData(mergeWithLocal(tasks, path));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onData(getLocalStore(path));
    }
  );
}

export async function saveDutyTask(task: DailyDutyTask): Promise<void> {
  const path = `hospital_daily_duty_tasks/${task.id}`;
  saveLocalItem("hospital_daily_duty_tasks", task.id, task);
  try {
    await setDoc(doc(db, "hospital_daily_duty_tasks", task.id), task);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 8. Custom Templates Sync
export function syncCustomTemplates(onData: (templates: FormTemplate[]) => void) {
  const path = "hospital_custom_templates";
  onData(mergeWithLocal([], path));
  
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const templates: FormTemplate[] = [];
      snapshot.forEach((doc) => {
        templates.push(doc.data() as FormTemplate);
      });
      onData(mergeWithLocal(templates, path));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onData(getLocalStore(path));
    }
  );
}

export async function saveCustomTemplate(template: FormTemplate): Promise<void> {
  const path = `hospital_custom_templates/${template.id}`;
  saveLocalItem("hospital_custom_templates", template.id, template);
  try {
    await setDoc(doc(db, "hospital_custom_templates", template.id), template);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCustomTemplate(templateId: string): Promise<void> {
  const path = `hospital_custom_templates/${templateId}`;
  deleteLocalItem("hospital_custom_templates", templateId);
  try {
    await deleteDoc(doc(db, "hospital_custom_templates", templateId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 10. System Users Sync
export function syncSystemUsers(onData: (users: AppUser[]) => void) {
  const path = "hospital_staff_registry";
  onData(mergeWithLocal([], path));
  
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const users: AppUser[] = [];
      snapshot.forEach((doc) => {
        users.push(doc.data() as AppUser);
      });
      onData(mergeWithLocal(users, path));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onData(getLocalStore(path));
    }
  );
}

export async function saveSystemUser(user: AppUser): Promise<void> {
  const path = `hospital_staff_registry/${user.id}`;
  saveLocalItem("hospital_staff_registry", user.id, user);
  try {
    await setDoc(doc(db, "hospital_staff_registry", user.id), user);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 10.5. Roster Lists / Department Rosters Sync and Save
export function syncDepartmentRosters(onData: (rosters: any[]) => void) {
  const path = "hospital_department_rosters";
  onData(mergeWithLocal([], path));
  
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const rosters: any[] = [];
      snapshot.forEach((doc) => {
        rosters.push(doc.data());
      });
      onData(mergeWithLocal(rosters, path));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onData(getLocalStore(path));
    }
  );
}

export async function saveDepartmentRoster(roster: any): Promise<void> {
  const path = `hospital_department_rosters/${roster.id}`;
  console.log(`Saving roster ${roster.id} to Firestore.`);
  saveLocalItem("hospital_department_rosters", roster.id, roster);
  try {
    await setDoc(doc(db, "hospital_department_rosters", roster.id), roster);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 10.6. Roster Wishes Sync and Save
export function syncRosterWishes(onData: (wishes: any[]) => void) {
  const path = "hospital_roster_wishes";
  onData(mergeWithLocal([], path));
  
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const wishes: any[] = [];
      snapshot.forEach((doc) => {
        wishes.push(doc.data());
      });
      onData(mergeWithLocal(wishes, path));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onData(getLocalStore(path));
    }
  );
}

export async function saveRosterWish(wish: any): Promise<void> {
  const path = `hospital_roster_wishes/${wish.id}`;
  saveLocalItem("hospital_roster_wishes", wish.id, wish);
  try {
    await setDoc(doc(db, "hospital_roster_wishes", wish.id), wish);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteRosterWish(wishId: string): Promise<void> {
  const path = `hospital_roster_wishes/${wishId}`;
  deleteLocalItem("hospital_roster_wishes", wishId);
  try {
    await deleteDoc(doc(db, "hospital_roster_wishes", wishId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 10.7. Resolved Gaps Sync and Save
export function syncResolvedGaps(onData: (gaps: any[]) => void) {
  const path = "hospital_resolved_gaps";
  onData(mergeWithLocal([], path));
  
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const gaps: any[] = [];
      snapshot.forEach((doc) => {
        gaps.push(doc.data());
      });
      onData(mergeWithLocal(gaps, path));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onData(getLocalStore(path));
    }
  );
}

export async function saveResolvedGap(gap: any): Promise<void> {
  const path = `hospital_resolved_gaps/${gap.id}`;
  saveLocalItem("hospital_resolved_gaps", gap.id, gap);
  try {
    await setDoc(doc(db, "hospital_resolved_gaps", gap.id), gap);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteResolvedGap(gapId: string): Promise<void> {
  const path = `hospital_resolved_gaps/${gapId}`;
  deleteLocalItem("hospital_resolved_gaps", gapId);
  try {
    await deleteDoc(doc(db, "hospital_resolved_gaps", gapId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 10.8. Role Permissions Document
export async function getRolePermissions(): Promise<any> {
    const docRef = doc(db, "hospital_settings", "role_permissions");
    const docSnap = await safeGetDoc(docRef);
    if (docSnap && docSnap.exists()) {
      const data = (docSnap.data() as any).permissions;
      saveLocalDoc("hospital_settings", "role_permissions", { permissions: data });
      return data;
    }
    const local = getLocalDoc("hospital_settings", "role_permissions");
    return local ? local.permissions : null;
}

export async function saveRolePermissions(permissions: any): Promise<void> {
  const path = `hospital_settings/role_permissions`;
  saveLocalDoc("hospital_settings", "role_permissions", { permissions });
  try {
    await setDoc(doc(db, "hospital_settings", "role_permissions"), { permissions });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 10.9. Roster Approvals Document
export async function getRosterApprovals(): Promise<any> {
    const docRef = doc(db, "hospital_settings", "roster_approvals");
    const docSnap = await safeGetDoc(docRef);
    if (docSnap && docSnap.exists()) {
      const data = docSnap.data();
      saveLocalDoc("hospital_settings", "roster_approvals", data);
      return data;
    }
    return getLocalDoc("hospital_settings", "roster_approvals");
}

export async function saveRosterApprovals(approvals: any): Promise<void> {
  const path = `hospital_settings/roster_approvals`;
  saveLocalDoc("hospital_settings", "roster_approvals", approvals);
  try {
    await setDoc(doc(db, "hospital_settings", "roster_approvals"), approvals);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 10.10. Custom Template Overrides and Deactivations
export async function getTemplateConfig(): Promise<any> {
    const docRef = doc(db, "hospital_settings", "template_config");
    const docSnap = await safeGetDoc(docRef);
    if (docSnap && docSnap.exists()) {
      const data = docSnap.data();
      saveLocalDoc("hospital_settings", "template_config", data);
      return data;
    }
    return getLocalDoc("hospital_settings", "template_config");
}

export async function saveTemplateConfig(config: any): Promise<void> {
  const path = `hospital_settings/template_config`;
  saveLocalDoc("hospital_settings", "template_config", config);
  try {
    await setDoc(doc(db, "hospital_settings", "template_config"), config);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getResolvedGapsCloud(): Promise<any> {
    const docRef = doc(db, "hospital_settings", "resolved_gaps");
    const docSnap = await safeGetDoc(docRef);
    if (docSnap && docSnap.exists()) {
        const data = docSnap.data();
        saveLocalDoc("hospital_settings", "resolved_gaps", data);
        return data;
    }
    return getLocalDoc("hospital_settings", "resolved_gaps");
}

export async function saveResolvedGapsCloud(gaps: any): Promise<void> {
    const path = `hospital_settings/resolved_gaps`;
    saveLocalDoc("hospital_settings", "resolved_gaps", gaps);
    try {
        await setDoc(doc(db, "hospital_settings", "resolved_gaps"), gaps);
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
    }
}

// 11. Notifications Sync
export function syncNotifications(userId: string, onData: (notifications: Notification[]) => void) {
  const path = "notifications";
  const getFilteredLocal = () => getLocalStore(path).filter((n: any) => n && n.userId === userId);
  
  onData(getFilteredLocal());
  const q = query(collection(db, path), where("userId", "==", userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const notifications: Notification[] = [];
      snapshot.forEach((doc) => {
        notifications.push(doc.data() as Notification);
      });
      
      // Update local storage items that match this userId
      const allLocal = getLocalStore(path).filter((n: any) => n && n.userId !== userId);
      notifications.forEach(n => allLocal.push(n));
      setLocalStore(path, allLocal);
      
      onData(notifications);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onData(getFilteredLocal());
    }
  );
}

export async function saveNotification(notification: Notification): Promise<void> {
  const path = `notifications/${notification.id}`;
  saveLocalItem("notifications", notification.id, notification);
  try {
    await setDoc(doc(db, "notifications", notification.id), notification);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 12. Settings Sync
export function syncHospitalSettings(onData: (settings: any) => void) {
    const path = "organizationSettings/main";
    const local = getLocalDoc("organizationSettings", "main");
    if (local) {
        onData(local);
    }
    return onSnapshot(
        doc(db, "organizationSettings", "main"),
        (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data() as any;
                if (data) {
                    data.organizationName = data.organizationName || data.nameEn || "Unified Medical Hospital";
                    data.organizationNameAr = data.organizationNameAr || data.nameAr || "مستشفى الرعاية الموحدة";
                    data.organizationNameEn = data.organizationNameEn || data.nameEn || "Unified Medical Hospital";
                }
                saveLocalDoc("organizationSettings", "main", data);
                onData(data);
            }
        },
        (error) => {
            console.error("Firestore settings sync error:", error);
            const fallback = getLocalDoc("organizationSettings", "main");
            if (fallback) onData(fallback);
        }
    );
}

export async function getHospitalSettings(): Promise<any> {
    const docRef = doc(db, "organizationSettings", "main");
    const docSnap = await safeGetDoc(docRef);
    if (docSnap && docSnap.exists()) {
        const data = docSnap.data() as any;
        if (data) {
            data.organizationName = data.organizationName || data.nameEn || "Unified Medical Hospital";
            data.organizationNameAr = data.organizationNameAr || data.nameAr || "مستشفى الرعاية الموحدة";
            data.organizationNameEn = data.organizationNameEn || data.nameEn || "Unified Medical Hospital";
        }
        saveLocalDoc("organizationSettings", "main", data);
        return data;
    }
    return getLocalDoc("organizationSettings", "main");
}

export async function saveHospitalSettings(settings: any): Promise<void> {
    const path = `organizationSettings/main`;
    saveLocalDoc("organizationSettings", "main", settings);
    try {
        await setDoc(doc(db, "organizationSettings", "main"), settings);
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
    }
}

// 14. Access Matrix and Audit Logs
export function syncRoles(onData: (roles: Role[]) => void) {
  const path = "roles";
  onData(mergeWithLocal([], path));
  return onSnapshot(collection(db, path), (snapshot) => {
    const roles: Role[] = [];
    snapshot.forEach((doc) => roles.push(doc.data() as Role));
    onData(mergeWithLocal(roles, path));
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
    onData(getLocalStore(path));
  });
}

export function syncPermissions(onData: (permissions: Permission[]) => void) {
  const path = "permissions";
  onData(mergeWithLocal([], path));
  return onSnapshot(collection(db, path), (snapshot) => {
    const permissions: Permission[] = [];
    snapshot.forEach((doc) => permissions.push(doc.data() as Permission));
    onData(mergeWithLocal(permissions, path));
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
    onData(getLocalStore(path));
  });
}

export function syncAccessMatrix(onData: (matrix: AccessMatrix[]) => void) {
  const path = "access_matrix";
  onData(mergeWithLocal([], path));
  return onSnapshot(collection(db, path), (snapshot) => {
    const matrix: AccessMatrix[] = [];
    snapshot.forEach((doc) => matrix.push(doc.data() as AccessMatrix));
    onData(mergeWithLocal(matrix, path));
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
    onData(getLocalStore(path));
  });
}

export async function saveAccessMatrix(matrix: AccessMatrix): Promise<void> {
  const path = `access_matrix/${matrix.id}`;
  saveLocalItem("access_matrix", matrix.id, matrix);
  try {
    await setDoc(doc(db, "access_matrix", matrix.id), matrix);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function syncAuditLogs(onData: (logs: AuditLog[]) => void) {
  const path = "audit_logs";
  onData(mergeWithLocal([], path));
  return onSnapshot(query(collection(db, path)), (snapshot) => {
    const logs: AuditLog[] = [];
    snapshot.forEach((doc) => logs.push(doc.data() as AuditLog));
    logs.sort((a, b) => b.timestamp - a.timestamp);
    onData(mergeWithLocal(logs, path));
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
    onData(getLocalStore(path).sort((a: any, b: any) => b.timestamp - a.timestamp));
  });
}

export async function saveAuditLog(log: AuditLog): Promise<void> {
  const path = `audit_logs/${log.id}`;
  saveLocalItem("audit_logs", log.id, log);
  try {
    await setDoc(doc(db, "audit_logs", log.id), log);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveRole(role: Role): Promise<void> {
  const path = `roles/${role.id}`;
  saveLocalItem("roles", role.id, role);
  try {
    await setDoc(doc(db, "roles", role.id), role);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteRole(roleId: string): Promise<void> {
  const path = `roles/${roleId}`;
  deleteLocalItem("roles", roleId);
  try {
    await deleteDoc(doc(db, "roles", roleId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function savePermission(permission: Permission): Promise<void> {
  const path = `permissions/${permission.id}`;
  saveLocalItem("permissions", permission.id, permission);
  try {
    await setDoc(doc(db, "permissions", permission.id), permission);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePermission(permId: string): Promise<void> {
  const path = `permissions/${permId}`;
  deleteLocalItem("permissions", permId);
  try {
    await deleteDoc(doc(db, "permissions", permId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 10.15. Sentinel Incidents Real-time Sync and Save
export function syncSentinelIncidents(onData: (incidents: any[]) => void) {
  const path = "hospital_sentinel_incidents";
  onData(mergeWithLocal([], path));
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      onData(mergeWithLocal(list, path));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onData(getLocalStore(path));
    }
  );
}

export async function saveSentinelIncident(incident: any): Promise<void> {
  const path = `hospital_sentinel_incidents/${incident.id}`;
  saveLocalItem("hospital_sentinel_incidents", incident.id, incident);
  try {
    await setDoc(doc(db, "hospital_sentinel_incidents", incident.id), incident);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSentinelIncident(incidentId: string): Promise<void> {
  const path = `hospital_sentinel_incidents/${incidentId}`;
  deleteLocalItem("hospital_sentinel_incidents", incidentId);
  try {
    await deleteDoc(doc(db, "hospital_sentinel_incidents", incidentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Generic Key-Value Settings Storage
export function syncSetting(key: string, onData: (value: any) => void) {
  const path = "app_settings";
  const localVal = getLocalDoc(path, key);
  if (localVal) {
    onData(localVal);
  }
  return onSnapshot(
    doc(db, "app_settings", key),
    (snapshot) => {
      const data = snapshot.exists() ? snapshot.data() : null;
      if (data) saveLocalDoc(path, key, data);
      onData(data);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `${path}/${key}`);
      onData(getLocalDoc(path, key));
    }
  );
}

export async function getSetting(key: string): Promise<any> {
    const docRef = doc(db, "app_settings", key);
    const docSnap = await safeGetDoc(docRef);
    if (docSnap && docSnap.exists()) {
        const data = docSnap.data() as any;
        if (data) saveLocalDoc("app_settings", key, data);
        return data ? data.value : null;
    }
    const local = getLocalDoc("app_settings", key);
    return local ? local.value : null;
}

export async function saveSetting(key: string, value: any): Promise<void> {
    const path = `app_settings/${key}`;
    saveLocalDoc("app_settings", key, { value });
    try {
        await setDoc(doc(db, "app_settings", key), { value });
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
    }
}

export function syncCloudDocuments(onData: (docs: any[]) => void) {
  const path = "hospital_cqi_documents";
  
  // Local fallback immediately
  try {
    const local = localStorage.getItem("hospital_cloud_docs_fallback");
    if (local) {
      onData(JSON.parse(local));
    }
  } catch (e) {
    console.warn("Local storage parse error:", e);
  }

  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      // Sort by timestamp desc
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      try {
        localStorage.setItem("hospital_cloud_docs_fallback", JSON.stringify(list));
      } catch (e) {
        console.warn("Quota exceeded for cloud docs local cache");
      }
      
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      // Ensure onData is called even on error so UI stops loading spinner
      try {
        const local = localStorage.getItem("hospital_cloud_docs_fallback");
        onData(local ? JSON.parse(local) : []);
      } catch (e) {
        onData([]);
      }
    }
  );
}

export async function saveCloudDocument(docData: any): Promise<void> {
  const path = `hospital_cqi_documents/${docData.id}`;
  
  // Local fallback
  try {
    const local = localStorage.getItem("hospital_cloud_docs_fallback");
    let list = local ? JSON.parse(local) : [];
    list = list.filter((d: any) => d.id !== docData.id);
    list.push(docData);
    list.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    localStorage.setItem("hospital_cloud_docs_fallback", JSON.stringify(list));
  } catch (e) {
    console.warn("Quota exceeded saving doc to local schema", e);
  }

  try {
      await setDoc(doc(db, "hospital_cqi_documents", docData.id), docData);
  } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCloudDocument(docId: string): Promise<void> {
  const path = `hospital_cqi_documents/${docId}`;
  
  // Local fallback
  try {
    const local = localStorage.getItem("hospital_cloud_docs_fallback");
    if (local) {
      const list = JSON.parse(local).filter((d: any) => d.id !== docId);
      localStorage.setItem("hospital_cloud_docs_fallback", JSON.stringify(list));
    }
  } catch (e) {
    console.warn("Could not delete from local storage", e);
  }

  try {
      await deleteDoc(doc(db, "hospital_cqi_documents", docId));
  } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 15. Quality OVRs Sync and Save
export function syncCQIOvrs(onData: (ovrs: any[]) => void) {
  const path = "hospital_cqi_ovrs";
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveCQIOvr(ovr: any): Promise<void> {
  const path = `hospital_cqi_ovrs/${ovr.id}`;
  try {
    await setDoc(doc(db, "hospital_cqi_ovrs", ovr.id), ovr);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCQIOvr(ovrId: string): Promise<void> {
  const path = `hospital_cqi_ovrs/${ovrId}`;
  try {
    await deleteDoc(doc(db, "hospital_cqi_ovrs", ovrId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 16. Staff Evaluation Sync and Save
export function syncCQIStaffEvals(onData: (evals: any[]) => void) {
  const path = "hospital_cqi_staff_evals";
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveCQIStaffEval(evaluation: any): Promise<void> {
  const path = `hospital_cqi_staff_evals/${evaluation.id}`;
  try {
    await setDoc(doc(db, "hospital_cqi_staff_evals", evaluation.id), evaluation);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCQIStaffEval(evalId: string): Promise<void> {
  const path = `hospital_cqi_staff_evals/${evalId}`;
  try {
    await deleteDoc(doc(db, "hospital_cqi_staff_evals", evalId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 17. Unit Inspections Sync and Save
export function syncCQIUnitInspections(onData: (inspections: any[]) => void) {
  const path = "hospital_cqi_unit_inspections";
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveCQIUnitInspection(inspection: any): Promise<void> {
  const path = `hospital_cqi_unit_inspections/${inspection.id}`;
  try {
    await setDoc(doc(db, "hospital_cqi_unit_inspections", inspection.id), inspection);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCQIUnitInspection(inspId: string): Promise<void> {
  const path = `hospital_cqi_unit_inspections/${inspId}`;
  try {
    await deleteDoc(doc(db, "hospital_cqi_unit_inspections", inspId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 18. Policy Signatures Read-Receipt Log
export function syncCQIPolicyAcks(onData: (acks: any[]) => void) {
  const path = "hospital_policy_acks";
  onData(mergeWithLocal([], path));
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      onData(mergeWithLocal(list, path));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onData(getLocalStore(path));
    }
  );
}

export async function saveCQIPolicyAck(ack: any): Promise<void> {
  const path = `hospital_policy_acks/${ack.id}`;
  saveLocalItem("hospital_policy_acks", ack.id, ack);
  try {
    await setDoc(doc(db, "hospital_policy_acks", ack.id), ack);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCQIPolicyAck(ackId: string): Promise<void> {
  const path = `hospital_policy_acks/${ackId}`;
  deleteLocalItem("hospital_policy_acks", ackId);
  try {
    await deleteDoc(doc(db, "hospital_policy_acks", ackId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 19. Clinical Decision Support Simulator Logs
export function syncCQIDecisionLogs(onData: (logs: any[]) => void) {
  const path = "hospital_decision_logs";
  onData(mergeWithLocal([], path));
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onData(mergeWithLocal(list, path));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onData(getLocalStore(path).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }
  );
}

export async function saveCQIDecisionLog(logData: any): Promise<void> {
  const path = `hospital_decision_logs/${logData.id}`;
  saveLocalItem("hospital_decision_logs", logData.id, logData);
  try {
    await setDoc(doc(db, "hospital_decision_logs", logData.id), logData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCQIDecisionLog(logId: string): Promise<void> {
  const path = `hospital_decision_logs/${logId}`;
  deleteLocalItem("hospital_decision_logs", logId);
  try {
    await deleteDoc(doc(db, "hospital_decision_logs", logId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 20. Leave Requests (Real-time)
export function syncLeaveRequests(onData: (data: any[]) => void) {
  const path = "hospital_leave_requests";
  onData(mergeWithLocal([], path));
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      list.sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));
      onData(mergeWithLocal(list, path));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onData(getLocalStore(path).sort((a: any, b: any) => (b.timestampMs || 0) - (a.timestampMs || 0)));
    }
  );
}

export async function saveLeaveRequest(req: any): Promise<void> {
  const path = `hospital_leave_requests/${req.id}`;
  saveLocalItem("hospital_leave_requests", req.id, req);
  try {
    await setDoc(doc(db, "hospital_leave_requests", req.id), req);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteLeaveRequest(id: string): Promise<void> {
  const path = `hospital_leave_requests/${id}`;
  deleteLocalItem("hospital_leave_requests", id);
  try {
    await deleteDoc(doc(db, "hospital_leave_requests", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 21. Administrative Requests (Real-time)
export function syncAdminRequests(onData: (data: any[]) => void) {
  const path = "hospital_admin_requests";
  onData(mergeWithLocal([], path));
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      list.sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));
      onData(mergeWithLocal(list, path));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onData(getLocalStore(path).sort((a: any, b: any) => (b.timestampMs || 0) - (a.timestampMs || 0)));
    }
  );
}

export async function saveAdminRequest(req: any): Promise<void> {
  const path = `hospital_admin_requests/${req.id}`;
  saveLocalItem("hospital_admin_requests", req.id, req);
  try {
    await setDoc(doc(db, "hospital_admin_requests", req.id), req);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAdminRequest(id: string): Promise<void> {
  const path = `hospital_admin_requests/${id}`;
  deleteLocalItem("hospital_admin_requests", id);
  try {
    await deleteDoc(doc(db, "hospital_admin_requests", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 22. Daily Duties Assignment (Real-time)
export function syncDailyDuties(onData: (data: any[]) => void) {
  const path = "hospital_daily_duties";
  onData(mergeWithLocal([], path));
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      onData(mergeWithLocal(list, path));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onData(getLocalStore(path));
    }
  );
}

export async function saveDailyDuty(duty: any): Promise<void> {
  const path = `hospital_daily_duties/${duty.id}`;
  saveLocalItem("hospital_daily_duties", duty.id, duty);
  try {
    await setDoc(doc(db, "hospital_daily_duties", duty.id), duty);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDailyDuty(id: string): Promise<void> {
  const path = `hospital_daily_duties/${id}`;
  deleteLocalItem("hospital_daily_duties", id);
  try {
    await deleteDoc(doc(db, "hospital_daily_duties", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 23. Daily Emergency Teams Selection (Real-time)
export function syncEmergencyTeams(onData: (data: any[]) => void) {
  const path = "hospital_daily_emergency_teams";
  onData(mergeWithLocal([], path));
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      onData(mergeWithLocal(list, path));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onData(getLocalStore(path));
    }
  );
}

export async function saveEmergencyTeam(team: any): Promise<void> {
  const path = `hospital_daily_emergency_teams/${team.id}`;
  saveLocalItem("hospital_daily_emergency_teams", team.id, team);
  try {
    await setDoc(doc(db, "hospital_daily_emergency_teams", team.id), team);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteEmergencyTeam(id: string): Promise<void> {
  const path = `hospital_daily_emergency_teams/${id}`;
  deleteLocalItem("hospital_daily_emergency_teams", id);
  try {
    await deleteDoc(doc(db, "hospital_daily_emergency_teams", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 24. HIS Modules (Real-time)
export function syncPatients(onData: (data: any[]) => void) {
  const path = "hospital_his_patients";
  onData(mergeWithLocal([], path));
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => list.push(doc.data()));
      onData(mergeWithLocal(list, path));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onData(getLocalStore(path));
    }
  );
}
export async function savePatient(patient: any): Promise<void> {
  const path = `hospital_his_patients/${patient.id}`;
  saveLocalItem("hospital_his_patients", patient.id, patient);
  try { await setDoc(doc(db, "hospital_his_patients", patient.id), patient); }
  catch (error) { handleFirestoreError(error, OperationType.WRITE, path); }
}

export function syncPrescriptions(onData: (data: any[]) => void) {
  const path = "hospital_his_prescriptions";
  onData(mergeWithLocal([], path));
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => list.push(doc.data()));
      onData(mergeWithLocal(list, path));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onData(getLocalStore(path));
    }
  );
}
export async function savePrescription(prescription: any): Promise<void> {
  const path = `hospital_his_prescriptions/${prescription.id}`;
  saveLocalItem("hospital_his_prescriptions", prescription.id, prescription);
  try { await setDoc(doc(db, "hospital_his_prescriptions", prescription.id), prescription); }
  catch (error) { handleFirestoreError(error, OperationType.WRITE, path); }
}

export function syncInvoices(onData: (data: any[]) => void) {
  const path = "hospital_his_invoices";
  onData(mergeWithLocal([], path));
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => list.push(doc.data()));
      onData(mergeWithLocal(list, path));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onData(getLocalStore(path));
    }
  );
}
export async function saveInvoice(invoice: any): Promise<void> {
  const path = `hospital_his_invoices/${invoice.id}`;
  saveLocalItem("hospital_his_invoices", invoice.id, invoice);
  try { await setDoc(doc(db, "hospital_his_invoices", invoice.id), invoice); }
  catch (error) { handleFirestoreError(error, OperationType.WRITE, path); }
}

// 27. Periodic Performance Reports Sync and Save
export function syncPeriodicReports(onData: (reports: any[]) => void) {
  const path = "hospital_periodic_reports";
  onData(mergeWithLocal([], path));
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      onData(mergeWithLocal(list, path));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onData(getLocalStore(path));
    }
  );
}

export async function savePeriodicReport(report: any): Promise<void> {
  const path = `hospital_periodic_reports/${report.id}`;
  saveLocalItem("hospital_periodic_reports", report.id, report);
  try {
    await setDoc(doc(db, "hospital_periodic_reports", report.id), report);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePeriodicReport(reportId: string): Promise<void> {
  const path = `hospital_periodic_reports/${reportId}`;
  deleteLocalItem("hospital_periodic_reports", reportId);
  try {
    await deleteDoc(doc(db, "hospital_periodic_reports", reportId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}





