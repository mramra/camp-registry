/**
 * Disability & Injury Report Generator
 * مولد كشف الإعاقات والإصابات
 * 
 * يقوم بإنشاء وتصدير كشف شامل لأرباب الأسر الذين لديهم إعاقات أو إصابات
 * مع الحفاظ على جميع المعلومات المهمة
 */

class DisabilityInjuryReportGenerator {
    constructor() {
        this.reportData = [];
    }

    /**
     * إنشاء كشف الإعاقات والإصابات من بيانات الحالة الصحية
     * @param {Array} healthStatuses - بيانات الحالة الصحية المعالجة
     * @returns {Array} بيانات الكشف
     */
    generateDisabilityInjuryReport(healthStatuses) {
        const reportData = [];
        const processedFamilyHeads = new Set();

        // معالجة كل سجل صحي
        healthStatuses.forEach((record, index) => {
            // التحقق من وجود إعاقات أو إصابات
            if ((record.disabilities && record.disabilities.length > 0) || 
                (record.injuries && record.injuries.length > 0)) {
                
                // إذا كان لدينا معلومات رب الأسرة
                if (record.familyHeadName) {
                    const familyHeadKey = `${record.familyHeadId || record.familyHeadName}`;
                    
                    // تجنب التكرار - إذا تم إضافة رب الأسرة بالفعل
                    if (!processedFamilyHeads.has(familyHeadKey)) {
                        reportData.push(this.createFamilyHeadRecord(record));
                        processedFamilyHeads.add(familyHeadKey);
                    }
                } else if (record.memberName) {
                    // إذا كان الشخص نفسه لديه إعاقة/إصابة (بدون بيانات رب الأسرة)
                    reportData.push(this.createMemberRecord(record));
                }
            }
        });

        this.reportData = reportData;
        return reportData;
    }

    /**
     * إنشاء سجل خاص برب الأسرة
     * @param {Object} record - السجل الصحي
     * @returns {Object} سجل الكشف
     */
    createFamilyHeadRecord(record) {
        const disabilities = record.disabilities || [];
        const injuries = record.injuries || [];

        return {
            // معلومات رب الأسرة
            familyHeadName: record.familyHeadName || 'غير محدد',
            familyHeadId: record.familyHeadId || '-',
            familyId: record.familyId || '-',
            
            // معلومات الإعاقات
            disabilitiesCount: disabilities.length,
            disabilitiesList: disabilities.map(d => d.type || d).join('، '),
            
            // معلومات الإصابات
            injuriesCount: injuries.length,
            injuriesList: injuries.map(i => i.type || i).join('، '),
            
            // معلومات إضافية
            memberName: record.memberName || '-',
            age: record.age || '-',
            gender: record.gender || '-',
            recordType: 'family_head', // نوع السجل
            processedAt: new Date().toISOString()
        };
    }

    /**
     * إنشاء سجل خاص بعضو الأسرة
     * @param {Object} record - السجل الصحي
     * @returns {Object} سجل الكشف
     */
    createMemberRecord(record) {
        const disabilities = record.disabilities || [];
        const injuries = record.injuries || [];

        return {
            // معلومات عضو الأسرة
            memberName: record.memberName || 'غير محدد',
            memberId: record.memberId || '-',
            familyId: record.familyId || '-',
            
            // معلومات الإعاقات
            disabilitiesCount: disabilities.length,
            disabilitiesList: disabilities.map(d => d.type || d).join('، '),
            
            // معلومات الإصابات
            injuriesCount: injuries.length,
            injuriesList: injuries.map(i => i.type || i).join('، '),
            
            // معلومات شخصية
            age: record.age || '-',
            gender: record.gender || '-',
            recordType: 'member', // نوع السجل
            processedAt: new Date().toISOString()
        };
    }

