document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIG & INITIALIZATION ---
  const firebaseConfig = {
    apiKey: "AIzaSyACcxwLCgoyCcLONNaFA0G_CpsABgCO8Fg",
    authDomain: "sunday-setlist-deb5e.firebaseapp.com",
    projectId: "sunday-setlist-deb5e",
    storageBucket: "sunday-setlist-deb5e.appspot.com",
    messagingSenderId: "942822009419",
    appId: "1:942822009419:web:3cbc262145d5bd0918bbce"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const auth = firebase.auth();
  const db = firebase.firestore();

  // ✅ Enable offline data persistence
  firebase.firestore().enablePersistence()
    .then(() => {
      console.log('✅ Firestore persistence enabled');
    })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('⚠️ Persistence failed: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('⚠️ Persistence is not supported in this browser');
      }
    });

    // --- 2. DOM ELEMENT REFERENCES ---
    const offlineIndicator = document.getElementById('offline-indicator');
    const searchBar = document.getElementById('search-bar');
    const loginNavBtn = document.getElementById('login-nav-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const createSetlistBtn = document.getElementById('create-setlist-btn');
    const loginModal = document.getElementById('login-modal');
    const closeLoginModalBtn = document.getElementById('close-login-modal-btn');
    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');
    const lyricsModal = document.getElementById('lyrics-modal');
    const closeLyricsModalBtn = document.getElementById('close-lyrics-modal-btn');
    const lyricsSongName = document.getElementById('lyrics-song-name');
    const lyricsContent = document.getElementById('lyrics-content');
    const sequenceModal = document.getElementById('sequence-modal');
    const closeSequenceModalBtn = document.getElementById('close-sequence-modal-btn');
    const sequenceSongName = document.getElementById('sequence-song-name');
    const sequenceContent = document.getElementById('sequence-content');
    const chordsModal = document.getElementById('chords-modal');
    const closeChordsModalBtn = document.getElementById('close-chords-modal-btn');
    const chordsSongName = document.getElementById('chords-song-name');
    const chordsContent = document.getElementById('chords-content');
    const setlistFormContainer = document.getElementById('setlist-form-container');
    const setlistPreviews = document.getElementById('setlist-previews');
    const latestSetlistContainer = document.getElementById('latest-setlist-container');
    const historySetlistsContainer = document.getElementById('history-setlists-container');
    const paginationContainer = document.getElementById('pagination-container');

    // --- 3. GLOBAL VARIABLES ---
    let allSetlists = [];
    let currentUser = null;
    let currentSetlistId = null;
    let currentPage = 1;
    const itemsPerPage = 6;
    const songCategories = {
        Songleader: ['Joyful Songs', 'Solemn Songs'],
        MC: ['Devotion Songs', 'Opening Songs', 'Welcome Song', 'Songs for Visitors', 'Special Song', 'Giving Song', 'Pre-Songleading Song']
    };

    // --- 4. FUNCTION DECLARATIONS ---

    function showModal(modal) { modal.classList.add('is-visible'); }
    function hideModal(modal) { modal.classList.remove('is-visible'); }
    
    function handleNetworkChange() {
        if (navigator.onLine) {
            offlineIndicator.classList.add('hidden');
            listenForSetlists(); // Re-establish listener when online
        } else {
            offlineIndicator.classList.remove('hidden');
            // Attempt to load from cache
            caches.match('setlists-data').then(response => {
                if (response) {
                    response.json().then(data => {
                        allSetlists = data;
                        renderSetlists(allSetlists);
                    });
                }
            });
        }
    }

    function listenForSetlists() {
        db.collection('setlists').orderBy('date', 'desc').limit(100)
          .onSnapshot(snapshot => {
            allSetlists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Cache the fresh data
            if ('caches' in window) {
                const responseToCache = new Response(JSON.stringify(allSetlists));
                caches.open('setlist-data-cache-v1').then(cache => {
                    cache.put('setlists-data', responseToCache);
                });
            }
            
            renderSetlists(allSetlists);
        }, error => {
            console.error("Firestore listener error: ", error);
            handleNetworkChange(); // Handle error as being offline
        });
    }

    let isFirstLoad = true; // Add this once in the global scope

    function renderSetlists(setlists) {
        const loader = document.getElementById('setlist-loader');
        if (loader) loader.classList.add('hidden'); // hide spinner after data is received

        latestSetlistContainer.innerHTML = '';
        historySetlistsContainer.innerHTML = '';
        paginationContainer.innerHTML = '';

        if (setlists.length === 0) {
            if (!isFirstLoad) {
                const message = searchBar.value
                    ? 'No matching setlists found.'
                    : 'No setlist yet. Login to create one!';
                latestSetlistContainer.innerHTML = `
                    <div class="text-center bg-white dark:bg-slate-800 p-8 rounded-lg shadow-sm">
                        <h2 class="text-xl font-bold text-slate-700 dark:text-slate-200">${message}</h2>
                    </div>`;
            }
            return;
        }

        isFirstLoad = false; // only set to false after we have received real data

        const latestDate = setlists[0].date;
        const latestSetlists = setlists.filter(s => s.date === latestDate);
        const historySetlists = setlists.filter(s => s.date !== latestDate);

        if (latestSetlists.length > 0) {
            let latestHTML = `<h2 class="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">Latest Setlist (${new Date(latestDate + 'T00:00:00').toDateString()})</h2><div class="grid grid-cols-1 md:grid-cols-2 gap-6">`;
            latestSetlists.forEach(setlist => {
                latestHTML += renderSetlistCard(setlist.id, setlist);
            });
            latestSetlistContainer.innerHTML = latestHTML + '</div>';
        }

        if (historySetlists.length > 0) {
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedHistory = historySetlists.slice(startIndex, endIndex);

            let historyHTML = `<h2 class="text-2xl font-bold mt-12 mb-4 text-slate-800 dark:text-slate-200">History</h2><div class="grid grid-cols-1 md:grid-cols-2 gap-6">`;
            paginatedHistory.forEach(setlist => {
                historyHTML += renderSetlistCard(setlist.id, setlist);
            });
            historySetlistsContainer.innerHTML = historyHTML + '</div>';

            renderPaginationControls(historySetlists.length);
        }
    }
    
    function renderPaginationControls(totalHistoryItems) {
        const totalPages = Math.ceil(totalHistoryItems / itemsPerPage);
        if (totalPages <= 1) return;

        const prevDisabled = currentPage === 1 ? 'disabled' : '';
        const nextDisabled = currentPage === totalPages ? 'disabled' : '';

        paginationContainer.innerHTML = `
            <button ${prevDisabled} class="prev-page-btn bg-white dark:bg-slate-700 px-4 py-2 rounded-md font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">&laquo; Previous</button>
            <span class="font-semibold text-slate-700 dark:text-slate-300">Page ${currentPage} of ${totalPages}</span>
            <button ${nextDisabled} class="next-page-btn bg-white dark:bg-slate-700 px-4 py-2 rounded-md font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">Next &raquo;</button>
        `;
    }

    function renderSetlistCard(id, setlist) {
        let songsHTML = '<div class="mt-4 space-y-3">';
        const orderedCategories = songCategories[setlist.role] || Object.keys(setlist.songs);

        orderedCategories.forEach(category => {
            if (setlist.songs[category]?.length > 0) {
                songsHTML += `<div><h4 class="font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-1 mb-2">${category}</h4><ul class="space-y-1 text-slate-600 dark:text-slate-400">`;
                setlist.songs[category].forEach(song => {
                    const keyBpmInfo = song.key || song.bpm ? `<span class="text-xs text-slate-400 dark:text-slate-500"> (Key: ${song.key || 'N/A'}, ${song.bpm || 'N/A'} BPM)</span>` : '';
                    const sanitizedLyrics = song.lyrics ? song.lyrics.replace(/"/g, '&quot;').replace(/'/g, '&#39;') : '';
                    const sanitizedSequence = song.sequence ? song.sequence.replace(/"/g, '&quot;').replace(/'/g, '&#39;') : '';
                    const sanitizedChords = song.chords ? song.chords.replace(/"/g, '&quot;').replace(/'/g, '&#39;') : '';
                    const lyricsButton = song.lyrics ? `<button class="view-lyrics-btn text-sm font-semibold text-sky-600 hover:text-sky-800 dark:text-sky-500 dark:hover:text-sky-400 transition" data-song-name="${song.name}" data-lyrics="${sanitizedLyrics}">View Lyrics</button>` : '';
                    const sequenceButton = song.sequence ? `<button class="view-sequence-btn text-sm font-semibold text-purple-600 hover:text-purple-800 dark:text-purple-500 dark:hover:text-purple-400 transition" data-song-name="${song.name}" data-sequence="${sanitizedSequence}">View Sequence</button>` : '';
                    const chordsButton = song.chords ? `<button class="view-chords-btn text-sm font-semibold text-green-600 hover:text-green-800 dark:text-green-500 dark:hover:text-green-400 transition" data-song-name="${song.name}" data-chords="${sanitizedChords}">View Chords</button>` : '';
                    const link = song.url ? `<a href="${song.url}" target="_blank" class="text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-400 transition">Open Link</a>` : '';
                    songsHTML += `<li class="flex flex-wrap items-center justify-between p-1 gap-x-4"><span>${song.name}${keyBpmInfo}</span><div class="flex items-center gap-4">${link}${chordsButton}${sequenceButton}${lyricsButton}</div></li>`;
                });
                songsHTML += '</ul></div>';
            }
        });
        songsHTML += '</div>';

        const canEdit = currentUser && currentUser.uid === setlist.userId;
        const editButton = canEdit ? `<button data-id="${id}" class="edit-btn text-sm bg-amber-500 text-white py-1 px-3 rounded-md hover:bg-amber-600 font-semibold transition">Edit</button>` : '';
        return `<div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md"><div class="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3"><div class="pr-4"> <p class="font-bold text-lg text-slate-800 dark:text-slate-100">${new Date(setlist.date + 'T00:00:00').toDateString()}</p><p class="text-slate-500 dark:text-slate-400 text-sm">by ${setlist.userName} (${setlist.role})</p></div><div class="flex gap-2 flex-shrink-0">${editButton}</div></div>${songsHTML}</div>`;
    }

    function renderForm(role, data = {}) {
        currentSetlistId = data.id || null;
        const orderedCategories = songCategories[role];
        let formHTML = `<div class="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 space-y-6"><input type="hidden" id="form-role" value="${role}"><div class="grid md:grid-cols-2 gap-4"><input type="text" id="user-name" placeholder="Your Name" class="w-full p-3 bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" value="${data.userName || ''}"><input type="date" id="setlist-date" class="w-full p-3 bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" value="${data.date || new Date().toISOString().slice(0, 10)}"></div><div id="songs-container" class="space-y-6"></div><div class="flex gap-4 mt-6"><button id="save-setlist-btn" class="w-full bg-sky-600 text-white p-3 rounded-lg hover:bg-sky-700 font-bold transition">${currentSetlistId ? 'Update Setlist' : 'Save Setlist'}</button><button id="cancel-btn" class="w-full bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-100 p-3 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500 font-bold transition">Cancel</button></div></div>`;
        setlistFormContainer.innerHTML = formHTML;
        const songsContainer = document.getElementById('songs-container');
        orderedCategories.forEach(cat => {
            const catId = cat.replace(/\s+/g, '-');
            const songsData = (data.songs && data.songs[cat]) ? data.songs[cat] : [{}];
            songsContainer.innerHTML += `<fieldset class="border border-slate-200 dark:border-slate-700 p-4 rounded-lg"><legend class="font-bold px-2 text-slate-600 dark:text-slate-300">${cat}</legend><div id="${catId}-list" class="space-y-4"></div><button type="button" data-catid="${catId}" class="add-song-btn mt-4 text-sky-600 dark:text-sky-500 font-semibold">+ Add Another Song</button></fieldset>`;
            songsData.forEach(song => addSongInput(catId, song, role));
        });
    }

    function addSongInput(catId, song = {}, role) {
        const isSongleader = role === 'Songleader';
        const songList = document.getElementById(catId + '-list');
        const songDiv = document.createElement('div');
        songDiv.className = 'song-entry p-3 bg-slate-100 dark:bg-slate-900/50 rounded-md border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-3';
        songDiv.innerHTML = `
            <input type="text" class="song-name w-full p-2 bg-white dark:bg-slate-700 border rounded" placeholder="Song Title" value="${song.name || ''}">
            <input type="url" class="song-url w-full p-2 bg-white dark:bg-slate-700 border rounded" placeholder="YouTube/Spotify URL (Optional)" value="${song.url || ''}">
            <input type="text" class="song-key w-full p-2 bg-white dark:bg-slate-700 border rounded" placeholder="Key (e.g., G)" value="${song.key || ''}">
            <input type="number" class="song-bpm w-full p-2 bg-white dark:bg-slate-700 border rounded" placeholder="BPM (e.g., 120)" value="${song.bpm || ''}">
            ${isSongleader ? `<textarea class="song-sequence w-full p-2 bg-white dark:bg-slate-700 border rounded md:col-span-2" rows="3" placeholder="Sequence/Flow/Notes (Optional)">${song.sequence || ''}</textarea>` : ''}
            <textarea class="song-lyrics w-full p-2 bg-white dark:bg-slate-700 border rounded md:col-span-2" rows="4" placeholder="Lyrics (Optional)">${song.lyrics || ''}</textarea>
            <textarea class="song-chords w-full p-2 bg-white dark:bg-slate-700 border rounded md:col-span-2" rows="4" placeholder="Chords (Optional)">${song.chords || ''}</textarea>
        `;
        songList.appendChild(songDiv);
    }
    
    function renderRoleSelection() {
        setlistFormContainer.innerHTML = `<section class="text-center bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700"><h2 class="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">Select Your Role</h2><div class="flex flex-col sm:flex-row justify-center gap-4"><button data-role="Songleader" class="role-btn bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition shadow">Songleader</button><button data-role="MC" class="role-btn bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition shadow">MC</button></div></section>`;
    }

    function saveSetlist() {
        if (!currentUser) { return alert("You must be logged in to save a setlist."); }
        const role = document.getElementById('form-role').value;
        const setlistData = {
            userId: currentUser.uid,
            userName: document.getElementById('user-name').value,
            date: document.getElementById('setlist-date').value,
            role: role,
            songs: {},
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (!setlistData.userName || !setlistData.date) { return alert('Please fill in your name and the date.'); }
        const orderedCategories = songCategories[role];
        orderedCategories.forEach(cat => {
            const catId = cat.replace(/\s+/g, '-');
            setlistData.songs[cat] = [];
            const songEntries = document.querySelectorAll(`#${catId}-list .song-entry`);
            songEntries.forEach(entry => {
                const name = entry.querySelector('.song-name').value;
                if (name) {
                    setlistData.songs[cat].push({
                        name: name,
                        url: entry.querySelector('.song-url').value,
                        key: entry.querySelector('.song-key').value,
                        bpm: entry.querySelector('.song-bpm').value,
                        lyrics: entry.querySelector('.song-lyrics').value,
                        chords: entry.querySelector('.song-chords').value,
                        sequence: entry.querySelector('.song-sequence') ? entry.querySelector('.song-sequence').value : null
                    });
                }
            });
        });
        const operation = currentSetlistId ? db.collection('setlists').doc(currentSetlistId).set(setlistData, { merge: true }) : db.collection('setlists').add(setlistData);
        operation.then(() => {
            alert(`Setlist ${currentSetlistId ? 'updated' : 'saved'}!`);
            setlistFormContainer.classList.add('hidden');
            setlistPreviews.classList.remove('hidden');
        }).catch(error => { console.error("Error saving setlist: ", error); });
    }

    // --- 5. EVENT LISTENERS & INITIALIZATION ---
    auth.onAuthStateChanged(user => {
        currentUser = user;
        if (user) {
            loginNavBtn.classList.add('hidden');
            logoutBtn.classList.remove('hidden');
            createSetlistBtn.classList.remove('hidden');
            hideModal(loginModal);
        } else {
            loginNavBtn.classList.remove('hidden');
            logoutBtn.classList.add('hidden');
            createSetlistBtn.classList.add('hidden');
            setlistFormContainer.classList.add('hidden');
            setlistPreviews.classList.remove('hidden');
        }
        renderSetlists(allSetlists);
    });

    // Initial load
    handleNetworkChange();

    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    searchBar.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        currentPage = 1;
        const filteredSetlists = allSetlists.filter(setlist => {
            const searchCorpus = [setlist.userName, setlist.role, ...Object.values(setlist.songs).flat().map(s => s.name)].join(' ').toLowerCase();
            return searchCorpus.includes(query);
        });
        renderSetlists(filteredSetlists);
    });

    loginNavBtn.addEventListener('click', () => showModal(loginModal));
    closeLoginModalBtn.addEventListener('click', () => hideModal(loginModal));
    closeLyricsModalBtn.addEventListener('click', () => hideModal(lyricsModal));
    closeSequenceModalBtn.addEventListener('click', () => hideModal(sequenceModal));
    closeChordsModalBtn.addEventListener('click', () => hideModal(chordsModal));
    logoutBtn.addEventListener('click', () => auth.signOut());
    
    createSetlistBtn.addEventListener('click', () => {
        currentSetlistId = null;
        setlistPreviews.classList.add('hidden');
        setlistFormContainer.classList.remove('hidden');
        renderRoleSelection();
    });

    loginBtn.addEventListener('click', () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        loginError.textContent = '';
        auth.signInWithEmailAndPassword(email, password).catch(error => { loginError.textContent = error.message; });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal) { hideModal(modal); } });
    });

    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('button, a');
        if (!target) return;
        if (target.matches('.role-btn')) { renderForm(target.dataset.role); }
        if (target.matches('.add-song-btn')) { addSongInput(target.dataset.catid, {}, document.getElementById('form-role').value); }
        if (target.id === 'save-setlist-btn') { saveSetlist(); }
        if (target.id === 'cancel-btn') {
            setlistFormContainer.classList.add('hidden');
            setlistPreviews.classList.remove('hidden');
        }
        if (target.matches('.edit-btn')) {
            const id = target.dataset.id;
            const setlistToEdit = allSetlists.find(s => s.id === id);
            if (setlistToEdit) {
                setlistPreviews.classList.add('hidden');
                setlistFormContainer.classList.remove('hidden');
                renderForm(setlistToEdit.role, setlistToEdit);
            }
        }
        if (target.matches('.view-lyrics-btn')) {
            lyricsSongName.textContent = target.dataset.songName;
            lyricsContent.textContent = target.dataset.lyrics;
            showModal(lyricsModal);
        }
        if (target.matches('.view-sequence-btn')) {
            sequenceSongName.textContent = `${target.dataset.songName} - Sequence`;
            sequenceContent.textContent = target.dataset.sequence;
            showModal(sequenceModal);
        }
        if (target.matches('.view-chords-btn')) {
            chordsSongName.textContent = `${target.dataset.songName} - Chords`;
            chordsContent.textContent = target.dataset.chords;
            showModal(chordsModal);
        }
        if (target.matches('.prev-page-btn')) {
            if (currentPage > 1) {
                currentPage--;
                const query = searchBar.value.toLowerCase();
                const filtered = query ? allSetlists.filter(s => [s.userName, s.role, ...Object.values(s.songs).flat().map(song => song.name)].join(' ').toLowerCase().includes(query)) : allSetlists;
                renderSetlists(filtered);
            }
        }
        if (target.matches('.next-page-btn')) {
            const query = searchBar.value.toLowerCase();
            const filtered = query ? allSetlists.filter(s => [s.userName, s.role, ...Object.values(s.songs).flat().map(song => song.name)].join(' ').toLowerCase().includes(query)) : allSetlists;
            const historyItems = filtered.filter(s => s.date !== filtered[0]?.date);
            if (currentPage < Math.ceil(historyItems.length / itemsPerPage)) {
                currentPage++;
                renderSetlists(filtered);
            }
        }
    });
});