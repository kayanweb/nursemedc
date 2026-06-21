import { Client, Databases } from 'appwrite';
import { DB_PROVIDERS_CONFIG } from './dbConfig';

const config = DB_PROVIDERS_CONFIG.APPWRITE;
const client = new Client();
client.setEndpoint(config.endpoint).setProject(config.projectId);
export const databases = new Databases(client);

// Skeleton for compatibility
export const addDoc = async (coll: string, data: any) => {
    // simplified for Appwrite needing ID
    return await databases.createDocument(config.projectId, coll, 'unique()', data);
};
export const getDocs = async (coll: string) => {
    return await databases.listDocuments(config.projectId, coll);
};
