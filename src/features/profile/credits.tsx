import { Linking, View } from 'react-native';
import { AuthCard, AuthLink, AuthText } from '@/features/auth/auth-components';
import { targetMethodUrl } from '@/features/nutrition/target-estimate';

// Data sources and artwork the app is built on. RepDB's free tier requires its link on an
// about or credits screen; maps also carry their own attribution on the map itself.
const credits = [
  {
    title: 'Exercise data by RepDB (repdb.co)',
    detail: 'Exercises, instructions and technique images. RepDB Free Tier License v1.0.',
    url: 'https://repdb.co',
  },
  {
    title: 'USDA FoodData Central',
    detail: 'Common foods: SR Legacy, April 2018. Public domain.',
    url: 'https://fdc.nal.usda.gov/',
  },
  {
    title: '© OpenStreetMap contributors',
    detail: 'Running maps via OpenFreeMap and OpenMapTiles.',
    url: 'https://www.openstreetmap.org/copyright',
  },
  {
    title: 'MuscleMap by Melih Colpan',
    detail: 'Body diagram in Explore by muscle. MIT licence.',
    url: 'https://github.com/melihcolpan/MuscleMap',
  },
  {
    title: 'Health Canada Dietary Reference Intakes',
    detail: 'The 2023 energy equations behind calorie estimates.',
    url: targetMethodUrl,
  },
] as const;

export function Credits() {
  return (
    <AuthCard>
      <AuthText kind="heading">Credits & data sources</AuthText>
      {credits.map((credit) => (
        <View key={credit.title} style={{ gap: 2 }}>
          <AuthLink title={credit.title} onPress={() => void Linking.openURL(credit.url)} />
          <AuthText kind="muted">{credit.detail}</AuthText>
        </View>
      ))}
    </AuthCard>
  );
}
