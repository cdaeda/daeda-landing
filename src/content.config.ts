/**
 * Content Configuration
 * All text content across the site is defined here for easy customization.
 */

export const siteConfig = {
  company: {
    name: 'Daeda Group',
    email: 'hello@daeda.net',
    location: 'Charlotte, NC · Remote',
  },

  navigation: {
    items: [
      { label: 'Work', href: '#clients' },
      { label: 'Services', href: '#capabilities' },
      { label: 'About', href: '#proof' },
      { label: 'Contact', href: '#contact' },
    ],
    cta: 'Book a call',
  },

  hero: {
    headline: {
      word1: 'AI',
      word2: 'Experts',
    },
    subheadline: 'Human Led. AI Executed.',
    primaryCta: 'Book a call',
    secondaryCta: 'Who are we',
    scrollHint: 'Scroll',
  },

  capabilities: {
    headline: 'Obsessed with AI-oriented Outcomes',
    description:
      'We 10x your tech investments, delivering the outcomes you have always dreamt about.',
    exploreCta: 'Explore services',
    drawerTitle: 'Our Services',
    drawerDescription: 'Delivering practical yet magical solutions to drive outcomes - quickly.',
    cards: [
      {
        icon: 'Brain',
        title: 'AI Strategy & Planning',
        description: 'Find the right AI opportunities for your business',
        details: [
          'Identify where AI can deliver real business value',
          'Prioritize initiatives by impact and feasibility',
          'Build a practical roadmap with clear milestones',
          'Estimate ROI and build the business case',
        ],
      },
      {
        icon: 'Rocket',
        title: 'Digital Product Development',
        description: 'Turn ideas into working products quickly',
        details: [
          'Rapid prototyping to validate concepts fast',
          'Build and launch in weeks, not years',
          'Modern, user-friendly designs your teams will love',
          'Ongoing support to keep improving',
        ],
      },
      {
        icon: 'Cloud',
        title: 'Technology Modernization',
        description: 'Upgrade your systems without the headaches',
        details: [
          'Move to the cloud safely and efficiently',
          'Connect your data and systems seamlessly',
          'Strengthen security and meet compliance requirements',
          'Reduce costs and technical debt',
        ],
      },
    ],
  },

  community: {
    badge: 'Community First',
    headline: 'Supportive of local community',
    description:
      'We partner with Charlotte-area teams and startups—offering mentorship, office hours, and hands-on help that turns ideas into working products.',
    cta: 'Request a Community Sessionaaq  ',
  },

  proof: {
    mainStat: {
      value: '30',
      label: 'years of Silicon Valley experience',
    },
    subtitle: 'From seed-stage startups to Fortune 50 transformation.',
    stats: [
      {
        icon: 'Briefcase',
        value: '120+',
        label: 'products shipped',
      },
      {
        icon: 'TrendingUp',
        value: '$2B+',
        label: 'in realized value',
      },
      {
        icon: 'Globe',
        value: '12',
        label: 'countries',
      },
    ],
  },

  clients: {
    headline: 'Past customers',
    description: "A few teams we've helped move faster.",
    footer:
      'From Fortune 50 enterprises to high-growth startups across fintech, healthcare, and technology.',
    clientList: [
      { name: 'Bank of America', logo: '/logos/bank-of-america.png' },
      { name: 'Charles Schwab', logo: '/logos/charles-schwab.png' },
      { name: 'JP Morgan', logo: '/logos/jp-morgan.png' },
      { name: 'Blue Cross Blue Shield', logo: '/logos/BCBS-NC.png' },
      { name: 'Confluent', logo: '/logos/confluent.png' },
      { name: 'Qlik', logo: '/logos/qlik.png' },
      { name: 'Tradeverifyd', logo: '/logos/tradeverifyd-logo.png' },
      { name: 'TIAA', logo: '/logos/TIAA_logo.png' },
      { name: 'High Sierra', logo: '/logos/high-sierra-logo.png' },
      { name: "Children's Healthcare", logo: '/logos/CHOA-logo.png' },
      { name: 'Johnson & Johnson', logo: '/logos/Johnson-Johnson.png' },
      { name: 'Sanofi Genzyme', logo: '/logos/sanofi-genzyme.png' },
      { name: 'Chick-Fil-A', logo: '/logos/Chick-fil-A-logo.png' },
      { name: 'Epic Games', logo: '/logos/Epic_Games_logo.png'},
      { name: 'Duke Energy', logo: '/logos/Duke_Energy.png' },
      { name: 'Wells Fargo', logo: '/logos/wells-fargo.png' },
      { name: 'NuBank', logo: '/logos/Nubank_logo.png' },
    ],
  },

  contact: {
    headline: "Let's build what's next.",
    description:
      "Tell us what you're modernizing. We'll reply within 2 business days with next steps.",
    form: {
      name: {
        label: 'Name',
        placeholder: 'Your name',
      },
      email: {
        label: 'Email',
        placeholder: 'you@company.com',
      },
      company: {
        label: 'Company',
        placeholder: 'Your company',
      },
      message: {
        label: 'Message',
        placeholder: 'Tell us about your project...',
      },
      submit: 'Send message',
      sending: 'Sending...',
      success: {
        title: 'Message sent!',
        message: "We'll be in touch within 2 business days.",
      },
    },
    footer: {
      copyright: `© ${new Date().getFullYear()} Daeda Group`,
      location: 'Charlotte, NC · Remote',
    },
  },
} as const;

export type SiteConfig = typeof siteConfig;
