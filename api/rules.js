const config = require('./config');
const { getActiveInstance } = require('./instance3532');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method === 'GET') {
        const rules = {
            owner: config.personalInfo.name,
            welcomeMessage: config.welcomeMessage,
            replies: config.replies,
            smartReplies: config.smartReplies,
            fallbackReply: config.fallbackReply,
            menuKeywords: config.menuKeywords,
            totalReplies: Object.keys(config.replies).length,
            totalSmartReplies: Object.keys(config.smartReplies).length
        };
        
        return res.status(200).json(rules);
    }
    
    res.status(405).json({ error: 'Method not allowed' });
};
