const axios = require('axios');

// ==================== معلوماتك الشخصية ====================
const personalInfo = {
    name: "محمد",
    fullName: "محمد",
    title: "مطور أنظمة ذكاء اصطناعي وبوتات واتساب",
    phone: "20119383101",
    email: "mohamed@example.com",
    whatsappLink: "https://wa.me/20119383101"
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

// ==================== ردود ذكية ====================
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
    "شكرا": `🎉 الشكر لله! نورتنا 🙏`,
    "السلام عليكم": `وعليكم السلام ورحمة الله وبركاتة 👋`,
    "صباح الخير": `صباح النور والفل والياسمين ☀️`,
    "مساء الخير": `مساء الورد والفل والياسمين 🌙`
};

// ==================== كلمات القائمة ====================
const menuKeywords = ['قائمة', 'menu', 'الرئيسية', 'start', 'بداية', 'مرحب', 'اهلا', 'سلام', 'hello', 'hi'];

// ==================== رد الفل باك ====================
const fallbackReply = `🤔 مش فاهم سؤالك بالضبط.

اكتب رقم من القائمة:
1️⃣ شرح الخدمة
2️⃣ مميزات الخدمة
3️⃣ طريقة العمل
4️⃣ AI ولا لا
5️⃣ بتنفع لمين
6️⃣ الفرق بين البوت والموظف
7️⃣ أمثلة استخدام
8️⃣ الأسعار
9️⃣ تبدأ إزاي
🔟 رسالة لـ محمد

أو اكتب 'قائمة' 👇`;

// ==================== إعدادات الـ Instance ====================
const INSTANCE_ID = "instance3532";
const INSTANCE = {
    id: INSTANCE_ID,
    token: "yzWzEjmxZpbifuOx6lWafYT3Ng69gaFpJGAdTsVc6N",
    name: "محمد - البوت الشخصي",
    phoneNumber: personalInfo.phone,
    active: true
};

// ==================== تخزين الحالات المؤقت ====================
const userStates = {};
const timeouts = {};
const TIMEOUT_DURATION = 30 * 60 * 1000;

async function saveUserState(chatId, mode) {
    userStates[chatId] = { mode, timestamp: Date.now() };
}

async function getUserState(chatId) {
    const state = userStates[chatId];
    if (state && state.mode === "human") {
        if (Date.now() - state.timestamp >= TIMEOUT_DURATION) {
            delete userStates[chatId];
            return null;
        }
        return state.mode;
    }
    return null;
}

async function deleteUserState(chatId) {
    delete userStates[chatId];
}

async function setAutoTimeout(chatId) {
    if (timeouts[chatId]) clearTimeout(timeouts[chatId]);
    timeouts[chatId] = setTimeout(async () => {
        if (userStates[chatId]?.mode === "human") {
            await deleteUserState(chatId);
            console.log(`🤖 Auto timeout: ${chatId} back to BOT`);
        }
        delete timeouts[chatId];
    }, TIMEOUT_DURATION);
}

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
function findAutoReply(message) {
    if (!message) return null;
    const lowerMsg = message.toLowerCase().trim();
    
    console.log(`🔍 Searching for: "${lowerMsg}"`);
    
    // كلمات القائمة
    for (let keyword of menuKeywords) {
        if (lowerMsg.includes(keyword.toLowerCase())) {
            return welcomeMessage;
        }
    }
    
    // الأرقام
    const numberMap = {
        '1': '1', '2': '2', '3': '3', '4': '4', '5': '5',
        '6': '6', '7': '7', '8': '8', '9': '9', '10': '10',
        '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5',
        '٦': '6', '٧': '7', '٨': '8', '٩': '9', '١٠': '10'
    };
    
    if (numberMap[lowerMsg]) {
        const reply = replies[numberMap[lowerMsg]];
        if (reply) return reply;
    }
    
    // الردود الذكية
    for (let [keyword, reply] of Object.entries(smartReplies)) {
        if (lowerMsg.includes(keyword.toLowerCase())) {
            return reply;
        }
    }
    
    // رقم مش موجود
    if (lowerMsg.match(/^[0-9]+$/)) {
        return `❌ الرقم ${message} مش موجود.\n\n${fallbackReply}`;
    }
    
    return fallbackReply;
}

// إرسال رسالة واتساب
async function sendWhatsAppMessage(chatId, message) {
    try {
        console.log(`📤 Sending to: ${chatId}`);
        console.log(`📤 Message: ${message.substring(0, 100)}...`);
        
        const response = await axios.post(
            `https://api.wapilot.net/api/v2/${INSTANCE.id}/send-message`,
            { chat_id: chatId, text: message },
            { headers: { "token": INSTANCE.token, "Content-Type": "application/json" } }
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
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // GET للاختبار
    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'active',
            bot: personalInfo.name,
            instance: {
                id: INSTANCE.id,
                name: INSTANCE.name,
                phone: INSTANCE.phoneNumber
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
    
    // لو الرسالة مني (محمد) - ندخل وضع human
    if (isFromMe) {
        await saveUserState(chatId, "human");
        await setAutoTimeout(chatId);
        console.log(`👨‍💼 Admin mode activated for 30 minutes`);
        return res.status(200).json({ success: true, mode: "human", detected: "admin" });
    }
    
    // التحقق من وضع المستخدم
    const currentMode = await getUserState(chatId);
    console.log(`📊 Current mode: ${currentMode || "bot"}`);
    
    if (currentMode === "human") {
        console.log(`🤫 Human mode active, bot silent`);
        return res.status(200).json({ success: true, mode: "human", silent: true });
    }
    
    // طلب خدمة العملاء (رقم 6)
    const isCustomerServiceRequest = (
        message.trim() === '6' || 
        message.trim() === '٦' ||
        message.toLowerCase().includes('خدمة العملاء') ||
        message.toLowerCase().includes('support') ||
        message.toLowerCase().includes('agent') ||
        message.toLowerCase().includes('human')
    );
    
    if (isCustomerServiceRequest) {
        await saveUserState(chatId, "human");
        await setAutoTimeout(chatId);
        console.log(`👨‍💼 Customer support requested - switching to human mode`);
        
        const reply = "👤 تم تحويل محادثتك إلى محمد. سيتم الرد عليك يدوياً في أقرب وقت. شكراً لصبرك.";
        await sendWhatsAppMessage(chatId, reply);
        return res.status(200).json({ success: true, mode: "human" });
    }
    
    // العودة للقائمة
    const isMenuRequest = message.toLowerCase().includes('menu') || message.includes('قائمة');
    if (isMenuRequest && currentMode === "human") {
        if (timeouts[chatId]) {
            clearTimeout(timeouts[chatId]);
            delete timeouts[chatId];
        }
        await deleteUserState(chatId);
        console.log(`🤖 User returned to BOT mode`);
    }
    
    // البحث عن رد تلقائي
    const autoReply = findAutoReply(message);
    
    if (autoReply) {
        console.log(`🤖 Sending auto-reply...`);
        const result = await sendWhatsAppMessage(chatId, autoReply);
        return res.status(200).json({ success: result.success, replied: true });
    } else {
        console.log(`⚠️ No auto-reply found`);
        return res.status(200).json({ success: true, replied: false });
    }
};
