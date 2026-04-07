// api/health.js
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.status(200).json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
        node: process.version
    });
};
