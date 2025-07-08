import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAPI } from '../contexts/APIContext';
import MemberForm from '../components/MemberForm';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

const Member: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { getGroup } = useAPI();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      if (!groupId) {
        setError('ID de grupo inválido');
        setLoading(false);
        return;
      }

      try {
        const groupData = await getGroup(groupId);
        setGroup(groupData);
      } catch {
        setError('No se pudo cargar la información del grupo');
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [groupId, getGroup]);

  const handleRegistrationSuccess = () => {
    setRegistered(true);
    setTimeout(() => {
      navigate('/');
    }, 3000);
  };

  const handleRegistrationError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-6 w-6 text-red-400" />
            <h3 className="text-lg font-semibold text-red-200">Error</h3>
          </div>
          <p className="text-red-200 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (registered) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="bg-green-500/20 border border-green-500/50 rounded-2xl p-8">
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            ¡Registro Exitoso!
          </h2>
          <p className="text-green-200">
            Te has registrado correctamente al grupo. Serás redirigido automáticamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          Registro de Miembro
        </h1>
        <p className="text-purple-200 text-lg">
          Completa tu información para unirte al grupo
        </p>
      </div>

      {group && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">
            Información del Grupo
          </h3>
          <div className="space-y-2 text-purple-200">
            <p><strong>Organizador:</strong> {group.nombre}</p>
            <p><strong>Fecha:</strong> {group.fecha}</p>
            <p><strong>Hora:</strong> {group.hora}</p>
            <p><strong>Personas:</strong> {group.personas}</p>
            <p><strong>Tipo de mesa:</strong> {group.tipoMesa}</p>
            {group.observaciones && (
              <p><strong>Observaciones:</strong> {group.observaciones}</p>
            )}
          </div>
        </div>
      )}

      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="flex items-center space-x-2 mb-6">
          <UserPlus className="h-6 w-6 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">
            Datos del Miembro
          </h3>
        </div>
        
        <MemberForm
          groupId={groupId!}
          onSuccess={handleRegistrationSuccess}
          onError={handleRegistrationError}
        />
      </div>
    </div>
  );
};

export default Member;