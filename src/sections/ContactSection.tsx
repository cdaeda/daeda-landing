import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Send, MapPin, Mail, AlertCircle, Lightbulb } from 'lucide-react';
import { siteConfig } from '../content.config';
import { supabase } from '../lib/supabase';

gsap.registerPlugin(ScrollTrigger);

interface ContactSectionProps {
  className?: string;
}

const ContactSection = ({ className = '' }: ContactSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const { contact, company } = siteConfig;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current,
        { x: -40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        formRef.current,
        { x: 60, y: 20, opacity: 0 },
        {
          x: 0,
          y: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: submitError } = await supabase
        .from('contact_submissions')
        .insert({
          name: formData.name,
          email: formData.email,
          company: formData.company || null,
          message: formData.message,
        });

      if (submitError) {
        throw submitError;
      }

      setIsSubmitted(true);
      setFormData({ name: '', email: '', company: '', message: '' });
    } catch (err) {
      console.error('Error submitting contact form:', err);
      setError('Something went wrong. Please try again or email us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  return (
    <section ref={sectionRef} id="contact" className={`relative w-full min-h-screen py-24 overflow-hidden ${className}`}>
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div ref={contentRef} className="pt-8">
            <h2 className="text-[clamp(40px,5vw,72px)] font-light text-white mb-6 leading-tight drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)]">
              {contact.headline}
            </h2>
            <p className="text-white/90 text-[clamp(15px,1.3vw,19px)] leading-relaxed max-w-[420px] mb-12 drop-shadow-[0_1px_10px_rgba(0,0,0,0.8)]">
              {contact.description}
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-white/80">
                <MapPin size={18} strokeWidth={1.5} />
                <span className="text-sm">{company.location}</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <Mail size={18} strokeWidth={1.5} />
                <a href={`mailto:${company.email}`} className="text-sm hover:text-[#F6B047] transition-colors">
                  {company.email}
                </a>
              </div>
            </div>
          </div>

          <div
            ref={formRef}
            className="bg-black/50 border border-white/15 backdrop-blur-md rounded-3xl p-8 lg:p-10"
          >
            {isSubmitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#F6B047]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Send size={28} className="text-[#F6B047]" />
                </div>
                <h3 className="text-white text-xl font-medium mb-2">{contact.form.success.title}</h3>
                <p className="text-white/70 text-sm">{contact.form.success.message}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-200 text-sm">{error}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block text-white/80 text-sm mb-2">
                    {contact.form.name.label}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-[#F6B047]/50 transition-colors disabled:opacity-50"
                    placeholder={contact.form.name.placeholder}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-white/80 text-sm mb-2">
                    {contact.form.email.label}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-[#F6B047]/50 transition-colors disabled:opacity-50"
                    placeholder={contact.form.email.placeholder}
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-white/80 text-sm mb-2">
                    {contact.form.company.label}
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-[#F6B047]/50 transition-colors disabled:opacity-50"
                    placeholder={contact.form.company.placeholder}
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-white/80 text-sm mb-2">
                    {contact.form.message.label}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    rows={4}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-[#F6B047]/50 transition-colors resize-none disabled:opacity-50"
                    placeholder={contact.form.message.placeholder}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#F6B047] text-black py-4 rounded-xl font-semibold text-sm hover:bg-[#F6B047]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02]"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      {contact.form.sending}
                    </>
                  ) : (
                    <>
                      {contact.form.submit}
                      <Send size={16} />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-white/40 text-xs">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Let's Ideate Button */}
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('openIdeate'))}
                  className="group w-full bg-gradient-to-r from-white/10 to-white/5 border border-white/20 text-white py-4 rounded-xl font-semibold text-sm hover:bg-white/15 transition-all flex items-center justify-center gap-2"
                >
                  <Lightbulb size={16} strokeWidth={2.5} className="text-[#F6B047] group-hover:animate-pulse" />
                  Let's Ideate with AI!
                  <span>💡</span>
                </button>
              </form>
            )}
          </div>
        </div>

        <footer className="mt-24 pt-8 border-t border-white/15 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/60 text-sm">{contact.footer.copyright}</p>
          <p className="text-white/60 text-sm flex items-center gap-2">
            <MapPin size={14} strokeWidth={1.5} />
            {contact.footer.location}
          </p>
        </footer>
      </div>
    </section>
  );
};

export default ContactSection;
