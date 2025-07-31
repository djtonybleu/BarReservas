import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Database, Users, Clock, TrendingUp } from 'lucide-react';

interface Metrics {
  reservations: {
    total: number;
    byType: Record<string, number>;
  };
  qrScans: {
    total: number;
    successful: number;
    failed: number;
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    uptime: number;
  };
}

interface Alert {
  id: string;
  type: string;
  severity: 'WARNING' | 'CRITICAL';
  message: string;
  timestamp: number;
}

const MonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // WebSocket connection for real-time updates
    const ws = new WebSocket(`ws://${window.location.host}/ws`);
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log('Connected to monitoring WebSocket');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'metrics':
          setMetrics(message.data);
          break;
        case 'alert':
          setAlerts(prev => [message.data, ...prev.slice(0, 9)]);
          break;
        case 'reservation':
          // Update reservation count in real-time
          setMetrics(prev => prev ? {
            ...prev,
            reservations: {
              ...prev.reservations,
              total: prev.reservations.total + 1
            }
          } : null);
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('Disconnected from monitoring WebSocket');
    };

    // Fetch initial data
    fetchMetrics();

    return () => {
      ws.close();
    };
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/monitoring/metrics/realtime');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Monitoring Dashboard</h1>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
          isConnected ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Reservations Today"
          value={metrics.reservations.total}
          icon={<Users className="h-6 w-6" />}
          color="blue"
        />
        <MetricCard
          title="QR Scans"
          value={metrics.qrScans.total}
          subtitle={`${metrics.qrScans.successful} successful`}
          icon={<Activity className="h-6 w-6" />}
          color="green"
        />
        <MetricCard
          title="Memory Usage"
          value={`${metrics.system.memory.percentage}%`}
          subtitle={`${metrics.system.memory.used}MB / ${metrics.system.memory.total}MB`}
          icon={<Database className="h-6 w-6" />}
          color={metrics.system.memory.percentage > 80 ? "red" : "purple"}
        />
        <MetricCard
          title="Uptime"
          value={formatUptime(metrics.system.uptime)}
          icon={<Clock className="h-6 w-6" />}
          color="cyan"
        />
      </div>

      {/* Reservation Types Chart */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Reservations by Type</h3>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(metrics.reservations.byType).map(([type, count]) => (
            <div key={type} className="text-center">
              <div className="text-2xl font-bold text-white">{count}</div>
              <div className="text-sm text-purple-300 capitalize">{type}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-400" />
            Recent Alerts
          </h3>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-red-500/20 border-red-500/50 text-red-200'
                    : 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{alert.type}</span>
                  <span className="text-xs">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm mt-1">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Chart Placeholder */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-green-400" />
          Performance Trends
        </h3>
        <div className="h-48 flex items-center justify-center text-purple-300">
          <p>Performance chart would be rendered here</p>
          <p className="text-sm mt-2">Integration with Chart.js or similar library</p>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
    red: 'from-red-500 to-orange-500',
    cyan: 'from-cyan-500 to-blue-500'
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg bg-gradient-to-r ${colorClasses[color]} shadow-lg`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-purple-200">{title}</div>
      {subtitle && (
        <div className="text-xs text-purple-300 mt-1">{subtitle}</div>
      )}
    </div>
  );
};

const formatUptime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  return `${hours}h ${minutes}m`;
};

export default MonitoringDashboard;