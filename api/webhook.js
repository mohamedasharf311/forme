const axios = require('axios');
const { 
    saveUserState, 
    getUserState, 
    deleteUserState, 
    cleanupExpiredUsers,
    saveMessage,
    getMessagesStats
} = require('./firebase-config');

// ==================== معلوماتك الشخصية ====================
const personalInfo = {
    name: "محمد",
    fullName: "محمد ",
    title: "مطور أنظمة ذكاء اصطناعي وبوتات واتساب",
    phone: "201119383101", // رقمك الشخصي
    email: "mohamed@example.com",
    whatsappLink: "https://wa.me/201119383101",
    workingHours: "الرد خلال 24 ساعة كحد أقصى",
    responseTime: "برد خلال 24 ساعة"
};

// ==================== رسالة الترحيب ====================
const welcomeMessage = `👋 أهلاً بيك!

أنا البوت الخاص بـ ${personalInfo.name} 🤖  
بساعدك تفهم كل حاجة عن الخدمات اللي ${personalInfo.name} بيقدمها.

اختار اللي حابب تعرفه 👇

1️⃣ ${personalInfo.name} بيعمل ايه؟
2️⃣ مميزات الخدمة
3️⃣ بيشتغل ازاي؟
4️⃣ بيستخدم AI ولا لا؟
5️⃣ الخدمة بتنفع لمين؟
6️⃣ الفرق بين البوت والموظف
7️⃣ أمثلة استخدام
8️⃣ الأسعار
9️⃣ تبدأ إزاي
🔟 تسيب رسالة لـ ${personalInfo.name}

اكتب الرقم 👇`;

// ==================== الردود حسب الأرقام ====================
const replies = {
    "1": `🤖 ${personalInfo.name} بيعمل ايه؟

${personalInfo.name} بيدي خدمات:
- تصميم بوتات واتساب ذكية
- أنظمة ردود تلقائية للمحلات والشركات
- تطوير أنظمة ذكاء اصطناعي للمحادثة
- إدارة حسابات واتساب Business

يعني بدل ما تشتغل 24 ساعة… البوت يشتغل بدالك 👌`,

    "2": `🔥 مميزات البوت اللي ${personalInfo.name} بيعمله:

✔️ بيرد تلقائي طول اليوم
✔️ بيرد بسرعة وبدون تأخير
✔️ بيشتغل على واتساب / ماسنجر
✔️ ممكن يبعت صور ومنتجات
✔️ يقدر يفهم أسئلة العميل ويرد عليها
✔️ يقلل الأخطاء البشرية
✔️ ممكن يتحول لموظف حقيقي (انت) لو حبيت

يعني نظام كامل مش مجرد ردود 💯`,

    "3": `⚙️ البوت بيشتغل ازاي؟

1. العميل يبعت رسالة
2. البوت يفهم السؤال
3. يرد من البيانات اللي انت محددها
4. لو محتاج تدخل من ${personalInfo.name} → يحولك

كل ده بيحصل في ثواني ⏱️`,

    "4": `🧠 البوت ممكن يشتغل بطريقتين:

1. ردود ثابتة (سريعة وبسيطة)
2. AI ذكي (يفهم ويحلل الكلام)

${personalInfo.name} بيعمل الاتنين حسب احتياجك 👌`,

    "5": `🎯 الخدمة بتنفع لـ:

- محلات أونلاين
- شركات شحن
- عيادات
- مطاعم
- أي بزنس عنده عملاء بيسألوا كتير

لو عندك عملاء → انت محتاج الخدمة دي 💯`,

    "6": `👨‍💼 البوت vs الموظف:

البوت:
✔️ شغال 24 ساعة
✔️ مفيش مرتبات
✔️ مبيغلطش
✔️ بيرد فورًا

الموظف:
❌ وقت محدود
❌ ممكن يتأخر
❌ تكلفة أعلى

عشان كده البوت بقى أساسي لأي بزنس 🚀`,

    "7": `💡 أمثلة استخدام:

- عميل: السعر كام؟ → البوت يرد فورًا
- عميل: عايز أطلب → البوت ياخد البيانات
- عميل: في شحن؟ → البوت يشرح كل التفاصيل

كل ده بدون تدخل منك 👌`,

    "8": `💰 الأسعار اللي بيقدمها ${personalInfo.name}:

- بوت بسيط: من 1500 لـ 3000 جنيه
- بوت AI متطور: من 5000 لـ 15000 جنيه

السعر حسب:
✔️ حجم البزنس
✔️ عدد الردود
✔️ هل فيه AI أو لا

تقدر تبدأ بحاجة بسيطة وتكبر بعد كده 👍`,

    "9": `🚀 عايز تبدأ؟

ابعت لـ ${personalInfo.name}:
1. نوع شغلك
2. عايز البوت يعمل ايه
3. هتستخدمه فين

${personalInfo.name} هيرد عليك في أقرب وقت 👌`,

    "10": `✍️ اكتب كل اللي محتاجه بالتفصيل  
و ${personalInfo.name} هيرد عليك في أقرب وقت 🙏`
};

