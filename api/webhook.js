// api/webhook.js
const axios = require('axios');
const config = require('./config');
const { getActiveInstance } = require('./instance3532');

// محاولة Firebase اختيارياً (إذا كان موجوداً)
let firebase = null;
try {
    firebase = require('./firebase');
    console.log('✅ Firebase module loaded');
} catch (e) {
    console.log('⚠️ Firebase module not available, continuing without it');
}

// دالة تحويل الأرقام العربية إلى إنجليزية
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

// دالة تنظيف رقم الهاتف - مع دعم LID
function cleanPhoneNumber(phone) {
    let cleanPhone = phone.toString();
    
    // إذا كان LID، لا يمكن الرد عليه
    if (cleanPhone.includes('@lid')) {
        console.log(`⚠️ This is a LID, not a real phone number: ${cleanPhone}`);
        return null;
    }
    
    cleanPhone = cleanPhone.replace('@c.us', '');
    cleanPhone = cleanPhone.replace('+', '');
    cleanPhone = cleanPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
    
    // التحقق من أن الرقم حقيقي (10-15 رقم)
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        console.log(`⚠️ Invalid phone number length: ${cleanPhone.length}`);
        return null;
    }
    
    return cleanPhone;
}

// دالة البحث عن رد تلقائي
function findAutoReply(message) {
    if (!message) return null;
    
    let processedMessage = convertArabicNumbers(message.toLowerCase().trim());
    let originalMessage = message.trim();
    
    console.log(`🔍 Searching for reply to: "${originalMessage}" (processed: "${processedMessage}")`);
    
    // 1. التحقق من كلمات القائمة
    for (let keyword of config.menuKeywords) {
        if (processedMessage.includes(keyword.toLowerCase()) || 
            originalMessage.toLowerCase().includes(keyword.toLowerCase())) {
            console.log(`✅ Menu keyword matched: ${keyword}`);
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
        if (reply) {
            console.log(`✅ Number matched: ${processedMessage}`);
            return reply;
        }
    }
    
    if (numberMap[originalMessage]) {
        const reply = config.replies[numberMap[originalMessage]];
        if (reply) {
            console.log(`✅ Number matched from original: ${originalMessage}`);
            return reply;
        }
    }
    
    // 3. التحقق من الردود الذكية
    for (let [keyword, reply] of Object.entries(config.smartReplies)) {
        if (processedMessage.includes(keyword.toLowerCase())) {
            console.log(`✅ Smart reply matched: ${keyword}`);
            return reply;
        }
    }
    
    // 4. رد الفل باك
    return config.fallbackReply;
}

// دالة إرسال رسالة واتساب
async function sendWhatsAppMessage(instance, chatId, message) {
    try {
        console.log(`📤 Sending to: ${chatId}`);
        console.log(`📤 Message: ${message.substring(0, 100)}...`);
        
        const response = await axios.post(
            `https://api.wapilot.net/api/v2/${instance.id}/send-message`,
            { chat_id: chatId, text: message },
            { headers: { "token": instance.token, "Content-Type": "application/json" } }
        );
        
        console.log(`✅ Sent successfully`);
        return { success: true };
    } catch (error) {
        console.error(`❌ Send failed:`, error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
}

// ==================== WEBHOOK HANDLER ====================
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'active',
            bot: config.personalInfo.name,
            message: 'Webhook is working! Send a POST with a message to test.',
            timestamp: new Date().toISOString()
        });
    }
    
    console.log('='.repeat(50));
    console.log(`📩 Webhook received at: ${new Date().toISOString()}`);
    
    const data = req.body;
    let rawChatId = null;
    let message = null;
    let isFromMe = false;
    
    // استخراج البيانات
    if (data.payload) {
        rawChatId = data.payload.from;
        message = data.payload.body;
        isFromMe = data.payload.fromMe || false;
    } else if (data.from) {
        rawChatId = data.from;
        message = data.body || data.text;
        isFromMe = data.fromMe || false;
    } else if (data.phone) {
        rawChatId = data.phone;
        message = data.message;
    }
    
    if (!rawChatId || !message) {
        console.log('⚠️ Missing chatId or message');
        return res.status(200).json({ received: true, error: 'Missing data' });
    }
    
    console.log(`📱 Raw ChatId: ${rawChatId}`);
    console.log(`💬 Original Message: "${message}"`);
    console.log(`👤 Is from me: ${isFromMe}`);
    
    // التحقق من أن المرسل رقم هاتف حقيقي (ليس LID)
    const cleanNumber = cleanPhoneNumber(rawChatId);
    
    if (!cleanNumber) {
        // هذا LID أو رقم غير صالح - لا يمكن الرد
        console.log(`⚠️ Cannot reply to LID or invalid phone number: ${rawChatId}`);
        console.log(`💡 Only real phone numbers can receive replies. This appears to be a WhatsApp LID.`);
        return res.status(200).json({ 
            received: true, 
            note: "Cannot reply to LID - this is not a real phone number",
            originalId: rawChatId
        });
    }
    
    const chatId = `${cleanNumber}@c.us`;
    console.log(`📱 Valid phone number: ${cleanNumber}`);
    console.log(`📱 ChatId for sending: ${chatId}`);
    
    // الحصول على الإنستانس النشط
    const activeInstance = getActiveInstance();
    if (!activeInstance) {
        console.log('⚠️ No active instance');
        return res.status(200).json({ error: 'No active instance' });
    }
    
    console.log(`🤖 Using instance: ${activeInstance.name}`);
    
    // إذا كانت الرسالة من المسؤول
    if (isFromMe) {
        console.log(`👨‍💼 Admin message detected - no auto-reply`);
        return res.status(200).json({ success: true, mode: "human", admin: true });
    }
    
    // البحث عن رد تلقائي
    const autoReply = findAutoReply(message);
    
    if (autoReply) {
        console.log(`🤖 Sending auto-reply...`);
        const result = await sendWhatsAppMessage(activeInstance, chatId, autoReply);
        return res.status(200).json({ success: result.success, replied: true });
    } else {
        console.log(`⚠️ No auto-reply found`);
        return res.status(200).json({ success: true, replied: false });
    }
};
