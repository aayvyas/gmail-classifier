import fs from 'fs/promises';
import path from 'path';
import { authenticate } from '@google-cloud/local-auth';
import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist(): Promise<OAuth2Client | null> {
    try {
        const content = await fs.readFile(TOKEN_PATH, 'utf-8');
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials) as OAuth2Client;
    } catch (err) {
        return null;
    }
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client: OAuth2Client): Promise<void> {
    const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
export async function authorize(): Promise<OAuth2Client> {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    }) as any as OAuth2Client;
    if (client && client.credentials) {
        await saveCredentials(client);
    }
    return client!;
}

export async function listUnreadMessages(auth: OAuth2Client): Promise<gmail_v1.Schema$Message[]> {
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread',
        maxResults: 10, // Process 10 at a time to avoid rate limits/overload
    });
    return res.data.messages || [];
}

export async function getMessage(auth: OAuth2Client, id: string): Promise<gmail_v1.Schema$Message> {
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.messages.get({
        userId: 'me',
        id: id,
        format: 'full',
    });
    return res.data;
}

export async function getLabelId(auth: OAuth2Client, labelName: string): Promise<string | null> {
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.labels.list({
        userId: 'me',
    });
    const label = res.data.labels?.find((l) => l.name?.toLowerCase() === labelName.toLowerCase());
    return label?.id || null;
}

export async function createLabel(auth: OAuth2Client, labelName: string): Promise<string> {
    const existingId = await getLabelId(auth, labelName);
    if (existingId) return existingId;

    const gmail = google.gmail({ version: 'v1', auth });
    try {
        const res = await gmail.users.labels.create({
            userId: 'me',
            requestBody: {
                name: labelName,
                labelListVisibility: 'labelShow',
                messageListVisibility: 'show',
            },
        });
        return res.data.id!;
    } catch (error: any) {
        if (error.code === 409) {
            // Label might have been created concurrently or exists with different casing
            const id = await getLabelId(auth, labelName);
            if (id) return id;
        }
        throw error;
    }
}

export async function modifyMessage(
    auth: OAuth2Client,
    id: string,
    addLabelIds: string[],
    removeLabelIds: string[] = []
): Promise<void> {
    const gmail = google.gmail({ version: 'v1', auth });
    await gmail.users.messages.modify({
        userId: 'me',
        id: id,
        requestBody: {
            addLabelIds,
            removeLabelIds,
        },
    });
}

export function getEmailBody(message: gmail_v1.Schema$Message): string {
    let body = '';
    if (message.payload?.parts) {
        for (const part of message.payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
                body += Buffer.from(part.body.data, 'base64').toString('utf-8');
            }
        }
    } else if (message.payload?.body?.data) {
        body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    }
    return body || message.snippet || '';
}
