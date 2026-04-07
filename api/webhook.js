const axios = require('axios');
const config = require('./config');
const { getActiveInstance, getInstanceById, instanceConfig } = require('./instance3532');

// ==================== دوال مساعدة ====================

// تنظيف رقم الهاتف
function cleanPhoneNumber(phone) {
    let cleanPhone = phone.toString();
    cleanPhone = cleanPhone.replace('@c.us', '');
    cleanPhone = cleanPhone.replace('@lid', '');
    cleanPhone = cleanPhone.replace('+', '');
    cleanPhone = cleanPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
    return cleanPhone;
}

// البحث عن رد مناسب
function findReply(message) {
    if (!message) return null;
    
    const lowerMsg = message.toLowerCase().trim();
    
    // التحقق من كلمات القائمة
    for (let keyword of config.menuKeywords) {
        if (lowerMsg.includes(keyword.toLowerCase())) {
            return config.welcomeMessage;
        }
    }
    
    // التحقق من الأرقام (1-10)
    const numberMap = {
        '1': '1', '2': '2', '3': '3', '4': '4', '5': '5',
        '6': '6', '7': '7', '8': '8', '9': '9', '10': '10',
        '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5',
        '٦': '6', '٧': '7', '٨': '8', '٩': '9', '١٠': '10'
    };
    
    if (numberMap[lowerMsg]) {
        const reply = config.replies[numberMap[lowerMsg]];
        if (reply) return reply;
    }
    
    // التحقق من الردود الذكية
    for (let [keyword, reply] of Object.entries(config.smartReplies)) {
        if (lowerMsg.includes(keyword.toLowerCase())) {
            return reply;
        }
    }
    
    // لو الرقم أكبر من 10
    if (lowerMsg.match(/^[0-9]+$/)) {
        return `❌ الرقم ${message} مش موجود في القائمة.\n\n${config.fallbackReply}`;
    }
    
    // فل باك
    return config.fallbackReply;
}

// إرسال رسالة واتساب
async function sendWhatsAppMessage(instance, phone, message) {
    try {
        const cleanPhone = cleanPhoneNumber(phone);
        const chat_id = `${cleanPhone}@c.us`;
        
        console.log(`📤 [${instance.name}] Sending to: ${cleanPhone}`);
        console.log(`📤 Message: ${message.substring(0, 100)}...`);
        
        const response = await axios.post(
            `https://api.wapilot.net/api/v2/${instance.id}/send-message`,
            { chat_id, text: message },
            { headers: { "token": instance.token, "Content-Type": "application/json" } }
        );
        
        console.log(`✅ [${instance.name}] Sent successfully`);
        return { success: true, data: response.data };
    } catch (error) {
        console.error(`❌ Send failed:`, error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
}

// ==================== WEBHOOK HANDLER ====================
module.exports = async (req, res) => {
    // إعدادات CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // معالجة OPTIONS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // GET request - للاختبار
    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'active',
            bot: `${config.personalInfo.name} 🤖`,
            owner: config.personalInfo.name,
            instance: {
                id: instanceConfig.id,
                name: instanceConfig.name,
                phone: instanceConfig.phoneNumber
            },
            timestamp: new Date().toISOString()
        });
    }
    
    console.log('='.repeat(50));
    console.log(`📩 Webhook received at: ${new Date().toISOString()}`);
    console.log(`📩 Body:`, JSON.stringify(req.body, null, 2));
    
    // استخراج البيانات من الويب هوك
    const data = req.body;
    let rawPhone = null;
    let message = null;
    let incomingInstanceId = null;
    let isFromMe = false;
    
    // تنسيق Wapilot
    if (data.event === 'message' && data.payload) {
        rawPhone = data.payload.from;
        message = data.payload.body;
        isFromMe = data.payload.fromMe || false;
        incomingInstanceId = data.instance_id || data.webhook_id;
    }
    // تنسيقات بديلة
    else if (data.from) {
        rawPhone = data.from;
        message = data.body || data.text;
        isFromMe = data.fromMe || false;
        incomingInstanceId = data.instance_id;
    }
    else if (data.phone) {
        rawPhone = data.phone;
        message = data.message;
    }
    
    if (!rawPhone || !message) {
        console.log('⚠️ Missing phone or message');
        return res.status(200).json({ received: true, error: 'Missing data' });
    }
    
    console.log(`📱 Raw phone: ${rawPhone}`);
    console.log(`💬 Message: "${message}"`);
    console.log(`👤 Is from me: ${isFromMe}`);
    
    // لو الرسالة مني أنا (محمد)، مردش عليها
    if (isFromMe) {
        console.log(`👨‍💼 Message from owner (${config.personalInfo.name}), ignoring...`);
        return res.status(200).json({ success: true, note: "Message from owner, ignored" });
    }
    
    // تحديد الـ instance المناسب
    let targetInstance = null;
    
    if (incomingInstanceId) {
        targetInstance = getInstanceById(incomingInstanceId);
    }
    
    if (!targetInstance || !targetInstance.active) {
        targetInstance = getActiveInstance();
    }
    
    if (!targetInstance) {
        console.log('⚠️ No active instance');
        return res.status(200).json({ received: true, error: 'No active instance' });
    }
    
    // تنظيف رقم الهاتف
    let cleanPhone = cleanPhoneNumber(rawPhone);
    
    // منع الرد على LID
    if (rawPhone.includes('@lid')) {
        console.log(`⚠️ Cannot reply to LID: ${rawPhone}`);
        return res.status(200).json({ received: true, note: 'Cannot reply to LID' });
    }
    
    // التحقق من صحة الرقم
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        console.log(`⚠️ Invalid phone number: ${cleanPhone}`);
        return res.status(200).json({ received: true, error: 'Invalid phone number' });
    }
    
    // البحث عن الرد المناسب
    const autoReply = findReply(message);
    
    if (autoReply) {
        console.log(`🤖 Sending auto-reply to ${cleanPhone}...`);
        const result = await sendWhatsAppMessage(targetInstance, cleanPhone, autoReply);
        
        return res.status(200).json({
            success: result.success,
            replied: true,
            reply_preview: autoReply.substring(0, 100) + (autoReply.length > 100 ? '...' : ''),
            instance: targetInstance.name,
            to: cleanPhone
        });
    } else {
        console.log(`⚠️ No auto-reply found for: "${message}"`);
        return res.status(200).json({
            success: true,
            replied: false,
            reason: 'No matching rule',
            to: cleanPhone
        });
    }
};
