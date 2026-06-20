import { motion } from 'framer-motion';

export default function IntegrationsSection() {
  const coreStack = [
    { name: 'Azure AI Foundry', iconPath: './AZUREAI Foundry.png' },
    { name: 'Microsoft Azure', iconPath: './Microsoft_Azure.svg.png' },
    { name: 'Claude Agent SDK', iconPath: './awan_getting_started_claude_agent_sdk_2.png' }
  ];

  const securityEcosystem = [
    { name: 'Wazuh', iconPath: './logo-wazuh-landing.png', whiteBg: true },
    { name: 'OpenVAS', iconPath: './greenbone_openvass_logo.svg' },
    { name: 'Nessus', iconPath: './logo-nessus-landing.png' },
    { name: 'InsightVM', iconPath: './insightvm-rapid7-landing.png', whiteBg: true },
    { name: 'Qualys', iconPath: './Logo-Qualys-landing.png', whiteBg: true },
    { name: 'Nmap', iconPath: './nmap-logo-landing.png' },
    { name: 'Zabbix', iconPath: './Zabbix_logo.svg' },
    { name: 'Splunk', iconPath: './Splunk_logo-landing.png', whiteBg: true },
    { name: 'Uptime Kuma', iconPath: './uptime-kuma.svg' },
    { name: 'Cisco Meraki', iconPath: './meraki-logo-landing.png' }
  ];

  return (
    <section id="integraciones" className="py-20 px-6 relative bg-[#0a0a0a] overflow-hidden">
      {/* Refined Horizon Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[180%] h-[400px] bg-gradient-to-b from-white/[0.03] to-transparent rounded-[100%] border-t border-white/[0.05] pointer-events-none -z-10 flex justify-center">
         <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent blur-sm" />
      </div>
      
      <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="flex justify-center mb-6">
            <span className="px-3 py-1 text-[9px] font-black tracking-[0.3em] uppercase bg-white/5 border border-white/10 rounded-md shadow-lg flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-green shadow-[0_0_8px_rgba(0,255,159,0.7)]" />
              INFRAESTRUCTURA E INTEGRACIONES
            </span>
          </div>
          
          <h2 className="text-2xl md:text-4xl font-black mb-14 uppercase tracking-tight text-white leading-tight">
             Infraestructura y ecosistema <br className="hidden md:block"/> de integraciones
          </h2>

          <div className="mb-20">
              <div className="flex items-center gap-4 mb-8 justify-center">
                 <div className="h-px bg-white/5 flex-1 max-w-[100px]" />
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neon-green">Infraestructura & AI</h3>
                 <div className="h-px bg-white/5 flex-1 max-w-[100px]" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
                  {coreStack.map((brand, idx) => (
                       <motion.div
                           key={idx}
                           initial={{ opacity: 0, y: 20 }}
                           whileInView={{ opacity: 1, y: 0 }}
                           viewport={{ once: true }}
                           transition={{ delay: idx * 0.1 }}
                           whileHover={{ y: -8, borderColor: 'rgba(0,255,159,0.4)' }}
                           className="h-44 rounded-[2rem] bg-[#0d0d0d] border border-white/[0.05] flex flex-col items-center justify-center p-8 transition-all duration-500 group relative overflow-hidden shadow-2xl"
                        >
                           {/* Holographic Background */}
                           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,159,0.08),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                           <div className="absolute -inset-px bg-gradient-to-br from-white/10 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem]" />
                           
                           <div className="relative mb-6 flex items-center justify-center w-full">
                               <img 
                                   src={brand.iconPath} 
                                   alt={brand.name} 
                                   className={`relative z-10 h-20 object-contain transition-all duration-500 scale-100 group-hover:scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,0.3)] ${brand.name === 'Claude Agent SDK' ? 'rounded-2xl' : ''}`}
                               />
                               {/* Subtle light ring */}
                               <div className="absolute h-24 w-24 rounded-full border border-neon-green/20 scale-50 opacity-0 group-hover:scale-150 group-hover:opacity-100 transition-all duration-1000 blur-sm" />
                           </div>
                           
                           <div className="relative z-10 flex flex-col items-center">
                             <span className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 group-hover:text-white transition-colors">{brand.name}</span>
                             <div className="h-0.5 w-0 bg-neon-green mt-1 group-hover:w-8 transition-all duration-500 rounded-full" />
                           </div>
                       </motion.div>
                  ))}
              </div>
          </div>

           <div>
              <div className="flex items-center gap-4 mb-8 justify-center">
                 <div className="h-px bg-white/5 flex-1 max-w-[100px]" />
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Security & Observability</h3>
                 <div className="h-px bg-white/5 flex-1 max-w-[100px]" />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-5xl mx-auto">
                  {securityEcosystem.map((brand, idx) => (
                       <motion.div
                           key={idx}
                           initial={{ opacity: 0, scale: 0.95 }}
                           whileInView={{ opacity: 1, scale: 1 }}
                           viewport={{ once: true }}
                           transition={{ delay: (idx % 5) * 0.05 }}
                           whileHover={{ y: -5, scale: 1.02, borderColor: 'rgba(255,255,255,0.2)' }}
                            className="h-32 rounded-2xl bg-[#0d0d0d] border border-white/[0.05] flex flex-col items-center justify-center p-5 transition-all duration-500 group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03),transparent_60%)] group-hover:rgba(0,255,159,0.05) transition-all" />
                            
                            {brand.iconPath ? (
                            <div className="relative mb-4 flex items-center justify-center w-full px-2">
                                <div className={`relative z-10 w-full h-14 flex items-center justify-center transition-all duration-500 ${(brand as any).whiteBg ? 'bg-white rounded-xl shadow-lg p-3' : ''}`}>
                                  <img
                                      src={brand.iconPath}
                                      alt={brand.name}
                                      className={`object-contain transition-all duration-500 scale-100 group-hover:scale-110 
                                        ${(brand as any).whiteBg ? 'h-8' : 
                                          brand.name === 'Nmap' ? 'h-14 opacity-90 brightness-110 contrast-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.15)] group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover:opacity-100' :
                                          'h-11 opacity-90 brightness-110 contrast-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.15)] group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover:opacity-100'}`}
                                  />
                                </div>
                                {/* Scanning light effect - Only for non-white-bg to keep it clean */}
                                {!(brand as any).whiteBg && <div className="absolute -top-10 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[scan_2s_linear_infinite] opacity-0 group-hover:opacity-100" />}
                            </div>
                           ) : (
                            <div className="h-10 mb-2 px-3 rounded-lg border border-white/10 text-gray-600 text-[8px] font-black tracking-wider uppercase flex items-center justify-center group-hover:text-gray-400 group-hover:border-white/20 transition-colors">
                                {brand.name}
                            </div>
                           )}
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 group-hover:text-white transition-colors text-center relative z-10">{brand.name}</span>
                        </motion.div>
                   ))}
               </div>
          </div>
      </div>
    </section>
  );
}
