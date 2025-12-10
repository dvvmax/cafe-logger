// ============================================
// 🔥 FIREBASE CONFIGURATION
// ============================================
// PASTE YOUR FIREBASE CONFIG HERE
// Get this from Firebase Console > Project Settings > Your apps > Web app

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ⚠️ REPLACE THE VALUES BELOW WITH YOUR FIREBASE CONFIG ⚠️
const firebaseConfig = {
  apiKey: 'AIzaSyDTTeKAM6LiHGIGADDacD0Gd9rvapfFPxM',

  authDomain: 'cafelog-4601c.firebaseapp.com',

  projectId: 'cafelog-4601c',

  storageBucket: 'cafelog-4601c.firebasestorage.app',

  messagingSenderId: '639681577030',

  appId: '1:639681577030:web:bb4b0cf6e253137d09ca47',
};

// ============================================
// Initialize Firebase
// ============================================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const cafesRef = collection(db, 'cafes');

// ============================================
// GOOGLE PLACES AUTOCOMPLETE
// ============================================
let autocomplete;
let selectedPlace = null;

// This function is called by Google Maps API
window.initAutocomplete = function () {
  const input = document.getElementById('cafeSearch');

  // Create autocomplete instance - restrict to cafes
  autocomplete = new google.maps.places.Autocomplete(input, {
    types: ['cafe', 'restaurant', 'bakery', 'food'],
    fields: ['name', 'formatted_address', 'place_id', 'geometry'],
  });

  // Listen for place selection
  autocomplete.addListener('place_changed', () => {
    selectedPlace = autocomplete.getPlace();

    if (selectedPlace && selectedPlace.name) {
      // Show selected cafe info
      document.getElementById('selectedCafeName').textContent = selectedPlace.name;
      document.getElementById('selectedCafeAddress').textContent =
        selectedPlace.formatted_address || '';
      document.getElementById('selectedCafeInfo').style.display = 'block';

      // Enable the button
      const btn = document.getElementById('addBtn');
      btn.disabled = false;
      btn.querySelector('#btnText').textContent = 'Add to Collection';
    }
  });
};

// ============================================
// UI INTERACTIONS
// ============================================

// Update slider values in real-time
document.querySelectorAll('input[type="range"]').forEach(slider => {
  slider.addEventListener('input', e => {
    document.getElementById(e.target.id + 'Val').textContent = e.target.value;
  });
});

// ============================================
// ADD CAFE FUNCTION
// ============================================
window.addCafe = async function () {
  if (!selectedPlace || !selectedPlace.name) {
    alert('Please select a cafe from the suggestions!');
    return;
  }

  const btn = document.getElementById('addBtn');
  btn.disabled = true;
  btn.querySelector('#btnText').textContent = 'Adding...';

  try {
    // Add to Firebase
    await addDoc(cafesRef, {
      name: selectedPlace.name,
      location: selectedPlace.formatted_address || 'Location unavailable',
      placeId: selectedPlace.place_id || null,
      coffee: parseInt(document.getElementById('coffee').value),
      service: parseInt(document.getElementById('service').value),
      vibe: parseInt(document.getElementById('vibe').value),
      pastry: parseInt(document.getElementById('pastry').value),
      timestamp: new Date(),
      date: new Date().toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    });

    // Reset form
    document.getElementById('cafeSearch').value = '';
    document.getElementById('selectedCafeInfo').style.display = 'none';
    selectedPlace = null;

    document.querySelectorAll('input[type="range"]').forEach(slider => {
      slider.value = 5;
      document.getElementById(slider.id + 'Val').textContent = 5;
    });

    btn.disabled = true;
    btn.querySelector('#btnText').textContent = 'Select a cafe to continue';
  } catch (error) {
    console.error('Error adding cafe:', error);
    alert('Failed to add cafe. Please check your Firebase configuration.');
    btn.disabled = false;
    btn.querySelector('#btnText').textContent = 'Try Again';
  }
};

// ============================================
// DELETE CAFE FUNCTION
// ============================================
window.deleteCafe = async function (id) {
  if (confirm('Remove this cafe from your collection?')) {
    try {
      await deleteDoc(doc(db, 'cafes', id));
    } catch (error) {
      console.error('Error deleting cafe:', error);
      alert('Failed to delete cafe.');
    }
  }
};

// ============================================
// REAL-TIME LISTENER
// ============================================
const q = query(cafesRef, orderBy('timestamp', 'desc'));

onSnapshot(
  q,
  snapshot => {
    // Update sync status
    document.getElementById('syncText').textContent = 'Synced';

    // Check if list is empty
    if (snapshot.empty) {
      document.getElementById('cafeList').innerHTML =
        '<div class="empty-state">No cafes yet.<br>Search and add your first one above.</div>';
      return;
    }

    // Build HTML for each cafe
    const html = snapshot.docs
      .map(docSnap => {
        const cafe = docSnap.data();
        const cafeId = docSnap.id;

        // Calculate average rating
        const avg = ((cafe.coffee + cafe.service + cafe.vibe + cafe.pastry) / 4).toFixed(1);

        return `
            <div class="cafe-item">
                <div class="cafe-name">${cafe.name}</div>
                <div class="cafe-location">
                    ${cafe.location}
                </div>
                <div class="ratings">
                    <div class="rating-item">
                        <span>☕ Coffee</span>
                        <span class="rating-score">${cafe.coffee}</span>
                    </div>
                    <div class="rating-item">
                        <span>🤝 Service</span>
                        <span class="rating-score">${cafe.service}</span>
                    </div>
                    <div class="rating-item">
                        <span>✨ Vibe</span>
                        <span class="rating-score">${cafe.vibe}</span>
                    </div>
                    <div class="rating-item">
                        <span>🥐 Pastry</span>
                        <span class="rating-score">${cafe.pastry}</span>
                    </div>
                </div>
                <div class="cafe-meta">
                    <span>${cafe.date} • Avg ${avg}</span>
                    <button class="delete-btn" onclick="deleteCafe('${cafeId}')">Remove</button>
                </div>
            </div>
        `;
      })
      .join('');

    document.getElementById('cafeList').innerHTML = html;
  },
  error => {
    console.error('Error loading cafes:', error);
    document.getElementById('syncText').textContent = 'Error';
    document.getElementById('cafeList').innerHTML = `<div class="empty-state">
            Connection error<br><br>
            Check your Firebase setup
        </div>`;
  }
);
