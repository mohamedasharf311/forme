// api/webhook.js
const axios = require('axios');
const config = require('./config');
const { getActiveInstance } = require('./instance3532');
const firebase = require('./firebase');

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
            firebase: 'connected',
            timestamp: new Date().toISOString()
        });
    }
    
    console.log('='.repeat(50));
    console.log(`📩 Webhook received at: ${new Date().toISOString()}`);
    
    const data = req.body;
    let rawChatId = null;
    let message = null;
    let isFromMe = false;
    
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
    
    let chatId = rawChatId;
    if (!chatId.includes('@')) {
        chatId = `${chatId}@c.us`;
    }
    
    let cleanNumber = rawChatId.toString();
    cleanNumber = cleanNumber.replace('@c.us', '').replace('@lid', '').replace(/[^0-9]/g, '');
    if (cleanNumber.startsWith('0')) cleanNumber = cleanNumber.substring(1);
    
    console.log(`📱 ChatId: ${chatId}`);
    console.log(`💬 Message: "${message}"`);
    console.log(`👤 Is from me: ${isFromMe}`);
    
    // حفظ الرسالة في Firebase
    await firebase.saveMessage('instance3532', cleanNumber, message, isFromMe);
    
    // الحصول على الإنستانس النشط
    const activeInstance = getActiveInstance();
    if (!activeInstance) {
        console.log('⚠️ No active instance');
        return res.status(200).json({ error: 'No active instance' });
    }
    
    // لو الرسالة من المسؤول - ندخل وضع human
    if (isFromMe) {
        await firebase.saveUserState('instance3532', chatId, "human");
        console.log(`👨‍💼 Admin mode activated`);
        return res.status(200).json({ success: true, mode: "human" });
    }
    
    // التحقق من وضع المستخدم
    const currentMode = await firebase.getUserState('instance3532', chatId);
    console.log(`📊 Current mode: ${currentMode || "bot"}`);
    
    if (currentMode === "human") {
        console.log(`🤫 Human mode active, bot silent`);
        return res.status(200).json({ success: true, mode: "human", silent: true });
    }
    
    // البحث عن رد تلقائي من config.js
    let autoReply = null;
    
    // التحقق من كلمات القائمة
    for (let keyword of config.menuKeywords) {
        if (message.toLowerCase().includes(keyword.toLowerCase())) {
            autoReply = config.welcomeMessage;
            break;
        }
    }
    
    // التحقق من الأرقام
    if (!autoReply) {
        const numberMap = {
            '1': '1', '2': '2', '3': '3', '4': '4', '5': '5',
            '6': '6', '7': '7', '8': '8', '9': '9', '10': '10'
        };
        if (numberMap[message.trim()]) {
            autoReply = config.replies[numberMap[message.trim()]];
        }
    }
    
    // التحقق من الردود الذكية
    if (!autoReply) {
        for (let [keyword, reply] of Object.entries(config.smartReplies)) {
            if (message.toLowerCase().includes(keyword.toLowerCase())) {
                autoReply = reply;
                break;
            }
        }
    }
    
    // طلب خدمة العملاء (رقم 10)
    if (message.trim() === '10' || message.toLowerCase().includes('تسيب رسالة')) {
        await firebase.saveUserState('instance3532', chatId, "human");
        autoReply = "👤 تم تحويل محادثتك إلى محمد. سيتم الرد عليك يدوياً في أقرب وقت.";
    }
    
    if (!autoReply) {
        autoReply = config.fallbackReply;
    }
    
    // إرسال الرد
    try {
        const response = await axios.post(
            `https://api.wapilot.net/api/v2/${activeInstance.id}/send-message`,
            { chat_id: chatId, text: autoReply },
            { headers: { "token": activeInstance.token, "Content-Type": "application/json" } }
        );
        
        // حفظ رد البوت في Firebase
        await firebase.saveMessage('instance3532', cleanNumber, autoReply, true, message);
        
        console.log(`✅ Auto-reply sent`);
        res.status(200).json({ success: true, replied: true });
    } catch (error) {
        console.error('❌ Send error:', error.response?.data || error.message);
        res.status(200).json({ success: false, error: error.message });
    }
};
