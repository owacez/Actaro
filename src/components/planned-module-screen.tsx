import { AuthFrame, AuthText } from '@/features/auth/auth-components';

export function PlannedModuleScreen({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <AuthFrame>
      <AuthText kind="eyebrow">ACTARO</AuthText>
      <AuthText kind="title">{title}</AuthText>
      <AuthText>{description}</AuthText>
    </AuthFrame>
  );
}
