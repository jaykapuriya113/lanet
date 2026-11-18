# Project Startup Guide

## Backend

1. Open a terminal in `new-job-portal/backend`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the backend server:
   ```bash
   npm run start
   ```

> Make sure the backend `.env` file is configured with valid values before starting.

## Frontend

1. Open a terminal in `new-job-portal/frontend`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend app:
   ```bash
   npm start
   ```

## Notes

- The frontend is configured to proxy API requests to `http://localhost:8000`.
- Start the backend first, then start the frontend.

## Gmail API OAuth setup

- In Google Cloud Console, enable the Gmail API and create OAuth client credentials for a Web application.
- Add this exact Authorized redirect URI to the OAuth client:
  `http://localhost:8000/api/google/oauth/callback`
- Set `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` in `backend/.env`. Optionally set `GOOGLE_OAUTH_REDIRECT_URI` to the exact callback URI; otherwise the backend derives it from `PORT` (default `8000`).
- Start the backend and visit `http://localhost:8000/api/google/oauth` in a browser signed into the Gmail account that will send messages. Grant the Gmail send permission.
- The callback returns a refresh token once. Copy it securely into `GMAIL_OAUTH_REFRESH_TOKEN` in `backend/.env` and restart the backend. Do not commit or share OAuth credentials or tokens.
- The OAuth callback obtains the token but does not change the existing application-status email sender.
