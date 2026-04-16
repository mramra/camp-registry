// Updated validation for national ID
function validateNationalID(id) {
    const regex = /^\d{9}$/; // Accepts only 9 digits
    if (!regex.test(id)) {
        return "رقم الهوية الوطنية يجب أن يتكون من 9 أرقام"; // Error message in Arabic
    }
    return true;
}

// Updated validation for phone number
function validatePhoneNumber(phone) {
    const regex = /^(059|056)\d{7}$/; // Accepts only 10 digits starting with 059 or 056
    if (!regex.test(phone)) {
        return "رقم الهاتف يجب أن يتكون من 10 أرقام ويبدأ بـ 059 أو 056"; // Error message in Arabic
    }
    return true;
}

// Removed email validation