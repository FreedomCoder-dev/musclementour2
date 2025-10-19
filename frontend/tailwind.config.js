/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#D0BCFF',
        onPrimary: '#381E72',
        primaryContainer: '#4F378B',
        onPrimaryContainer: '#EADDFF',
        secondary: '#CCC2DC',
        onSecondary: '#332D41',
        secondaryContainer: '#4A4458',
        onSecondaryContainer: '#E8DEF8',
        tertiary: '#EFB8C8',
        onTertiary: '#492532',
        surface: '#141218',
        surfaceDim: '#0C0B11',
        surfaceBright: '#372F41',
        surfaceContainerLowest: '#0F0D13',
        surfaceContainerLow: '#1D1B20',
        surfaceContainer: '#211F26',
        surfaceContainerHigh: '#2B2930',
        surfaceContainerHighest: '#36343B',
        surfaceVariant: '#49454F',
        outline: '#938F99',
        outlineVariant: '#49454F',
        background: '#141218',
        onSurface: '#E6E0E9',
        onSurfaceVariant: '#CAC4D0',
        error: '#F2B8B5',
        onError: '#601410',
        success: '#99F6E4'
      }
    }
  },
  plugins: []
};
