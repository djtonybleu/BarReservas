import React, { useState } from 'react';
import { useAPI } from '../contexts/APIContext';
import { User, Instagram, CheckCircle } from 'lucide-react';

interface MemberFormProps {
  groupId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const MemberForm: React.FC<MemberFormProps> = ({ groupId, onSuccess, onError }) => {
  const { addMember } = useAPI();
  const [formData, setFormData] = useState({
    genero: '',
    instagram: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.genero) {
        throw new Error('El género es obligatorio');
      }

      const memberData = {
        genero: formData.genero,
        instagram: formData.instagram || undefined,
      };

      await addMember(groupId, memberData);
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al registrar el miembro';
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Género */}
      <div>
        <label className="block text-sm font-medium text-purple-200 mb-2">
          Género *
        </label>
        <div className="relative">
          <select
            name="genero"
            value={formData.genero}
            onChange={handleChange}
            className="w-full px-3 py-2 pl-10 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          >
            <option value="">Selecciona tu género</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
            <option value="otro">Otro</option>
            <option value="prefiero-no-decir">Prefiero no decir</option>
          </select>
          <User className="absolute left-3 top-2.5 h-4 w-4 text-purple-400" />
        </div>
      </div>

      {/* Instagram */}
      <div>
        <label className="block text-sm font-medium text-purple-200 mb-2">
          Instagram (opcional)
        </label>
        <div className="relative">
          <input
            type="text"
            name="instagram"
            value={formData.instagram}
            onChange={handleChange}
            className="w-full px-3 py-2 pl-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="tu_usuario"
          />
          <Instagram className="absolute left-3 top-2.5 h-4 w-4 text-purple-400" />
        </div>
        <p className="text-xs text-purple-300 mt-1">
          Sin el símbolo @, solo tu nombre de usuario
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 flex items-center justify-center space-x-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Registrando...</span>
          </>
        ) : (
          <>
            <CheckCircle className="h-5 w-5" />
            <span>Registrarse al Grupo</span>
          </>
        )}
      </button>

      {/* Info */}
      <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
        <p className="text-blue-200 text-sm">
          <strong>Nota:</strong> Una vez que te registres, el host del bar podrá gestionar tu check-in
          cuando llegues al establecimiento. Recibirás confirmación una vez completado el registro.
        </p>
      </div>
    </form>
  );
};

export default MemberForm;