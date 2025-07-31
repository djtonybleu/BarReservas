import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, Copy, CheckCircle, ArrowLeft } from 'lucide-react';

interface QRDisplayProps {
  reservation: {
    id: string;
    nombre: string;
    contacto: string;
    fecha: string;
    hora: string;
    personas: number;
    tipoMesa: string;
    observaciones?: string;
  };
  onReset: () => void;
}

const QRDisplay: React.FC<QRDisplayProps> = ({ reservation, onReset }) => {
  const [copied, setCopied] = useState(false);

  const qrValue = `${window.location.origin}/member/${reservation.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Reserva BarReservas',
          text: `Únete a mi reserva en el bar`,
          url: qrValue,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopy();
    }
  };

  const handleDownload = () => {
    const svg = document.getElementById('qr-code');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx!.fillStyle = 'white';
        ctx!.fillRect(0, 0, canvas.width, canvas.height);
        ctx!.drawImage(img, 0, 0);
        
        const link = document.createElement('a');
        link.download = `reserva-${reservation.id}.png`;
        link.href = canvas.toDataURL();
        link.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white">
          ¡Reserva Confirmada!
        </h2>
        <p className="text-purple-200">
          Tu reserva ha sido creada exitosamente. Comparte el código QR con todos los miembros.
        </p>
      </div>

      {/* Reservation Details */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">
          Detalles de la Reserva
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-purple-300">Organizador:</span>
            <p className="text-white font-medium">{reservation.nombre}</p>
          </div>
          <div>
            <span className="text-purple-300">Contacto:</span>
            <p className="text-white font-medium">{reservation.contacto}</p>
          </div>
          <div>
            <span className="text-purple-300">Fecha:</span>
            <p className="text-white font-medium">{reservation.fecha}</p>
          </div>
          <div>
            <span className="text-purple-300">Hora:</span>
            <p className="text-white font-medium">{reservation.hora}</p>
          </div>
          <div>
            <span className="text-purple-300">Personas:</span>
            <p className="text-white font-medium">{reservation.personas}</p>
          </div>
          <div>
            <span className="text-purple-300">Tipo de Mesa:</span>
            <p className="text-white font-medium">{reservation.tipoMesa}</p>
          </div>
        </div>
        {reservation.observaciones && (
          <div className="mt-4">
            <span className="text-purple-300">Observaciones:</span>
            <p className="text-white font-medium">{reservation.observaciones}</p>
          </div>
        )}
      </div>

      {/* QR Code */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="text-center space-y-6">
          <h3 className="text-lg font-semibold text-white">
            Código QR para Miembros
          </h3>
          
          <div className="inline-block p-6 bg-white rounded-2xl">
            <QRCodeSVG
              id="qr-code"
              value={qrValue}
              size={200}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
            />
          </div>
          
          <div className="text-sm text-purple-200 max-w-md mx-auto">
            <p className="mb-2">
              <strong>Instrucciones:</strong>
            </p>
            <p>
              1. Comparte este código QR con todos los miembros del grupo
            </p>
            <p>
              2. Cada persona debe escanearlo para registrarse
            </p>
            <p>
              3. El host del bar gestionará el check-in con este mismo código
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleDownload}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
        >
          <Download className="h-4 w-4" />
          <span>Descargar QR</span>
        </button>
        
        <button
          onClick={handleShare}
          className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
        >
          <Share2 className="h-4 w-4" />
          <span>Compartir</span>
        </button>
        
        <button
          onClick={handleCopy}
          className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
        >
          {copied ? (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>Copiado</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copiar Link</span>
            </>
          )}
        </button>
      </div>

      {/* Reset Button */}
      <div className="text-center pt-6">
        <button
          onClick={onReset}
          className="flex items-center justify-center space-x-2 mx-auto text-purple-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Hacer otra reserva</span>
        </button>
      </div>
    </div>
  );
};

export default QRDisplay;