import React, { useState } from 'react';
import { useAPI } from '../contexts/APIContext';
import { Users, Clock, MapPin, UserCheck, UserX, RefreshCw, ArrowLeft, CheckCircle } from 'lucide-react';

interface GroupPanelProps {
  group: {
    id: string;
    nombre: string;
    fecha: string;
    hora: string;
    personas: number;
    tipoMesa: string;
    observaciones?: string;
    miembros: Array<{
      id: string;
      genero: string;
      instagram?: string;
      estado: string;
    }>;
  };
  onReset: () => void;
}

const GroupPanel: React.FC<GroupPanelProps> = ({ group: initialGroup, onReset }) => {
  const { updateMemberStatus, getGroup } = useAPI();
  const [group, setGroup] = useState(initialGroup);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const refreshGroup = async () => {
    try {
      setLoading(true);
      const updatedGroup = await getGroup(group.id);
      setGroup(updatedGroup);
    } catch {
      setError('Error al actualizar la información del grupo');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberCheckIn = async (memberId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ingresado' ? 'registrado' : 'ingresado';
      await updateMemberStatus(group.id, memberId, newStatus);
      setGroup(prev => ({
        ...prev,
        miembros: prev.miembros.map(member => 
          member.id === memberId 
            ? { ...member, estado: newStatus }
            : member
        )
      }));
      setSuccessMessage(newStatus === 'ingresado' ? '¡Check-in exitoso!' : 'Check-out realizado');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch {
      setError('Error al actualizar el estado del miembro');
    }
  };

  const membersCheckedIn = group.miembros?.filter(m => m.estado === 'ingresado').length || 0;
  const totalMembers = group.miembros?.length || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">
            Grupo: {group.nombre}
          </h2>
          <p className="text-purple-200">
            {membersCheckedIn} de {totalMembers} miembros han ingresado
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={refreshGroup}
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
          
          <button
            onClick={onReset}
            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </button>
        </div>
      </div>

      {/* Group Info */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">
          Información de la Reserva
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-purple-400" />
            <div>
              <p className="text-xs text-purple-300">Fecha y Hora</p>
              <p className="text-white font-medium">{group.fecha} {group.hora}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-purple-400" />
            <div>
              <p className="text-xs text-purple-300">Personas</p>
              <p className="text-white font-medium">{group.personas}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-purple-400" />
            <div>
              <p className="text-xs text-purple-300">Tipo de Mesa</p>
              <p className="text-white font-medium">{group.tipoMesa}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-xs text-purple-300">Check-in</p>
              <p className="text-white font-medium">{membersCheckedIn}/{totalMembers}</p>
            </div>
          </div>
        </div>
        
        {group.observaciones && (
          <div className="mt-4 p-3 bg-white/5 rounded-lg">
            <p className="text-xs text-purple-300">Observaciones</p>
            <p className="text-white">{group.observaciones}</p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium">Progreso de Check-in</span>
          <span className="text-purple-300 text-sm">
            {totalMembers > 0 ? Math.round((membersCheckedIn / totalMembers) * 100) : 0}%
          </span>
        </div>
        <div className="w-full bg-purple-900/40 rounded-full h-4 mb-6">
          <div
            className="bg-green-500 h-4 rounded-full transition-all duration-700"
            style={{ width: `${(membersCheckedIn / totalMembers) * 100}%` }}
          ></div>
        </div>
      </div>

      {successMessage && (
        <div className="flex items-center justify-center mb-4">
          <CheckCircle className="h-6 w-6 text-green-400 mr-2" />
          <span className="text-green-300 font-medium">{successMessage}</span>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">
          Miembros del Grupo
        </h3>
        
        {totalMembers === 0 ? (
          <div className="text-center py-8">
            <UserX className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <p className="text-purple-200">
              Aún no hay miembros registrados en este grupo
            </p>
            <p className="text-purple-300 text-sm mt-2">
              Los miembros deben escanear el código QR para registrarse
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {group.miembros.map((member, index) => (
              <div
                key={member.id || index}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                  member.estado === 'ingresado'
                    ? 'bg-green-500/20 border-green-500/50'
                    : 'bg-white/5 border-white/20'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    member.estado === 'ingresado'
                      ? 'bg-green-500 text-white'
                      : 'bg-purple-500 text-white'
                  }`}>
                    {member.estado === 'ingresado' ? (
                      <UserCheck className="h-5 w-5" />
                    ) : (
                      <Users className="h-5 w-5" />
                    )}
                  </div>
                  
                  <div>
                    <p className="text-white font-medium">
                      Miembro #{index + 1}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-purple-300">
                      <span>Género: {member.genero}</span>
                      {member.instagram && (
                        <span>@{member.instagram}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleMemberCheckIn(member.id, member.estado)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    member.estado === 'ingresado'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {member.estado === 'ingresado' ? 'Marcar Salida' : 'Ingresar'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default GroupPanel;