// ==================== ردود ذكية إضافية ====================
const smartReplies = {
    "عايز بوت": `تمام 🔥

تحب البوت يكون:
1️⃣ يرد بس
2️⃣ يرد ويبيع
3️⃣ نظام كامل (AI + Dashboard)

اختار 👇`,

    "مهتم": `واضح إنك مهتم 👌

تحب أشرحلك:
1️⃣ التفاصيل التقنية
2️⃣ السعر
3️⃣ أمثلة حقيقية

اختار 👇`,

    "شكرا": `🎉 الشكر لله! نورتنا 🙏

لو احتجت حاجة، ${personalInfo.name} موجود. اكتب 'قائمة' في أي وقت`,
    
    "السلام عليكم": `وعليكم السلام ورحمة الله وبركاتة 👋

أنا بوت ${personalInfo.name}، جاهز أخدمك. اختار رقم من القائمة فوق 👆`,
    
    "صباح الخير": `صباح النور والفل والياسمين ☀️

أنا بوت ${personalInfo.name}، ازيك عامل ايه؟ اختار الخدمة اللي عايزها من القائمة 👆`,
    
    "مساء الخير": `مساء الورد والفل والياسمين 🌙

أنا بوت ${personalInfo.name}، جاهز لأمرك. اختار من القائمة 👆`
};

// ==================== كلمات مفتاحية ====================
const menuKeywords = [
    'قائمة', 'menu', 'الرئيسية', 'start', 'بداية', 
    'مرحب', 'اهلا', 'سلام', 'hello', 'hi', 'start',
    'السلام عليكم', 'صباح الخير', 'مساء الخير'
];

// ==================== رد الفل باك ====================
const fallbackReply = `🤔 مش فاهم سؤالك بالضبط.

اكتب رقم من القائمة:
1️⃣ ${personalInfo.name} بيعمل ايه؟
2️⃣ مميزات الخدمة
3️⃣ بيشتغل ازاي؟
4️⃣ بيستخدم AI ولا لا؟
5️⃣ الخدمة بتنفع لمين؟
6️⃣ الفرق بين البوت والموظف
7️⃣ أمثلة استخدام
8️⃣ الأسعار
9️⃣ تبدأ إزاي
🔟 تسيب رسالة لـ ${personalInfo.name}

أو اكتب 'قائمة' 👇`;

// ==================== INSTANCE CONFIGURATION ====================
const INSTANCE_ID = "instance3532";
const INSTANCE = {
    id: INSTANCE_ID,
    token: "yzWzEjmxZpbifuOx6lWafYT3Ng69gaFpJGAdTsVc6N", // استخدم التوكن بتاعك
    name: "محمد - البوت الشخصي",
    phoneNumber: personalInfo.phone,
    active: true
};

// 🔥 رقم هاتف المسؤول (أنت)
const ADMIN_PHONE = personalInfo.phone;

// 🔥 كلمات مفتاحية خاصة بالعملاء
const CUSTOMER_KEYWORDS = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'قائمة', 'menu',
    'سعر', 'بوت', 'خدمة', 'مميزات', 'شكرا', 'السلام', 'صباح', 'مساء',
    'price', 'bot', 'service', 'features', 'thank', 'hello', 'hi'
];

