import React, { useState, useEffect, useCallback } from 'react';
import { useAPI } from '../contexts/APIContext';
import TableMap from '../components/TableMap';
import { Map, RefreshCw, AlertCircle } from 'lucide-react';

const Tables: React.FC = () => {
  const { getTables } = useAPI();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      const tablesData = await getTables();
      setTables(tablesData);
      setError('');
    } catch {
      setError('No se pudo cargar la información de las mesas');
    } finally {
      setLoading(false);
    }
  }, [getTables]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleRefresh = () => {
    fetchTables();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Mapa de Mesas
          </h1>
          <p className="text-purple-200 text-lg">
            Estado actual de todas las mesas del bar
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20 text-center">
          <div className="text-2xl font-bold text-white">
            {tables.filter(t => t.estado === 'ocupada').length}
          </div>
          <div className="text-sm text-red-300">Ocupadas</div>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20 text-center">
          <div className="text-2xl font-bold text-white">
            {tables.filter(t => t.estado === 'libre').length}
          </div>
          <div className="text-sm text-green-300">Libres</div>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20 text-center">
          <div className="text-2xl font-bold text-white">
            {tables.filter(t => t.estado === 'reservada').length}
          </div>
          <div className="text-sm text-yellow-300">Reservadas</div>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20 text-center">
          <div className="text-2xl font-bold text-white">
            {tables.length}
          </div>
          <div className="text-sm text-purple-300">Total</div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Table Map */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <div className="flex items-center space-x-2 mb-6">
            <Map className="h-6 w-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">
              Distribución de Mesas
            </h3>
          </div>
          
          <TableMap tables={tables} />
        </div>
      )}
    </div>
  );
};

export default Tables;