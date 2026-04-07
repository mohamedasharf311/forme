const config = require('./config');
const { getAllInstances, getActiveInstance } = require('./instance3532');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method === 'GET') {
        const stats = {
            bot: {
                name: `${config.personalInfo.name} 🤖`,
                owner: config.personalInfo.name,
                ownerPhone: config.personalInfo.phone,
                status: "active",
                version: "2.0.0"
            },
            replies: {
                menuReplies: Object.keys(config.replies).length,
                smartReplies: Object.keys(config.smartReplies).length,
                total: Object.keys(config.replies).length + Object.keys(config.smartReplies).length,
                hasFallback: true
            },
            instances: getAllInstances().map(inst => ({
                id: inst.id,
                name: inst.name,
                phone: inst.phoneNumber,
                active: inst.active
            })),
            timestamp: new Date().toISOString()
        };
        
        return res.status(200).json(stats);
    }
    
    res.status(405).json({ error: 'Method not allowed' });
};
