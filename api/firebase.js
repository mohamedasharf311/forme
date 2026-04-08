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

// حفظ حالة مستخدم
async function saveUserState(instanceId, phone, mode) {
    try {
        if (!database) {
            console.log('⚠️ Firebase not initialized, skipping saveUserState');
            return false;
        }
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

// استرجاع حالة مستخدم
async function getUserState(instanceId, phone) {
    try {
        if (!database) {
            console.log('⚠️ Firebase not initialized, returning null');
            return null;
        }
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

// حذف حالة مستخدم
async function deleteUserState(instanceId, phone) {
    try {
        if (!database) {
            console.log('⚠️ Firebase not initialized, skipping deleteUserState');
            return false;
        }
        const userRef = ref(database, `userStates/${instanceId}/${phone}`);
        await remove(userRef);
        console.log(`🗑️ Firebase: Deleted state for ${phone}`);
        return true;
    } catch (error) {
        console.error('❌ Firebase delete error:', error.message);
        return false;
    }
}

// تنظيف المستخدمين المنتهيين (أكثر من 30 دقيقة)
async function cleanupExpiredUsers(instanceId) {
    try {
        if (!database) return 0;
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
            return deletedCount;
        }
        return 0;
    } catch (error) {
        console.error('❌ Firebase cleanup error:', error.message);
        return 0;
    }
}

// ==================== MESSAGE HISTORY FUNCTIONS ====================

// 💬 حفظ رسالة جديدة
async function saveMessage(instanceId, phone, message, isFromMe, reply = null) {
    try {
        if (!database) {
            console.log('⚠️ Firebase not initialized, skipping saveMessage');
            return false;
        }
        
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
        console.log(`💬 Firebase: Message saved for ${phone} (fromMe: ${isFromMe})`);
        return true;
    } catch (error) {
        console.error('❌ Firebase message save error:', error.message);
        return false;
    }
}

// 📜 استرجاع محادثات مستخدم
async function getUserMessages(instanceId, phone, limit = 50) {
    try {
        if (!database) return [];
        const messagesRef = ref(database, `messages/${instanceId}/${phone}`);
        const snapshot = await get(messagesRef);
        
        if (snapshot.exists()) {
            const messages = snapshot.val();
            const messagesArray = Object.entries(messages).map(([id, msg]) => ({
                id,
                ...msg
            })).sort((a, b) => a.timestamp - b.timestamp).slice(-limit);
            
            console.log(`📜 Firebase: Retrieved ${messagesArray.length} messages for ${phone}`);
            return messagesArray;
        }
        return [];
    } catch (error) {
        console.error('❌ Firebase get messages error:', error.message);
        return [];
    }
}

// 🗑️ حذف محادثات مستخدم
async function deleteUserMessages(instanceId, phone) {
    try {
        if (!database) return false;
        const messagesRef = ref(database, `messages/${instanceId}/${phone}`);
        await remove(messagesRef);
        console.log(`🗑️ Firebase: Deleted all messages for ${phone}`);
        return true;
    } catch (error) {
        console.error('❌ Firebase delete messages error:', error.message);
        return false;
    }
}

// 📊 إحصائيات المحادثات
async function getMessagesStats(instanceId) {
    try {
        if (!database) return null;
        const messagesRef = ref(database, `messages/${instanceId}`);
        const snapshot = await get(messagesRef);
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            let totalMessages = 0;
            let usersCount = 0;
            let botReplies = 0;
            let userMessages = 0;
            
            for (const [phone, msgs] of Object.entries(users)) {
                usersCount++;
                totalMessages += Object.keys(msgs).length;
                
                for (const [id, msg] of Object.entries(msgs)) {
                    if (msg.fromMe) {
                        botReplies++;
                    } else {
                        userMessages++;
                    }
                }
            }
            
            return {
                usersCount,
                totalMessages,
                botReplies,
                userMessages,
                instanceId,
                timestamp: new Date().toISOString()
            };
        }
        return { usersCount: 0, totalMessages: 0, botReplies: 0, userMessages: 0, instanceId };
    } catch (error) {
        console.error('❌ Firebase stats error:', error.message);
        return null;
    }
}

// ==================== EXPORT ALL FUNCTIONS ====================
module.exports = {
    saveUserState,
    getUserState,
    deleteUserState,
    cleanupExpiredUsers,
    saveMessage,
    getUserMessages,
    deleteUserMessages,
    getMessagesStats
};
