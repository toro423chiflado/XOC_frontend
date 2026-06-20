import { Globe, Users } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="py-12 px-6 border-t border-white/5 bg-black relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-4 gap-12 mb-16 text-center md:text-left">
              <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                      <div className="w-10 h-10 bg-neon-green/10 border border-neon-green/30 rounded-xl flex items-center justify-center overflow-hidden">
                          <img src="/Logo_XOC_Vectorial.svg" alt="XOC" className="w-6 h-6 object-contain" />
                      </div>
                      <div className="flex flex-col">
                          <span className="text-xl font-black tracking-tight text-white uppercase">XOC Platform</span>
                          <span className="text-[8px] font-black tracking-[0.25em] text-neon-green uppercase">Powered by TxDxSecure</span>
                      </div>
                  </div>
                  <p className="text-gray-500 font-medium text-[13px] max-w-sm mx-auto md:mx-0 leading-relaxed mb-6">
                      Xperience Operation Center: la nueva capa de control para operaciones de ciberseguridad, red y experiencia digital empresarial.
                  </p>
                  <div className="flex items-center justify-center md:justify-start gap-3">
                      <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group hover:bg-white/5 hover:border-white/30 transition-all cursor-pointer">
                          <Globe className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors" />
                      </div>
                      <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group hover:bg-white/5 hover:border-white/30 transition-all cursor-pointer">
                          <Users className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors" />
                      </div>
                  </div>
              </div>
              <div>
                  <h4 className="font-black mb-6 uppercase tracking-widest text-[11px] text-white">Plataforma</h4>
                  <ul className="space-y-3 test-xs font-bold text-gray-500">
                      <li><a href="#" className="hover:text-neon-green transition-colors">Incident Response</a></li>
                      <li><a href="#" className="hover:text-neon-green transition-colors">Integrations</a></li>
                      <li><a href="#" className="hover:text-neon-green transition-colors">SOPHIA AI Engine</a></li>
                      <li><a href="#" className="hover:text-neon-green transition-colors">Developer API</a></li>
                  </ul>
              </div>
              <div>
                  <h4 className="font-black mb-6 uppercase tracking-widest text-[11px] text-white">Compañía</h4>
                  <ul className="space-y-3 test-xs font-bold text-gray-500">
                      <li><a href="#" className="hover:text-neon-green transition-colors">Nosotros</a></li>
                      <li><a href="#" className="hover:text-neon-green transition-colors">Privacidad y Seguridad</a></li>
                      <li><a href="#" className="hover:text-neon-green transition-colors">Partners</a></li>
                      <li><a href="#" className="hover:text-neon-green transition-colors">Contacto Enterprise</a></li>
                  </ul>
              </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">© 2025 TXDX SECURE TECHNOLOGY. Enterprise operations platform.</p>
              <div className="flex items-center gap-8 text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">
                   <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-neon-green shadow-[0_0_5px_rgba(0,255,159,0.8)]" /> Global Cluster: Optimal</span>
                   <span>Engine v2.10.4-LTS</span>
              </div>
          </div>
      </div>
    </footer>
  );
}
