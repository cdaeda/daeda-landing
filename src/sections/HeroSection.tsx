import { useEffect, useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, ChevronDown, Lightbulb } from 'lucide-react';
import { siteConfig } from '../content.config';

gsap.registerPlugin(ScrollTrigger);

interface HeroSectionProps {
  className?: string;
}

const HeroSection = ({ className = '' }: HeroSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);

  // Entrance animation on load
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      tl.fromTo(
        cityRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1 },
        0.2
      );

      const words = headlineRef.current?.querySelectorAll('.word');
      if (words) {
        tl.fromTo(
          words,
          { y: 15, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.05 },
          0.4
        );
      }

      tl.fromTo(
        subheadlineRef.current,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        0.6
      );

      tl.fromTo(
        ctaRef.current,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        0.75
      );

      tl.fromTo(
        scrollHintRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4 },
        1
      );

      gsap.to(scrollHintRef.current, {
        y: 6,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

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
          onLeaveBack: () => {
            gsap.set([headlineRef.current, subheadlineRef.current, ctaRef.current], {
              opacity: 1,
              y: 0,
              x: 0,
            });
            gsap.set(cityRef.current, { opacity: 1, y: 0 });

          },
        },
      });

      scrollTl.fromTo(
        headlineRef.current,
        { y: 0, opacity: 1 },
        { y: '-50px', opacity: 0.5, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        subheadlineRef.current,
        { y: 0, opacity: 1 },
        { y: '-40px', opacity: 0.5, ease: 'power2.in' },
        0.72
      );

      scrollTl.fromTo(
        ctaRef.current,
        { y: 0, opacity: 1 },
        { y: '-30px', opacity: 0.5, ease: 'power2.in' },
        0.74
      );

      scrollTl.fromTo(
        cityRef.current,
        { y: 0, opacity: 1 },
        { y: '-25px', opacity: 0.5, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        scrollHintRef.current,
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
        0.6
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const scrollToCapabilities = () => {
    const element = document.querySelector('#capabilities');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToContact = () => {
    const element = document.querySelector('#contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="hero"
      className={`relative w-full h-screen overflow-hidden ${className}`}
    >
      {/* City wireframe */}
      <div
        ref={cityRef}
        className="absolute left-1/2 bottom-[-5%] -translate-x-1/2 w-[70vw] max-w-[900px] opacity-0"
        style={{
          mixBlendMode: 'screen',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 60%, black 40%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 60%, black 40%, transparent 85%)',
        }}
      >
        <img
          src="/city-hero.png"
          alt=""
          className="w-full h-auto object-contain"
          style={{
            filter: 'drop-shadow(0 0 25px rgba(255, 255, 255, 0.5)) brightness(1.3)',
          }}
        />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-start pt-[14vh] px-6">
        {/* Logo mark */}
        <div className="mb-6">
          <img 
            src="/logo.svg" 
            alt="Daeda Group" 
            className="h-16 sm:h-20 w-auto mx-auto"
          />
        </div>

        {/* Headline */}
        <div ref={headlineRef} className="text-center mb-3">
          <h1 className="text-[clamp(44px,7vw,84px)] font-light text-white tracking-tight drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
            <span className="word inline-block">{siteConfig.hero.headline.word1}</span>{' '}
            <span className="word inline-block">{siteConfig.hero.headline.word2}</span>
          </h1>
        </div>

        {/* Subheadline */}
        <p
          ref={subheadlineRef}
          className="text-center text-white text-[clamp(16px,1.6vw,22px)] max-w-[600px] mb-8 opacity-0 drop-shadow-[0_2px_20px_rgba(0,0,0,0.9)]"
        >
          {siteConfig.hero.subheadline}
        </p>

        {/* CTAs */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 opacity-0 flex-wrap justify-center">
          <button
            onClick={scrollToContact}
            className="group bg-[#F6B047] text-black px-8 py-4 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-[#F6B047]/90 transition-all hover:scale-105 shadow-lg"
          >
            {siteConfig.hero.primaryCta}
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={scrollToCapabilities}
            className="border border-white/40 text-white px-8 py-4 rounded-full font-semibold text-sm hover:bg-white/15 transition-all backdrop-blur-sm"
          >
            {siteConfig.hero.secondaryCta}
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openIdeate'))}
            className="group bg-gradient-to-r from-[#F6B047] to-[#F6B047]/80 text-[#0B0F1C] px-8 py-4 rounded-full font-semibold text-sm flex items-center gap-2 hover:shadow-lg hover:scale-105 transition-all"
          >
            <Lightbulb size={16} strokeWidth={2.5} className="group-hover:animate-pulse" />
            Let's Ideate!
            <span>💡</span>
          </button>
        </div>
      </div>

      {/* Scroll hint */}
      <div
        ref={scrollHintRef}
        className="absolute bottom-[5%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0"
      >
        <span className="text-white/60 text-xs label-small">{siteConfig.hero.scrollHint}</span>
        <ChevronDown size={16} className="text-white/60" />
      </div>
    </section>
  );
};

export default HeroSection;
