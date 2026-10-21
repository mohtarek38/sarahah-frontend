# Sarahah — Frontend

React client for an anonymous messaging app inspired by Sarahah. Users share their profile link, receive anonymous messages, and choose which ones to show publicly.

**Backend:** [sarahah-backend](https://github.com/mohtarek38/sarahah-backend)

## Tech stack

- React 19 (Create React App)
- React Router 7
- DOMPurify for sanitizing user-generated content
- Plain CSS with a light/dark theme

## Features

- Register, confirm email with an OTP, and log in
- Google Sign-In
- Password reset via emailed OTP
- Automatic access-token refresh: when a request fails with an expired token, the app refreshes it once and retries every pending request
- Profile page: edit your info, upload or remove a profile image, and choose which fields are public
- Inbox: read, delete, and show or hide messages on your public profile
- Public profile at `/:userId`, where anyone can send an anonymous message
- Light and dark mode
- Client-side validation that matches the backend rules

## Pages

| Route | Page |
| --- | --- |
| `/login` | Login |
| `/register` | Register |
| `/confirm-email` | Email confirmation |
| `/request-password-reset` | Request a reset code |
| `/reset-password` | Set a new password |
| `/profile` | Your profile and inbox (logged in only) |
| `/:userId` | A user's public profile |

## Project structure

```
src/
├── components/   # Reusable UI: Avatar, EditableField, MessageList, Modal, Toast, ThemeToggle
├── config/       # API base URL and app config
├── contexts/     # Theme context
├── hooks/        # useProfile, useFetchMessages, useImageUpload
├── pages/        # Route pages
└── utils/        # API client with token refresh, validation, date helpers
```

## Getting started

You need the [backend](https://github.com/mohtarek38/sarahah-backend) running first.

```bash
git clone https://github.com/mohtarek38/sarahah-frontend.git
cd sarahah-frontend
npm install
```

Create a `.env` file in the project root:

```
REACT_APP_API_BASE=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

Then run:

```bash
npm start         # development server
npm run build     # production build
```

Make sure the frontend's URL is in the backend's `CORS_WHITELIST`.

## About

Built as part of a backend development course, as the client for the Sarahah API.
