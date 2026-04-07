// ==================== INSTANCE CONFIGURATION ====================
const instanceConfig = {
    id: "instance3532",
    token: "yzWzEjmxZpbifuOx6lWafYT3Ng69gaFpJGAdTsVc6N", // استخدم التوكن بتاعك
    name: "محمد - البوت الشخصي",
    phoneNumber: "201xxxxxxxxx", // ضع رقمك هنا
    active: true,
    description: "بوت خدمة عملاء محمد - أنظمة ذكاء اصطناعي"
};

// قائمة بكل الـ instances
const instances = [
    instanceConfig,
    // لو عندك instances تانية، ضيفها هنا
];

// دوال مساعدة
function getActiveInstance() {
    return instances.find(inst => inst.active === true) || instances[0];
}

function getInstanceById(id) {
    return instances.find(inst => inst.id === id);
}

function getAllInstances() {
    return instances;
}

module.exports = {
    instanceConfig,
    instances,
    getActiveInstance,
    getInstanceById,
    getAllInstances
};