    /**
     * تصدير الكشف إلى صيغة CSV
     * @param {Array} reportData - بيانات الكشف (اختياري)
     * @returns {string} محتوى CSV
     */
    exportToCSV(reportData = null) {
        const data = reportData || this.reportData;
        
        if (data.length === 0) {
            return 'لا توجد بيانات للتصدير';
        }

        // رؤوس الأعمدة
        const headers = [
            'اسم رب الأسرة / الفرد',
            'رقم الهوية',
            'رقم الأسرة',
            'عدد الإعاقات',
            'قائمة الإعاقات',
            'عدد الإصابات',
            'قائمة الإصابات',
            'الاسم (إن وجد)',
            'العمر',
            'الجنس',
            'نوع السجل',
            'تاريخ المعالجة'
        ];

        // بناء صفوف البيانات
        const rows = data.map(row => [
            row.familyHeadName || row.memberName,
            row.familyHeadId || row.memberId,
            row.familyId,
            row.disabilitiesCount,
            row.disabilitiesList,
            row.injuriesCount,
            row.injuriesList,
            row.memberName || '-',
            row.age,
            row.gender,
            row.recordType === 'family_head' ? 'رب أسرة' : 'عضو أسرة',
            new Date(row.processedAt).toLocaleDateString('ar-SA')
        ]);

        // إنشاء محتوى CSV
        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            // إضافة علامات اقتباس للخلايا التي تحتوي على فواصل
            const escapedRow = row.map(cell => {
                const cellStr = String(cell || '');
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return `"${cellStr.replace(/"/g, '""')}"`;
                }
                return cellStr;
            });
            csvContent += escapedRow.join(',') + '\n';
        });

        return csvContent;
    }

    /**
     * تصدير الكشف إلى صيغة JSON
     * @param {Array} reportData - بيانات الكشف (اختياري)
     * @returns {string} محتوى JSON
     */
    exportToJSON(reportData = null) {
        const data = reportData || this.reportData;
        return JSON.stringify(data, null, 2);
    }

    /**
     * تصدير الكشف إلى HTML (جدول قابل للطباعة)
     * @param {Array} reportData - بيانات الكشف (اختياري)
     * @returns {string} محتوى HTML
     */
    exportToHTML(reportData = null) {
        const data = reportData || this.reportData;

        if (data.length === 0) {
            return '<p>لا توجد بيانات للعرض</p>';
        }

        let html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>كشف الإعاقات والإصابات</title>
    <style>
        body {
            font-family: 'Cairo', Arial, sans-serif;
            direction: rtl;
            background: #f5f5f5;
            padding: 20px;
        }
        .container {
            max-width: 100%;
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 20px;
        }
        .report-summary {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            border-right: 4px solid #1a1a2e;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        thead {
            background: #1a1a2e;
            color: white;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: right;
        }
        th {
            font-weight: bold;
            font-size: 14px;
        }
        tbody tr:nth-child(even) {
            background: #f9f9f9;
        }
        tbody tr:hover {
            background: #f0f0f0;
        }
        .family-head {
            background: #fff3cd;
            font-weight: bold;
        }
        .member {
            background: #e7f3ff;
        }
        .print-button {
            margin: 20px 0;
            text-align: center;
        }
        .print-button button {
            padding: 10px 30px;
            background: #1a1a2e;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        .print-button button:hover {
            background: #0f0f1d;
        }
        @media print {
            .print-button {
                display: none;
            }
            body {
                background: white;
            }
            .container {
                box-shadow: none;
            }
        }
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
        }
        .status-family-head {
            background: #ffc107;
            color: #333;
        }
        .status-member {
            background: #17a2b8;
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>كشف أرباب الأسر والأفراد ذوي الإعاقات والإصابات</h1>
        
        <div class="report-summary">
            <h3>ملخص الكشف</h3>
            <p><strong>إجمالي السجلات:</strong> ${data.length}</p>
            <p><strong>عدد أرباب الأسر المتأثرين:</strong> ${data.filter(r => r.recordType === 'family_head').length}</p>
            <p><strong>عدد أفراد الأسرة المتأثرين:</strong> ${data.filter(r => r.recordType === 'member').length}</p>
            <p><strong>إجمالي حالات الإعاقة:</strong> ${data.reduce((sum, r) => sum + r.disabilitiesCount, 0)}</p>
            <p><strong>إجمالي حالات الإصابة:</strong> ${data.reduce((sum, r) => sum + r.injuriesCount, 0)}</p>
        </div>

        <div class="print-button">
            <button onclick="window.print()">طباعة الكشف</button>
        </div>

        <table>
            <thead>
                <tr>
                    <th>الاسم</th>
                    <th>رقم الهوية</th>
                    <th>رقم الأسرة</th>
                    <th>الإعاقات</th>
                    <th>الإصابات</th>
                    <th>العمر</th>
                    <th>الجنس</th>
                    <th>النوع</th>
                </tr>
            </thead>
            <tbody>`;

        data.forEach(row => {
            const rowClass = row.recordType === 'family_head' ? 'family-head' : 'member';
            const typeBadge = row.recordType === 'family_head' 
                ? '<span class="status-badge status-family-head">رب أسرة</span>'
                : '<span class="status-badge status-member">عضو أسرة</span>';

            html += `
                <tr class="${rowClass}">
                    <td>${row.familyHeadName || row.memberName}</td>
                    <td>${row.familyHeadId || row.memberId}</td>
                    <td>${row.familyId}</td>
                    <td>
                        <strong>(${row.disabilitiesCount})</strong><br>
                        ${row.disabilitiesList || '-'}
                    </td>
                    <td>
                        <strong>(${row.injuriesCount})</strong><br>
                        ${row.injuriesList || '-'}
                    </td>
                    <td>${row.age}</td>
                    <td>${row.gender}</td>
                    <td>${typeBadge}</td>
                </tr>`;
        });

        html += `
            </tbody>
        </table>
    </div>
</body>
</html>`;

        return html;
    }

    /**
     * تنزيل الملف
     * @param {string} filename - اسم الملف
     * @param {string} content - محتوى الملف
     * @param {string} mimeType - نوع MIME
     */
    static downloadFile(filename, content, mimeType = 'text/plain') {
        const element = document.createElement('a');
        element.setAttribute('href', `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`);
        element.setAttribute('download', filename);
        element.style.display = 'none';
        
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    /**
     * تصدير الكشف مع تنزيل الملف
     * @param {string} format - صيغة التصدير (csv, json, html)
     * @param {string} filename - اسم الملف
     */
    exportAndDownload(format = 'csv', filename = null) {
        let content, mimeType, extension;

        switch (format.toLowerCase()) {
            case 'csv':
                content = this.exportToCSV();
                mimeType = 'text/csv;charset=utf-8';
                extension = 'csv';
                filename = filename || `كشف_الاعاقات_${new Date().toISOString().split('T')[0]}.csv`;
                break;
            
            case 'json':
                content = this.exportToJSON();
                mimeType = 'application/json;charset=utf-8';
                extension = 'json';
                filename = filename || `كشف_الاعاقات_${new Date().toISOString().split('T')[0]}.json`;
                break;
            
            case 'html':
                content = this.exportToHTML();
                mimeType = 'text/html;charset=utf-8';
                extension = 'html';
                filename = filename || `كشف_الاعاقات_${new Date().toISOString().split('T')[0]}.html`;
                break;
            
            default:
                console.error('صيغة التصدير غير معروفة');
                return;
        }

        // في بيئة المتصفح
        if (typeof document !== 'undefined') {
            DisabilityInjuryReportGenerator.downloadFile(filename, content, mimeType);
        } else {
            // في بيئة Node.js
            console.log(`محتوى ${format.toUpperCase()}:`);
            console.log(content);
        }
    }

    /**
     * إنشاء تقرير إحصائي شامل
     * @param {Array} reportData - بيانات الكشف
     * @returns {Object} التقرير الإحصائي
     */
    generateStatistics(reportData = null) {
        const data = reportData || this.reportData;

        const stats = {
            totalRecords: data.length,
            totalFamilyHeads: data.filter(r => r.recordType === 'family_head').length,
            totalMembers: data.filter(r => r.recordType === 'member').length,
            totalDisabilities: data.reduce((sum, r) => sum + r.disabilitiesCount, 0),
            totalInjuries: data.reduce((sum, r) => sum + r.injuriesCount, 0),
            
            // إحصائيات حسب نوع الإعاقة
            disabilitiesByType: {},
            injuriesByType: {},
            
            // توزيع الحالات
            familyHeadsWithDisabilities: data.filter(r => r.recordType === 'family_head' && r.disabilitiesCount > 0).length,
            familyHeadsWithInjuries: data.filter(r => r.recordType === 'family_head' && r.injuriesCount > 0).length,
            membersWithDisabilities: data.filter(r => r.recordType === 'member' && r.disabilitiesCount > 0).length,
            membersWithInjuries: data.filter(r => r.recordType === 'member' && r.injuriesCount > 0).length
        };

        // حساب نوع الإعاقات
        data.forEach(row => {
            if (row.disabilitiesList) {
                const items = row.disabilitiesList.split('، ');
                items.forEach(item => {
                    item = item.trim();
                    if (item) {
                        stats.disabilitiesByType[item] = (stats.disabilitiesByType[item] || 0) + 1;
                    }
                });
            }
            if (row.injuriesList) {
                const items = row.injuriesList.split('، ');
                items.forEach(item => {
                    item = item.trim();
                    if (item) {
                        stats.injuriesByType[item] = (stats.injuriesByType[item] || 0) + 1;
                    }
                });
            }
        });

        return stats;
    }
}

// تصدير الفئة
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DisabilityInjuryReportGenerator;
}
