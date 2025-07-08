import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAPI } from '../contexts/APIContext';
import { Camera, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScanResult: (groupData: unknown) => void;
  onScanError: (error: string) => void;
  scanning: boolean;
  setScanning: (scanning: boolean) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({
  onScanResult,
  onScanError,
  scanning,
  setScanning,
}) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { getGroup } = useAPI();

  useEffect(() => {
    if (scanning) {
      scannerRef.current = new Html5QrcodeScanner(
        'qr-scanner',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        false
      );

      scannerRef.current.render(
        async (decodedText: string) => {
          try {
            // Extract group ID from URL
            const url = new URL(decodedText);
            const pathParts = url.pathname.split('/');
            const groupId = pathParts[pathParts.length - 1];

            if (!groupId) {
              throw new Error('Código QR inválido');
            }

            // Fetch group data
            const groupData = await getGroup(groupId);
            
            // Stop scanner
            if (scannerRef.current) {
              scannerRef.current.clear();
            }
            
            onScanResult(groupData);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al procesar el código QR';
            onScanError(errorMessage);
          }
        },
        (error: string) => {
          console.log('QR scan error:', error);
        }
      );
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [scanning, getGroup, onScanResult, onScanError]);

  return (
    <div className="space-y-4">
      {!scanning ? (
        <div className="text-center space-y-4">
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
            <Camera className="h-16 w-16 text-purple-400 mx-auto mb-4" />
            <p className="text-purple-200 mb-4">
              Presiona el botón para iniciar el escáner QR
            </p>
            <button
              onClick={() => setScanning(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
            >
              Iniciar Escáner
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div id="qr-scanner" className="w-full" />
          </div>
          
          <div className="text-center">
            <button
              onClick={() => setScanning(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200"
            >
              Detener Escáner
            </button>
          </div>
          
          <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-400" />
              <p className="text-blue-200 text-sm">
                Posiciona el código QR del grupo dentro del marco para escanearlo
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;