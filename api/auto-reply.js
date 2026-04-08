// api/auto-reply.js
const axios = require('axios');
const config = require('./config');

// ==================== INSTANCE CONFIGURATION ====================
const instances = [
    {
        id: "instance3532",
        token: "yzWzEjmxZpbifuOx6lWafYT3Ng69gaFpJGAdTsVc6N",
        name: "محمد - البوت الشخصي",
        phoneNumber: "20119383101",
        active: true
    }
];

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

// دالة تنظيف رقم الهاتف
function cleanPhoneNumber(phone) {
    let cleanPhone = phone.toString();
    cleanPhone = cleanPhone.replace('@c.us', '');
    cleanPhone = cleanPhone.replace('@lid', '');
    cleanPhone = cleanPhone.replace('+', '');
    cleanPhone = cleanPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
    return cleanPhone;
}

// دالة الحصول على الإنستانس النشط
function getActiveInstance() {
    return instances.find(inst => inst.active === true) || instances[0];
}

// دالة البحث عن رد تلقائي
function getAutoReply(message) {
    if (!message) return null;
    
    // تحويل الأرقام العربية
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
    
    // 2. التحقق من الأرقام (1-10)
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
    
    // 5. رد الفل باك
    return config.fallbackReply;
}

// دالة إرسال رسالة واتساب
async function sendWhatsAppMessage(phone, message) {
    try {
        const activeInstance = getActiveInstance();
        if (!activeInstance) {
            return { success: false, error: 'No active instance' };
        }
        
        let cleanPhone = cleanPhoneNumber(phone);
        const chat_id = `${cleanPhone}@c.us`;
        
        console.log(`📤 Sending to: ${chat_id}`);
        console.log(`📤 Message: ${message.substring(0, 100)}...`);
        
        const response = await axios.post(
            `https://api.wapilot.net/api/v2/${activeInstance.id}/send-message`,
            { chat_id, text: message },
            { headers: { "token": activeInstance.token, "Content-Type": "application/json" } }
        );
        
        console.log(`✅ Sent successfully`);
        return { success: true, data: response.data };
    } catch (error) {
        console.error(`❌ Send failed:`, error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
}

// الدالة الرئيسية لمعالجة الرسائل الواردة
async function processIncomingMessage(phone, message) {
    console.log(`📩 Incoming message from ${phone}: ${message}`);
    
    // تنظيف رقم الهاتف
    let cleanPhone = cleanPhoneNumber(phone);
    
    // التحقق من أن الرقم صالح (ليس LID)
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        console.log(`⚠️ Invalid phone number (likely a LID): ${phone}`);
        return { 
            replied: false, 
            message: null, 
            error: 'Cannot reply to LID - not a real phone number' 
        };
    }
    
    // الحصول على الرد التلقائي
    const autoReply = getAutoReply(message);
    
    if (autoReply) {
        console.log(`🤖 Auto-reply found, sending...`);
        const result = await sendWhatsAppMessage(cleanPhone, autoReply);
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

// دوال مساعدة للواجهة
function getAllRules() {
    return Object.entries(config.replies).map(([id, reply]) => ({
        id: parseInt(id),
        keywords: [id],
        reply: reply,
        active: true
    }));
}

function addRule(keywords, reply, active = true) {
    // إضافة قاعدة جديدة (يمكن تطويرها لاحقاً)
    console.log(`New rule added: ${keywords} -> ${reply.substring(0, 50)}...`);
    return { id: Date.now(), keywords: keywords.split(','), reply, active };
}

function getInstances() {
    return instances;
}

function getCompanyData() {
    return {
        name: config.personalInfo.name,
        welcomeMessage: config.welcomeMessage,
        replies: config.replies
    };
}

module.exports = {
    processIncomingMessage,
    getAutoReply,
    sendWhatsAppMessage,
    getAllRules,
    addRule,
    getInstances,
    getCompanyData
};
