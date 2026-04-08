// api/firebase-stats.js
const firebase = require('./firebase');
const { getActiveInstance } = require('./instance3532');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const instance = getActiveInstance();
    const instanceId = instance?.id || 'instance3532';
    
    const stats = await firebase.getMessagesStats(instanceId);
    const activeUsers = await firebase.getActiveUsers(instanceId);
    const allStats = await firebase.getAllStats();
    const allStates = await firebase.getAllUserStates(instanceId);
    
    res.status(200).json({
        success: true,
        data: {
            instance: {
                id: instanceId,
                name: instance?.name
            },
            statistics: stats,
            activeUsers: activeUsers,
            globalStats: allStats,
            userStates: Object.keys(allStates).length,
            timestamp: new Date().toISOString()
        }
    });
};
