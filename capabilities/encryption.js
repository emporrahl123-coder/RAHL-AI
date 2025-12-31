const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class Encryption {
    constructor() {
        this.name = "encryption";
        this.description = "Encrypt and decrypt data using various algorithms";
        this.version = "1.0.0";
        this.supportedAlgorithms = {
            'aes-256-gcm': 'AES-256-GCM (Recommended)',
            'aes-256-cbc': 'AES-256-CBC',
            'aes-192-cbc': 'AES-192-CBC',
            'aes-128-cbc': 'AES-128-CBC',
            'des-ede3-cbc': '3DES',
            'chacha20-poly1305': 'ChaCha20-Poly1305'
        };
    }
    
    async execute(data, options = {}) {
        try {
            const action = options.action || 'encrypt';
            const algorithm = options.algorithm || 'aes-256-gcm';
            
            if (!this.supportedAlgorithms[algorithm]) {
                throw new Error(`Unsupported algorithm: ${algorithm}`);
            }
            
            let result;
            
            if (action === 'encrypt') {
                result = await this.encryptData(data, algorithm, options);
            } else if (action === 'decrypt') {
                result = await this.decryptData(data, algorithm, options);
            } else if (action === 'hash') {
                result = await this.hashData(data, options);
            } else if (action === 'generate_key') {
                result = await this.generateKey(options);
            } else {
                throw new Error(`Unknown action: ${action}`);
            }
            
            return {
                success: true,
                action: action,
                algorithm: algorithm,
                ...result,
                source: this.name,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                action: options.action,
                source: this.name
            };
        }
    }
    
    async encryptData(data, algorithm, options = {}) {
        const key = options.key || crypto.randomBytes(32);
        const iv = options.iv || crypto.randomBytes(16);
        
        let cipher;
        let encrypted;
        
        if (algorithm.includes('gcm') || algorithm.includes('poly1305')) {
            // AEAD algorithms
            cipher = crypto.createCipheriv(algorithm, key, iv);
            
            if (options.aad) {
                cipher.setAAD(Buffer.from(options.aad));
            }
            
            encrypted = Buffer.concat([
                cipher.update(data, 'utf8'),
                cipher.final()
            ]);
            
            const authTag = cipher.getAuthTag();
            
            return {
                encrypted: encrypted.toString('base64'),
                iv: iv.toString('base64'),
                key: key.toString('base64'),
                authTag: authTag.toString('base64'),
                algorithm: algorithm,
                originalLength: data.length
            };
        } else {
            // Standard block cipher
            cipher = crypto.createCipheriv(algorithm, key, iv);
            encrypted = Buffer.concat([
                cipher.update(data, 'utf8'),
                cipher.final()
            ]);
            
            return {
                encrypted: encrypted.toString('base64'),
                iv: iv.toString('base64'),
                key: key.toString('base64'),
                algorithm: algorithm,
                originalLength: data.length
            };
        }
    }
    
    async decryptData(encryptedData, algorithm, options = {}) {
        const key = Buffer.from(options.key, 'base64');
        const iv = Buffer.from(options.iv, 'base64');
        const encrypted = Buffer.from(encryptedData, 'base64');
        
        let decipher;
        
        if (algorithm.includes('gcm') || algorithm.includes('poly1305')) {
            // AEAD algorithms
            decipher = crypto.createDecipheriv(algorithm, key, iv);
            
            if (options.authTag) {
                decipher.setAuthTag(Buffer.from(options.authTag, 'base64'));
            }
            
            if (options.aad) {
                decipher.setAAD(Buffer.from(options.aad));
            }
            
            const decrypted = Buffer.concat([
                decipher.update(encrypted),
                decipher.final()
            ]);
            
            return {
                decrypted: decrypted.toString('utf8'),
                algorithm: algorithm,
                verified: true
            };
        } else {
            // Standard block cipher
            decipher = crypto.createDecipheriv(algorithm, key, iv);
            const decrypted = Buffer.concat([
                decipher.update(encrypted),
                decipher.final()
            ]);
            
            return {
                decrypted: decrypted.toString('utf8'),
                algorithm: algorithm
            };
        }
    }
    
    async hashData(data, options = {}) {
        const algorithm = options.algorithm || 'sha256';
        const iterations = options.iterations || 1;
        const salt = options.salt || crypto.randomBytes(16);
        
        let hash = data;
        
        for (let i = 0; i < iterations; i++) {
            const hashObj = crypto.createHash(algorithm);
            hashObj.update(hash + salt.toString('hex'));
            hash = hashObj.digest('hex');
        }
        
        return {
            hash: hash,
            algorithm: algorithm,
            iterations: iterations,
            salt: salt.toString('hex'),
            length: hash.length
        };
    }
    
    async generateKey(options = {}) {
        const type = options.type || 'aes';
        const length = options.length || 256;
        
        let key;
        let publicKey;
        let privateKey;
        
        switch(type) {
            case 'aes':
                key = crypto.randomBytes(length / 8);
                break;
                
            case 'rsa':
                const { publicKey: pub, privateKey: priv } = crypto.generateKeyPairSync('rsa', {
                    modulusLength: length,
                    publicKeyEncoding: {
                        type: 'spki',
                        format: 'pem'
                    },
                    privateKeyEncoding: {
                        type: 'pkcs8',
                        format: 'pem'
                    }
                });
                publicKey = pub;
                privateKey = priv;
                break;
                
            case 'ec':
                const { publicKey: ecPub, privateKey: ecPriv } = crypto.generateKeyPairSync('ec', {
                    namedCurve: 'secp256k1',
                    publicKeyEncoding: {
                        type: 'spki',
                        format: 'pem'
                    },
                    privateKeyEncoding: {
                        type: 'pkcs8',
                        format: 'pem'
                    }
                });
                publicKey = ecPub;
                privateKey = ecPriv;
                break;
                
            default:
                throw new Error(`Unsupported key type: ${type}`);
        }
        
        return {
            key: key ? key.toString('base64') : null,
            publicKey: publicKey,
            privateKey: privateKey,
            type: type,
            length: length,
            format: type === 'aes' ? 'base64' : 'pem'
        };
    }
    
    async encryptFile(filePath, options = {}) {
        const data = fs.readFileSync(filePath);
        const encrypted = await this.encryptData(data, options.algorithm || 'aes-256-gcm', options);
        
        const encryptedPath = filePath + '.enc';
        fs.writeFileSync(encryptedPath, Buffer.from(encrypted.encrypted, 'base64'));
        
        // Save metadata
        const metadata = {
            iv: encrypted.iv,
            algorithm: encrypted.algorithm,
            originalSize: data.length
        };
        
        if (encrypted.authTag) {
            metadata.authTag = encrypted.authTag;
        }
        
        fs.writeFileSync(encryptedPath + '.meta', JSON.stringify(metadata, null, 2));
        
        return {
            success: true,
            originalFile: filePath,
            encryptedFile: encryptedPath,
            metadataFile: encryptedPath + '.meta',
            algorithm: encrypted.algorithm,
            originalSize: data.length,
            encryptedSize: Buffer.from(encrypted.encrypted, 'base64').length,
            source: this.name
        };
    }
    
    async decryptFile(encryptedPath, options = {}) {
        const encryptedData = fs.readFileSync(encryptedPath);
        const metadata = JSON.parse(fs.readFileSync(encryptedPath + '.meta', 'utf8'));
        
        const decrypted = await this.decryptData(
            encryptedData.toString('base64'),
            metadata.algorithm,
            {
                key: options.key,
                iv: metadata.iv,
                authTag: metadata.authTag
            }
        );
        
        const decryptedPath = encryptedPath.replace('.enc', '.dec');
        fs.writeFileSync(decryptedPath, decrypted.decrypted);
        
        return {
            success: true,
            encryptedFile: encryptedPath,
            decryptedFile: decryptedPath,
            algorithm: metadata.algorithm,
            verified: decrypted.verified || false,
            source: this.name
        };
    }
    
    async generatePassword(options = {}) {
        const length = options.length || 16;
        const includeUppercase = options.includeUppercase !== false;
        const includeLowercase = options.includeLowercase !== false;
        const includeNumbers = options.includeNumbers !== false;
        const includeSymbols = options.includeSymbols !== false;
        
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        let charset = '';
        if (includeUppercase) charset += uppercase;
        if (includeLowercase) charset += lowercase;
        if (includeNumbers) charset += numbers;
        if (includeSymbols) charset += symbols;
        
        if (charset.length === 0) {
            throw new Error('At least one character set must be included');
        }
        
        let password = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = crypto.randomInt(0, charset.length);
            password += charset[randomIndex];
        }
        
        // Calculate password strength
        const strength = this.calculatePasswordStrength(password);
        
        return {
            password: password,
            length: length,
            strength: strength.score,
            category: strength.category,
            entropy: strength.entropy,
            characterSets: {
                uppercase: includeUppercase,
                lowercase: includeLowercase,
                numbers: includeNumbers,
                symbols: includeSymbols
            },
            source: this.name
        };
    }
    
    calculatePasswordStrength(password) {
        let score = 0;
        let entropy = 0;
        
        // Length score
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (password.length >= 16) score += 2;
        
        // Character variety
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSymbols = /[^A-Za-z0-9]/.test(password);
        
        if (hasUppercase) score += 1;
        if (hasLowercase) score += 1;
        if (hasNumbers) score += 1;
        if (hasSymbols) score += 2;
        
        // Calculate entropy
        let charsetSize = 0;
        if (hasUppercase) charsetSize += 26;
        if (hasLowercase) charsetSize += 26;
        if (hasNumbers) charsetSize += 10;
        if (hasSymbols) charsetSize += 32;
        
        if (charsetSize > 0) {
            entropy = Math.log2(Math.pow(charsetSize, password.length));
        }
        
        // Determine category
        let category;
        if (score >= 7) category = 'Very Strong';
        else if (score >= 5) category = 'Strong';
        else if (score >= 3) category = 'Moderate';
        else category = 'Weak';
        
        return {
            score: score,
            category: category,
            entropy: entropy.toFixed(2)
        };
    }
    
    async digitalSignature(data, options = {}) {
        const privateKey = options.privateKey;
        const algorithm = options.algorithm || 'RSA-SHA256';
        
        if (!privateKey) {
            throw new Error('Private key required for signing');
        }
        
        const sign = crypto.createSign(algorithm);
        sign.update(data);
        sign.end();
        
        const signature = sign.sign(privateKey, 'base64');
        
        return {
            signature: signature,
            algorithm: algorithm,
            dataHash: this.hashData(data, { algorithm: algorithm.split('-')[1] }).hash,
            source: this.name
        };
    }
    
    async verifySignature(data, signature, options = {}) {
        const publicKey = options.publicKey;
        const algorithm = options.algorithm || 'RSA-SHA256';
        
        if (!publicKey) {
            throw new Error('Public key required for verification');
        }
        
        const verify = crypto.createVerify(algorithm);
        verify.update(data);
        verify.end();
        
        const isValid = verify.verify(publicKey, signature, 'base64');
        
        return {
            verified: isValid,
            algorithm: algorithm,
            source: this.name
        };
    }
    
    async generateCertificate(options = {}) {
        const { generateKeyPairSync, createCertificate } = crypto;
        
        const { publicKey, privateKey } = generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });
        
        const cert = createCertificate({
            issuer: options.issuer || {
                C: 'US',
                ST: 'California',
                L: 'San Francisco',
                O: 'RAHL AI',
                CN: 'RAHL AI Certificate'
            },
            subject: options.subject || {
                C: 'US',
                ST: 'California',
                L: 'San Francisco',
                O: 'User',
                CN: 'user@example.com'
            },
            serialNumber: options.serial || '01',
            notBefore: new Date(),
            notAfter: new Date(Date.now() + (options.days || 365) * 24 * 60 * 60 * 1000),
            publicKey: publicKey,
            sign: privateKey,
            hash: 'sha256'
        });
        
        return {
            certificate: cert.toString(),
            privateKey: privateKey,
            publicKey: publicKey,
            validFrom: cert.validity.notBefore,
            validTo: cert.validity.notAfter,
            subject: cert.subject,
            issuer: cert.issuer,
            source: this.name
        };
    }
}

module.exports = Encryption;
