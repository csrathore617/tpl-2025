/**
 * drive.service.js
 * Google Drive integration layer.
 * When GOOGLE_SERVICE_ACCOUNT_JSON env var is set AND DRIVE_FILE_ID / DRIVE_FOLDER_ID are set,
 * all reads/writes go to Google Drive. Otherwise falls back to local Excel.
 *
 * Setup:
 *  1. Create a Google Cloud project, enable Drive API + Sheets API.
 *  2. Create a Service Account, download JSON key.
 *  3. Share the Drive Excel file (DRIVE_FILE_ID) and images folder (DRIVE_FOLDER_ID)
 *     with the service account email (Editor access).
 *  4. Set env vars:
 *       GOOGLE_SERVICE_ACCOUNT_JSON=<contents of JSON key file, base64 or raw JSON string>
 *       DRIVE_FILE_ID=1Crgw70m9nfN_CaLy-24VUQjHs8cMbw9k
 *       DRIVE_FOLDER_ID=1c124sGpFDaxVbEiKipJTQ1qePNKljW0y
 *
 * IMAGE UPLOADS (creating new files) need real Drive storage quota, which a
 * Service Account does NOT have (Google restriction — "Service Accounts do
 * not have storage quota"). Updating an EXISTING file (the Excel sheet) is
 * fine with a Service Account, but creating NEW files (images) is not,
 * unless the target folder is a Shared Drive owned by a Workspace org.
 * For a normal personal Google account, set these THREE extra env vars
 * (see get-refresh-token.js) to upload images as your own account instead:
 *       OAUTH_CLIENT_ID=...
 *       OAUTH_CLIENT_SECRET=...
 *       OAUTH_REFRESH_TOKEN=...
 * When these are set, image create/delete/list calls use your own account
 * (which has quota); the Service Account is still used for the Excel file.
 */

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const os = require('os');

const DRIVE_FILE_ID = process.env.DRIVE_FILE_ID || '';
const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID || '';
const SA_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '';

const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID || '';
const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET || '';
const OAUTH_REFRESH_TOKEN = process.env.OAUTH_REFRESH_TOKEN || '';
const OAUTH_ENABLED = !!(OAUTH_CLIENT_ID && OAUTH_CLIENT_SECRET && OAUTH_REFRESH_TOKEN);

const DRIVE_ENABLED = !!(DRIVE_FILE_ID && DRIVE_FOLDER_ID && SA_JSON);

let _auth = null;
let _drive = null;
let _oauthDrive = null;

// The drive client used for creating/deleting/listing IMAGES.
// Prefers the OAuth (real-account) client, since only a real account has
// storage quota to create new files. Falls back to the Service Account
// client if OAuth isn't configured (will hit the quota error unless the
// folder is a Shared Drive).
function getImageDrive() {
  if (OAUTH_ENABLED) {
    if (_oauthDrive) return _oauthDrive;
    const oAuth2Client = new google.auth.OAuth2(OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET);
    oAuth2Client.setCredentials({ refresh_token: OAUTH_REFRESH_TOKEN });
    _oauthDrive = google.drive({ version: 'v3', auth: oAuth2Client });
    return _oauthDrive;
  }
  return getDrive();
}

function getAuth() {
  if (_auth) return _auth;
  let creds;
  try {
    const raw = SA_JSON.startsWith('{') ? SA_JSON : Buffer.from(SA_JSON, 'base64').toString('utf8');
    creds = JSON.parse(raw);
  } catch (e) {
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON: ' + e.message);
  }
  _auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/drive']
  });
  _drive = google.drive({ version: 'v3', auth: _auth });
  return _auth;
}

function getDrive() {
  getAuth();
  return _drive;
}

// Retry wrapper for transient errors
async function withRetry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); }
    catch (e) {
      const isRetryable = e.code === 429 || e.code === 503 || (e.message && e.message.includes('ECONNRESET'));
      if (i < retries - 1 && isRetryable) {
        await new Promise(r => setTimeout(r, delay * (i + 1)));
      } else throw e;
    }
  }
}

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const GSHEET_MIME = 'application/vnd.google-apps.spreadsheet';

