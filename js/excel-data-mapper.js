/**
 * Excel Data Mapper
 * محول بيانات Excel المتقدم
 * 
 * يقوم بفهم وتحويل بنية بيانات Excel المختلفة
 * والتأكد من الحفاظ على معلومات أرباب الأسر
 */

class ExcelDataMapper {
    constructor() {
        this.familiesMap = new Map(); // خريطة الأسر برقم الأسرة
        this.familyHeadsMap = new Map(); // خريطة أرباب الأسر
    }

    /**
     * تحويل بيانات Excel الخام إلى بنية موحدة
     * يدعم تنسيقات مختلفة من ملفات Excel
     * @param {Array} worksheets - صفائح العمل
     * @returns {Object} البيانات المحولة
     */
    mapExcelData(worksheets) {
        const result = {
            families: [],
            members: [],
            healthStatus: [],
            errors: [],
            familyHeadMap: {} // خريطة للعلاقة بين أرقام الأسر وأرباب الأسر
        };

        try {
            // البحث عن جميع الصفائح المتاحة
            const familiesSheet = this.findSheet(worksheets, ['أسر', 'families', 'Families']);
            const membersSheet = this.findSheet(worksheets, ['أفراد', 'members', 'Members', 'أعضاء']);
            const healthSheet = this.findSheet(worksheets, ['صحة', 'health', 'Health', 'الحالة الصحية']);

            // معالجة صفحة الأسر (إن وجدت)
            if (familiesSheet) {
                this.processFamiliesSheet(familiesSheet, result);
            }

            // معالجة صفحة الأعضاء/الأفراد
            if (membersSheet) {
                this.processMembersSheet(membersSheet, result);
            }

            // معالجة صفحة الحالة الصحية
            if (healthSheet) {
                this.processHealthSheet(healthSheet, result);
            } else {
                result.errors.push('لم يتم العثور على صفحة الحالة الصحية');
            }

            // بناء خريطة أرباب الأسر
            result.familyHeadMap = this.buildFamilyHeadMap(result);

        } catch (error) {
            result.errors.push(`خطأ في تحويل البيانات: ${error.message}`);
        }

        return result;
    }

    /**
     * البحث عن صفحة بأسماء مختلفة
     * @param {Array} sheets - صفائح العمل
     * @param {Array} names - الأسماء المحتملة
     * @returns {Object} الصفحة المطلوبة أو null
     */
    findSheet(sheets, names) {
        if (!sheets || sheets.length === 0) return null;

        return sheets.find(sheet => 
            names.some(name => 
                sheet.name && sheet.name.toLowerCase().includes(name.toLowerCase())
            )
        );
    }

    /**
     * معالجة صفحة الأسر
     * @param {Object} sheet - الصفحة
     * @param {Object} result - كائن النتيجة
     */
    processFamiliesSheet(sheet, result) {
        const data = sheet.data || [];
        if (data.length === 0) return;

        const headers = this.extractHeaders(data[0]);

        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.every(cell => !cell)) continue;

            const family = {
                familyId: row[headers.familyId],
                familyHeadName: row[headers.familyHeadName] || row[headers.headName],
                familyHeadId: row[headers.familyHeadId] || row[headers.headId],
                familyHeadPhone: row[headers.phone],
                familySize: row[headers.familySize],
                address: row[headers.address],
                rawRow: row
            };

