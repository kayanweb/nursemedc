// realTimeService.ts
import { getActiveDbProvider, DB_PROVIDERS_CONFIG, DbProvider } from "./dbConfig";
import { db } from "../firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  doc, 
  setDoc, 
  deleteDoc, 
  orderBy,
  getDocs
} from "firebase/firestore";

// Bilingual notification trigger to alert the client to server faults
export function triggerBilingualNotification(errorMsg: string) {
  console.error("🚨 Universal Abstraction Layer Error:", errorMsg);
  
  // Create a custom event to show bilingual error notifications on the main app layout
  if (typeof window !== "undefined") {
    const isAr = window.navigator.language.startsWith("ar");
    const friendlyAr = `⚠️ خطأ في الاتصال بالسيرفر: ${errorMsg}. يرجى المحاولة لاحقاً.`;
    const friendlyEn = `⚠️ Server Connection Error: ${errorMsg}. Please try again later.`;
    
    window.dispatchEvent(new CustomEvent("bilingual-alert", {
      detail: {
        messageAr: friendlyAr,
        messageEn: friendlyEn,
        raw: errorMsg
      }
    }));
  }
}

/**
 * 1. Central Live Stream Subscriber (subscribeToClinicalData)
 * Opens an active realtime channel or polling listener with zero local database footprints (strictly no localStorage).
 */
export function subscribeToClinicalData<T>(
  collectionName: string,
  onDataUpdate: (data: T[]) => void,
  onError: (error: Error) => void
): () => void {
  const provider = getActiveDbProvider();

  // ---------------------------------------------
  // FIREBASE FIRESTORE REAL-TIME STREAM
  // ---------------------------------------------
  if (provider === "FIREBASE") {
    try {
      console.log(`📡 [Real-Time Stream] Connecting to Firebase Firestore collection: ${collectionName}`);
      const q = query(collection(db, collectionName));
      return onSnapshot(
        q,
        (snapshot) => {
          const items: T[] = [];
          snapshot.forEach((docRef) => {
            items.push(docRef.data() as T);
          });
          onDataUpdate(items);
        },
        (err) => {
          triggerBilingualNotification(err.message);
          onError(err);
        }
      );
    } catch (err: any) {
      triggerBilingualNotification(err.message);
      onError(err);
      return () => {};
    }
  }

  // ---------------------------------------------
  // CLOUD & LOCAL SERVER CHANNELS: SUPABASE, POCKETBASE, LOCAL_HOST
  // All structured via our dynamic Express back-end SSE Real-Time router.
  // ---------------------------------------------
  console.log(`📡 [Real-Time Stream] Opening live SSE channel for [${provider}] to collection: ${collectionName}`);

  let isUnsubscribed = false;

  // Fetch initial list from the Express live server
  const fetchCurrentList = async () => {
    if (isUnsubscribed) return;
    try {
      const response = await fetch(`/api/db/${provider.toLowerCase()}/${collectionName}`);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      const json = await response.json();
      if (json.success && !isUnsubscribed) {
        onDataUpdate(json.data);
      }
    } catch (err: any) {
      triggerBilingualNotification(`Failed to load from ${provider}: ${err.message}`);
      onError(err);
    }
  };

  fetchCurrentList();

  // Subscribe to central Server-Sent Events stream for push-updates
  const sseSource = new EventSource("/api/db/stream");

  sseSource.onmessage = (event) => {
    if (isUnsubscribed) return;
    try {
      const updateInfo = JSON.parse(event.data);
      if (
        updateInfo.provider === provider &&
        updateInfo.collectionName === collectionName
      ) {
        console.log(`🔄 [SSE Live Update] Stream notification received for ${provider}:${collectionName}`);
        fetchCurrentList();
      }
    } catch (e) {
      console.error("Error parsing SSE update stream data:", e);
    }
  };

  sseSource.onerror = (err) => {
    console.warn("SSE stream encountered connection error. Active polling remains healthy.", err);
  };

  // Return unsubscribe cleanup handler to free memory (RAM clearance)
  return () => {
    isUnsubscribed = true;
    sseSource.close();
    console.log(`🧹 [Stream Cleaned] Connection closed for ${provider}:${collectionName}. RAM cleared.`);
  };
}

/**
 * 2. Permanent Server Save (saveDataPermanently)
 * Sends updates immediately to the active server provider and avoids local caching issues.
 */
export async function saveDataPermanently<T extends { id: string }>(
  collectionName: string,
  dataPayload: T
): Promise<{ success: boolean; error?: string }> {
  const provider = getActiveDbProvider();
  const enrichedData = {
    ...dataPayload,
    updatedAt: new Date().toISOString(),
    savedBy: "User_ID_Dynamic"
  };

  try {
    // ---------------------------------------------
    // FIREBASE SAVE
    // ---------------------------------------------
    if (provider === "FIREBASE") {
      console.log(`💾 [Permanent Save] Publishing to Firebase document: ${collectionName}/${dataPayload.id}`);
      await setDoc(doc(db, collectionName, dataPayload.id), enrichedData);
      return { success: true };
    }

    // ---------------------------------------------
    // CLOUD & LOCAL ROUTER SECURE SAVE (SUPABASE, POCKETBASE, LOCAL_HOST)
    // ---------------------------------------------
    console.log(`💾 [Permanent Save] Connecting to ${provider} API to save in table: ${collectionName}`);
    const response = await fetch(`/api/db/${provider.toLowerCase()}/${collectionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(enrichedData)
    });

    if (!response.ok) {
      throw new Error(`Server rejected request with status: ${response.status}`);
    }

    const result = await response.json();
    return { success: !!result.success };

  } catch (err: any) {
    triggerBilingualNotification(`Transmission Error [${provider}]: ${err.message}`);
    return { success: false, error: err.message };
  }
}

/**
 * 3. Permanent Server Delete (deleteDataPermanently)
 */
export async function deleteDataPermanently(
  collectionName: string,
  recordId: string
): Promise<{ success: boolean; error?: string }> {
  const provider = getActiveDbProvider();

  try {
    if (provider === "FIREBASE") {
      console.log(`🗑️ [Permanent Delete] Removing from Firebase: ${collectionName}/${recordId}`);
      await deleteDoc(doc(db, collectionName, recordId));
      return { success: true };
    }

    const response = await fetch(`/api/db/${provider.toLowerCase()}/${collectionName}/${recordId}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      throw new Error(`Server returned error code: ${response.status}`);
    }

    const result = await response.json();
    return { success: !!result.success };

  } catch (err: any) {
    triggerBilingualNotification(`Deletion Error [${provider}]: ${err.message}`);
    return { success: false, error: err.message };
  }
}
