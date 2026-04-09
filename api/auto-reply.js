// api/auto-reply.js
const axios = require('axios');
const config = require('./config');
const { getActiveInstance } = require('./instance3532');

// محاولة تحميل Firebase
let firebase = null;
try {
  firebase = require('./firebase');
  console.log('✅ Firebase loaded successfully');
} catch (error) {
  console.log('⚠️ Firebase not available:', error.message);
}

// دالة تحويل الأرقام العربية
function convertArabicNumbers(text) {
  if (!text) return text;
  const arabicNumbers = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  };
  
  let converted = text.toString();
  for (let [arabic, english] of Object.entries(arabicNumbers)) {
    converted = converted.replace(new RegExp(arabic, 'g'), english);
  }
  return converted;
}

// دالة البحث عن رد تلقائي
function getAutoReply(message) {
  if (!message) return null;
  
  let processedMessage = convertArabicNumbers(message.toLowerCase().trim());
  let originalMessage = message.trim();
  
  console.log(`🔍 Searching for reply to: "${originalMessage}"`);
  
  // 1. التحقق من كلمات القائمة
  for (let keyword of config.menuKeywords) {
    if (processedMessage.includes(keyword.toLowerCase()) || 
        originalMessage.toLowerCase().includes(keyword.toLowerCase())) {
      return config.welcomeMessage;
    }
  }
  
  // 2. التحقق من الأرقام
  const numberMap = {
    '1': '1', '2': '2', '3': '3', '4': '4', '5': '5',
    '6': '6', '7': '7', '8': '8', '9': '9', '10': '10'
  };
  
  if (numberMap[processedMessage]) {
    const reply = config.replies[numberMap[processedMessage]];
    if (reply) return reply;
  }
  
  if (numberMap[originalMessage]) {
    const reply = config.replies[numberMap[originalMessage]];
    if (reply) return reply;
  }
  
  // 3. التحقق من الردود الذكية
  for (let [keyword, reply] of Object.entries(config.smartReplies)) {
    if (processedMessage.includes(keyword.toLowerCase())) {
      return reply;
    }
  }
  
  // 4. رقم غير موجود
  if (processedMessage.match(/^[0-9]+$/)) {
    return `❌ الرقم ${originalMessage} مش موجود.\n\n${config.fallbackReply}`;
  }
  
  return config.fallbackReply;
}

// دالة إرسال رسالة واتساب
async function sendWhatsAppMessage(chatId, message) {
  try {
    const activeInstance = getActiveInstance();
    if (!activeInstance) {
      return { success: false, error: 'No active instance' };
    }
    
    console.log(`📤 Sending to: ${chatId}`);
    console.log(`📤 Message: ${message.substring(0, 100)}...`);
    
    const response = await axios.post(
      `https://api.wapilot.net/api/v2/${activeInstance.id}/send-message`,
      { chat_id: chatId, text: message },
      { headers: { "token": activeInstance.token, "Content-Type": "application/json" } }
    );
    
    console.log(`✅ Sent successfully`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`❌ Send failed:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

// دالة حفظ الرسالة في Firebase
async function saveToFirebase(chatId, message, isFromMe, reply = null) {
  if (!firebase) {
    console.log('⚠️ Firebase not available, skipping save');
    return false;
  }
  
  try {
    // تنظيف chatId للحصول على رقم الهاتف
    let phone = chatId.replace('@c.us', '').replace('@lid', '').replace(/[^0-9]/g, '');
    
    await firebase.saveMessage('instance3532', phone, message, isFromMe, reply);
    console.log(`💾 Saved to Firebase: ${phone}`);
    return true;
  } catch (error) {
    console.error('❌ Firebase save error:', error.message);
    return false;
  }
}

// الدالة الرئيسية
async function processIncomingMessage(chatId, message, isFromMe = false) {
  console.log(`📩 Incoming message from ${chatId}: ${message}`);
  
  // حفظ رسالة المستخدم في Firebase
  await saveToFirebase(chatId, message, false);
  
  // إذا كانت الرسالة من المسؤول لا نرد
  if (isFromMe) {
    console.log(`👨‍💼 Admin message, skipping auto-reply`);
    return { replied: false, message: null, note: "Admin message" };
  }
  
  // الحصول على الرد التلقائي
  const autoReply = getAutoReply(message);
  
  if (autoReply) {
    console.log(`🤖 Auto-reply found, sending to ${chatId}...`);
    
    // إرسال الرد
    const result = await sendWhatsAppMessage(chatId, autoReply);
    
    if (result.success) {
      // حفظ رد البوت في Firebase
      await saveToFirebase(chatId, autoReply, true, message);
    }
    
    return { 
      replied: result.success, 
      message: autoReply,
      success: result.success,
      error: result.error
    };
  }
  
  console.log(`⚠️ No auto-reply found for: "${message}"`);
  return { replied: false, message: null };
}

module.exports = {
  processIncomingMessage,
  getAutoReply,
  sendWhatsAppMessage
};