// ==================== CACHE للـ timeouts ====================
const timeouts = {};
const TIMEOUT_DURATION = 30 * 60 * 1000;

async function setAutoTimeout(chatId) {
    if (timeouts[chatId]) {
        clearTimeout(timeouts[chatId]);
        delete timeouts[chatId];
    }
    
    timeouts[chatId] = setTimeout(async () => {
        const currentMode = await getUserState(INSTANCE_ID, chatId);
        if (currentMode === "human") {
            await deleteUserState(INSTANCE_ID, chatId);
            delete timeouts[chatId];
            console.log(`🤖 Auto timeout: User ${chatId} switched back to BOT mode after 30 minutes`);
        }
    }, TIMEOUT_DURATION);
}

// 🔥 دالة لاستخراج رقم الهاتف الحقيقي من @lid أو @c.us
function extractRealPhoneNumber(rawId) {
    if (!rawId) return null;
    
    let cleanNumber = rawId.toString();
    
    // إزالة @c.us أو @lid
    cleanNumber = cleanNumber.replace('@c.us', '');
    cleanNumber = cleanNumber.replace('@lid', '');
    
    // إزالة أي حروف غير أرقام
    cleanNumber = cleanNumber.replace(/[^0-9]/g, '');
    
    // إزالة الصفر في البداية إن وجد
    if (cleanNumber.startsWith('0')) {
        cleanNumber = cleanNumber.substring(1);
    }
    
    // التحقق من صحة الرقم (يبدأ ب 201 لمصر)
    if (cleanNumber.length >= 10 && cleanNumber.length <= 15) {
        return cleanNumber;
    }
    
    return null;
}

// 🔥 دالة لكشف إذا كانت الرسالة من المسؤول
function isMessageFromAdmin(message, isFromMe, chatId, rawPhone) {
    // الطريقة الأولى: من فلاج fromMe
    if (isFromMe) {
        console.log(`✅ Admin detected by fromMe flag`);
        return true;
    }
    
    // الطريقة الثانية: مقارنة رقم الهاتف
    const extractedPhone = extractRealPhoneNumber(rawPhone);
    if (extractedPhone && extractedPhone === ADMIN_PHONE.replace(/[^0-9]/g, '')) {
        console.log(`✅ Admin detected by phone number: ${extractedPhone}`);
        return true;
    }
    
    // الطريقة الثالثة: التحقق من كلمات العميل
    const lowerMsg = message.toLowerCase();
    const hasCustomerKeyword = CUSTOMER_KEYWORDS.some(keyword => 
        lowerMsg.includes(keyword.toLowerCase())
    );
    
    if (hasCustomerKeyword) {
        console.log(`✅ Customer detected - has customer keyword`);
        return false;
    }
    
    // بشكل افتراضي، أي رسالة مش من الكلمات المفتاحية تعتبر من عميل
    console.log(`✅ Customer detected by default - message: "${message}"`);
    return false;
}

// ==================== AUTO REPLY RULES ====================
let autoRules = [
    {
        id: 0,
        keywords: menuKeywords,
        reply: welcomeMessage,
        active: true
    },
    {
        id: 1,
        keywords: ['1', '١'],
        reply: replies["1"],
        active: true
    },
    {
        id: 2,
        keywords: ['2', '٢'],
        reply: replies["2"],
        active: true
    },
    {
        id: 3,
        keywords: ['3', '٣'],
        reply: replies["3"],
        active: true
    },
    {
        id: 4,
        keywords: ['4', '٤'],
        reply: replies["4"],
        active: true
    },
    {
        id: 5,
        keywords: ['5', '٥'],
        reply: replies["5"],
        active: true
    },
    {
        id: 6,
        keywords: ['6', '٦'],
        reply: replies["6"],
        active: true
    },
    {
        id: 7,
        keywords: ['7', '٧'],
        reply: replies["7"],
        active: true
    },
    {
        id: 8,
        keywords: ['8', '٨'],
        reply: replies["8"],
        active: true
    },
    {
        id: 9,
        keywords: ['9', '٩'],
        reply: replies["9"],
        active: true
    },
    {
        id: 10,
        keywords: ['10', '١٠', '0'],
        reply: replies["10"],
        active: true
    },
    {
        id: 11,
        keywords: ['عايز بوت', 'بدي بوت', 'اريد بوت', 'bot'],
        reply: smartReplies["عايز بوت"],
        active: true
    },
    {
        id: 12,
        keywords: ['مهتم', 'interest', 'interested'],
        reply: smartReplies["مهتم"],
        active: true
    },
    {
        id: 13,
        keywords: ['شكرا', 'شكراً', 'تسلم', 'thank', 'thanks'],
        reply: smartReplies["شكرا"],
        active: true
    },
    {
        id: 14,
        keywords: ['السلام عليكم', 'سلام عليكم', 'السلام'],
        reply: smartReplies["السلام عليكم"],
        active: true
    },
    {
        id: 15,
        keywords: ['صباح الخير', 'صباح'],
        reply: smartReplies["صباح الخير"],
        active: true
    },
    {
        id: 16,
        keywords: ['مساء الخير', 'مساء'],
        reply: smartReplies["مساء الخير"],
        active: true
    }
];

