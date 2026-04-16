// security.js

// Importing necessary libraries
const crypto = require('crypto');

// Data Encryption
function encrypt(text, key) {
    let iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Validation Functions
function isEmailValid(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}

function isPasswordStrong(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
}

// XSS Prevention
function sanitizeInput(input) {
    const sanitized = input.replace(/<[^>]*>/g, ''); // Remove HTML tags
    return sanitized;
}

// Password Security
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

module.exports = { encrypt, isEmailValid, isPasswordStrong, sanitizeInput, hashPassword };