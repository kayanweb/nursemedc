import PocketBase from 'pocketbase';
import { DB_PROVIDERS_CONFIG } from './dbConfig';

const config = DB_PROVIDERS_CONFIG.POCKETBASE;
export const pb = new PocketBase(config.baseUrl);

// Skeleton for compatibility
export const addDoc = async (coll: string, data: any) => {
    return await pb.collection(coll).create(data);
};
export const getDocs = async (coll: string) => {
    return await pb.collection(coll).getList(1, 50);
};