function findAutoReply(message) {
    if (!message) return null;
    const lowerMsg = message.toLowerCase().trim();
    
    console.log(`🔍 [${INSTANCE.name}] Searching for reply to: "${lowerMsg}"`);
    
    const numberMap = {
        '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
        '١': 1, '٢': 2, '٣': 3, '٤': 4, '٥': 5, '٦': 6, '٧': 7, '٨': 8, '٩': 9, '١٠': 10
    };
    
    if (numberMap[lowerMsg] !== undefined) {
        const number = numberMap[lowerMsg];
        for (let rule of autoRules) {
            if (!rule.active) continue;
            for (let keyword of rule.keywords) {
                if (keyword === number.toString()) {
                    console.log(`✅ Number match: ${number}`);
                    return rule.reply;
                }
            }
        }
    }
    
    for (let rule of autoRules) {
        if (!rule.active) continue;
        for (let keyword of rule.keywords) {
            const keywordLower = keyword.toLowerCase();
            if (lowerMsg === keywordLower || lowerMsg.includes(keywordLower)) {
                console.log(`✅ Match found: ${keyword}`);
                return rule.reply;
            }
        }
    }
    
    return fallbackReply;
}

async function sendWhatsAppMessage(chat_id, message) {
    try {
        console.log(`📤 [${INSTANCE.name}] Sending to: ${chat_id}`);
        console.log(`📤 Message: ${message.substring(0, 100)}...`);
        
        const response = await axios.post(
            `https://api.wapilot.net/api/v2/${INSTANCE.id}/send-message`,
            { chat_id, text: message },
            { headers: { "token": INSTANCE.token, "Content-Type": "application/json" } }
        );
        
        console.log(`✅ [${INSTANCE.name}] Sent successfully`);
        return { success: true, message: message };
    } catch (error) {
        console.error(`❌ Send failed:`, error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
}

async function initialize() {
    console.log(`🚀 Initializing ${INSTANCE.name}...`);
    await cleanupExpiredUsers(INSTANCE_ID);
    
    const stats = await getMessagesStats(INSTANCE_ID);
    if (stats) {
        console.log(`📊 Stats: ${stats.usersCount} users, ${stats.totalMessages} messages`);
    }
}

initialize();

// ==================== WEBHOOK HANDLER ====================
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    if (req.method === 'GET') {
        return res.status(200).json({ 
            status: 'active',
            bot: personalInfo.name,
            owner: personalInfo.name,
            instance: {
                id: INSTANCE.id,
                name: INSTANCE.name,
                phone: INSTANCE.phoneNumber
            },
            message: 'البوت شغال بكفاءة! 🚀',
            timestamp: new Date().toISOString()
        });
    }
    
    console.log(`📩 [${INSTANCE.name}] Webhook received:`, new Date().toISOString());
    
    const data = req.body;
    let rawChatId = null;
    let message = null;
    let isFromMe = false;
    
    // استخراج البيانات من Webhook
    if (data.payload) {
        rawChatId = data.payload.from;
        message = data.payload.body;
        isFromMe = data.payload.fromMe || false;
    }
    
    if (!rawChatId || !message) {
        console.log(`⚠️ Missing chat_id or message`);
        return res.status(200).json({ received: true, error: 'Missing data' });
    }
    
    console.log(`📱 Raw chat ID: ${rawChatId}`);
    console.log(`💬 Message: ${message}`);
    console.log(`👤 Is from me: ${isFromMe}`);
    
    // استخراج رقم الهاتف الحقيقي
    let realPhoneNumber = extractRealPhoneNumber(rawChatId);
    
    // إذا كان الرقم من نوع LID (مش رقم حقيقي)، نستخدم الـ rawChatId كمعرف مؤقت
    let chatId;
    let storeNumber;
    
    if (realPhoneNumber) {
        // رقم حقيقي
        chatId = `${realPhoneNumber}@c.us`;
        storeNumber = realPhoneNumber;
        console.log(`✅ Real phone number detected: ${realPhoneNumber}`);
    } else {
        // LID - لا يمكن الرد عليه
        console.log(`⚠️ LID detected (cannot reply): ${rawChatId}`);
        return res.status(200).json({ 
            received: true, 
            note: "Cannot reply to LID - need real phone number",
            rawId: rawChatId
        });
    }
    
    // حفظ الرسالة في Firebase
    await saveMessage(INSTANCE_ID, storeNumber, message, isFromMe);
    
    // التحقق إذا كانت الرسالة من المسؤول
    const isAdmin = isMessageFromAdmin(message, isFromMe, chatId, rawChatId);
    console.log(`👑 Is Admin: ${isAdmin}`);
    
    if (isAdmin) {
        await saveUserState(INSTANCE_ID, chatId, "human");
        await setAutoTimeout(chatId);
        console.log(`👨‍💼 [${INSTANCE.name}] BOT STOPPED for 30 minutes (admin detected)`);
        return res.status(200).json({ success: true, mode: "human", detected: "admin" });
    }
    
    // التحقق من وضع المستخدم الحالي
    const currentMode = await getUserState(INSTANCE_ID, chatId);
    console.log(`📊 Current mode: ${currentMode || "bot"}`);
    
    if (currentMode === "human") {
        console.log(`🤫 Human mode active, bot silent`);
        return res.status(200).json({ success: true, mode: "human", silent: true });
    }
    
    // التحقق من طلب خدمة العملاء
    const isCustomerServiceRequest = (
        message.trim() === '6' || 
        message.trim() === '٦' ||
        message.toLowerCase().includes('خدمة العملاء') ||
        message.toLowerCase().includes('support') ||
        message.toLowerCase().includes('agent') ||
        message.toLowerCase().includes('human')
    );
    
    if (isCustomerServiceRequest) {
        await saveUserState(INSTANCE_ID, chatId, "human");
        await setAutoTimeout(chatId);
        console.log(`👨‍💼 User requested human support - BOT STOPPED`);
        
        const reply = "👤 تم تحويل محادثتك إلى محمد. سيتم الرد عليك يدوياً في أقرب وقت. شكراً لصبرك.";
        const result = await sendWhatsAppMessage(chatId, reply);
        if (result.success) {
            await saveMessage(INSTANCE_ID, storeNumber, reply, true);
        }
        return res.status(200).json({ success: true, mode: "human" });
    }
    
    // التحقق من طلب العودة للقائمة
    const isMenuRequest = message.toLowerCase().includes('menu') || message.includes('قائمة');
    if (isMenuRequest && currentMode === "human") {
        if (timeouts[chatId]) {
            clearTimeout(timeouts[chatId]);
            delete timeouts[chatId];
        }
        await deleteUserState(INSTANCE_ID, chatId);
        console.log(`🤖 User returned to BOT mode`);
    }
    
    // البحث عن رد تلقائي
    const autoReply = findAutoReply(message);
    
    if (autoReply) {
        console.log(`🤖 Sending auto-reply...`);
        const result = await sendWhatsAppMessage(chatId, autoReply);
        
        if (result.success) {
            await saveMessage(INSTANCE_ID, storeNumber, autoReply, true);
        }
        
        return res.status(200).json({ success: result.success, replied: true });
    } else {
        console.log(`⚠️ No auto-reply found for: "${message}"`);
        return res.status(200).json({ success: true, replied: false });
    }
};
