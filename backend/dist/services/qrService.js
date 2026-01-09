"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyQRData = exports.generateQRCodeForEvent = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateQRCodeForEvent = async (eventId) => {
    try {
        // Create QR data payload
        const qrData = {
            eventId,
            timestamp: Date.now()
        };
        // Sign the QR data to prevent tampering
        const signedData = jsonwebtoken_1.default.sign(qrData, process.env.QR_SECRET, { expiresIn: '24h' });
        // Generate QR code as data URL
        const qrCodeDataURL = await qrcode_1.default.toDataURL(signedData, {
            errorCorrectionLevel: 'M',
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        return qrCodeDataURL;
    }
    catch (error) {
        console.error('Error generating QR code:', error);
        throw new Error('Failed to generate QR code');
    }
};
exports.generateQRCodeForEvent = generateQRCodeForEvent;
const verifyQRData = (qrData) => {
    try {
        // Verify and decode the signed QR data
        const decoded = jsonwebtoken_1.default.verify(qrData, process.env.QR_SECRET);
        // Additional validation can be added here
        if (!decoded.eventId || !decoded.timestamp) {
            return null;
        }
        return decoded;
    }
    catch (error) {
        console.error('Error verifying QR data:', error);
        return null;
    }
};
exports.verifyQRData = verifyQRData;
