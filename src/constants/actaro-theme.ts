// Values verified from the Sign In / Password Reset Figma nodes.
// This is the current light foundation, not the complete Figma component library.
export const actaroColors = {
  background: '#f4f0e8',
  surface: '#fffdf8',
  text: '#121211',
  muted: '#6d6961',
  accent: '#ff681e',
  border: '#ddd5c8',
};

export const actaroTypography = {
  body: { fontSize: 12, lineHeight: 18, color: actaroColors.muted },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 30, lineHeight: 36 },
  heading: { fontFamily: 'Inter_600SemiBold', fontSize: 22, lineHeight: 28 },
  eyebrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 1,
    color: actaroColors.accent,
  },
  muted: { fontSize: 10, color: actaroColors.muted },
};

export const actaroLayout = {
  contentWidth: 430,
  screenPadding: 20,
  contentGap: 14,
  controlRadius: 12,
  fieldRadius: 13,
  minimumTouchHeight: 44,
};
