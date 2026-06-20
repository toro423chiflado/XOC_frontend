import { motion } from 'framer-motion';

type Partner = {
  name: string;
  category: string;
  iconPath?: string;
};

const PARTNERS: Partner[] = [
  { name: 'Palo Alto Networks', category: 'Ciberseguridad', iconPath: '/PaloAltoNetworks_2020_Logo.svg' },
  { name: 'Fortinet', category: 'Ciberseguridad',iconPath: '/fortinet-logo.svg' },
  { name: 'Kaspersky', category: 'Ciberseguridad', iconPath: '/kaspersky-1.svg' },
  { name: 'Tenable', category: 'Vulnerabilidades', iconPath: '/660ddd9925059d06e6284b7a30b395f4.png' },
  { name: 'InsightVM', category: 'Vulnerabilidades', iconPath: '/insightvm-rapid7-landing.png' },
  { name: 'Veracode', category: 'Vulnerabilidades', iconPath: '/idSSp8MToN_logos.svg' },
  { name: 'Synopsys', category: 'Vulnerabilidades',iconPath: '/idPJuJxUaS_logos.svg' },
  { name: 'Splunk', category: 'Observabilidad', iconPath: '/splunk.svg' },
  { name: 'AppDynamics', category: 'Observabilidad',iconPath: '/appdynamics-ar21~bgwhite.svg' },
  { name: 'Zabbix', category: 'Monitoreo', iconPath: '/Zabbix_logo.svg' },
  { name: 'SolarWinds', category: 'Monitoreo', iconPath: '/solarwinds.svg' },
  { name: 'Cisco', category: 'Infraestructura', iconPath: '/cisco-svgrepo-com.svg' },
  { name: 'Aruba (HPE)', category: 'Infraestructura', iconPath: '/Hpe-aruba-networking-logo.svg' },
  { name: 'Hewlett Packard Enterprise', category: 'Infraestructura', iconPath: '/hewlett-packard-enterprise-seeklogo.png' },
  { name: 'Microsoft', category: 'Cloud', iconPath: '/Microsoft_Azure.svg.png' },
  { name: 'Google', category: 'Cloud', iconPath: '/google-icon-logo-svgrepo-com.svg' },
  { name: 'Cloudflare', category: 'Edge / Seguridad Web', iconPath: '/cloudflare-svgrepo-com.svg' },
  { name: 'ServiceNow', category: 'ITSM', iconPath: '/idgCUq3t1k_logos.png' },
];

export default function PartnersCarouselSection() {
  const carouselItems = [...PARTNERS, ...PARTNERS, ...PARTNERS];

  return (
    <section id="partners" className="py-20 bg-[#0a0a0a] relative overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
        <h2 className="text-[10px] font-black tracking-[0.5em] uppercase text-gray-500 mb-4 antialiased">
          Trusted by Industry Leaders & Integrations
        </h2>
      </div>

      <div className="relative w-full">
        {/* Shadow Masks for Premium Fade Effect */}
        <div className="absolute inset-y-0 left-0 w-32 md:w-64 bg-gradient-to-r from-[#0a0a0a] to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 md:w-64 bg-gradient-to-l from-[#0a0a0a] to-transparent z-20 pointer-events-none" />

        <div className="flex overflow-hidden">
          <motion.div
            className="flex gap-16 md:gap-24 items-center w-max flex-nowrap py-4"
            animate={{ x: ['0%', '-33.33%'] }}
            transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
          >
            {carouselItems.map((partner, idx) => (
              <div 
                key={`${partner.name}-${idx}`} 
                className="flex items-center gap-4 group cursor-default"
              >
                <div className="flex flex-col items-center lg:items-start transition-all duration-500">
                  {partner.iconPath ? (
                    <img 
                      src={partner.iconPath} 
                      alt={partner.name} 
                      className="h-8 md:h-10 w-auto object-contain grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 drop-shadow-2xl" 
                    />
                  ) : (
                    <div className="h-8 md:h-10 flex items-center">
                       <span className="text-xl md:text-2xl font-black italic tracking-tighter text-gray-700 group-hover:text-white transition-colors duration-500 uppercase">
                         {partner.name}
                       </span>
                    </div>
                  )}
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-800 group-hover:text-neon-green transition-colors mt-2">
                    {partner.category}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
