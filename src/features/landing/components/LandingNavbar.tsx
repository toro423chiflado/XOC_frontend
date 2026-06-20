import { useNavigate } from 'react-router-dom';

export default function LandingNavbar() {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 w-full z-50 py-6 px-6 lg:px-12 flex items-center justify-center pointer-events-none relative">
      {/* Left Logo / Brand */}
      <div className="absolute left-6 lg:left-12 flex items-center gap-3 pointer-events-auto cursor-pointer" onClick={() => window.scrollTo(0,0)}>
        <span className="text-2xl font-black tracking-widest bg-gradient-to-r from-neon-green to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(0,255,159,0.5)]">XOC</span>
      </div>

      {/* Center Nav Pill */}
      <div className="hidden md:flex items-center gap-6 px-6 py-2.5 rounded-full bg-[#1c1c1c]/80 backdrop-blur-md border border-white/10 pointer-events-auto shadow-lg">
        <a href="#solucion" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Solución</a>
        <a href="#capacidades" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Capacidades</a>
        <a href="#integraciones" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Partners</a>
        <a href="#arquitectura" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Infra</a>
      </div>

      {/* Right Actions */}
      <div className="absolute right-6 lg:right-12 flex items-center gap-4 pointer-events-auto">
        <button 
          onClick={() => navigate('/login')}
          className="text-sm font-medium text-gray-300 hover:text-white transition-colors hidden sm:block"
        >
          Login
        </button>
        <button 
          onClick={() => navigate('/login')}
          className="px-5 py-2.5 bg-gradient-to-b from-white/10 to-transparent border border-white/20 text-white text-sm font-medium rounded-full hover:bg-white/10 transition-all shadow-lg"
        >
          Empezar
        </button>
      </div>
    </nav>
  );
}
