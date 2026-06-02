export const COLORS = {
  // Brand
  primary: '#1D9E75',
  primaryDark: '#0F6E56',
  primaryLight: '#E1F5EE',
  primaryText: '#085041',

  // Light mode
  light: {
    bg: '#FFFFFF',
    bgSecondary: '#F5F5F5',
    bgTertiary: '#EFEFEF',
    text: '#111111',
    textSecondary: '#555555',
    textTertiary: '#999999',
    border: 'rgba(0,0,0,0.10)',
    borderStrong: 'rgba(0,0,0,0.20)',
    card: '#FFFFFF',
    tabBar: '#FFFFFF',
  },

  // Dark mode
  dark: {
    bg: '#111111',
    bgSecondary: '#1C1C1E',
    bgTertiary: '#2C2C2E',
    text: '#F2F2F7',
    textSecondary: '#AEAEB2',
    textTertiary: '#636366',
    border: 'rgba(255,255,255,0.12)',
    borderStrong: 'rgba(255,255,255,0.22)',
    card: '#1C1C1E',
    tabBar: '#1C1C1E',
  },

  // Source badges
  dictionary: { bg: '#E1F5EE', text: '#0F6E56' },
  glossary: { bg: '#EEF2FF', text: '#3730A3' },
};

export const FONTS = {
  // Devanagari-capable font — loaded via expo-font
  devanagari: 'NotoSansDevanagari_400Regular',
  devanagariBold: 'NotoSansDevanagari_700Bold',
  // UI font (system)
  regular: undefined, // system default
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export function useTheme() {
  return { theme: COLORS.light, isDark: false, scheme: 'light' as const };
}
