const axios = require('axios');
const { getActiveInstance, getInstanceById, getAllInstances } = require('./instance3532');
const config = require('./config');

function cleanPhoneNumber(phone) {
    let cleanPhone = phone.toString();
    cleanPhone = cleanPhone.replace('@c.us', '');
    cleanPhone = cleanPhone.replace('@lid', '');
    cleanPhone = cleanPhone.replace('+', '');
    cleanPhone = cleanPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
    return cleanPhone;
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method === 'GET') {
        return res.status(200).json({
            bot: `${config.personalInfo.name} 🤖`,
            owner: config.personalInfo.name,
            instructions: "استخدم POST مع { phone, message, instanceId }",
            activeInstances: getAllInstances().filter(i => i.active).map(i => ({ 
                id: i.id, 
                name: i.name,
                phone: i.phoneNumber
            }))
        });
    }
    
    const { phone, message, instanceId } = req.body;
    
    if (!phone || !message) {
        return res.status(400).json({ error: 'Phone and message are required' });
    }
    
    let targetInstance = null;
    
    if (instanceId) {
        targetInstance = getInstanceById(instanceId);
    }
    
    if (!targetInstance || !targetInstance.active) {
        targetInstance = getActiveInstance();
    }
    
    if (!targetInstance) {
        return res.status(400).json({ error: 'No active instance available' });
    }
    
    try {
        const cleanPhone = cleanPhoneNumber(phone);
        const chat_id = `${cleanPhone}@c.us`;
        
        const response = await axios.post(
            `https://api.wapilot.net/api/v2/${targetInstance.id}/send-message`,
            { chat_id, text: message },
            { headers: { "token": targetInstance.token, "Content-Type": "application/json" } }
        );
        
        res.status(200).json({
            success: true,
            data: response.data,
            instance: targetInstance.name,
            to: cleanPhone,
            from: config.personalInfo.name
        });
    } catch (error) {
        console.error('Send error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data || error.message,
            instance: targetInstance.name
        });
    }
};
