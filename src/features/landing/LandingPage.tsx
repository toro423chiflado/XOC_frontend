import LandingNavbar from './components/LandingNavbar';
import HeroSection from './components/HeroSection';
import XocDetailSection from './components/XocDetailSection';
import HowItWorksSection from './components/HowItWorksSection';
import MobileAppSection from './components/MobileAppSection';
import ProblemSolutionSection from './components/ProblemSolutionSection';
import CapabilitiesSection from './components/CapabilitiesSection';
import IntegrationsSection from './components/IntegrationsSection';
import ArchitectureSection from './components/ArchitectureSection';
import PartnersCarouselSection from './components/PartnersCarouselSection';
import CTASection from './components/CTASection';
import LandingFooter from './components/LandingFooter';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-neon-green/30 selection:text-neon-green overflow-x-hidden font-inter">
      <LandingNavbar />
      <HeroSection />
      <XocDetailSection />
      <HowItWorksSection />
      <MobileAppSection />
      <ProblemSolutionSection />
      <CapabilitiesSection />
      <IntegrationsSection />
      <ArchitectureSection />
      <PartnersCarouselSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
