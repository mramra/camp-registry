// utils/validation.js

// دالة للتحقق من صحة رقم الهوية الوطنية
function validateNationalID(nationalID) {
    const regex = /^(\d{10}|\d{14})$/;
    return regex.test(nationalID);
}

// دالة للتحقق من صحة رقم الهاتف
function validatePhoneNumber(phoneNumber) {
    const regex = /^\+?\d{10,15}$/;
    return regex.test(phoneNumber);
}

// دالة للتحقق من صحة البريد الإلكتروني
function validateEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}

// دالة للتحقق من قوة كلمة المرور
function validatePasswordStrength(password) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[!@#\$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars && isLongEnough;
}

// دالة للكشف عن التكرار في مصفوفة
function hasDuplicates(array) {
    return new Set(array).size !== array.length;
}

// الرسائل الخطأ الخاصة بالتحقق
function getValidationErrorMessages() {
    return {
        nationalID: "رقم الهوية الوطنية غير صالح.",
        phoneNumber: "رقم الهاتف غير صالح.",
        email: "البريد الإلكتروني غير صالح.",
        passwordStrength: "كلمة المرور يجب أن تحتوي على أحرف كبيرة وصغيرة، وأرقام، ورموز خاصة، ويجب أن تكون من 8 أحرف على الأقل.",
        duplicates: "توجد عناصر مكررة في القائمة."
    };
}

module.exports = {
    validateNationalID,
    validatePhoneNumber,
    validateEmail,
    validatePasswordStrength,
    hasDuplicates,
    getValidationErrorMessages
};