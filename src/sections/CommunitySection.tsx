import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Users, Lightbulb } from 'lucide-react';
import { siteConfig } from '../content.config';

const scrollToContact = () => {
  const element = document.querySelector('#contact');
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

gsap.registerPlugin(ScrollTrigger);

interface CommunitySectionProps {
  className?: string;
}

const CommunitySection = ({ className = '' }: CommunitySectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const cityLeftRef = useRef<HTMLDivElement>(null);
  const cityRightRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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
        cityLeftRef.current,
        { x: -150, opacity: 0.5 },
        { x: 0, opacity: 1, ease: 'power2.out' },
        0
      );
      scrollTl.to(
        cityLeftRef.current,
        { y: -25, opacity: 0.5, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        cityRightRef.current,
        { x: 150, opacity: 0.5 },
        { x: 0, opacity: 1, ease: 'power2.out' },
        0
      );
      scrollTl.to(
        cityRightRef.current,
        { y: -25, opacity: 0.5, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        contentRef.current,
        { y: -30, opacity: 0.6 },
        { y: 0, opacity: 1, ease: 'power2.out' },
        0.05
      );
      scrollTl.to(
        contentRef.current,
        { y: -20, opacity: 0.5, ease: 'power2.in' },
        0.7
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const cityMaskStyle = {
    mixBlendMode: 'screen' as const,
    maskImage: 'radial-gradient(ellipse 70% 80% at 50% 60%, black 40%, transparent 80%)',
    WebkitMaskImage: 'radial-gradient(ellipse 70% 80% at 50% 60%, black 40%, transparent 80%)',
  };

  return (
    <section
      ref={sectionRef}
      id="community"
      className={`relative w-full h-screen overflow-hidden ${className}`}
    >
      <div
        ref={cityLeftRef}
        className="absolute left-[-10%] bottom-[5%] w-[50vw] max-w-[600px] opacity-100"
        style={cityMaskStyle}
      >
        <img
          src="/city-left.png"
          alt=""
          className="w-full h-auto object-contain"
          style={{
            filter: 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.4)) brightness(1.2)',
          }}
        />
      </div>

      <div
        ref={cityRightRef}
        className="absolute right-[-10%] bottom-[5%] w-[50vw] max-w-[600px] opacity-100"
        style={cityMaskStyle}
      >
        <img
          src="/city-right.png"
          alt=""
          className="w-full h-auto object-contain"
          style={{
            filter: 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.4)) brightness(1.2)',
          }}
        />
      </div>

      <div
        ref={contentRef}
        className="absolute inset-0 flex flex-col items-center justify-start pt-[16vh] px-6 opacity-100"
      >
        <div className="flex items-center gap-3 mb-6">
          <Users size={20} className="text-[#F6B047]" strokeWidth={1.5} />
          <span className="label-small text-[#F6B047]">{siteConfig.community.badge}</span>
        </div>

        <h2 className="text-[clamp(36px,5vw,68px)] font-light text-white text-center mb-6 leading-tight max-w-[800px] drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)]">
          {siteConfig.community.headline}
        </h2>

        <p className="text-white/90 text-[clamp(15px,1.3vw,19px)] text-center leading-relaxed max-w-[600px] mb-10 drop-shadow-[0_1px_10px_rgba(0,0,0,0.8)]">
          {siteConfig.community.description}
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={scrollToContact}
            className="bg-[#F6B047] text-black px-8 py-4 rounded-full font-semibold text-sm hover:bg-[#F6B047]/90 transition-all hover:scale-105 shadow-lg"
          >
            {siteConfig.community.cta}
          </button>
          {siteConfig.ideate.showInCommunity && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openIdeate'))}
              className="group bg-gradient-to-r from-white/20 to-white/10 text-white border border-white/30 px-8 py-4 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-white/20 hover:scale-105 transition-all backdrop-blur-sm"
            >
              <Lightbulb size={16} strokeWidth={2.5} className="text-[#F6B047] group-hover:animate-pulse" />
              {siteConfig.ideate.label}
              <span>{siteConfig.ideate.emoji}</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
