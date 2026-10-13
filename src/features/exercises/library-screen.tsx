import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { FlatList, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { actaroLayout } from '@/constants/actaro-theme';
import {
  AuthButton,
  AuthChoice,
  AuthInput,
  AuthLink,
  AuthLoading,
  AuthNotice,
  AuthText,
  authStyles,
} from '@/features/auth/auth-components';
import { useAppTheme } from '@/features/profile/theme-context';
import { ExerciseImage } from './exercise-image';
import {
  exerciseService,
  type CatalogEntry,
  type ExerciseSummary,
  type SearchFilters,
} from './exercise-service';

const initialFilters: SearchFilters = {
  query: '',
  bodyweight: false,
  availableOnly: false,
  offset: 0,
};
export function LibraryScreen({
  userId,
  onOpen,
  onEquipment,
  onWorkouts,
  onAddToWorkout,
}: {
  userId: string;
  onOpen: (id: string, exercise: ExerciseSummary) => void;
  onEquipment: () => void;
  onWorkouts?: () => void;
  onAddToWorkout?: (id: string) => void;
}) {
  const { colors } = useAppTheme();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [catalogs, setCatalogs] = useState<{
    muscles: CatalogEntry[];
    equipment: CatalogEntry[];
  } | null>(null);
  const [rows, setRows] = useState<ExerciseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const generation = useRef(0);
  useFocusEffect(
    useCallback(() => {
      const request = ++generation.current;
      void Promise.all([exerciseService.catalogs(), exerciseService.search(filters, userId)])
        .then(([reference, result]) => {
          if (request !== generation.current) return;
          setCatalogs(reference);
          setRows(result);
          setLoading(false);
        })
        .catch(() => {
          if (request !== generation.current) return;
          setError('Unable to load exercises. Check your connection and retry.');
          setLoading(false);
        });
      return () => {
        generation.current = request + 1;
      };
    }, [filters, userId]),
  );
  function search(patch: Partial<SearchFilters>) {
    generation.current += 1;
    setError(null);
    setLoading(true);
    setRows([]);
    setFilters((current) => ({ ...current, offset: 0, ...patch }));
  }
  function refresh() {
    generation.current += 1;
    setError(null);
    setLoading(true);
    setFilters((current) => ({ ...current }));
  }
  const total = rows[0]?.total_count ?? 0;
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top', 'left', 'right']}
    >
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <AuthText kind="eyebrow">FITNESS</AuthText>
            <AuthText kind="heading">Exercise Library</AuthText>
            <AuthText>Find exercises for your training.</AuthText>
            {onWorkouts && <AuthLink title="My workouts" onPress={onWorkouts} />}
            <AuthInput
              label="Search exercises"
              value={query}
              maxLength={120}
              placeholder="Search by name"
              autoCorrect={false}
              returnKeyType="search"
              onChangeText={setQuery}
              onSubmitEditing={() => search({ query })}
            />
            <View style={authStyles.row}>
              <AuthLink title="Search" onPress={() => search({ query })} />
              <AuthLink
                title={showFilters ? 'Hide filters' : 'Filters'}
                onPress={() => setShowFilters((value) => !value)}
              />
              <AuthLink title="My equipment" onPress={onEquipment} />
            </View>
            {showFilters && catalogs && (
              <>
                <AuthText>Muscle</AuthText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chips}>
                    <AuthChoice
                      title="All muscles"
                      selected={!filters.muscleId}
                      onPress={() => search({ muscleId: undefined })}
                    />
                    {catalogs.muscles.map((item) => (
                      <AuthChoice
                        key={item.id}
                        title={item.name}
                        selected={filters.muscleId === item.id}
                        onPress={() => search({ muscleId: item.id })}
                      />
                    ))}
                  </View>
                </ScrollView>
                <AuthText>Equipment</AuthText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chips}>
                    <AuthChoice
                      title="All equipment"
                      selected={!filters.equipmentId && !filters.bodyweight}
                      onPress={() => search({ equipmentId: undefined, bodyweight: false })}
                    />
                    <AuthChoice
                      title="No equipment"
                      selected={filters.bodyweight}
                      onPress={() => search({ equipmentId: undefined, bodyweight: true })}
                    />
                    {catalogs.equipment.map((item) => (
                      <AuthChoice
                        key={item.id}
                        title={item.name}
                        selected={filters.equipmentId === item.id}
                        onPress={() => search({ equipmentId: item.id, bodyweight: false })}
                      />
                    ))}
                  </View>
                </ScrollView>
                <AuthChoice
                  title="Use my available equipment"
                  selected={filters.availableOnly}
                  onPress={() => search({ availableOnly: !filters.availableOnly })}
                />
                <AuthLink
                  title="Clear filters"
                  onPress={() => {
                    setQuery('');
                    search(initialFilters);
                  }}
                />
              </>
            )}
            {!loading && !error && (
              <AuthText>
                {total} exercises{filters.availableOnly ? ' · your equipment' : ''}
              </AuthText>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View ${item.name}`}
              onPress={() => onOpen(item.id, item)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.65 }]}
            >
              <ExerciseImage
                key={item.imageUrl ?? item.id}
                url={item.imageUrl}
                label={`${item.name} technique`}
              />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text }}>
                  {item.name}
                </Text>
                <AuthText kind="muted">
                  {item.muscles.join(', ')} · {item.equipment.join(', ') || 'No equipment'}
                </AuthText>
              </View>
            </Pressable>
            {onAddToWorkout && (
              <AuthLink
                title="Add to workout"
                accessibilityLabel={`Add ${item.name} to workout`}
                onPress={() => onAddToWorkout(item.id)}
              />
            )}
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <AuthLoading>Loading exercises…</AuthLoading>
          ) : error ? (
            <View style={styles.header}>
              <AuthNotice error>{error}</AuthNotice>
              <AuthButton title="Retry" onPress={refresh} />
            </View>
          ) : (
            <AuthText>No exercises match. Try another search or clear the filters.</AuthText>
          )
        }
        ListFooterComponent={
          <View style={styles.header}>
            {!loading && !error && (
              <View style={authStyles.row}>
                <AuthButton
                  title="Previous"
                  outlined
                  disabled={filters.offset === 0}
                  onPress={() => search({ offset: Math.max(0, filters.offset - 24) })}
                />
                <AuthText>Page {filters.offset / 24 + 1}</AuthText>
                <AuthButton
                  title="Next"
                  outlined
                  disabled={filters.offset + rows.length >= total}
                  onPress={() => search({ offset: filters.offset + 24 })}
                />
              </View>
            )}
            <AuthLink title="Refresh exercises and images" onPress={refresh} />
            <AuthLink
              title="Exercise data by RepDB (repdb.co)"
              onPress={() => void Linking.openURL('https://repdb.co')}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: actaroLayout.contentWidth,
    alignSelf: 'center',
    padding: 20,
    paddingBottom: 30,
    gap: 12,
  },
  header: { gap: 12 },
  chips: { flexDirection: 'row', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 76, paddingVertical: 8 },
});
