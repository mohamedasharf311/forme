// api/webhook.js
const axios = require('axios');
const config = require('./config');
const { getActiveInstance } = require('./instance3532');
const firebase = require('./firebase');

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

// دالة البحث عن رد تلقائي من config.js
function findAutoReply(message) {
    if (!message) return null;
    
    // تحويل الأرقام العربية إلى إنجليزية للمعالجة
    let processedMessage = convertArabicNumbers(message.toLowerCase().trim());
    let originalMessage = message.trim();
    
    console.log(`🔍 Searching for reply to: "${originalMessage}" (processed: "${processedMessage}")`);
    
    // 1. التحقق من كلمات القائمة (من config.js)
    for (let keyword of config.menuKeywords) {
        if (processedMessage.includes(keyword.toLowerCase()) || 
            originalMessage.toLowerCase().includes(keyword.toLowerCase())) {
            console.log(`✅ Menu keyword matched: ${keyword}`);
            return config.welcomeMessage;
        }
    }
    
    // 2. التحقق من الأرقام (1-10 بالعربية أو الإنجليزية)
    const numberMap = {
        '1': '1', '2': '2', '3': '3', '4': '4', '5': '5',
        '6': '6', '7': '7', '8': '8', '9': '9', '10': '10'
    };
    
    // تجربة الرقم المعالج (بعد تحويل العربي لإنجليزي)
    if (numberMap[processedMessage]) {
        const reply = config.replies[numberMap[processedMessage]];
        if (reply) {
            console.log(`✅ Number matched: ${processedMessage} -> ${numberMap[processedMessage]}`);
            return reply;
        }
    }
    
    // تجربة الرقم الأصلي (قد يكون عربي أو إنجليزي)
    if (numberMap[originalMessage]) {
        const reply = config.replies[numberMap[originalMessage]];
        if (reply) {
            console.log(`✅ Number matched from original: ${originalMessage}`);
            return reply;
        }
    }
    
    // 3. التحقق من الردود الذكية (من config.js)
    for (let [keyword, reply] of Object.entries(config.smartReplies)) {
        if (processedMessage.includes(keyword.toLowerCase())) {
            console.log(`✅ Smart reply matched: ${keyword}`);
            return reply;
        }
    }
    
    // 4. إذا كان الرقم غير موجود في الردود
    if (processedMessage.match(/^[0-9]+$/) || originalMessage.match(/^[0-9]+$/)) {
        console.log(`⚠️ Number not found: ${originalMessage}`);
        return `❌ الرقم ${originalMessage} مش موجود.\n\n${config.fallbackReply}`;
    }
    
    // 5. رد الفل باك من config.js
    console.log(`⚠️ No match found, using fallback reply`);
    return config.fallbackReply;
}

