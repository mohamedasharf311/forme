// أضف هذه الدالة في ملف firebase.js إذا لم تكن موجودة

// استرجاع جميع حالات المستخدمين
async function getAllUserStates(instanceId) {
    try {
        if (!database) return {};
        const usersRef = ref(database, `userStates/${instanceId}`);
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
            return snapshot.val();
        }
        return {};
    } catch (error) {
        console.error('❌ Firebase get all states error:', error.message);
        return {};
    }
}

// تصديرها في نهاية الملف
module.exports = {
    saveUserState,
    getUserState,
    deleteUserState,
    getAllUserStates,  // أضف هذا
    cleanupExpiredUsers,
    saveMessage,
    getMessagesStats
};
