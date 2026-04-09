// api/firebase.js
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, set, remove, push } = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyDWOvo3svd_e239IJkLtrs_F0tUfa5oCfE",
  authDomain: "forme-6167f.firebaseapp.com",
  databaseURL: "https://forme-6167f-default-rtdb.firebaseio.com",
  projectId: "forme-6167f",
  storageBucket: "forme-6167f.firebasestorage.app",
  messagingSenderId: "473501377416",
  appId: "1:473501377416:web:92a1bc21291824ab7d503d"
};

let database = null;

try {
  const app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  console.log('🔥 Firebase initialized successfully');
  console.log('📡 Database URL:', firebaseConfig.databaseURL);
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
}

// حفظ رسالة
async function saveMessage(instanceId, phone, message, isFromMe, reply = null) {
  try {
    if (!database) {
      console.log('⚠️ Firebase not initialized');
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
    console.log(`💾 Saved to Firebase: ${phone} - ${message.substring(0, 50)}`);
    return true;
  } catch (error) {
    console.error('❌ Firebase save error:', error.message);
    return false;
  }
}

// حفظ حالة مستخدم
async function saveUserState(instanceId, phone, mode) {
  try {
    if (!database) return false;
    const userRef = ref(database, `userStates/${instanceId}/${phone}`);
    await set(userRef, {
      mode: mode,
      timestamp: Date.now()
    });
    console.log(`💾 Saved state: ${phone} -> ${mode}`);
    return true;
  } catch (error) {
    console.error('❌ Save state error:', error.message);
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
      return snapshot.val().mode;
    }
    return null;
  } catch (error) {
    console.error('❌ Get state error:', error.message);
    return null;
  }
}

// حذف حالة مستخدم
async function deleteUserState(instanceId, phone) {
  try {
    if (!database) return false;
    const userRef = ref(database, `userStates/${instanceId}/${phone}`);
    await remove(userRef);
    return true;
  } catch (error) {
    console.error('❌ Delete state error:', error.message);
    return false;
  }
}

module.exports = {
  saveMessage,
  saveUserState,
  getUserState,
  deleteUserState
};
