import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { siteConfig } from '../content.config';

interface NavigationProps {
  lenis?: any;
}

const Navigation = ({ lenis }: NavigationProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { navigation } = siteConfig;
  const navItems = navigation.items;

  const scrollToSection = (href: string) => {
    if (lenis) {
      // Use Lenis for smooth scrolling
      const element = document.querySelector(href);
      if (element) {
        lenis.scrollTo(element, {
          offset: 0,
          duration: 1.5,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
      }
    } else {
      // Fallback to native scroll
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
          isScrolled
            ? 'bg-[#0B0F1C]/80 backdrop-blur-md py-5'
            : 'bg-transparent py-7'
        }`}
      >
        <div className="w-full px-6 lg:px-12 flex items-center justify-between">
          {/* Logo */}
          <a
            href="#"
            className="flex items-center hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              if (lenis) {
                lenis.scrollTo(0, { duration: 1.5 });
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            <img 
              src={navigation.logo} 
              alt="Daeda Group" 
              className="h-10 md:h-12 w-auto"
            />
          </a>

          {/* Desktop Nav - mr-20 gives space for the lightbulb icon */}
          <div className="hidden md:flex items-center gap-8 mr-16 lg:mr-20">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => scrollToSection(item.href)}
                className="text-[#A9B3C7] hover:text-[#F4F6FB] text-sm font-medium transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-[#F4F6FB]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-[99] bg-[#0B0F1C]/95 backdrop-blur-lg transition-all duration-300 md:hidden ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => scrollToSection(item.href)}
              className="text-[#F4F6FB] text-2xl font-medium hover:text-[#F6B047] transition-colors"
            >
              {item.label}
            </button>
          ))}

        </div>
      </div>
    </>
  );
};

export default Navigation;
