
// js/rxdb/rxdb-config.js
const RXDB_CONFIG = {
    databaseName: 'camp_registry_db',
    collections: {
        families: {
            version: 0,
            primaryKey: 'id',
            type: 'object',
            properties: {
                id: { type: 'string', maxLength: 100 },
                name: { type: 'string' },
                campId: { type: 'string' },
                registrationDate: { type: 'string', format: 'date-time' },
                status: { type: 'string', enum: ['active', 'inactive', 'pending'] },
                _deleted: { type: 'boolean', default: false },
                _modified: { type: 'string', format: 'date-time' }
            },
            required: ['id', 'name', 'campId']
        },
        // أضف باقي الجداول (members, distributions...) حسب الحاجة
    }
};

window.RXDB_CONFIG = RXDB_CONFIG;
