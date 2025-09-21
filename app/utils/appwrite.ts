// utils/appwrite.ts

import { Client, TablesDB, Account } from "appwrite";

const url: string = import.meta.env.VITE_APPWRITE_ENDPOINT;
const project: string = import.meta.env.VITE_APPWRITE_PROJECT;

const client: Client = new Client();

client.setEndpoint(url).setProject(project);

export const account: Account = new Account(client);
export const tablesDB: TablesDB = new TablesDB(client);
