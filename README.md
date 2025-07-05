# Sunday Setlist PWA

A modern, responsive Progressive Web App (PWA) designed to help church worship teams and service leaders organize and view their Sunday setlists. This application provides a public, view-only interface for all users and a secure, login-protected area for Songleaders and MCs to create, update, and manage setlists.

Built with vanilla HTML, Tailwind CSS, and plain JavaScript, and powered by a Firebase backend for real-time data and authentication.

## ✨ Features

- **Real-Time Updates:** Using Firestore's `onSnapshot` listener, any changes made to a setlist are reflected instantly for all users without needing a page refresh.
- **Enhanced Offline Viewing:** Through a service worker, the app caches all essential files and the latest setlist data. Users can view previously loaded setlists even if they lose their internet connection.
- **Public Viewing:** Anyone can visit the app and instantly see the latest setlist and a history of past setlists.
- **Role-Based Input:** Once logged in, users select their role ("Songleader" or "MC") to see a form tailored to their specific needs.
- **Ordered Categories:** Song categories for both Songleaders and MCs are always displayed in a predefined, logical order.
- **Detailed Song Entries:** Users can input song titles, YouTube/Spotify links, musical key, BPM, lyrics, chords, and sequence/flow notes.
- **View Modals:** On-demand pop-up modals to cleanly display a song's Lyrics, Chords, or Sequence.
- **Sticky Header:** The main header stays fixed to the top for easy access to login/logout buttons while scrolling.
- **Grouped Setlists:** Setlists for the most recent date are grouped together under a "Latest Setlist" heading.
- **Paginated History:** Older setlists are neatly organized into pages to keep the interface clean and fast.
- **Live Search:** Instantly filter all setlists by song title, leader's name, or role.
- **Automatic Dark Mode:** Adapts to the user's system preference for a light or dark theme.
- **Responsive Design:** A mobile-first design that looks great on any device, from phones to desktops.

## 🛠️ Tech Stack

- **Frontend:**
  - HTML5
  - Tailwind CSS
  - Vanilla JavaScript (ES6+)
- **Backend & Database:**
  - Firebase Authentication (for user login)
  - Firestore (as the real-time NoSQL database)
- **PWA:**
  - Web App Manifest (`manifest.json`)
  - Service Worker (`sw.js`)

## 🚀 Setup and Installation

To get this project running on your own system, follow these steps.

### 1. Firebase Project Setup

1. **Create a Firebase Project:** Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. **Add a Web App:** In your project's dashboard, click the web icon (`</>`) to add a new web app. Give it a name and register the app.
3. **Get Firebase Config:** After registering, Firebase will provide you with a `firebaseConfig` object. Copy this object. You will need it for `app.js`.
4. **Enable Authentication:**
   - In the Firebase console, go to **Authentication**.
   - Click the **"Sign-in method"** tab.
   - Enable **Email/Password**.
   - Under **Users**, click **"Add user"** to create Songleader/MC accounts.
5. **Enable Firestore:**
   - Go to **Firestore Database**.
   - Click **"Create database"**, start in **Production mode**.
   - After it's created, go to the **Rules** tab.

### 2. Project Files

1. **Create Folder:** On your local machine, create your project folder.
2. **Add These Files:**
   - `index.html`
   - `app.js`
   - `sw.js`
   - `manifest.json`
   - `src/input.css`
   - `output.css`
3. **Paste Code:** Copy code from your editor or version control.
4. **Insert Firebase Config:** Add your own Firebase credentials to `app.js`.

### 3. Firebase Security Rules

In **Firestore > Rules**, paste the following:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /setlists/{setlistId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

Click **Publish** to apply changes.

### 4. Tailwind Setup via CLI

1. Install Tailwind:
```
npm install -D tailwindcss
npx tailwindcss init
```

2. Update `tailwind.config.js`:
```
module.exports = {
  content: ["./index.html", "./app.js"],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

3. Add to `src/input.css`:
```
@tailwind base;
@tailwind components;
@tailwind utilities;
```

4. Build your styles:
```
npx tailwindcss -i ./src/input.css -o ./output.css --watch
```

Make sure to reference `output.css` in your HTML.

## 👥 Usage

### Viewers

- Can open the app.
- Browse the latest and previous setlists.
- Use the search bar to filter songs by title, leader, or role.
- View lyrics, chords, and sequence details via modals.

### Admins (Songleaders/MCs)

1. Click **Login** and enter credentials.
2. After login, click **Create Setlist**.
3. Choose a role (MC or Songleader).
4. A custom form appears for that role.
5. Add songs with title, links, key, BPM, lyrics, chords, sequence.
6. Admins can also **edit** previously created setlists.
