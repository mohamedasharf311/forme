// api/firebase.js
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, set, remove, push } = require('firebase/database');

// Firebase configuration - استخدم بياناتك
const firebaseConfig = {
  apiKey: "AIzaSyDWOvo3svd_e239IJkLtrs_F0tUfa5oCfE",
  authDomain: "forme-6167f.firebaseapp.com",
  databaseURL: "https://forme-6167f-default-rtdb.firebaseio.com",
  projectId: "forme-6167f",
  storageBucket: "forme-6167f.firebasestorage.app",
  messagingSenderId: "473501377416",
  appId: "1:473501377416:web:92a1bc21291824ab7d503d",
  measurementId: "G-KLL80WKMNJ"
};

// Initialize Firebase
let database = null;

try {
  const app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  console.log('🔥 Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
}

// ==================== USER STATE FUNCTIONS ====================

async function saveUserState(instanceId, phone, mode) {
    try {
        if (!database) return false;
        const userRef = ref(database, `userStates/${instanceId}/${phone}`);
        await set(userRef, {
            mode: mode,
            timestamp: Date.now(),
            instanceId: instanceId
        });
        console.log(`💾 Firebase: Saved state for ${phone} (${mode})`);
        return true;
    } catch (error) {
        console.error('❌ Firebase save error:', error.message);
        return false;
    }
}

async function getUserState(instanceId, phone) {
    try {
        if (!database) return null;
        const userRef = ref(database, `userStates/${instanceId}/${phone}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            console.log(`📥 Firebase: Loaded state for ${phone}: ${data.mode}`);
            return data.mode;
        }
        return null;
    } catch (error) {
        console.error('❌ Firebase load error:', error.message);
        return null;
    }
}

async function deleteUserState(instanceId, phone) {
    try {
        if (!database) return false;
        const userRef = ref(database, `userStates/${instanceId}/${phone}`);
        await remove(userRef);
        console.log(`🗑️ Firebase: Deleted state for ${phone}`);
        return true;
    } catch (error) {
        console.error('❌ Firebase delete error:', error.message);
        return false;
    }
}

async function cleanupExpiredUsers(instanceId) {
    try {
        if (!database) return;
        const usersRef = ref(database, `userStates/${instanceId}`);
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
            const users = snapshot.val();
            const now = Date.now();
            const TIMEOUT_DURATION = 30 * 60 * 1000;
            let deletedCount = 0;
            
            for (const [phone, user] of Object.entries(users)) {
                if (user.mode === "human") {
                    const elapsed = now - user.timestamp;
                    if (elapsed >= TIMEOUT_DURATION) {
                        await deleteUserState(instanceId, phone);
                        deletedCount++;
                    }
                }
            }
            
            if (deletedCount > 0) {
                console.log(`🧹 Firebase: Cleaned up ${deletedCount} expired users`);
            }
        }
    } catch (error) {
        console.error('❌ Firebase cleanup error:', error.message);
    }
}

async function saveMessage(instanceId, phone, message, isFromMe, reply = null) {
    try {
        if (!database) return false;
        const messagesRef = ref(database, `messages/${instanceId}/${phone}`);
        const newMessageRef = push(messagesRef);
        
        const messageData = {
            message: message,
            fromMe: isFromMe,
            timestamp: Date.now(),
            timestamp_readable: new Date().toISOString()
        };
        
        if (reply) {
            messageData.reply = reply;
        }
        
        await set(newMessageRef, messageData);
        console.log(`💬 Firebase: Message saved for ${phone}`);
        return true;
    } catch (error) {
        console.error('❌ Firebase message save error:', error.message);
        return false;
    }
}

async function getMessagesStats(instanceId) {
    try {
        if (!database) return null;
        const messagesRef = ref(database, `messages/${instanceId}`);
        const snapshot = await get(messagesRef);
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            let totalMessages = 0;
            let usersCount = 0;
            
            for (const [phone, msgs] of Object.entries(users)) {
                usersCount++;
                totalMessages += Object.keys(msgs).length;
            }
            
            return { usersCount, totalMessages, instanceId };
        }
        return { usersCount: 0, totalMessages: 0, instanceId };
    } catch (error) {
        console.error('❌ Firebase stats error:', error.message);
        return null;
    }
}

module.exports = {
    saveUserState,
    getUserState,
    deleteUserState,
    cleanupExpiredUsers,
    saveMessage,
    getMessagesStats
};
