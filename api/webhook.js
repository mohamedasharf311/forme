// api/webhook.js
const { processIncomingMessage } = require('./auto-reply');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // واجهة GET للاختبار
    if (req.method === 'GET') {
        return res.status(200).json({ 
            status: 'ok', 
            message: 'Webhook is working!',
            instructions: 'Send POST with message to trigger auto-reply'
        });
    }
    
    console.log('='.repeat(50));
    console.log(`📩 Webhook received at: ${new Date().toISOString()}`);
    
    // استقبال الرسائل من واتساب
    const data = req.body;
    let chatId = null;
    let message = null;
    let isFromMe = false;
    
    // استخراج البيانات من تنسيق وابيلوت
    if (data.payload) {
        chatId = data.payload.from;
        message = data.payload.body;
        isFromMe = data.payload.fromMe || false;
    } else if (data.from) {
        chatId = data.from;
        message = data.body || data.text;
        isFromMe = data.fromMe || false;
    } else if (data.phone) {
        chatId = data.phone;
        message = data.message;
    } else {
        chatId = req.body.chatId || req.body.from || req.query.chatId;
        message = req.body.message || req.body.text || req.query.message;
    }
    
    if (!chatId || !message) {
        console.log('⚠️ Missing chatId or message');
        return res.status(200).json({ 
            success: false, 
            error: 'Missing chatId or message',
            received: req.body 
        });
    }
    
    console.log(`📱 ChatId: ${chatId}`);
    console.log(`💬 Message: "${message}"`);
    console.log(`👤 Is from me: ${isFromMe}`);
    
    try {
        // معالجة الرسالة والرد بنفس chatId
        const result = await processIncomingMessage(chatId, message, isFromMe);
        
        res.status(200).json({ 
            success: true, 
            replied: result.replied,
            autoReply: result.message || null,
            to_chatId: chatId,
            error: result.error || null
        });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(200).json({ success: false, error: error.message });
    }
};
