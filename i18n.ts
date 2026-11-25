export type Language = 'en' | 'kn';

const dict = {
  en: {
    brand: 'UNNATI',
    tagline: 'Discover Skills. Find Opportunities. Build Income.',
    heroHeadline: 'Your Next Opportunity Starts Closer Than You Think.',
    heroSubtext:
      'Discover local skills, jobs, training, sports and income opportunities, all in one place.',
    exploreCta: 'Explore Opportunities',
    joinProviderCta: 'Join as a Provider',
    locationBadge: 'Raichur, Karnataka',
    navHome: 'Home',
    navExplore: 'Explore',
    navCategories: 'Categories',
    navLearn: 'Learn',
    navEarn: 'Earn',
    navGrow: 'Grow',
    navConnect: 'Connect',
    navAbout: 'About',
    navContact: 'Contact',
    navGuide: 'Section Guide',
    navPricing: 'Pricing',
    getStarted: 'Get Started',
    dashboard: 'Dashboard',
    signIn: 'Sign In',
    closingStatement:
      "Opportunities shouldn't remain hidden just because people don't know where to find them. UNNATI brings opportunities closer to everyone.",
  },
  kn: {
    brand: 'ಉನ್ನತಿ (UNNATI)',
    tagline: 'ಕೌಶಲ್ಯಗಳನ್ನು ಅನ್ವೇಷಿಸಿ. ಅವಕಾಶಗಳನ್ನು ಪಡೆಯಿರಿ. ಆದಾಯವನ್ನು ನಿರ್ಮಿಸಿ.',
    heroHeadline: 'ನಿಮ್ಮ ಮುಂದಿನ ಅವಕಾಶ ನೀವು ಭಾವಿಸುವುದಕ್ಕಿಂತ ಹತ್ತಿರದಲ್ಲಿದೆ.',
    heroSubtext:
      'ಸ್ಥಳೀಯ ಕೌಶಲ್ಯಗಳು, ಉದ್ಯೋಗಗಳು, ತರಬೇತಿ, ಕ್ರೀಡೆ ಮತ್ತು ಆದಾಯದ ಅವಕಾಶಗಳನ್ನು ಒಂದೇ ವೇದಿಕೆಯಲ್ಲಿ ಪಡೆಯಿರಿ.',
    exploreCta: 'ಅವಕಾಶಗಳನ್ನು ಹುಡುಕಿ',
    joinProviderCta: 'ಪ್ರೊವೈಡರ್ ಆಗಿ ಸೇರಿ',
    locationBadge: 'ರಾಯಚೂರು, ಕರ್ನಾಟಕ',
    navHome: 'ಮುಖಪುಟ',
    navExplore: 'ಅನ್ವೇಷಿಸಿ',
    navCategories: 'ವರ್ಗಗಳು',
    navLearn: 'ಕಲಿಯಿರಿ',
    navEarn: 'ಗಳಿಸಿ',
    navGrow: 'ಬೆಳೆಯಿರಿ',
    navConnect: 'ಸಂಪರ್ಕಿಸಿ',
    navAbout: 'ನಮ್ಮ ಬಗ್ಗೆ',
    navContact: 'ಸಂಪರ್ಕ',
    navGuide: 'ವಿಭಾಗ ಮಾರ್ಗದರ್ಶಿ',
    navPricing: 'ದರ ಪಟ್ಟಿ',
    getStarted: 'ಪ್ರಾರಂಭಿಸಿ',
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    signIn: 'ಲಾಗಿನ್',
    closingStatement:
      'ಅವಕಾಶಗಳು ಎಲ್ಲಿ ಸಿಗುತ್ತವೆ ಎಂದು ತಿಳಿಯದ ಕಾರಣದಿಂದ ಅವು ಮರೆಯಾಗಬಾರದು. ಉನ್ನತಿ ಪ್ರತಿಯೊಬ್ಬರಿಗೂ ಸ್ಥಳೀಯ ಅವಕಾಶಗಳನ್ನು ಹತ್ತಿರ ತರುತ್ತದೆ.',
  },
} as const;

export type TranslationKey = keyof typeof dict.en;

export function translate(lang: Language, key: TranslationKey): string {
  return dict[lang][key] || dict.en[key];
}
