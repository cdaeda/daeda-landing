import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Brain, Rocket, Cloud, X, ChevronRight } from 'lucide-react';
import { siteConfig } from '../content.config';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '../components/ui/drawer';

gsap.registerPlugin(ScrollTrigger);

const iconMap: Record<
  string,
  React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
> = {
  Brain,
  Rocket,
  Cloud,
};

interface CapabilitiesSectionProps {
  className?: string;
}

const CapabilitiesSection = ({ className = '' }: CapabilitiesSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

      // City platform entrance
      scrollTl.fromTo(
        cityRef.current,
        { y: 60, opacity: 0.5 },
        { y: 0, opacity: 1, ease: 'power2.out' },
        0
      );
      scrollTl.to(
        cityRef.current,
        { y: -30, opacity: 0.5, ease: 'power2.in' },
        0.7
      );

      // Headline + body entrance
      scrollTl.fromTo(
        headlineRef.current,
        { x: -50, opacity: 0.6 },
        { x: 0, opacity: 1, ease: 'power2.out' },
        0.05
      );
      scrollTl.to(
        headlineRef.current,
        { x: -25, opacity: 0.5, ease: 'power2.in' },
        0.7
      );

      // Cards staggered entrance
      const cards = cardsRef.current?.querySelectorAll('.capability-card');
      if (cards) {
        cards.forEach((card, i) => {
          scrollTl.fromTo(
            card,
            { x: 60, y: 30, opacity: 0.5 },
            { x: 0, y: 0, opacity: 1, ease: 'power2.out' },
            0.08 + i * 0.03
          );

          scrollTl.to(card, { x: 25, opacity: 0.5, ease: 'power2.in' }, 0.7);
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const { capabilities } = siteConfig;

  return (
    <>
      <section
        ref={sectionRef}
        id="capabilities"
        className={`relative w-full h-screen overflow-hidden ${className}`}
      >
        {/* City platform */}
        <div
          ref={cityRef}
          className="absolute left-1/2 bottom-[-10%] -translate-x-1/2 w-[85vw] max-w-[1100px] opacity-100"
          style={{
            mixBlendMode: 'screen',
            maskImage:
              'radial-gradient(ellipse 85% 60% at 50% 70%, black 50%, transparent 90%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 85% 60% at 50% 70%, black 50%, transparent 90%)',
          }}
        >
          <img
            src="/city-platform.png"
            alt=""
            className="w-full h-auto object-contain"
            style={{
              filter:
                'drop-shadow(0 0 20px rgba(255, 255, 255, 0.5)) brightness(1.2)',
            }}
          />
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex items-center px-[8%] lg:px-[10%]">
          {/* Left side - Headline */}
          <div ref={headlineRef} className="max-w-[480px] opacity-100">
            <h2 className="text-[clamp(36px,4.5vw,60px)] font-light text-white mb-6 leading-tight drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)]">
              {capabilities.headline}
            </h2>
            <p className="text-white/90 text-[clamp(15px,1.3vw,19px)] leading-relaxed mb-6 drop-shadow-[0_1px_10px_rgba(0,0,0,0.8)]">
              {capabilities.description}
            </p>
            <button
              onClick={() => setDrawerOpen(true)}
              className="group text-[#F6B047] text-sm font-medium flex items-center gap-2 hover:gap-3 transition-all"
            >
              {capabilities.exploreCta}
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Right side - Cards */}
          <div
            ref={cardsRef}
            className="absolute right-[6%] lg:right-[8%] top-1/2 -translate-y-1/2 flex flex-col gap-4"
          >
            {capabilities.cards.map((cap, i) => {
              const IconComponent = iconMap[cap.icon];
              return (
                <div
                  key={cap.title}
                  className="capability-card bg-black/60 border border-white/15 backdrop-blur-md rounded-2xl p-6 w-[260px] hover:border-[#F6B047]/50 transition-all hover:bg-black/70 opacity-100"
                  style={{
                    marginLeft: i === 1 ? '40px' : i === 2 ? '20px' : '0',
                  }}
                >
                  {IconComponent && (
                    <IconComponent
                      size={24}
                      className="text-[#F6B047] mb-4"
                      strokeWidth={1.5}
                    />
                  )}
                  <h3 className="text-white font-medium text-lg mb-2">
                    {cap.title}
                  </h3>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {cap.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Drawer */}
      <Drawer 
        open={drawerOpen} 
        onOpenChange={setDrawerOpen} 
        direction="right"
      >
        <DrawerContent className="bg-[#0B0F1C]/95 backdrop-blur-xl border-l border-white/20 shadow-[0_0_60px_rgba(0,0,0,0.5)] mt-[76px] h-[calc(100vh-76px)]">
          {/* Glass edge highlight */}
          <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent" />
          
          {/* Arrow navigation to close - positioned on the left edge */}
          <DrawerClose className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-[200] group">
            <div className="bg-[#0B0F1C]/80 backdrop-blur-sm shadow-xl rounded-full p-2 border border-white/30 hover:bg-[#0B0F1C] hover:scale-110 transition-all duration-300">
              <ChevronRight 
                size={20} 
                className="text-white group-hover:translate-x-0.5 transition-transform" 
                strokeWidth={2.5}
              />
            </div>
          </DrawerClose>
          
          <div className="flex flex-col h-full max-h-full">
            <DrawerHeader className="pb-4 pt-5 flex-shrink-0">
              <div className="flex items-center justify-between">
                <DrawerTitle className="text-white text-lg font-semibold tracking-tight">
                  {capabilities.drawerTitle}
                </DrawerTitle>
                <DrawerClose className="text-white/50 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10 -mr-2">
                  <X size={18} strokeWidth={2} />
                </DrawerClose>
              </div>
            </DrawerHeader>

            <div className="flex-1 overflow-y-auto px-4 pb-5">
              <div className="space-y-3">
                {capabilities.cards.map((card, index) => {
                  const IconComponent = iconMap[card.icon];
                  return (
                    <div 
                      key={card.title} 
                      className="group/card bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-3 border border-white/20 shadow-sm hover:shadow-md hover:border-[#F6B047]/40 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {/* Compact icon container */}
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#F6B047]/20 to-[#F6B047]/5 border border-[#F6B047]/20 flex items-center justify-center flex-shrink-0 group-hover/card:from-[#F6B047]/30 group-hover/card:to-[#F6B047]/10 transition-all">
                          {IconComponent && (
                            <IconComponent
                              size={18}
                              className="text-[#F6B047]"
                              strokeWidth={2}
                            />
                          )}
                        </div>
                        <h3 className="text-white font-semibold text-sm flex-1 leading-tight">
                          {card.title}
                        </h3>
                        <span className="text-[10px] font-bold text-[#F6B047]/60">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>

                      {/* Bullet list - aligned left under icon */}
                      <ul className="space-y-1 pl-12">
                        {card.details?.map((detail, idx) => (
                          <li
                            key={idx}
                            className="text-white/70 text-xs flex items-start gap-2"
                          >
                            <span className="w-1 h-1 rounded-full bg-[#F6B047]/70 mt-1.5 flex-shrink-0" />
                            <span className="leading-relaxed">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default CapabilitiesSection;
