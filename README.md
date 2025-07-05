# Sunday Setlist PWA

A modern, responsive Progressive Web App (PWA) designed to help church worship teams and service leaders organize and view their Sunday setlists. This application provides a public, view-only interface for all users and a secure, login-protected area for Songleaders and MCs to create, update, and manage setlists.

Built with vanilla HTML, Tailwind CSS, and plain JavaScript, and powered by a Firebase backend for real-time data and authentication.

## ✨ Features

* **Public Viewing:** Anyone can visit the app and instantly see the latest setlist and a history of past setlists.
* **Admin Login:** A secure login system for authorized users (managed via Firebase Authentication).
* **Role-Based Input:** Once logged in, users select their role ("Songleader" or "MC") to see a form tailored to their specific needs.
* **Detailed Song Entries:** Users can input song titles, YouTube/Spotify links, musical key, BPM, lyrics, chords, and sequence/flow notes.
* **View Modals:** On-demand pop-up modals to cleanly display a song's Lyrics, Chords, or Sequence.
* **Sticky Header:** The main header stays fixed to the top for easy access to login/logout buttons while scrolling.
* **Grouped Setlists:** Setlists for the most recent date are grouped together under a "Latest Setlist" heading.
* **Paginated History:** Older setlists are neatly organized into pages to keep the interface clean and fast.
* **Live Search:** Instantly filter all setlists by song title, leader's name, or role.
* **Dark Mode:** Automatically adapts to the user's system preference for a light or dark theme.
* **Responsive Design:** A mobile-first design that looks great on any device, from phones to desktops.

## 🛠️ Tech Stack

* **Frontend:**
    * HTML5
    * Tailwind CSS
    * Vanilla JavaScript (ES6+)
* **Backend & Database:**
    * Firebase Authentication (for user login)
    * Firestore (as the real-time NoSQL database)
* **PWA:**
    * Web App Manifest (`manifest.json`)

## 🚀 Setup and Installation

To get this project running on your own system, follow these steps.

### 1. Firebase Project Setup

1.  **Create a Firebase Project:** Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Add a Web App:** In your project's dashboard, click the web icon (`</>`) to add a new web app. Give it a name and register the app.
3.  **Get Firebase Config:** After registering, Firebase will provide you with a `firebaseConfig` object. Copy this object. You will need it for `app.js`.
4.  **Enable Authentication:**
    * In the Firebase console, go to **Authentication** (under the "Build" menu).
    * Click the **"Sign-in method"** tab.
    * Select **"Email/Password"** and enable it.
    * Go to the **"Users"** tab and click **"Add user"** to create login accounts for your Songleaders and MCs.
5.  **Enable Firestore:**
    * Go to **Firestore Database** (under the "Build" menu).
    * Click **"Create database"**.
    * Start in **Production mode**. Choose a location closest to you.
    * After the database is created, go to the **"Rules"** tab.

### 2. Project Files

1.  **Create Project Folder:** Create a folder for your project on your local machine.
2.  **Create Files:** Inside the folder, create the following files:
    * `index.html`
    * `app.js`
    * `manifest.json`
3.  **Paste Code:** Copy the code from the provided files into your newly created files.
4.  **Add Firebase Config to `app.js`:** Open your `app.js` file and replace the placeholder `firebaseConfig` object with the one you copied from your Firebase project.

### 3. Firebase Security Rules

In the **Firestore Database > Rules** tab of your Firebase console, replace the default rules with the following to allow public reads but restrict writes to authenticated owners:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /setlists/{setlistId} {
      // Allow anyone to read the setlists
      allow read: if true;

      // Only allow authenticated users to create, update, or delete
      // documents where their UID matches the document's userId field.
      allow write: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}