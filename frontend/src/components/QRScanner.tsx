'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Camera, X, CheckCircle, AlertTriangle } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose?: () => void;
  isLoading?: boolean;
  error?: string;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScan,
  onClose,
  isLoading = false,
  error
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [scanResult, setScanResult] = useState<string>('');

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
        setHasCamera(true);
        
        // Start scanning after video loads
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play();
            startScanning();
          }
        };
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setHasCamera(false);
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const startScanning = () => {
    const scanFrame = () => {
      if (videoRef.current && canvasRef.current && isScanning) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');
        
        if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          
          // Try to decode QR code from canvas
          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            // Note: In a real implementation, you would use a QR code library here
            // For now, we'll simulate QR scanning
            // const code = jsQR(imageData.data, imageData.width, imageData.height);
            // if (code) {
            //   setScanResult(code.data);
            //   onScan(code.data);
            //   setIsScanning(false);
            // }
          } catch (error) {
            // Handle scan error
          }
        }
        
        if (isScanning) {
          requestAnimationFrame(scanFrame);
        }
      }
    };
    
    requestAnimationFrame(scanFrame);
  };

  const handleManualInput = (data: string) => {
    setScanResult(data);
    onScan(data);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Scan QR Code</h3>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {hasCamera ? (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 object-cover rounded-lg bg-gray-100"
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white rounded-lg shadow-lg">
                  <div className="w-full h-full border-2 border-blue-500 rounded-lg border-dashed animate-pulse" />
                </div>
              </div>

              {isScanning && (
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black bg-opacity-75 text-white text-sm px-3 py-2 rounded-md text-center">
                    Position QR code within the frame
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 text-center">
              <div className="flex items-center justify-center space-x-2">
                <Camera className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {isScanning ? 'Scanning...' : 'Camera loading...'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-yellow-800">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Camera access required</span>
            </div>
            <p className="text-sm text-yellow-700 mt-2">
              Please allow camera access to scan QR codes or enter the code manually below.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Manual Input Fallback */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium text-gray-900 mb-3">Manual Entry</h4>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter QR code data manually"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleManualInput((e.target as HTMLInputElement).value);
                }
              }}
            />
            <Button 
              size="sm" 
              onClick={() => {
                const input = document.querySelector('input[placeholder="Enter QR code data manually"]') as HTMLInputElement;
                if (input?.value) {
                  handleManualInput(input.value);
                }
              }}
            >
              Submit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {isLoading && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-blue-800">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
              <span>Processing check-in...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {scanResult && !isLoading && !error && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="w-4 h-4" />
              <span>QR code scanned successfully!</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>Make sure the QR code is well-lit and clearly visible</p>
        <p>Point your camera directly at the QR code</p>
      </div>
    </div>
  );
};