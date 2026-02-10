import { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLenis } from 'lenis/react';
import './App.css';

import Navigation from './sections/Navigation';
import HeroSection from './sections/HeroSection';
import CapabilitiesSection from './sections/CapabilitiesSection';
import CommunitySection from './sections/CommunitySection';
import ProofSection from './sections/ProofSection';
import ClientsSection from './sections/ClientsSection';
import ContactSection from './sections/ContactSection';
import StarField from './components/StarField';
import { IdeateChat } from './components/IdeateChat';
import { IdeateIcon } from './components/IdeateButton';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const lenis = useLenis();
  const [isIdeateOpen, setIsIdeateOpen] = useState(false);

  useEffect(() => {
    if (lenis) {
      // Connect Lenis to GSAP ScrollTrigger
      lenis.on('scroll', ScrollTrigger.update);

      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });

      gsap.ticker.lagSmoothing(0);
    }
  }, [lenis]);

  // Listen for openIdeate events from section buttons
  useEffect(() => {
    const handleOpenIdeate = () => setIsIdeateOpen(true);
    window.addEventListener('openIdeate', handleOpenIdeate);
    return () => window.removeEventListener('openIdeate', handleOpenIdeate);
  }, []);

  return (
    <div className="relative bg-black min-h-screen overflow-x-hidden">
      {/* Cosmic background layer */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'url(/nebula.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />
      </div>

      {/* Animated starfield */}
      <StarField starCount={80} />

      {/* Content */}
      <Navigation />
      <IdeateIcon onClick={() => setIsIdeateOpen(true)} />
      <IdeateChat 
        isOpen={isIdeateOpen} 
        onClose={() => setIsIdeateOpen(false)} 
      />
      <main className="relative z-10">
        <HeroSection className="z-10" />
        <CapabilitiesSection className="z-20" />
        <CommunitySection className="z-30" />
        <ProofSection className="z-40" />
        <ClientsSection className="z-50" />
        <ContactSection className="z-[60]" />
      </main>
    </div>
  );
}

export default App;
