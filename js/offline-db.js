// offline-db.js

// IndexedDB initialization
const request = indexedDB.open('FamilyRegistryDB', 1);

request.onupgradeneeded = (event) => {
    const db = event.target.result;
    // Creating object stores
    const familiesStore = db.createObjectStore('families', { keyPath: 'id' });
    const membersStore = db.createObjectStore('members', { keyPath: 'id' });
    const distributionsStore = db.createObjectStore('distributions', { keyPath: 'id' });
    const movementsStore = db.createObjectStore('movements', { keyPath: 'id' });
};

request.onsuccess = (event) => {
    console.log('Database initialized successfully');
};

request.onerror = (event) => {
    console.error('Database error:', event.target.error);
};

// Function to add families
function addFamily(family) {
    const transaction = request.result.transaction(['families'], 'readwrite');
    const store = transaction.objectStore('families');
    store.add(family);
}

// Function to add members
function addMember(member) {
    const transaction = request.result.transaction(['members'], 'readwrite');
    const store = transaction.objectStore('members');
    store.add(member);
}

// Function to add distributions
function addDistribution(distribution) {
    const transaction = request.result.transaction(['distributions'], 'readwrite');
    const store = transaction.objectStore('distributions');
    store.add(distribution);
}

// Function to add movements
function addMovement(movement) {
    const transaction = request.result.transaction(['movements'], 'readwrite');
    const store = transaction.objectStore('movements');
    store.add(movement);
}

// Example usage:
// addFamily({ id: 1, name: 'Smith Family' });
// addMember({ id: 1, familyId: 1, name: 'John Smith' });
// addDistribution({ id: 1, familyId: 1, date: '2026-04-16' });
// addMovement({ id: 1, familyId: 1, from: 'Location A', to: 'Location B' });