let _fileMimeCache = null;
async function getFileMimeType() {
  if (_fileMimeCache) return _fileMimeCache;
  const drive = getDrive();
  const res = await withRetry(() => drive.files.get({ fileId: DRIVE_FILE_ID, fields: 'mimeType' }));
  _fileMimeCache = res.data.mimeType;
  return _fileMimeCache;
}

/**
 * Download the Drive Excel file to a temp path and return that path.
 * Works whether DRIVE_FILE_ID points to a real .xlsx file (alt=media)
 * or a native Google Sheet (must use files.export instead).
 * Caller is responsible for cleanup.
 */
async function downloadExcelToTemp() {
  if (!DRIVE_ENABLED) return null;
  const drive = getDrive();
  const tmpPath = path.join(os.tmpdir(), `tpl2026_${Date.now()}.xlsx`);
  const dest = fs.createWriteStream(tmpPath);
  const mimeType = await getFileMimeType();
  await withRetry(async () => {
    const res = mimeType === GSHEET_MIME
      ? await drive.files.export(
          { fileId: DRIVE_FILE_ID, mimeType: XLSX_MIME },
          { responseType: 'stream' }
        )
      : await drive.files.get(
          { fileId: DRIVE_FILE_ID, alt: 'media' },
          { responseType: 'stream' }
        );
    await new Promise((resolve, reject) => {
      res.data.pipe(dest);
      res.data.on('end', resolve);
      res.data.on('error', reject);
    });
  });
  return tmpPath;
}

/**
 * Upload a local file to Drive, replacing the existing file content.
 */
async function uploadExcelToDrive(localPath) {
  if (!DRIVE_ENABLED) return;
  const drive = getDrive();
  await withRetry(() => drive.files.update({
    fileId: DRIVE_FILE_ID,
    media: { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', body: fs.createReadStream(localPath) }
  }));
}

/**
 * Upload an image buffer/stream to the Drive images folder.
 * Returns { id, webViewLink, webContentLink } of the created file.
 */
async function uploadImageToDrive(fileBuffer, filename, mimeType) {
  if (!DRIVE_ENABLED) return null;
  const drive = getImageDrive();
  const { Readable } = require('stream');
  const stream = Readable.from(fileBuffer);
  const res = await withRetry(() => drive.files.create({
    requestBody: { name: filename, parents: [DRIVE_FOLDER_ID] },
    media: { mimeType, body: stream },
    fields: 'id,webViewLink,webContentLink'
  }));
  // Make publicly viewable
  await withRetry(() => drive.permissions.create({
    fileId: res.data.id,
    requestBody: { role: 'reader', type: 'anyone' }
  }));
  return res.data;
}

/**
 * Delete a file from Drive by its file ID.
 */
async function deleteImageFromDrive(fileId) {
  if (!DRIVE_ENABLED || !fileId) return;
  const drive = getImageDrive();
  await withRetry(() => drive.files.delete({ fileId })).catch(e => console.error('Drive delete error:', e.message));
}

/**
 * List all files in the Drive images folder.
 */
async function listDriveImages() {
  if (!DRIVE_ENABLED) return [];
  const drive = getImageDrive();
  const res = await withRetry(() => drive.files.list({
    q: `'${DRIVE_FOLDER_ID}' in parents and trashed=false`,
    fields: 'files(id,name,mimeType,size,createdTime,webViewLink,webContentLink)',
    pageSize: 1000
  }));
  return res.data.files || [];
}

/**
 * Get a public image URL from a Drive file ID.
 * The old `uc?export=view` format is unreliable for direct <img> embedding
 * (Google often shows a warning/redirect page instead of the raw image).
 * The `thumbnail` endpoint is Google's own recommended way to hotlink
 * Drive images and works reliably in <img> tags, provided the file has
 * "anyone with the link" reader access (uploadImageToDrive already sets
 * this on every upload).
 */
function getDriveImageUrl(fileId) {
  if (!fileId) return '';
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
}

module.exports = {
  DRIVE_ENABLED,
  OAUTH_ENABLED,
  downloadExcelToTemp,
  uploadExcelToDrive,
  uploadImageToDrive,
  deleteImageFromDrive,
  listDriveImages,
  getDriveImageUrl
};