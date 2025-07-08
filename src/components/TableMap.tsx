import React from 'react';
import { Circle, Square, Users } from 'lucide-react';

interface Table {
  id: string;
  numero: number;
  capacidad: number;
  tipo: string;
  estado: 'libre' | 'ocupada' | 'reservada';
  grupoId?: string;
  grupoNombre?: string;
}

interface TableMapProps {
  tables: Table[];
}

const TableMap: React.FC<TableMapProps> = ({ tables }) => {
  const getTableColor = (estado: string) => {
    switch (estado) {
      case 'libre':
        return 'bg-green-500/20 border-green-500/50 text-green-300';
      case 'ocupada':
        return 'bg-red-500/20 border-red-500/50 text-red-300';
      case 'reservada':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300';
      default:
        return 'bg-gray-500/20 border-gray-500/50 text-gray-300';
    }
  };

  const getTableIcon = (tipo: string) => {
    switch (tipo) {
      case 'vip':
        return Square;
      case 'terraza':
        return Circle;
      default:
        return Users;
    }
  };

  const getStatusText = (estado: string) => {
    switch (estado) {
      case 'libre':
        return 'Libre';
      case 'ocupada':
        return 'Ocupada';
      case 'reservada':
        return 'Reservada';
      default:
        return 'Desconocido';
    }
  };

  if (tables.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-purple-400 mx-auto mb-4" />
        <p className="text-purple-200 text-lg">
          No hay información de mesas disponible
        </p>
        <p className="text-purple-300 text-sm mt-2">
          Conecta con el backend para ver el estado de las mesas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-purple-200">Libre</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm text-purple-200">Ocupada</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className="text-sm text-purple-200">Reservada</span>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {tables.map((table) => {
          const Icon = getTableIcon(table.tipo);
          return (
            <div
              key={table.id}
              className={`relative p-4 rounded-lg border transition-all duration-200 hover:scale-105 ${getTableColor(table.estado)}`}
            >
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center">
                  <Icon className="h-8 w-8" />
                </div>
                
                <div>
                  <p className="font-bold text-lg">#{table.numero}</p>
                  <p className="text-xs opacity-75">{table.capacidad} personas</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs font-medium">{getStatusText(table.estado)}</p>
                  <p className="text-xs opacity-75 capitalize">{table.tipo}</p>
                </div>
                
                {table.grupoNombre && (
                  <div className="mt-2 p-2 bg-white/10 rounded text-xs">
                    <p className="font-medium">{table.grupoNombre}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-white font-medium mb-2">Resumen por Tipo</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-purple-300">Estándar</p>
            <p className="text-white font-medium">
              {tables.filter(t => t.tipo === 'estandar').length}
            </p>
          </div>
          <div>
            <p className="text-purple-300">VIP</p>
            <p className="text-white font-medium">
              {tables.filter(t => t.tipo === 'vip').length}
            </p>
          </div>
          <div>
            <p className="text-purple-300">Terraza</p>
            <p className="text-white font-medium">
              {tables.filter(t => t.tipo === 'terraza').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableMap;