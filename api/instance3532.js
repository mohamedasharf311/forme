// ==================== INSTANCE CONFIGURATION ====================
const instanceConfig = {
    id: "instance3532",
    token: "yzWzEjmxZpbifuOx6lWafYT3Ng69gaFpJGAdTsVc6N",
    name: "محمد - البوت الشخصي",
    phoneNumber: "20119383101",
    active: true,
    description: "بوت خدمة عملاء محمد - أنظمة ذكاء اصطناعي"
};

// قائمة بكل الـ instances
const instances = [
    instanceConfig,
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

function updateInstanceStatus(instanceId, active) {
    const instance = instances.find(inst => inst.id === instanceId);
    if (instance) {
        instance.active = active;
        return true;
    }
    return false;
}

function addInstance(id, token, name, phoneNumber, active = true) {
    const newInstance = {
        id,
        token,
        name,
        phoneNumber,
        active,
        description: `بوت خدمة عملاء - ${name}`,
        createdAt: new Date().toISOString()
    };
    instances.push(newInstance);
    return newInstance;
}

function removeInstance(instanceId) {
    const index = instances.findIndex(inst => inst.id === instanceId);
    if (index !== -1) {
        instances.splice(index, 1);
        return true;
    }
    return false;
}

module.exports = {
    instanceConfig,
    instances,
    getActiveInstance,
    getInstanceById,
    getAllInstances,
    updateInstanceStatus,
    addInstance,
    removeInstance
};
