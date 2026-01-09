import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';

export interface QRData {
  eventId: number;
  timestamp: number;
}

export const generateQRCodeForEvent = async (eventId: number): Promise<string> => {
  try {
    // Create QR data payload
    const qrData: QRData = {
      eventId,
      timestamp: Date.now()
    };

    // Sign the QR data to prevent tampering
    const signedData = jwt.sign(qrData, process.env.QR_SECRET!, { expiresIn: '24h' });

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(signedData, {
      errorCorrectionLevel: 'M' as any,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

export const verifyQRData = (qrData: string): QRData | null => {
  try {
    // Verify and decode the signed QR data
    const decoded = jwt.verify(qrData, process.env.QR_SECRET!) as QRData;
    
    // Additional validation can be added here
    if (!decoded.eventId || !decoded.timestamp) {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Error verifying QR data:', error);
    return null;
  }
};