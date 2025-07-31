import React, { useState } from 'react';
import QRScanner from '../components/QRScanner';
import GroupPanel from '../components/GroupPanel';
import { ScanLine, Users, AlertCircle } from 'lucide-react';

const CheckIn: React.FC = () => {
  const [scannedGroup, setScannedGroup] = useState<unknown>(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);

  const handleScanResult = (groupData: unknown) => {
    setScannedGroup(groupData);
    setError('');
    setScanning(false);
  };

  const handleScanError = (errorMessage: string) => {
    setError(errorMessage);
    setScannedGroup(null);
  };

  const resetScanner = () => {
    setScannedGroup(null);
    setError('');
    setScanning(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          Check-in Host
        </h1>
        <p className="text-purple-200 text-lg">
          Escanea códigos QR y gestiona el ingreso de los grupos
        </p>
      </div>

      {!scannedGroup ? (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Scanner Section */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center space-x-2 mb-4">
                <ScanLine className="h-6 w-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">
                  Escáner QR
                </h3>
              </div>
              
              <QRScanner
                onScanResult={handleScanResult}
                onScanError={handleScanError}
                scanning={scanning}
                setScanning={setScanning}
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Instructions Section */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">
                Instrucciones
              </h3>
              <div className="space-y-3 text-purple-200 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="font-medium">Posiciona el código QR</p>
                    <p className="text-xs text-purple-300">Centra el código QR del grupo dentro del marco de la cámara</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="font-medium">Escaneo automático</p>
                    <p className="text-xs text-purple-300">El sistema detectará automáticamente el código y cargará la información</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                  <div>
                    <p className="font-medium">Gestiona el ingreso</p>
                    <p className="text-xs text-purple-300">Marca el ingreso de cada miembro del grupo individualmente</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border border-blue-500/30">
              <div className="flex items-center space-x-2 mb-3">
                <Users className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">
                  Panel de Grupo
                </h3>
              </div>
              <p className="text-blue-200 text-sm">
                Una vez escaneado el código QR, podrás ver todos los detalles del grupo:
                nombre, cantidad de personas, quiénes ya ingresaron, y gestionar el check-in
                de cada miembro individualmente.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <GroupPanel group={scannedGroup} onReset={resetScanner} />
      )}
    </div>
  );
};

export default CheckIn;