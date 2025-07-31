import React, { useState } from 'react';
import { useAPI } from '../contexts/APIContext';
import ReservationForm from '../components/ReservationForm';
import QRDisplay from '../components/QRDisplay';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';

const Reservation: React.FC = () => {
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { assignTable } = useAPI();

  const handleReservationSuccess = async (reservationData: { id: string }) => {
    try {
      await assignTable(reservationData.id);
      setReservation(reservationData);
      setError('');
    } catch {
      setError('Error al asignar mesa automáticamente');
      setReservation(reservationData);
    }
  };

  const handleReservationError = (errorMessage: string) => {
    setError(errorMessage);
    setReservation(null);
  };

  const resetForm = () => {
    setReservation(null);
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          Reserva tu Mesa
        </h1>
        <p className="text-purple-200 text-lg">
          Completa el formulario para crear tu reserva y obtener el código QR
        </p>
      </div>

      {!reservation ? (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <ReservationForm
              onSuccess={handleReservationSuccess}
              onError={handleReservationError}
              loading={loading}
              setLoading={setLoading}
            />
            
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">
                Información Importante
              </h3>
              <div className="space-y-3 text-purple-200 text-sm">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Reservas con anticipación</p>
                    <p className="text-xs text-purple-300">Se requiere reservar con al menos 2 horas de anticipación</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Tiempo de espera</p>
                    <p className="text-xs text-purple-300">Las mesas se liberan automáticamente después de 15 minutos</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Tamaño del grupo</p>
                    <p className="text-xs text-purple-300">Máximo 12 personas por reserva</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Tipos de mesa</p>
                    <p className="text-xs text-purple-300">Estándar, VIP, Terraza disponibles</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30">
              <h3 className="text-lg font-semibold text-white mb-2">
                ¿Cómo funciona el check-in?
              </h3>
              <div className="space-y-2 text-purple-200 text-sm">
                <p>1. Recibirás un código QR único</p>
                <p>2. Compártelo con todos los miembros del grupo</p>
                <p>3. Cada persona debe escanear el QR para registrarse</p>
                <p>4. El host del bar gestionará el ingreso de cada uno</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <QRDisplay reservation={reservation} onReset={resetForm} />
      )}
    </div>
  );
};

export default Reservation;