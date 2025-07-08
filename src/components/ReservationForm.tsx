import React, { useState } from 'react';
import { useAPI } from '../contexts/APIContext';
import { Calendar, Clock, Users, MapPin, MessageCircle, Instagram, Phone } from 'lucide-react';

interface ReservationFormProps {
  onSuccess: (reservation: unknown) => void;
  onError: (error: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const ReservationForm: React.FC<ReservationFormProps> = ({
  onSuccess,
  onError,
  loading,
  setLoading,
}) => {
  const { createReservation } = useAPI();
  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    contactoTipo: 'whatsapp',
    fecha: '',
    hora: '',
    personas: 2,
    tipoMesa: 'estandar',
    observaciones: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form data
      if (!formData.nombre || !formData.contacto || !formData.fecha || !formData.hora) {
        throw new Error('Por favor completa todos los campos obligatorios');
      }

      // Check if date is in the future
      const selectedDate = new Date(`${formData.fecha}T${formData.hora}`);
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      if (selectedDate < twoHoursFromNow) {
        throw new Error('Las reservas deben hacerse con al menos 2 horas de anticipación');
      }

      const reservationData = {
        nombre: formData.nombre,
        contacto: formData.contacto,
        fecha: formData.fecha,
        hora: formData.hora,
        personas: formData.personas,
        tipoMesa: formData.tipoMesa,
        observaciones: formData.observaciones || undefined,
      };

      const result = await createReservation(reservationData);
      onSuccess(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear la reserva';
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };



  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-6">
          Información de la Reserva
        </h3>
        
        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">
              Nombre del Organizador *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Tu nombre completo"
              required
            />
          </div>

          {/* Contacto */}
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">
              Contacto *
            </label>
            <div className="flex space-x-2">
              <select
                name="contactoTipo"
                value={formData.contactoTipo}
                onChange={handleChange}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
              </select>
              <div className="flex-1 relative">
                <input
                  type="text"
                  name="contacto"
                  value={formData.contacto}
                  onChange={handleChange}
                  className="w-full px-3 py-2 pl-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={formData.contactoTipo === 'whatsapp' ? '+1234567890' : '@usuario'}
                  required
                />
                {formData.contactoTipo === 'whatsapp' ? (
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-purple-400" />
                ) : (
                  <Instagram className="absolute left-3 top-2.5 h-4 w-4 text-purple-400" />
                )}
              </div>
            </div>
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Fecha *
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 pl-10 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-purple-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Hora *
              </label>
              <div className="relative">
                <input
                  type="time"
                  name="hora"
                  value={formData.hora}
                  onChange={handleChange}
                  className="w-full px-3 py-2 pl-10 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-purple-400" />
              </div>
            </div>
          </div>

          {/* Número de Personas */}
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">
              Número de Personas *
            </label>
            <div className="relative">
              <input
                type="number"
                name="personas"
                value={formData.personas}
                onChange={handleChange}
                min="1"
                max="12"
                className="w-full px-3 py-2 pl-10 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
              <Users className="absolute left-3 top-2.5 h-4 w-4 text-purple-400" />
            </div>
          </div>

          {/* Tipo de Mesa */}
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">
              Tipo de Mesa *
            </label>
            <div className="relative">
              <select
                name="tipoMesa"
                value={formData.tipoMesa}
                onChange={handleChange}
                className="w-full px-3 py-2 pl-10 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="estandar">Estándar</option>
                <option value="vip">VIP</option>
                <option value="terraza">Terraza</option>
              </select>
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-purple-400" />
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">
              Observaciones (opcional)
            </label>
            <div className="relative">
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 pl-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="Alguna petición especial o comentario..."
              />
              <MessageCircle className="absolute left-3 top-2.5 h-4 w-4 text-purple-400" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
        >
          {loading ? 'Creando Reserva...' : 'Crear Reserva'}
        </button>
      </div>
    </form>
  );
};

export default ReservationForm;