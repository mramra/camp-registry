// js/rxdb/offline-db.js
let rxdbInstance = null;

async function initRxDB() {
    if (rxdbInstance) return rxdbInstance;

    try {
        // انتظر تحميل RxDB
        if (typeof RxDB === 'undefined') {
            console.error("RxDB لم يتم تحميله");
            return null;
        }

        rxdbInstance = await RxDB.createRxDatabase({
            name: window.RXDB_CONFIG.databaseName,
            storage: RxDB.getRxStorageDexie(),
            ignoreDuplicate: true
        });

        console.log("✅ RxDB تم تهيئته بنجاح (Parallel Mode)");
        return rxdbInstance;

    } catch (error) {
        console.error("❌ خطأ في تهيئة RxDB:", error);
        return null;
    }
}

// جعلها متاحة عالمياً
window.rxdb = {
    init: initRxDB,
    getInstance: () => rxdbInstance
};