// ==================== WEBHOOK HANDLER ====================
module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // GET request للاختبار
    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'active',
            bot: config.personalInfo.name,
            botPhone: config.personalInfo.phone,
            message: 'Webhook is working!',
            timestamp: new Date().toISOString()
        });
    }
    
    // POST request - معالجة الرسائل
    console.log('='.repeat(50));
    console.log(`📩 Webhook received at: ${new Date().toISOString()}`);
    console.log(`📩 Body:`, JSON.stringify(req.body, null, 2));
    
    // استخراج البيانات من webhook
    const data = req.body;
    let rawChatId = null;
    let message = null;
    let isFromMe = false;
    
    // تنسيق وابيلوت
    if (data.payload) {
        rawChatId = data.payload.from;
        message = data.payload.body;
        isFromMe = data.payload.fromMe || false;
    }
    // تنسيقات أخرى
    else if (data.from) {
        rawChatId = data.from;
        message = data.body || data.text;
        isFromMe = data.fromMe || false;
    }
    else if (data.phone) {
        rawChatId = data.phone;
        message = data.message;
    }
    
    // التحقق من وجود البيانات
    if (!rawChatId || !message) {
        console.log('⚠️ Missing chatId or message');
        return res.status(200).json({ received: true, error: 'Missing chatId or message' });
    }
    
    // تنظيف رقم الهاتف للاستخدام
    let cleanNumber = cleanPhoneNumber(rawChatId);
    let chatId = rawChatId;
    if (!chatId.includes('@')) {
        chatId = `${cleanNumber}@c.us`;
    }
    
    console.log(`📱 Raw ChatId: ${rawChatId}`);
    console.log(`📱 Clean Number: ${cleanNumber}`);
    console.log(`📱 ChatId for sending: ${chatId}`);
    console.log(`💬 Original Message: "${message}"`);
    console.log(`👤 Is from me: ${isFromMe}`);
    
    // حفظ الرسالة في Firebase (إذا أردت)
    if (firebase && firebase.saveMessage) {
        await firebase.saveMessage('instance3532', cleanNumber, message, isFromMe);
    }
    
    // الحصول على الإنستانس النشط
    const activeInstance = getActiveInstance();
    if (!activeInstance) {
        console.log('⚠️ No active instance available');
        return res.status(200).json({ error: 'No active instance' });
    }
    
    console.log(`🤖 Using instance: ${activeInstance.name} (${activeInstance.id})`);
    
    // ==================== معالجة الرسالة ====================
    
    // 1. إذا كانت الرسالة من المسؤول - ندخل وضع human
    if (isFromMe) {
        if (firebase && firebase.saveUserState) {
            await firebase.saveUserState('instance3532', chatId, "human");
        }
        console.log(`👨‍💼 Admin message detected - BOT will not auto-reply`);
        return res.status(200).json({ success: true, mode: "human", admin: true });
    }
    
    // 2. التحقق من وضع المستخدم (human/bot) من Firebase
    let currentMode = null;
    if (firebase && firebase.getUserState) {
        currentMode = await firebase.getUserState('instance3532', chatId);
    }
    console.log(`📊 Current user mode: ${currentMode || "bot"}`);
    
    // 3. إذا كان المستخدم في وضع human، لا نرد تلقائياً
    if (currentMode === "human") {
        console.log(`🤫 User in HUMAN mode - BOT silent, waiting for admin response`);
        return res.status(200).json({ success: true, mode: "human", silent: true });
    }
    
    // 4. طلب خدمة العملاء (رقم 10)
    const processedMsg = convertArabicNumbers(message.toLowerCase().trim());
    const isCustomerServiceRequest = (
        message.trim() === '10' || 
        message.trim() === '١٠' ||
        processedMsg === '10' ||
        message.toLowerCase().includes('خدمة العملاء') ||
        message.toLowerCase().includes('تسيب رسالة') ||
        message.toLowerCase().includes('support') ||
        message.toLowerCase().includes('agent') ||
        message.toLowerCase().includes('human')
    );
    
    if (isCustomerServiceRequest) {
        if (firebase && firebase.saveUserState) {
            await firebase.saveUserState('instance3532', chatId, "human");
        }
        console.log(`👨‍💼 Customer support requested - switching to HUMAN mode`);
        
        const reply = "👤 تم تحويل محادثتك إلى محمد. سيتم الرد عليك يدوياً في أقرب وقت. شكراً لصبرك.";
        
        // إرسال الرد
        try {
            await axios.post(
                `https://api.wapilot.net/api/v2/${activeInstance.id}/send-message`,
                { chat_id: chatId, text: reply },
                { headers: { "token": activeInstance.token, "Content-Type": "application/json" } }
            );
            console.log(`✅ Support reply sent`);
        } catch (error) {
            console.error(`❌ Send error:`, error.response?.data || error.message);
        }
        
        return res.status(200).json({ success: true, mode: "human" });
    }
    
    // 5. العودة للقائمة (إلغاء وضع human)
    const isMenuRequest = message.toLowerCase().includes('menu') || message.includes('قائمة');
    if (isMenuRequest && currentMode === "human") {
        if (firebase && firebase.deleteUserState) {
            await firebase.deleteUserState('instance3532', chatId);
        }
        console.log(`🤖 User requested menu - returning to BOT mode`);
    }
    
    // 6. البحث عن رد تلقائي من config.js
    const autoReply = findAutoReply(message);
    
    if (autoReply) {
        console.log(`🤖 Auto-reply found, sending...`);
        console.log(`📝 Reply preview: ${autoReply.substring(0, 100)}...`);
        
        // حفظ رد البوت في Firebase
        if (firebase && firebase.saveMessage) {
            await firebase.saveMessage('instance3532', cleanNumber, autoReply, true, message);
        }
        
        // إرسال الرد
        try {
            const response = await axios.post(
                `https://api.wapilot.net/api/v2/${activeInstance.id}/send-message`,
                { chat_id: chatId, text: autoReply },
                { headers: { "token": activeInstance.token, "Content-Type": "application/json" } }
            );
            
            console.log(`✅ Auto-reply sent successfully`);
            return res.status(200).json({ success: true, replied: true });
        } catch (error) {
            console.error(`❌ Send error:`, error.response?.data || error.message);
            return res.status(200).json({ success: false, error: error.message });
        }
    } else {
        console.log(`⚠️ No auto-reply found for message: "${message}"`);
        return res.status(200).json({ success: true, replied: false });
    }
};
