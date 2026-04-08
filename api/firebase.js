// api/firebase.js
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, set, remove, push, update, query, orderByChild, limitToLast } = require('firebase/database');

// ==================== Firebase Configuration ====================
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
        if (!database) return false;
        const userRef = ref(database, `userStates/${instanceId}/${phone}`);
        await set(userRef, {
            mode: mode,
            timestamp: Date.now(),
            instanceId: instanceId,
            updatedAt: new Date().toISOString()
        });
        console.log(`💾 Firebase: Saved state for ${phone} (${mode}) in ${instanceId}`);
        return true;
    } catch (error) {
        console.error('❌ Firebase save error:', error.message);
        return false;
    }
}

// استرجاع حالة مستخدم
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

// حذف حالة مستخدم
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

// استرجاع جميع حالات المستخدمين لإنستانس معين
async function getAllUserStates(instanceId) {
    try {
        if (!database) return {};
        const usersRef = ref(database, `userStates/${instanceId}`);
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
            return snapshot.val();
        }
        return {};
    } catch (error) {
        console.error('❌ Firebase get all states error:', error.message);
        return {};
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
async function saveMessage(instanceId, phone, message, isFromMe, reply = null, messageType = 'text') {
    try {
        if (!database) return false;
        
        // استخدام push لإنشاء ID تلقائي مرتب زمنياً
        const messagesRef = ref(database, `messages/${instanceId}/${phone}`);
        const newMessageRef = push(messagesRef);
        
        const messageData = {
            message: message,
            fromMe: isFromMe,
            type: messageType,
            timestamp: Date.now(),
            timestamp_readable: new Date().toISOString()
        };
        
        // إذا كان فيه رد من البوت، نضيفه
        if (reply) {
            messageData.reply = reply;
        }
        
        await set(newMessageRef, messageData);
        
        // تحديث آخر نشاط للمستخدم
        await updateUserActivity(instanceId, phone);
        
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
            // تحويل الكائن إلى مصفوفة وترتيبها حسب الوقت
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

// الحصول على آخر رسالة لمستخدم
async function getLastMessage(instanceId, phone) {
    try {
        const messages = await getUserMessages(instanceId, phone, 1);
        return messages.length > 0 ? messages[0] : null;
    } catch (error) {
        console.error('❌ Firebase get last message error:', error.message);
        return null;
    }
}

// 🗑️ حذف محادثات مستخدم (للخصوصية)
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

// ==================== USER ACTIVITY FUNCTIONS ====================

// تحديث نشاط المستخدم
async function updateUserActivity(instanceId, phone) {
    try {
        if (!database) return false;
        const activityRef = ref(database, `users/${instanceId}/${phone}`);
        await set(activityRef, {
            phone: phone,
            lastActive: Date.now(),
            lastActive_readable: new Date().toISOString(),
            instanceId: instanceId
        });
        return true;
    } catch (error) {
        console.error('❌ Firebase update activity error:', error.message);
        return false;
    }
}

// الحصول على جميع المستخدمين النشطين
async function getActiveUsers(instanceId, minutesThreshold = 30) {
    try {
        if (!database) return [];
        const usersRef = ref(database, `users/${instanceId}`);
        const snapshot = await get(usersRef);
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            const now = Date.now();
            const threshold = minutesThreshold * 60 * 1000;
            const activeUsers = [];
            
            for (const [phone, user] of Object.entries(users)) {
                if (now - user.lastActive <= threshold) {
                    activeUsers.push({
                        phone: phone,
                        lastActive: user.lastActive_readable
                    });
                }
            }
            
            return activeUsers;
        }
        return [];
    } catch (error) {
        console.error('❌ Firebase get active users error:', error.message);
        return [];
    }
}

// ==================== STATISTICS FUNCTIONS ====================

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
                const msgCount = Object.keys(msgs).length;
                totalMessages += msgCount;
                
                // حساب عدد رسائل البوت والمستخدم
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

// إحصائيات سريعة لجميع الإنستانسات
async function getAllStats() {
    try {
        if (!database) return null;
        const instancesRef = ref(database, `messages`);
        const snapshot = await get(instancesRef);
        
        if (snapshot.exists()) {
            const instances = snapshot.val();
            let totalUsers = 0;
            let totalMessages = 0;
            
            for (const [instanceId, users] of Object.entries(instances)) {
                for (const [phone, msgs] of Object.entries(users)) {
                    totalUsers++;
                    totalMessages += Object.keys(msgs).length;
                }
            }
            
            return {
                totalUsers,
                totalMessages,
                instancesCount: Object.keys(instances).length,
                timestamp: new Date().toISOString()
            };
        }
        return null;
    } catch (error) {
        console.error('❌ Firebase get all stats error:', error.message);
        return null;
    }
}

// ==================== CONVERSATION FUNCTIONS ====================

// حفظ محادثة كاملة (للتصدير)
async function saveConversation(instanceId, phone, conversationData) {
    try {
        if (!database) return false;
        const convRef = ref(database, `conversations/${instanceId}/${phone}`);
        await set(convRef, {
            ...conversationData,
            exportedAt: Date.now(),
            exportedAt_readable: new Date().toISOString()
        });
        console.log(`💾 Firebase: Saved conversation for ${phone}`);
        return true;
    } catch (error) {
        console.error('❌ Firebase save conversation error:', error.message);
        return false;
    }
}

// تصدير محادثة مستخدم
async function exportUserConversation(instanceId, phone) {
    try {
        const messages = await getUserMessages(instanceId, phone, 1000);
        const userState = await getUserState(instanceId, phone);
        
        const conversation = {
            phone: phone,
            instanceId: instanceId,
            messages: messages,
            userMode: userState || 'bot',
            totalMessages: messages.length,
            exportedAt: new Date().toISOString()
        };
        
        await saveConversation(instanceId, phone, conversation);
        return conversation;
    } catch (error) {
        console.error('❌ Firebase export error:', error.message);
        return null;
    }
}

module.exports = {
    // User State
    saveUserState,
    getUserState,
    deleteUserState,
    getAllUserStates,
    cleanupExpiredUsers,
    
    // Messages
    saveMessage,
    getUserMessages,
    getLastMessage,
    deleteUserMessages,
    
    // User Activity
    updateUserActivity,
    getActiveUsers,
    
    // Statistics
    getMessagesStats,
    getAllStats,
    
    // Conversation
    saveConversation,
    exportUserConversation
};
