export interface QRData {
    eventId: number;
    timestamp: number;
}
export declare const generateQRCodeForEvent: (eventId: number) => Promise<string>;
export declare const verifyQRData: (qrData: string) => QRData | null;
