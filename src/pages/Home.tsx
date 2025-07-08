import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ScanLine, Users, Map, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  const features = [
    {
      title: 'Hacer Reserva',
      description: 'Reserva tu mesa para el grupo de manera rápida y sencilla',
      icon: Calendar,
      href: '/reservation',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Check-in Host',
      description: 'Escanea códigos QR y gestiona el ingreso de los grupos',
      icon: ScanLine,
      href: '/checkin',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Ver Mesas',
      description: 'Visualiza el estado actual de todas las mesas del bar',
      icon: Map,
      href: '/tables',
      color: 'from-green-500 to-emerald-500',
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            Bienvenido a{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              BarReservas
            </span>
          </h1>
          <p className="text-xl text-purple-200 max-w-3xl mx-auto">
            Sistema completo de reservas y check-in para grupos. Gestiona tu experiencia en el bar de manera eficiente.
          </p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-2xl mx-auto border border-white/20">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Users className="h-6 w-6 text-purple-400" />
            <span className="text-lg font-semibold text-white">¿Cómo funciona?</span>
          </div>
          <div className="text-purple-200 space-y-2">
            <p><strong>1.</strong> El organizador hace la reserva y recibe un código QR</p>
            <p><strong>2.</strong> Los miembros del grupo escanean el QR para registrarse</p>
            <p><strong>3.</strong> El host del bar gestiona el check-in de cada persona</p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Link
              key={index}
              to={feature.href}
              className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-8 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              <div className="relative space-y-4">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white group-hover:text-purple-200 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-purple-200 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                
                <div className="flex items-center text-purple-400 group-hover:text-purple-300 transition-colors">
                  <span className="text-sm font-medium">Ir a {feature.title}</span>
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Stats Section */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
        <div className="grid grid-cols-3 gap-8 text-center">
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">24/7</div>
            <div className="text-purple-200 text-sm">Disponible</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">{'< 1min'}</div>
            <div className="text-purple-200 text-sm">Reserva rápida</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">100%</div>
            <div className="text-purple-200 text-sm">Móvil</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;