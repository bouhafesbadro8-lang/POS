import { Client, Databases, Account } from 'appwrite';

const client = new Client();

client
    .setEndpoint('https://fra.cloud.appwrite.io/v1') // أو الـ Endpoint الخاص بك
    .setProject('6a6df7ea003674a43112'); 

export const databases = new Databases(client);
export const account = new Account(client);
export default client;