            if (family.familyId) {
                result.families.push(family);
                this.familiesMap.set(String(family.familyId), family);
                
                // إضافة رب الأسرة إلى خريطة أرباب الأسر
                if (family.familyHeadName) {
                    this.familyHeadsMap.set(String(family.familyId), {
                        name: family.familyHeadName,
                        id: family.familyHeadId
                    });
                }
            }
        }
    }

    /**
     * معالجة صفحة الأفراد/الأعضاء
     * @param {Object} sheet - الصفحة
     * @param {Object} result - كائن النتيجة
     */
    processMembersSheet(sheet, result) {
        const data = sheet.data || [];
        if (data.length === 0) return;

        const headers = this.extractHeaders(data[0]);

        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.every(cell => !cell)) continue;

            const familyId = String(row[headers.familyId] || '');
            const member = {
                memberId: row[headers.memberId],
                memberName: row[headers.memberName],
                familyId: familyId,
                age: this.parseAge(row[headers.age]),
                dateOfBirth: row[headers.dateOfBirth],
                gender: row[headers.gender],
                relationship: row[headers.relationship], // العلاقة برب الأسرة (رب أسرة، أم، ابن، إلخ)
                rawRow: row
            };

            if (member.memberId && familyId) {
                result.members.push(member);

                // إذا كان هذا الفرد هو رب الأسرة، تحديث خريطة أرباب الأسر
                if (member.relationship === 'رب أسرة' || member.relationship === 'head' || member.relationship === 'Head') {
                    this.familyHeadsMap.set(familyId, {
                        name: member.memberName,
                        id: member.memberId
                    });
                }
            }
        }
    }

    /**
     * معالجة صفحة الحالة الصحية
     * @param {Object} sheet - الصفحة
     * @param {Object} result - كائن النتيجة
     */
    processHealthSheet(sheet, result) {
        const data = sheet.data || [];
        if (data.length === 0) return;

        const headers = this.extractHeaders(data[0]);

        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.every(cell => !cell)) continue;

            const familyId = String(row[headers.familyId] || '');
            const memberId = row[headers.memberId];

            // البحث عن معلومات الفرد من قائمة الأفراد
            let memberInfo = result.members.find(m => String(m.memberId) === String(memberId));

            // البحث عن معلومات رب الأسرة من الخريطة
            let familyHeadInfo = this.familyHeadsMap.get(familyId);

            const healthRecord = {
                memberId: memberId,
                memberName: row[headers.memberName] || (memberInfo ? memberInfo.memberName : null),
                familyId: familyId,
                age: this.parseAge(row[headers.age] || (memberInfo ? memberInfo.age : null)),
                gender: row[headers.gender] || (memberInfo ? memberInfo.gender : null),
                dateOfBirth: row[headers.dateOfBirth] || (memberInfo ? memberInfo.dateOfBirth : null),
                
                // معلومات رب الأسرة - من خريطة أرباب الأسر
                familyHeadName: familyHeadInfo ? familyHeadInfo.name : row[headers.familyHeadName] || null,
                familyHeadId: familyHeadInfo ? familyHeadInfo.id : row[headers.familyHeadId] || null,
                
                // البيانات الصحية
                disability: row[headers.disability],
                injury: row[headers.injury],
                isNursing: this.parseBoolean(row[headers.isNursing]),
                isPregnant: this.parseBoolean(row[headers.pregnancyStatus]),
                medicalNotes: row[headers.medicalNotes],
                
                // علم التتبع
                rawRow: row,
                dataSource: 'mapped', // مؤشر على أن البيانات تم تحويلها
                familyHeadSource: familyHeadInfo ? 'from_family_map' : 'from_health_sheet'
            };

            // Push health record if it contains health info or family head info
            const hasHealthInfo = (healthRecord.disability && String(healthRecord.disability).trim()) ||
                                  (healthRecord.injury && String(healthRecord.injury).trim());

            if (hasHealthInfo || healthRecord.familyHeadName || healthRecord.familyHeadId) {
                result.healthStatus.push(healthRecord);
            }
        }
    }

    /**
     * بناء خريطة أرباب الأسر من جميع الصفائح
     * @param {Object} result - كائن النتيجة
     * @returns {Object} خريطة أرباب الأسر
     */
    buildFamilyHeadMap(result) {
        const map = {};

        // من صفحة الأسر
        result.families.forEach(family => {
            if (family.familyId && family.familyHeadName) {
                map[String(family.familyId)] = {
                    name: family.familyHeadName,
                    id: family.familyHeadId,
                    source: 'families_sheet'
                };
            }
        });

        // من صفحة الأفراد (الأشخاص المعينين كرؤساء أسر)
        result.members.forEach(member => {
            if (member.relationship === 'رب أسرة' && member.familyId) {
                map[String(member.familyId)] = {
                    name: member.memberName,
                    id: member.memberId,
                    source: 'members_sheet'
                };
            }
        });

        return map;
    }

    /**
     * استخراج رؤوس الأعمدة مع دعم تسميات مختلفة
     * @param {Array} headerRow - الصف الأول
     * @returns {Object} خريطة الرؤوس
     */
    extractHeaders(headerRow) {
        const headers = {};
        const fieldMappings = {
            familyId: ['رقم الأسرة', 'family_id', 'Family ID', 'ID', 'id', 'FamilyID'],
            memberId: ['رقم الفرد', 'member_id', 'Member ID', 'National ID', 'رقم الهوية'],
            memberName: ['اسم الفرد', 'member_name', 'Name', 'الاسم', 'Full Name'],
            familyHeadName: ['اسم رب الأسرة', 'head_name', 'Family Head', 'رب الأسرة', 'Head Name'],
            familyHeadId: ['رقم هوية رب الأسرة', 'head_id', 'Head ID'],
            age: ['العمر', 'age', 'Age', 'السن'],
            dateOfBirth: ['تاريخ الميلاد', 'date_of_birth', 'DOB'],
            gender: ['الجنس', 'gender', 'Sex', 'النوع'],
            disability: ['الإعاقة', 'disability', 'Disabilities', 'العجز'],
            injury: ['الإصابة', 'injury', 'Injuries', 'الضرر'],
            isNursing: ['مرضع', 'nursing', 'is_nursing', 'Breastfeeding'],
            pregnancyStatus: ['حالة الحمل', 'pregnancy', 'is_pregnant', 'Pregnant'],
            phone: ['الهاتف', 'phone', 'Phone'],
            address: ['العنوان', 'address', 'Address'],
            familySize: ['حجم الأسرة', 'family_size', 'Family Size'],
            relationship: ['العلاقة', 'relationship', 'Relation'],
            medicalNotes: ['ملاحظات طبية', 'medical_notes', 'Notes']
        };

        headerRow.forEach((header, index) => {
            if (!header) return;
            const headerText = String(header).trim().toLowerCase();

            for (const [key, variations] of Object.entries(fieldMappings)) {
                if (variations.some(v => headerText.includes(v.toLowerCase()))) {
                    headers[key] = index;
                    break;
                }
            }
        });

        return headers;
    }

    /**
     * تحليل العمر
     * @param {any} value - قيمة العمر
     * @returns {number} العمر بالسنوات
     */
    parseAge(value) {
        if (!value) return null;
        const age = parseInt(value);
        return isNaN(age) ? null : age;
    }

    /**
     * تحليل القيم البوليانية
     * @param {any} value - القيمة
     * @returns {boolean}
     */
    parseBoolean(value) {
        if (!value) return false;
        const valueStr = String(value).trim().toLowerCase();
        return ['yes', 'نعم', 'true', '1', 'yes', 'y'].includes(valueStr);
    }

    /**
     * التحقق من صحة البيانات
     * @param {Object} result - كائن النتيجة
     * @returns {Object} تقرير التحقق
     */
    validateData(result) {
        const validation = {
            totalRecords: result.healthStatus.length,
            recordsWithFamilyHead: 0,
            recordsWithoutFamilyHead: 0,
            warnings: [],
            missingFamilyHeads: []
        };

        result.healthStatus.forEach((record, index) => {
            if (record.familyHeadName && record.familyHeadId) {
                validation.recordsWithFamilyHead++;
            } else {
                validation.recordsWithoutFamilyHead++;
                validation.missingFamilyHeads.push({
                    index: index + 1,
                    memberId: record.memberId,
                    memberName: record.memberName,
                    familyId: record.familyId
                });
                validation.warnings.push(
                    `الصف ${index + 2}: معلومات رب الأسرة ناقصة للفرد ${record.memberName || record.memberId}`
                );
            }
        });

        return validation;
    }

    /**
     * إصلاح البيانات الناقصة باستخدام الخرائط
     * @param {Object} result - كائن النتيجة
     * @returns {Object} البيانات المصلحة
     */
    fixMissingFamilyHeads(result) {
        result.healthStatus.forEach(record => {
            // إذا كانت معلومات رب الأسرة ناقصة
            if ((!record.familyHeadName || !record.familyHeadId) && record.familyId) {
                const familyHeadInfo = result.familyHeadMap[String(record.familyId)];
                
                if (familyHeadInfo) {
                    record.familyHeadName = record.familyHeadName || familyHeadInfo.name;
                    record.familyHeadId = record.familyHeadId || familyHeadInfo.id;
                    record.familyHeadFixed = true;
                }
            }
        });

        return result;
    }
}

// تصدير الفئة
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExcelDataMapper;
}
