// api/webhook.js
const axios = require('axios');
const config = require('./config');
const { getActiveInstance } = require('./instance3532');
const firebase = require('./firebase');

// دالة تحويل الأرقام العربية إلى إنجليزية
function convertArabicNumbers(text) {
    const arabicNumbers = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };
    
    let converted = text;
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

// دالة البحث عن رد تلقائي
function findAutoReply(message, originalMessage) {
    if (!message) return null;
    
    // تحويل الأرقام العربية إلى إنجليزية
    let processedMessage = convertArabicNumbers(message.toLowerCase().trim());
    let originalProcessed = originalMessage ? convertArabicNumbers(originalMessage) : processedMessage;
    
    console.log(`🔍 Original: "${originalMessage}"`);
    console.log(`🔍 Processed: "${processedMessage}"`);
    
    // 1. التحقق من كلمات القائمة
    for (let keyword of config.menuKeywords) {
        if (processedMessage.includes(keyword.toLowerCase()) || 
            originalProcessed.includes(keyword.toLowerCase())) {
            console.log(`✅ Menu keyword matched: ${keyword}`);
            return config.welcomeMessage;
        }
    }
    
    // 2. التحقق من الأرقام (بعد التحويل)
    const numberMap = {
        '1': '1', '2': '2', '3': '3', '4': '4', '5': '5',
        '6': '6', '7': '7', '8': '8', '9': '9', '10': '10'
    };
    
    // تجربة الرقم من الرسالة المعالجة
    if (numberMap[processedMessage]) {
        const reply = config.replies[numberMap[processedMessage]];
        if (reply) {
            console.log(`✅ Number matched: ${processedMessage}`);
            return reply;
        }
    }
    
    // تجربة الرقم من الرسالة الأصلية (بعد تحويل الأرقام العربية)
    if (numberMap[originalProcessed]) {
        const reply = config.replies[numberMap[originalProcessed]];
        if (reply) {
            console.log(`✅ Number matched from original: ${originalProcessed}`);
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
    
    // 4. التحقق من رقم غير موجود
    if (processedMessage.match(/^[0-9]+$/) || originalProcessed.match(/^[0-9]+$/)) {
        console.log(`⚠️ Number not found: ${processedMessage}`);
        return `❌ الرقم ${originalMessage} مش موجود.\n\n${config.fallbackReply}`;
    }
    
    return config.fallbackReply;
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
        const stats = await firebase.getMessagesStats('instance3532');
        return res.status(200).json({
            status: 'active',
            bot: config.personalInfo.name,
            firebase: 'connected',
            stats: stats,
            timestamp: new Date().toISOString()
        });
    }
    
    console.log('='.repeat(50));
    console.log(`📩 Webhook received at: ${new Date().toISOString()}`);
    console.log(`📩 Body:`, JSON.stringify(req.body, null, 2));
    
    const data = req.body;
    let rawChatId = null;
    let message = null;
    let isFromMe = false;
    
    // استخراج البيانات من مختلف التنسيقات
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
    
    // تنظيف chatId
    let chatId = rawChatId;
    if (!chatId.includes('@')) {
        chatId = `${chatId}@c.us`;
    }
    
    // تنظيف رقم الهاتف
    let cleanNumber = cleanPhoneNumber(rawChatId);
    
    console.log(`📱 Raw ChatId: ${rawChatId}`);
    console.log(`📱 Clean Number: ${cleanNumber}`);
    console.log(`📱 ChatId for sending: ${chatId}`);
    console.log(`💬 Original Message: "${message}"`);
    console.log(`👤 Is from me: ${isFromMe}`);
    
    // حفظ الرسالة في Firebase
    await firebase.saveMessage('instance3532', cleanNumber, message, isFromMe);
    
    // الحصول على الإنستانس النشط
    const activeInstance = getActiveInstance();
    if (!activeInstance) {
        console.log('⚠️ No active instance');
        return res.status(200).json({ error: 'No active instance' });
    }
    
    console.log(`🤖 Using instance: ${activeInstance.name} (${activeInstance.id})`);
    
    // لو الرسالة من المسؤول - ندخل وضع human
    if (isFromMe) {
        await firebase.saveUserState('instance3532', chatId, "human");
        console.log(`👨‍💼 Admin mode activated for 30 minutes`);
        return res.status(200).json({ success: true, mode: "human", admin: true });
    }
    
    // التحقق من وضع المستخدم
    let currentMode = await firebase.getUserState('instance3532', chatId);
    console.log(`📊 Current mode: ${currentMode || "bot"}`);
    
    if (currentMode === "human") {
        console.log(`🤫 Human mode active, bot silent (waiting for admin response)`);
        return res.status(200).json({ success: true, mode: "human", silent: true });
    }
    
    // طلب خدمة العملاء (رقم 10)
    const processedMsgForSupport = convertArabicNumbers(message.toLowerCase());
    const isCustomerServiceRequest = (
        message.trim() === '10' || 
        message.trim() === '١٠' ||
        processedMsgForSupport === '10' ||
        message.toLowerCase().includes('خدمة العملاء') ||
        message.toLowerCase().includes('تسيب رسالة') ||
        message.toLowerCase().includes('support') ||
        message.toLowerCase().includes('agent') ||
        message.toLowerCase().includes('human')
    );
    
    if (isCustomerServiceRequest) {
        await firebase.saveUserState('instance3532', chatId, "human");
        console.log(`👨‍💼 Customer support requested - switching to human mode`);
        
        const reply = "👤 تم تحويل محادثتك إلى محمد. سيتم الرد عليك يدوياً في أقرب وقت. شكراً لصبرك.";
        await firebase.saveMessage('instance3532', cleanNumber, reply, true, message);
        
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
    
    // العودة للقائمة
    const isMenuRequest = message.toLowerCase().includes('menu') || 
                          message.includes('قائمة') ||
                          convertArabicNumbers(message).toLowerCase().includes('menu');
    
    if (isMenuRequest && currentMode === "human") {
        await firebase.deleteUserState('instance3532', chatId);
        console.log(`🤖 User returned to BOT mode`);
    }
    
    // البحث عن رد تلقائي
    const autoReply = findAutoReply(message, message);
    
    if (autoReply) {
        console.log(`🤖 Auto-reply found, sending...`);
        console.log(`📝 Reply preview: ${autoReply.substring(0, 100)}...`);
        
        // حفظ رد البوت في Firebase
        await firebase.saveMessage('instance3532', cleanNumber, autoReply, true, message);
        
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
