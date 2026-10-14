import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import {
  HabitEditor,
  HabitHistoryScreen,
  HabitLogScreen,
  HabitsScreen,
} from '@/features/habits/habit-screens';
import { AuthFrame, AuthLink, AuthNotice } from '@/features/auth/auth-components';
const scalar = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
export default function HabitsRoute() {
  const { session, recovery } = useAuth(),
    params = useLocalSearchParams<{ view?: string; id?: string; date?: string }>();
  if (!session || recovery) return <Redirect href="/" />;
  const id = scalar(params.id),
    view = scalar(params.view),
    date = scalar(params.date),
    userId = session.user.id,
    key = `${userId}:${view}:${id}:${date}`;
  const onBack = () => router.dismissTo('/habits'),
    onOpen = (view: 'edit' | 'log' | 'history', id?: string, date?: string) =>
      router.push({
        pathname: '/habits/manage',
        params: { view, ...(id ? { id } : {}), ...(date ? { date } : {}) },
      });
  if (view === 'edit')
    return <HabitEditor key={key} userId={userId} habitId={id} onBack={onBack} onSaved={onBack} />;
  if (id && view === 'log')
    return (
      <HabitLogScreen key={key} userId={userId} habitId={id} requestedDate={date} onBack={onBack} />
    );
  if (id && view === 'history')
    return (
      <HabitHistoryScreen key={key} userId={userId} habitId={id} onBack={onBack} onOpen={onOpen} />
    );
  if (view)
    return (
      <AuthFrame>
        <AuthNotice error>Invalid habit screen.</AuthNotice>
        <AuthLink title="Habits" onPress={onBack} />
      </AuthFrame>
    );
  return (
    <HabitsScreen
      key={userId}
      userId={userId}
      onOpen={onOpen}
      onBack={() => router.dismissTo('/(tabs)/more')}
    />
  );
}
