import React, { useEffect, useState } from 'react';
import { Users, BarChart2, Repeat, Instagram, TrendingUp } from 'lucide-react';
import { useAPI } from '../contexts/APIContext';

const mockMetrics = {
  totalClientes: 124,
  clientesPorGenero: { hombre: 60, mujer: 58, otro: 6 },
  consumoPromedioGrupo: 850,
  consumoPromedioPersona: 140,
  recurrentes: 32,
  nuevos: 92,
  instagramConectados: 41,
  embudo: [124, 110, 98, 90], // ejemplo: reservas, check-in, consumo, recurrentes
};

const MetricsAdmin: React.FC = () => {
  const { getMetrics } = useAPI?.() || {};
  const [metrics, setMetrics] = useState<typeof mockMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!getMetrics) return setLoading(false);
      try {
        const data = await getMetrics();
        setMetrics(data);
        setError('');
      } catch {
        setError('No se pudieron cargar las métricas. Mostrando datos de ejemplo.');
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [getMetrics]);

  const m = metrics || mockMetrics;

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-white">Panel de Métricas & Admin</h1>
        <p className="text-purple-200 text-lg">Estadísticas clave de la noche y segmentación de clientes</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-center text-red-200 mb-4">{error}</div>
          )}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 rounded-2xl p-6 border border-white/20 text-center">
              <Users className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{m.totalClientes}</div>
              <div className="text-purple-200 text-sm">Clientes totales</div>
              <div className="flex justify-center gap-2 mt-2 text-xs">
                <span className="text-blue-300">♂️ {m.clientesPorGenero.hombre}</span>
                <span className="text-pink-300">♀️ {m.clientesPorGenero.mujer}</span>
                <span className="text-purple-300">⚧️ {m.clientesPorGenero.otro}</span>
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-6 border border-white/20 text-center">
              <BarChart2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">${m.consumoPromedioGrupo}</div>
              <div className="text-purple-200 text-sm">Consumo promedio por grupo</div>
              <div className="text-lg text-purple-300 mt-2">${m.consumoPromedioPersona} / persona</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-6 border border-white/20 text-center">
              <Repeat className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{m.recurrentes}</div>
              <div className="text-purple-200 text-sm">Clientes recurrentes</div>
              <div className="text-lg text-purple-300 mt-2">{m.nuevos} nuevos</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-6 border border-white/20 text-center">
              <Instagram className="h-8 w-8 text-pink-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{m.instagramConectados}</div>
              <div className="text-purple-200 text-sm">Instagram conectados</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-6 border border-white/20 text-center col-span-2 md:col-span-1">
              <TrendingUp className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">Embudo de fidelización</div>
              <div className="text-purple-200 text-sm mt-2">Reservas: {m.embudo[0]} → Check-in: {m.embudo[1]} → Consumo: {m.embudo[2]} → Recurrentes: {m.embudo[3]}</div>
            </div>
          </div>
        </>
      )}
      <div className="text-center pt-8">
        <p className="text-purple-300 text-sm">* Estos datos son de ejemplo. Integraremos datos reales del backend y BI en el siguiente paso.</p>
      </div>
    </div>
  );
};

export default MetricsAdmin; 