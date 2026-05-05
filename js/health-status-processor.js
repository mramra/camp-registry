/**
 * Health Status Processor
 * معالج الحالة الصحية
 * 
 * يقوم بمعالجة بيانات الحالة الصحية المستوردة من ملفات Excel
 * مع التركيز على:
 * 1. الحفاظ على معلومات أرباب الأسر في بيانات الإعاقة والإصابة
 * 2. تصنيف صحيح للمرضعات والأطفال (بناءً على البيانات المدخلة، وليس تلقائياً)
 */

class HealthStatusProcessor {
    constructor() {
        // تحديد الأعمار الحدود
        this.NURSING_MIN_AGE = 0;  // أقل من السنة
        this.NURSING_MAX_AGE = 2;  // تحت سنتين
        this.PREGNANCY_MIN_AGE = 15; // سن الخصوبة الدنيا
        this.PREGNANCY_MAX_AGE = 49; // سن الخصوبة العليا
    }

    /**
     * معالجة ملف Excel المستورد
     * @param {Array} workbookSheets - صفائح العمل من XLSX
     * @returns {Object} البيانات المعالجة
     */
    processExcelFile(workbookSheets) {
        const result = {
            families: [],
            members: [],
            healthStatuses: [],
            errors: [],
            warnings: []
        };

        try {
            // البحث عن صفحة الحالة الصحية
            const healthSheet = workbookSheets.find(sheet => 
                sheet.name.includes('صحة') || 
                sheet.name.includes('health') ||
                sheet.name.includes('Health')
            );

            if (!healthSheet) {
                result.errors.push('لم يتم العثور على صفحة الحالة الصحية');
                return result;
            }

            // معالجة الصفيفة
            result = this.processHealthSheet(healthSheet.data, result);

        } catch (error) {
            result.errors.push(`خطأ في معالجة الملف: ${error.message}`);
        }

        return result;
    }

    /**
     * معالجة صفحة الحالة الصحية
     * @param {Array} sheetData - بيانات الصفحة
     * @param {Object} result - كائن النتيجة
     * @returns {Object} النتيجة المحدثة
     */
    processHealthSheet(sheetData, result) {
        if (!sheetData || sheetData.length === 0) {
            result.errors.push('صفحة الحالة الصحية فارغة');
            return result;
        }

        // الصف الأول يحتوي على رؤوس الأعمدة
        const headers = this.extractHeaders(sheetData[0]);

        // معالجة كل صف من الصفوف
        for (let i = 1; i < sheetData.length; i++) {
            const row = sheetData[i];
            
            // تخطي الصفوف الفارغة
            if (!row || row.every(cell => !cell)) continue;

            try {
                const healthRecord = this.processRow(row, headers);
                if (healthRecord) {
                    result.healthStatuses.push(healthRecord);
                }
            } catch (error) {
                result.warnings.push({
                    row: i + 1,
                    error: error.message
                });
            }
        }

        return result;
    }

    /**
     * استخراج رؤوس الأعمدة من الصف الأول
     * @param {Array} headerRow - الصف الأول
     * @returns {Object} خريطة الرؤوس
     */
    extractHeaders(headerRow) {
        const headers = {};
        const possibleFields = {
            familyId: ['رقم الأسرة', 'family_id', 'ID', 'id'],
            familyHeadName: ['اسم رب الأسرة', 'head_name', 'family_head', 'رب الأسرة'],
            familyHeadId: ['رقم هوية رب الأسرة', 'head_id', 'national_id'],
            memberName: ['اسم الفرد', 'member_name', 'name', 'الاسم'],
            memberId: ['رقم هوية الفرد', 'member_id', 'id_number'],
            age: ['العمر', 'age', 'السن'],
            dateOfBirth: ['تاريخ الميلاد', 'date_of_birth', 'dob'],
            gender: ['الجنس', 'gender', 'sex'],
            disability: ['الإعاقة', 'disability', 'disabilities'],
            injury: ['الإصابة', 'injury', 'injuries'],
            isNursing: ['مرضع', 'nursing', 'is_nursing', 'breastfeeding'],
            pregnancyStatus: ['حالة الحمل', 'pregnancy', 'is_pregnant'],
            medicalNotes: ['ملاحظات طبية', 'medical_notes', 'notes']
        };

        // البحث عن رؤوس الأعمدة
        headerRow.forEach((header, index) => {
            if (!header) return;
            
            const headerText = String(header).trim().toLowerCase();
            
            for (const [key, variations] of Object.entries(possibleFields)) {
                if (variations.some(v => headerText.includes(v.toLowerCase()))) {
                    headers[key] = index;
                    break;
                }
            }
        });

        return headers;
    }

    /**
     * معالجة صف واحد من البيانات
     * @param {Array} row - الصف
     * @param {Object} headers - خريطة الرؤوس
     * @returns {Object} سجل الحالة الصحية
     */
    processRow(row, headers) {
        const familyHeadNameValue = headers.familyHeadName !== undefined ? row[headers.familyHeadName] : null;
        const familyHeadIdValue = headers.familyHeadId !== undefined ? row[headers.familyHeadId] : null;

        const record = {
            familyId: row[headers.familyId] || null,
            familyHeadName: familyHeadNameValue || null,
            familyHeadId: familyHeadIdValue || null,
            memberName: row[headers.memberName] || null,
            memberId: row[headers.memberId] || null,
            age: this.parseAge(row[headers.age]),
            dateOfBirth: row[headers.dateOfBirth] || null,
            gender: row[headers.gender] || null,
            // مرّر اسم رب الأسرة الفعلي (وليس فهرس العمود)
            disabilities: this.parseDisabilities(row[headers.disability], familyHeadNameValue, row),
            injuries: this.parseInjuries(row[headers.injury], familyHeadNameValue, row),
            isNursing: this.determineNursingStatus(row, headers),
            isPregnant: this.determinePregnancyStatus(row, headers),
            medicalNotes: row[headers.medicalNotes] || null,
            processedAt: new Date().toISOString()
        };

        return record;
    }

