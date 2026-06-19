import { db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  query,
  where
} from "firebase/firestore";
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

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
    },
    operationType,
    path,
  };
  console.warn("Firestore Operation Warning (System will use offline mode/local state): ", JSON.stringify(errInfo));
  // We do not throw an unhandled error to guarantee system uptime and zero UI crashes for the Medical ERP.
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
    const docRef = doc(db, "baheya_clinical_records", "test-connection");
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.warn("Firestore offline or inaccessible: ", error);
    return false;
  }
}

// 2. Clinical Records Sync (Real-time)
export function syncClinicalRecords(onData: (records: SavedRecord[]) => void) {
  const path = "baheya_clinical_records";
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const records: SavedRecord[] = [];
      snapshot.forEach((doc) => {
        records.push(doc.data() as SavedRecord);
      });
      onData(records);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveClinicalRecord(record: SavedRecord): Promise<void> {
  const path = `baheya_clinical_records/${record.id}`;
  try {
    await setDoc(doc(db, "baheya_clinical_records", record.id), record);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteClinicalRecord(recordId: string): Promise<void> {
  const path = `baheya_clinical_records/${recordId}`;
  try {
    await deleteDoc(doc(db, "baheya_clinical_records", recordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 3. Staff Registry Sync (Real-time)
export function syncStaffRegistry(onData: (users: AppUser[]) => void) {
  const path = "baheya_staff_registry";
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const users: AppUser[] = [];
      snapshot.forEach((doc) => {
        users.push(doc.data() as AppUser);
      });
      onData(users);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveStaffMember(user: AppUser): Promise<void> {
  const path = `baheya_staff_registry/${user.id}`;
  try {
    await setDoc(doc(db, "baheya_staff_registry", user.id), user);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteStaffMember(userId: string): Promise<void> {
  const path = `baheya_staff_registry/${userId}`;
  try {
    await deleteDoc(doc(db, "baheya_staff_registry", userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 4. Daily Supervisor Audits Sync (Real-time)
export function syncDailyAudits(onData: (audits: UnitDailyChecklist[]) => void) {
  const path = "baheya_daily_audits";
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const audits: UnitDailyChecklist[] = [];
      snapshot.forEach((doc) => {
        audits.push(doc.data() as UnitDailyChecklist);
      });
      onData(audits);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveDailyAudit(audit: UnitDailyChecklist): Promise<void> {
  const path = `baheya_daily_audits/${audit.id}`;
  try {
    await setDoc(doc(db, "baheya_daily_audits", audit.id), audit);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 5. System Troubleshooting / IT Logs Sync (Real-time and persistent)
export function syncSystemLogs(onData: (logs: SystemLog[]) => void) {
  const path = "baheya_system_logs";
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const logs: SystemLog[] = [];
      snapshot.forEach((doc) => {
        logs.push(doc.data() as SystemLog);
      });
      // Sort by timestampMs descending so most recent is first
      logs.sort((a, b) => b.timestampMs - a.timestampMs);
      onData(logs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveSystemLog(log: SystemLog): Promise<void> {
  const path = `baheya_system_logs/${log.id}`;
  try {
    await setDoc(doc(db, "baheya_system_logs", log.id), log);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSystemLog(logId: string): Promise<void> {
  const path = `baheya_system_logs/${logId}`;
  try {
    await deleteDoc(doc(db, "baheya_system_logs", logId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 7. Duty Tasks Sync
export function syncDutyTasks(onData: (tasks: DailyDutyTask[]) => void) {
  const path = "baheya_daily_duty_tasks";
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const tasks: DailyDutyTask[] = [];
      snapshot.forEach((doc) => {
        tasks.push(doc.data() as DailyDutyTask);
      });
      onData(tasks);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveDutyTask(task: DailyDutyTask): Promise<void> {
  const path = `baheya_daily_duty_tasks/${task.id}`;
  try {
    await setDoc(doc(db, "baheya_daily_duty_tasks", task.id), task);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 8. Custom Templates Sync
export function syncCustomTemplates(onData: (templates: FormTemplate[]) => void) {
  const path = "baheya_custom_templates";
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const templates: FormTemplate[] = [];
      snapshot.forEach((doc) => {
        templates.push(doc.data() as FormTemplate);
      });
      onData(templates);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveCustomTemplate(template: FormTemplate): Promise<void> {
  const path = `baheya_custom_templates/${template.id}`;
  try {
    await setDoc(doc(db, "baheya_custom_templates", template.id), template);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCustomTemplate(templateId: string): Promise<void> {
  const path = `baheya_custom_templates/${templateId}`;
  try {
    await deleteDoc(doc(db, "baheya_custom_templates", templateId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 10. System Users Sync
export function syncSystemUsers(onData: (users: AppUser[]) => void) {
  const path = "baheya_staff_registry";
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const users: AppUser[] = [];
      snapshot.forEach((doc) => {
        users.push(doc.data() as AppUser);
      });
      onData(users);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveSystemUser(user: AppUser): Promise<void> {
  const path = `baheya_staff_registry/${user.id}`;
  try {
    await setDoc(doc(db, "baheya_staff_registry", user.id), user);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 10.5. Roster Lists / Department Rosters Sync and Save
export function syncDepartmentRosters(onData: (rosters: any[]) => void) {
  const path = "baheya_department_rosters";
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const rosters: any[] = [];
      snapshot.forEach((doc) => {
        rosters.push(doc.data());
      });
      onData(rosters);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveDepartmentRoster(roster: any): Promise<void> {
  const path = `baheya_department_rosters/${roster.id}`;
  console.log(`Saving roster ${roster.id} to Firestore.`);
  try {
    await setDoc(doc(db, "baheya_department_rosters", roster.id), roster);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 10.6. Roster Wishes Sync and Save
export function syncRosterWishes(onData: (wishes: any[]) => void) {
  const path = "baheya_roster_wishes";
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const wishes: any[] = [];
      snapshot.forEach((doc) => {
        wishes.push(doc.data());
      });
      onData(wishes);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveRosterWish(wish: any): Promise<void> {
  const path = `baheya_roster_wishes/${wish.id}`;
  try {
    await setDoc(doc(db, "baheya_roster_wishes", wish.id), wish);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteRosterWish(wishId: string): Promise<void> {
  const path = `baheya_roster_wishes/${wishId}`;
  try {
    await deleteDoc(doc(db, "baheya_roster_wishes", wishId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 10.7. Resolved Gaps Sync and Save
export function syncResolvedGaps(onData: (gaps: any[]) => void) {
  const path = "baheya_resolved_gaps";
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const gaps: any[] = [];
      snapshot.forEach((doc) => {
        gaps.push(doc.data());
      });
      onData(gaps);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveResolvedGap(gap: any): Promise<void> {
  const path = `baheya_resolved_gaps/${gap.id}`;
  try {
    await setDoc(doc(db, "baheya_resolved_gaps", gap.id), gap);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteResolvedGap(gapId: string): Promise<void> {
  const path = `baheya_resolved_gaps/${gapId}`;
  try {
    await deleteDoc(doc(db, "baheya_resolved_gaps", gapId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 10.8. Role Permissions Document
export async function getRolePermissions(): Promise<any> {
    const docRef = doc(db, "baheya_settings", "role_permissions");
    const docSnap = await safeGetDoc(docRef);
    if (docSnap && docSnap.exists()) {
      return (docSnap.data() as any).permissions;
    }
    return null;
}

export async function saveRolePermissions(permissions: any): Promise<void> {
  const path = `baheya_settings/role_permissions`;
  try {
    await setDoc(doc(db, "baheya_settings", "role_permissions"), { permissions });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 10.9. Roster Approvals Document
export async function getRosterApprovals(): Promise<any> {
    const docRef = doc(db, "baheya_settings", "roster_approvals");
    const docSnap = await safeGetDoc(docRef);
    if (docSnap && docSnap.exists()) {
      return docSnap.data();
    }
    return null;
}

export async function saveRosterApprovals(approvals: any): Promise<void> {
  const path = `baheya_settings/roster_approvals`;
  try {
    await setDoc(doc(db, "baheya_settings", "roster_approvals"), approvals);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 10.10. Custom Template Overrides and Deactivations
export async function getTemplateConfig(): Promise<any> {
    const docRef = doc(db, "baheya_settings", "template_config");
    const docSnap = await safeGetDoc(docRef);
    if (docSnap && docSnap.exists()) {
      return docSnap.data();
    }
    return null;
}

export async function saveTemplateConfig(config: any): Promise<void> {
  const path = `baheya_settings/template_config`;
  try {
    await setDoc(doc(db, "baheya_settings", "template_config"), config);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getResolvedGapsCloud(): Promise<any> {
    const docRef = doc(db, "baheya_settings", "resolved_gaps");
    const docSnap = await safeGetDoc(docRef);
    if (docSnap && docSnap.exists()) {
        return docSnap.data();
    }
    return null;
}

export async function saveResolvedGapsCloud(gaps: any): Promise<void> {
    const path = `baheya_settings/resolved_gaps`;
    try {
        await setDoc(doc(db, "baheya_settings", "resolved_gaps"), gaps);
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
    }
}

// 11. Notifications Sync
export function syncNotifications(userId: string, onData: (notifications: Notification[]) => void) {
  const path = "notifications";
  const q = query(collection(db, path), where("userId", "==", userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const notifications: Notification[] = [];
      snapshot.forEach((doc) => {
        notifications.push(doc.data() as Notification);
      });
      onData(notifications);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveNotification(notification: Notification): Promise<void> {
  const path = `notifications/${notification.id}`;
  try {
    await setDoc(doc(db, "notifications", notification.id), notification);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 12. Settings Sync
export function syncHospitalSettings(onData: (settings: any) => void) {
    const path = "organizationSettings/main";
    return onSnapshot(
        doc(db, "organizationSettings", "main"),
        (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data() as any;
                if (data) {
                    // map organizationName to different variations for compatibility with program usages
                    data.organizationName = data.organizationName || data.nameEn || "Unified Medical Hospital";
                    data.organizationNameAr = data.organizationNameAr || data.nameAr || "مستشفى الرعاية الموحدة";
                    data.organizationNameEn = data.organizationNameEn || data.nameEn || "Unified Medical Hospital";
                }
                onData(data);
            }
        },
        (error) => {
            console.error("Firestore settings sync error:", error);
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
        return data;
    }
    return null;
}

export async function saveHospitalSettings(settings: any): Promise<void> {
    const path = `organizationSettings/main`;
    try {
        await setDoc(doc(db, "organizationSettings", "main"), settings);
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
    }
}

// 14. Access Matrix and Audit Logs
export function syncRoles(onData: (roles: Role[]) => void) {
  const path = "roles";
  return onSnapshot(collection(db, path), (snapshot) => {
    const roles: Role[] = [];
    snapshot.forEach((doc) => roles.push(doc.data() as Role));
    onData(roles);
  }, (error) => handleFirestoreError(error, OperationType.LIST, path));
}

export function syncPermissions(onData: (permissions: Permission[]) => void) {
  const path = "permissions";
  return onSnapshot(collection(db, path), (snapshot) => {
    const permissions: Permission[] = [];
    snapshot.forEach((doc) => permissions.push(doc.data() as Permission));
    onData(permissions);
  }, (error) => handleFirestoreError(error, OperationType.LIST, path));
}

export function syncAccessMatrix(onData: (matrix: AccessMatrix[]) => void) {
  const path = "access_matrix";
  return onSnapshot(collection(db, path), (snapshot) => {
    const matrix: AccessMatrix[] = [];
    snapshot.forEach((doc) => matrix.push(doc.data() as AccessMatrix));
    onData(matrix);
  }, (error) => handleFirestoreError(error, OperationType.LIST, path));
}

export async function saveAccessMatrix(matrix: AccessMatrix): Promise<void> {
  const path = `access_matrix/${matrix.id}`;
  try {
    await setDoc(doc(db, "access_matrix", matrix.id), matrix);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function syncAuditLogs(onData: (logs: AuditLog[]) => void) {
  const path = "audit_logs";
  return onSnapshot(query(collection(db, path)), (snapshot) => {
    const logs: AuditLog[] = [];
    snapshot.forEach((doc) => logs.push(doc.data() as AuditLog));
    logs.sort((a, b) => b.timestamp - a.timestamp);
    onData(logs);
  }, (error) => handleFirestoreError(error, OperationType.LIST, path));
}

export async function saveAuditLog(log: AuditLog): Promise<void> {
  const path = `audit_logs/${log.id}`;
  try {
    await setDoc(doc(db, "audit_logs", log.id), log);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveRole(role: Role): Promise<void> {
  const path = `roles/${role.id}`;
  try {
    await setDoc(doc(db, "roles", role.id), role);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteRole(roleId: string): Promise<void> {
  const path = `roles/${roleId}`;
  try {
    await deleteDoc(doc(db, "roles", roleId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function savePermission(permission: Permission): Promise<void> {
  const path = `permissions/${permission.id}`;
  try {
    await setDoc(doc(db, "permissions", permission.id), permission);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePermission(permId: string): Promise<void> {
  const path = `permissions/${permId}`;
  try {
    await deleteDoc(doc(db, "permissions", permId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 10.15. Sentinel Incidents Real-time Sync and Save
export function syncSentinelIncidents(onData: (incidents: any[]) => void) {
  const path = "baheya_sentinel_incidents";
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

export async function saveSentinelIncident(incident: any): Promise<void> {
  const path = `baheya_sentinel_incidents/${incident.id}`;
  try {
    await setDoc(doc(db, "baheya_sentinel_incidents", incident.id), incident);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSentinelIncident(incidentId: string): Promise<void> {
  const path = `baheya_sentinel_incidents/${incidentId}`;
  try {
    await deleteDoc(doc(db, "baheya_sentinel_incidents", incidentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Generic Key-Value Settings Storage
export function syncSetting(key: string, onData: (value: any) => void) {
  const path = "app_settings";
  return onSnapshot(
    doc(db, "app_settings", key),
    (snapshot) => {
      onData(snapshot.exists() ? snapshot.data() : null);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `${path}/${key}`);
    }
  );
}

export async function getSetting(key: string): Promise<any> {
    const docRef = doc(db, "app_settings", key);
    const docSnap = await safeGetDoc(docRef);
    if (docSnap && docSnap.exists()) {
        const data = docSnap.data() as any;
        return data ? data.value : null;
    }
    return null;
}

export async function saveSetting(key: string, value: any): Promise<void> {
    const path = `app_settings/${key}`;
    try {
        await setDoc(doc(db, "app_settings", key), { value });
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
    }
}

// 15. Quality OVRs Sync and Save
export function syncCQIOvrs(onData: (ovrs: any[]) => void) {
  const path = "baheya_cqi_ovrs";
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
  const path = `baheya_cqi_ovrs/${ovr.id}`;
  try {
    await setDoc(doc(db, "baheya_cqi_ovrs", ovr.id), ovr);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCQIOvr(ovrId: string): Promise<void> {
  const path = `baheya_cqi_ovrs/${ovrId}`;
  try {
    await deleteDoc(doc(db, "baheya_cqi_ovrs", ovrId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 16. Staff Evaluation Sync and Save
export function syncCQIStaffEvals(onData: (evals: any[]) => void) {
  const path = "baheya_cqi_staff_evals";
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
  const path = `baheya_cqi_staff_evals/${evaluation.id}`;
  try {
    await setDoc(doc(db, "baheya_cqi_staff_evals", evaluation.id), evaluation);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCQIStaffEval(evalId: string): Promise<void> {
  const path = `baheya_cqi_staff_evals/${evalId}`;
  try {
    await deleteDoc(doc(db, "baheya_cqi_staff_evals", evalId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 17. Unit Inspections Sync and Save
export function syncCQIUnitInspections(onData: (inspections: any[]) => void) {
  const path = "baheya_cqi_unit_inspections";
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
  const path = `baheya_cqi_unit_inspections/${inspection.id}`;
  try {
    await setDoc(doc(db, "baheya_cqi_unit_inspections", inspection.id), inspection);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCQIUnitInspection(inspId: string): Promise<void> {
  const path = `baheya_cqi_unit_inspections/${inspId}`;
  try {
    await deleteDoc(doc(db, "baheya_cqi_unit_inspections", inspId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 18. Policy Signatures Read-Receipt Log
export function syncCQIPolicyAcks(onData: (acks: any[]) => void) {
  const path = "baheya_policy_acks";
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

export async function saveCQIPolicyAck(ack: any): Promise<void> {
  const path = `baheya_policy_acks/${ack.id}`;
  try {
    await setDoc(doc(db, "baheya_policy_acks", ack.id), ack);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCQIPolicyAck(ackId: string): Promise<void> {
  const path = `baheya_policy_acks/${ackId}`;
  try {
    await deleteDoc(doc(db, "baheya_policy_acks", ackId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 19. Clinical Decision Support Simulator Logs
export function syncCQIDecisionLogs(onData: (logs: any[]) => void) {
  const path = "baheya_decision_logs";
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      // Sort descending by timestamp
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveCQIDecisionLog(logData: any): Promise<void> {
  const path = `baheya_decision_logs/${logData.id}`;
  try {
    await setDoc(doc(db, "baheya_decision_logs", logData.id), logData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCQIDecisionLog(logId: string): Promise<void> {
  const path = `baheya_decision_logs/${logId}`;
  try {
    await deleteDoc(doc(db, "baheya_decision_logs", logId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 20. Leave Requests (Real-time)
export function syncLeaveRequests(onData: (data: any[]) => void) {
  const path = "baheya_leave_requests";
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      list.sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveLeaveRequest(req: any): Promise<void> {
  const path = `baheya_leave_requests/${req.id}`;
  try {
    await setDoc(doc(db, "baheya_leave_requests", req.id), req);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteLeaveRequest(id: string): Promise<void> {
  const path = `baheya_leave_requests/${id}`;
  try {
    await deleteDoc(doc(db, "baheya_leave_requests", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 21. Administrative Requests (Real-time)
export function syncAdminRequests(onData: (data: any[]) => void) {
  const path = "baheya_admin_requests";
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      list.sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveAdminRequest(req: any): Promise<void> {
  const path = `baheya_admin_requests/${req.id}`;
  try {
    await setDoc(doc(db, "baheya_admin_requests", req.id), req);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAdminRequest(id: string): Promise<void> {
  const path = `baheya_admin_requests/${id}`;
  try {
    await deleteDoc(doc(db, "baheya_admin_requests", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 22. Daily Duties Assignment (Real-time)
export function syncDailyDuties(onData: (data: any[]) => void) {
  const path = "baheya_daily_duties";
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

export async function saveDailyDuty(duty: any): Promise<void> {
  const path = `baheya_daily_duties/${duty.id}`;
  try {
    await setDoc(doc(db, "baheya_daily_duties", duty.id), duty);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDailyDuty(id: string): Promise<void> {
  const path = `baheya_daily_duties/${id}`;
  try {
    await deleteDoc(doc(db, "baheya_daily_duties", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 23. Daily Emergency Teams Selection (Real-time)
export function syncEmergencyTeams(onData: (data: any[]) => void) {
  const path = "baheya_daily_emergency_teams";
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

export async function saveEmergencyTeam(team: any): Promise<void> {
  const path = `baheya_daily_emergency_teams/${team.id}`;
  try {
    await setDoc(doc(db, "baheya_daily_emergency_teams", team.id), team);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteEmergencyTeam(id: string): Promise<void> {
  const path = `baheya_daily_emergency_teams/${id}`;
  try {
    await deleteDoc(doc(db, "baheya_daily_emergency_teams", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 24. HIS Modules (Real-time)
export function syncPatients(onData: (data: any[]) => void) {
  const path = "baheya_his_patients";
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => list.push(doc.data()));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}
export async function savePatient(patient: any): Promise<void> {
  const path = `baheya_his_patients/${patient.id}`;
  try { await setDoc(doc(db, "baheya_his_patients", patient.id), patient); }
  catch (error) { handleFirestoreError(error, OperationType.WRITE, path); }
}

export function syncPrescriptions(onData: (data: any[]) => void) {
  const path = "baheya_his_prescriptions";
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => list.push(doc.data()));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}
export async function savePrescription(prescription: any): Promise<void> {
  const path = `baheya_his_prescriptions/${prescription.id}`;
  try { await setDoc(doc(db, "baheya_his_prescriptions", prescription.id), prescription); }
  catch (error) { handleFirestoreError(error, OperationType.WRITE, path); }
}

export function syncInvoices(onData: (data: any[]) => void) {
  const path = "baheya_his_invoices";
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => list.push(doc.data()));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}
export async function saveInvoice(invoice: any): Promise<void> {
  const path = `baheya_his_invoices/${invoice.id}`;
  try { await setDoc(doc(db, "baheya_his_invoices", invoice.id), invoice); }
  catch (error) { handleFirestoreError(error, OperationType.WRITE, path); }
}





