// js/rxdb/sync-manager.js
async function startRxDBSync(supabaseClient) {
    const db = await window.rxdb.init();
    if (!db) return;

    console.log("🔄 RxDB جاهز للمزامنة (حالياً في وضع الاختبار)");
    // سنضيف المزامنة لاحقاً
}

window.startRxDBSync = startRxDBSync;
