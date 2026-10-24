// Chalk / Carbon, Actaro-v1-redesign.pdf, page 3. Keep product colors semantic.
export const actaroColors = {
  background: '#f1f2ee',
  surface: '#ffffff',
  fill: '#e6e8e3',
  text: '#111311',
  muted: '#5e645e',
  accent: '#ff5a1f',
  border: '#dfe2dc',
  volt: '#c7ff3c',
  protein: '#4c7dfe',
  carbs: '#f5b400',
  fat: '#19b39b',
  success: '#21a359',
  danger: '#c62f35',
};

export const actaroDarkColors: typeof actaroColors = {
  ...actaroColors,
  background: '#0c0d0c',
  surface: '#171917',
  fill: '#222522',
  text: '#f1f2ee',
  muted: '#959b95',
  accent: '#ff6a2c',
  border: '#2a2e29',
};

export const actaroTypography = {
  body: { fontSize: 14, lineHeight: 21, color: actaroColors.muted },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 25, lineHeight: 32 },
  heading: { fontFamily: 'Inter_600SemiBold', fontSize: 17, lineHeight: 24 },
  metric: { fontFamily: 'Inter_600SemiBold', fontSize: 32, lineHeight: 40 },
  eyebrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.6,
    // Eyebrows always read as small caps; source text stays sentence case for screen readers.
    textTransform: 'uppercase' as const,
    color: actaroColors.muted,
  },
  muted: { fontSize: 12, lineHeight: 18, color: actaroColors.muted },
};

export const actaroLayout = {
  contentWidth: 430,
  screenPadding: 20,
  contentGap: 14,
  controlRadius: 16,
  fieldRadius: 16,
  minimumTouchHeight: 44,
};
