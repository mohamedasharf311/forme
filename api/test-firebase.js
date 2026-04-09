// api/test-firebase.js
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, get, push } = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyDWOvo3svd_e239IJkLtrs_F0tUfa5oCfE",
  authDomain: "forme-6167f.firebaseapp.com",
  databaseURL: "https://forme-6167f-default-rtdb.firebaseio.com",
  projectId: "forme-6167f",
  storageBucket: "forme-6167f.firebasestorage.app",
  messagingSenderId: "473501377416",
  appId: "1:473501377416:web:92a1bc21291824ab7d503d"
};

// Initialize Firebase
let database = null;

try {
  const app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  console.log('✅ Firebase initialized');
} catch (error) {
  console.error('❌ Firebase error:', error.message);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (!database) {
    return res.json({ error: 'Firebase not initialized', config: firebaseConfig });
  }
  
  try {
    // محاولة كتابة بيانات تجريبية
    const testRef = ref(database, 'test/connection');
    await set(testRef, {
      message: 'Firebase is working!',
      timestamp: Date.now(),
      date: new Date().toISOString()
    });
    
    // محاولة قراءة البيانات
    const snapshot = await get(testRef);
    
    // محاولة حفظ رسالة تجريبية في مسار المحادثات
    const testMessageRef = push(ref(database, 'messages/instance3532/test'));
    await set(testMessageRef, {
      message: 'Test message',
      fromMe: true,
      timestamp: Date.now(),
      timestamp_readable: new Date().toISOString()
    });
    
    res.json({
      success: true,
      connection: 'Working',
      testData: snapshot.val(),
      databaseURL: firebaseConfig.databaseURL,
      messagePath: 'messages/instance3532/test'
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      databaseURL: firebaseConfig.databaseURL
    });
  }
};
