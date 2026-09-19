/**
 * get-refresh-token.js
 * ONE-TIME helper script. Run this once on your own computer to get an
 * OAUTH_REFRESH_TOKEN for your own Google account, so image uploads use
 * YOUR account's storage quota instead of the Service Account (which has
 * none — see the note at the top of drive.service.js).
 *
 * USAGE:
 *   1. In Google Cloud Console (same project as your Service Account):
 *      APIs & Services > Credentials > Create Credentials > OAuth client ID
 *      Application type: "Desktop app". Give it any name.
 *      Copy the Client ID and Client Secret it gives you.
 *   2. Set them below (or as env vars OAUTH_CLIENT_ID / OAUTH_CLIENT_SECRET).
 *   3. Run:  node get-refresh-token.js
 *   4. It prints a URL. Open it in your browser, log in with the SAME
 *      Google account that owns the images Drive folder, click Allow.
 *   5. You'll be redirected to a localhost URL that fails to load —
 *      that's fine. Copy the "code" value from that URL's address bar.
 *   6. Paste the code back into this terminal when asked.
 *   7. It prints OAUTH_REFRESH_TOKEN=... — copy that whole line into
 *      your server/.env file, along with OAUTH_CLIENT_ID and
 *      OAUTH_CLIENT_SECRET.
 */

const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = process.env.OAUTH_CLIENT_ID || 'PASTE_YOUR_CLIENT_ID_HERE';
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET || 'PASTE_YOUR_CLIENT_SECRET_HERE';
const REDIRECT_URI = 'https://tpl-2025.onrender.com/oauth2callback';

if (CLIENT_ID.includes('PASTE_') || CLIENT_SECRET.includes('PASTE_')) {
  console.error('Edit get-refresh-token.js and set CLIENT_ID / CLIENT_SECRET first (or pass as env vars).');
  process.exit(1);
}

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/drive']
});

console.log('\n1. Open this URL in your browser and log in with the Google account\n   that owns your Drive images folder:\n');
console.log(authUrl);
console.log('\n2. After clicking Allow, the browser will try to open a localhost\n   page that fails to load. That is expected — just copy the "code="\n   value from that page\'s URL.\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Paste the code here: ', async (code) => {
  rl.close();
  try {
    const { tokens } = await oAuth2Client.getToken(code.trim());
    console.log('\nSuccess! Add these lines to your server/.env file:\n');
    console.log(`OAUTH_CLIENT_ID=${CLIENT_ID}`);
    console.log(`OAUTH_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
    if (!tokens.refresh_token) {
      console.log('\nNo refresh_token returned — this usually means you already\nauthorized this app before. Go to https://myaccount.google.com/permissions,\nremove access for this app, and run this script again.');
    }
  } catch (e) {
    console.error('Error exchanging code for tokens:', e.message);
  }
});