    /**
     * تحليل العمر
     * @param {any} ageValue - قيمة العمر
     * @returns {number} العمر بالسنوات
     */
    parseAge(ageValue) {
        if (!ageValue) return null;
        const age = parseInt(ageValue);
        return isNaN(age) ? null : age;
    }

    /**
     * تحليل الإعاقات مع الحفاظ على معلومات رب الأسرة
     * @param {any} disabilityValue - قيمة الإعاقة
     * @param {any} familyHeadName - اسم رب الأسرة
     * @param {Array} row - الصف الكامل
     * @returns {Array} قائمة الإعاقات
     */
    parseDisabilities(disabilityValue, familyHeadName, row) {
        if (!disabilityValue) return [];

        const disabilities = [];
        const disabilityText = String(disabilityValue).trim();

        if (disabilityText && disabilityText.toLowerCase() !== 'no') {
            // تقسيم الإعاقات المتعددة
            const items = disabilityText.split(/[,;|]/);
            
            items.forEach(item => {
                const trimmed = item.trim();
                if (trimmed) {
                    disabilities.push({
                        type: trimmed,
                        // **الحفاظ على معلومات رب الأسرة**
                        familyHeadName: familyHeadName || null,
                        recordedAt: new Date().toISOString()
                    });
                }
            });
        }

        return disabilities;
    }

    /**
     * تحليل الإصابات مع الحفاظ على معلومات رب الأسرة
     * @param {any} injuryValue - قيمة الإصابة
     * @param {any} familyHeadName - اسم رب الأسرة
     * @param {Array} row - الصف الكامل
     * @returns {Array} قائمة الإصابات
     */
    parseInjuries(injuryValue, familyHeadName, row) {
        if (!injuryValue) return [];

        const injuries = [];
        const injuryText = String(injuryValue).trim();

        if (injuryText && injuryText.toLowerCase() !== 'no') {
            // تقسيم الإصابات المتعددة
            const items = injuryText.split(/[,;|]/);
            
            items.forEach(item => {
                const trimmed = item.trim();
                if (trimmed) {
                    injuries.push({
                        type: trimmed,
                        // **الحفاظ على معلومات رب الأسرة**
                        familyHeadName: familyHeadName || null,
                        recordedAt: new Date().toISOString()
                    });
                }
            });
        }

        return injuries;
    }

    /**
     * تحديد حالة الرضاعة - يجب أن تكون مدخلة بوضوح
     * **لا يتم التصنيف التلقائي بناءً على العمر وحده**
     * @param {Array} row - الصف
     * @param {Object} headers - خريطة الرؤوس
     * @returns {boolean} هل الشخص مرضع
     */
    determineNursingStatus(row, headers) {
        // إذا كان هناك عمود صريح للرضاعة
        if (headers.isNursing !== undefined) {
            const value = row[headers.isNursing];
            if (value !== undefined && value !== null) {
                const valueStr = String(value).trim().toLowerCase();
                return ['yes', 'نعم', 'true', '1'].includes(valueStr);
            }
        }

        // إذا لم تكن هناك بيانات صريحة، لا نفترض التصنيف التلقائي
        // هذا يتطلب إدخال واضح من المستخدم
        return false;
    }

    /**
     * تحديد حالة الحمل - يجب أن تكون مدخلة بوضوح
     * **لا يتم التصنيف التلقائي**
     * @param {Array} row - الصف
     * @param {Object} headers - خريطة الرؤوس
     * @returns {boolean} هل الشخص حامل
     */
    determinePregnancyStatus(row, headers) {
        // إذا كان هناك عمود صريح لحالة الحمل
        if (headers.pregnancyStatus !== undefined) {
            const value = row[headers.pregnancyStatus];
            if (value !== undefined && value !== null) {
                const valueStr = String(value).trim().toLowerCase();
                return ['yes', 'نعم', 'true', '1'].includes(valueStr);
            }
        }

        // إذا لم تكن هناك بيانات صريحة، لا نفترض التصنيف التلقائي
        return false;
    }

    /**
     * إنشاء تقرير معالجة البيانات
     * @param {Object} processResult - نتيجة المعالجة
     * @returns {Object} التقرير
     */
    generateReport(processResult) {
        return {
            summary: {
                totalRecords: processResult.healthStatuses.length,
                totalErrors: processResult.errors.length,
                totalWarnings: processResult.warnings.length,
                recordsWithDisability: processResult.healthStatuses.filter(r => r.disabilities.length > 0).length,
                recordsWithInjury: processResult.healthStatuses.filter(r => r.injuries.length > 0).length,
                recordsNursing: processResult.healthStatuses.filter(r => r.isNursing).length,
                recordsPregnant: processResult.healthStatuses.filter(r => r.isPregnant).length
            },
            errors: processResult.errors,
            warnings: processResult.warnings,
            recordsWithFamilyHeadInfo: processResult.healthStatuses.filter(r => r.familyHeadName !== null).length
        };
    }
}

// تصدير الفئة
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HealthStatusProcessor;
}
