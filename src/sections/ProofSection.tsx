import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Briefcase, TrendingUp, Globe, Lightbulb } from 'lucide-react';
import { siteConfig } from '../content.config';

gsap.registerPlugin(ScrollTrigger);

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>> = {
  Briefcase,
  TrendingUp,
  Globe,
};

interface ProofSectionProps {
  className?: string;
}

const ProofSection = ({ className = '' }: ProofSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const statRef = useRef<HTMLDivElement>(null);
  const proofPointsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=120%',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      scrollTl.fromTo(
        cityRef.current,
        { y: 60, opacity: 0.4 },
        { y: 0, opacity: 1, ease: 'power2.out' },
        0
      );
      scrollTl.to(
        cityRef.current,
        { y: -30, opacity: 0.5, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        statRef.current,
        { scale: 0.85, y: -25, opacity: 0.6 },
        { scale: 1, y: 0, opacity: 1, ease: 'power2.out' },
        0.08
      );
      scrollTl.to(
        statRef.current,
        { y: -15, opacity: 0.5, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        proofPointsRef.current,
        { y: 25, opacity: 0.6 },
        { y: 0, opacity: 1, ease: 'power2.out' },
        0.12
      );
      scrollTl.to(
        proofPointsRef.current,
        { opacity: 0.5, ease: 'power2.in' },
        0.7
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const { proof } = siteConfig;

  return (
    <section
      ref={sectionRef}
      id="proof"
      className={`relative w-full h-screen overflow-hidden ${className}`}
    >
      <div
        ref={cityRef}
        className="absolute left-1/2 bottom-[-15%] -translate-x-1/2 w-[80vw] max-w-[1000px] opacity-100"
        style={{
          mixBlendMode: 'screen',
          maskImage: 'radial-gradient(ellipse 85% 55% at 50% 75%, black 50%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse 85% 55% at 50% 75%, black 50%, transparent 90%)',
        }}
      >
        <img
          src="/city-platform.png"
          alt=""
          className="w-full h-auto object-contain opacity-60"
          style={{
            filter: 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.4)) brightness(1.2)',
          }}
        />
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-start pt-[12vh] px-6">
        <div ref={statRef} className="text-center mb-4 opacity-100">
          <span
            className="text-[clamp(100px,14vw,180px)] font-light text-[#F6B047] leading-none drop-shadow-lg"
            style={{
              filter: 'drop-shadow(0 0 35px rgba(246, 176, 71, 0.5))',
            }}
          >
            {proof.mainStat.value}
          </span>
          <p className="text-white/70 text-[clamp(12px,1.1vw,16px)] label-small mt-2">
            {proof.mainStat.label}
          </p>
        </div>

        <p className="text-white text-[clamp(16px,1.5vw,22px)] text-center mb-12 max-w-[600px] drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)]">
          {proof.subtitle}
        </p>

        <div ref={proofPointsRef} className="flex flex-wrap justify-center gap-8 lg:gap-16 opacity-100">
          {proof.stats.map((point) => {
            const IconComponent = iconMap[point.icon];
            return (
              <div key={point.label} className="flex flex-col items-center text-center">
                {IconComponent && <IconComponent size={26} className="text-[#F6B047] mb-3" strokeWidth={1.5} />}
                <span className="text-white text-[clamp(24px,2.5vw,36px)] font-light mb-1 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                  {point.value}
                </span>
                <span className="text-white/70 text-sm">{point.label}</span>
              </div>
            );
          })}
        </div>

        {/* Let's Ideate Button */}
        {siteConfig.ideate.showInProof && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openIdeate'))}
            className="group mt-12 bg-gradient-to-r from-[#F6B047] to-[#F6B047]/80 text-[#0B0F1C] px-8 py-4 rounded-full font-semibold text-sm hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <Lightbulb size={18} strokeWidth={2.5} className="group-hover:animate-pulse" />
            {siteConfig.ideate.label}
            <span className="text-lg">{siteConfig.ideate.emoji}</span>
          </button>
        )}
      </div>
    </section>
  );
};

export default ProofSection;
