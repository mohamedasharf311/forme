// api/webhook.js (الجزء العلوي - أضف هذه الأسطر)
const axios = require('axios');
const firebase = require('./firebase');

// ==================== معلوماتك الشخصية ====================
const personalInfo = {
    name: "محمد",
    fullName: "محمد",
    title: "مطور أنظمة ذكاء اصطناعي وبوتات واتساب",
    phone: "20119383101",
    email: "mohamed@example.com",
    whatsappLink: "https://wa.me/20119383101"
};

// ==================== باقي الكود كما هو ====================
// ... (welcomeMessage, replies, smartReplies, menuKeywords, fallbackReply بنفس الشكل)

// ==================== إعدادات الـ Instance ====================
const INSTANCE_ID = "instance3532";
const INSTANCE = {
    id: INSTANCE_ID,
    token: "yzWzEjmxZpbifuOx6lWafYT3Ng69gaFpJGAdTsVc6N",
    name: "محمد - البوت الشخصي",
    phoneNumber: personalInfo.phone,
    active: true
};

// ==================== WEBHOOK HANDLER (محدث لاستخدام Firebase) ====================
module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // GET للاختبار
    if (req.method === 'GET') {
        // جلب إحصائيات من Firebase
        const stats = await firebase.getMessagesStats(INSTANCE_ID);
        
        return res.status(200).json({
            status: 'active',
            bot: personalInfo.name,
            instance: {
                id: INSTANCE.id,
                name: INSTANCE.name,
                phone: INSTANCE.phoneNumber
            },
            firebase: {
                connected: true,
                stats: stats
            },
            endpoints: {
                webhook: '/api/webhook',
                send: '/api/send'
            },
            timestamp: new Date().toISOString()
        });
    }
    
    console.log('='.repeat(50));
    console.log(`📩 Webhook received at: ${new Date().toISOString()}`);
    console.log(`📩 Body:`, JSON.stringify(req.body, null, 2));
    
    // استخراج البيانات
    const data = req.body;
    let rawChatId = null;
    let message = null;
    let isFromMe = false;
    
    // نفس تنسيق الكود الأصلي
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
    
    // تجهيز الـ chatId
    let chatId = rawChatId;
    if (!chatId.includes('@')) {
        chatId = `${chatId}@c.us`;
    }
    
    // تنظيف الرقم للتخزين
    let cleanNumber = rawChatId.toString();
    cleanNumber = cleanNumber.replace('@c.us', '').replace('@lid', '').replace(/[^0-9]/g, '');
    if (cleanNumber.startsWith('0')) cleanNumber = cleanNumber.substring(1);
    
    console.log(`📱 ChatId: ${chatId}`);
    console.log(`💬 Message: "${message}"`);
    console.log(`👤 Is from me: ${isFromMe}`);
    
    // حفظ الرسالة في Firebase
    await firebase.saveMessage(INSTANCE_ID, cleanNumber, message, isFromMe);
    
    // لو الرسالة مني (محمد) - ندخل وضع human
    if (isFromMe) {
        await firebase.saveUserState(INSTANCE_ID, cleanNumber, "human");
        console.log(`👨‍💼 Admin mode activated for ${cleanNumber}`);
        return res.status(200).json({ success: true, mode: "human", detected: "admin" });
    }
    
    // التحقق من وضع المستخدم من Firebase
    let currentMode = await firebase.getUserState(INSTANCE_ID, cleanNumber);
    console.log(`📊 Current mode: ${currentMode || "bot"}`);
    
    if (currentMode === "human") {
        console.log(`🤫 Human mode active, bot silent`);
        return res.status(200).json({ success: true, mode: "human", silent: true });
    }
    
    // طلب خدمة العملاء (رقم 10 أو كلمات مفتاحية)
    const isCustomerServiceRequest = (
        message.trim() === '10' || 
        message.trim() === '١٠' ||
        message.toLowerCase().includes('خدمة العملاء') ||
        message.toLowerCase().includes('support') ||
        message.toLowerCase().includes('agent') ||
        message.toLowerCase().includes('human') ||
        message.toLowerCase().includes('تسيب رسالة')
    );
    
    if (isCustomerServiceRequest) {
        await firebase.saveUserState(INSTANCE_ID, cleanNumber, "human");
        console.log(`👨‍💼 Customer support requested - switching to human mode`);
        
        const reply = "👤 تم تحويل محادثتك إلى محمد. سيتم الرد عليك يدوياً في أقرب وقت. شكراً لصبرك.";
        
        // حفظ الرد في Firebase
        await firebase.saveMessage(INSTANCE_ID, cleanNumber, reply, true, null);
        
        await sendWhatsAppMessage(chatId, reply);
        return res.status(200).json({ success: true, mode: "human" });
    }
    
    // البحث عن رد تلقائي
    const autoReply = findAutoReply(message);
    
    if (autoReply) {
        console.log(`🤖 Sending auto-reply...`);
        
        // حفظ الرد في Firebase
        await firebase.saveMessage(INSTANCE_ID, cleanNumber, autoReply, true, message);
        
        const result = await sendWhatsAppMessage(chatId, autoReply);
        return res.status(200).json({ success: result.success, replied: true });
    } else {
        console.log(`⚠️ No auto-reply found`);
        return res.status(200).json({ success: true, replied: false });
    }
};

// دوال مساعدة (نفس الكود الأصلي)
function cleanPhoneNumber(phone) { /* ... */ }
function findAutoReply(message) { /* ... */ }
async function sendWhatsAppMessage(chatId, message) { /* ... */ }
