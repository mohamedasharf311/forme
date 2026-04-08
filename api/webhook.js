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
            instructions: 'Send POST with phone and message to trigger auto-reply'
        });
    }
    
    // استقبال الرسائل من واتساب
    const data = req.body;
    let phone = null;
    let message = null;
    let isFromMe = false;
    
    // استخراج البيانات من تنسيق وابيلوت
    if (data.payload) {
        phone = data.payload.from;
        message = data.payload.body;
        isFromMe = data.payload.fromMe || false;
    } else if (data.from) {
        phone = data.from;
        message = data.body || data.text;
        isFromMe = data.fromMe || false;
    } else if (data.phone) {
        phone = data.phone;
        message = data.message;
    } else {
        phone = req.body.phone || req.query.phone;
        message = req.body.message || req.body.text || req.query.message;
    }
    
    // إذا كانت الرسالة مني (المسؤول) لا نرد
    if (isFromMe) {
        console.log(`👨‍💼 Admin message, skipping auto-reply`);
        return res.status(200).json({ 
            success: true, 
            replied: false, 
            note: "Message from admin, no auto-reply" 
        });
    }
    
    if (!phone || !message) {
        return res.status(200).json({ 
            success: false, 
            error: 'Missing phone or message',
            received: req.body 
        });
    }
    
    try {
        const result = await processIncomingMessage(phone, message);
        res.status(200).json({ 
            success: true, 
            replied: result.replied,
            autoReply: result.message || null,
            error: result.error || null
        });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(200).json({ error: error.message });
    }
};
