import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ActionSheet, IconButton, ScreenHeader } from '@/components/product-ui';
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
import { clearReadCache } from '@/lib/supabase/read-cache';
import {
  exerciseService,
  type CatalogEntry,
  type ExerciseSummary,
  type SearchFilters,
} from './exercise-service';
import { plural } from '@/lib/format';

const initialFilters: SearchFilters = {
  query: '',
  bodyweight: false,
  availableOnly: false,
  offset: 0,
};
export function LibraryScreen({
  userId,
  navigation,
  onOpen,
  onEquipment,
  onWorkouts,
  onAddToWorkout,
  onLogExercise,
  onQuickAdd,
  onEditSelection,
  selectedExercises,
  addDisabled = false,
}: {
  userId: string;
  navigation?: ReactNode;
  onOpen: (id: string, exercise: ExerciseSummary) => void;
  onEquipment: () => void;
  onWorkouts?: () => void;
  onAddToWorkout?: (id: string) => void;
  onLogExercise?: (id: string) => void;
  onQuickAdd?: (exercise: ExerciseSummary) => void;
  onEditSelection?: (id: string) => void;
  selectedExercises?: { id: string; sets: number }[];
  addDisabled?: boolean;
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
  const [selectedExercise, setSelectedExercise] = useState<ExerciseSummary | null>(null);
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
    clearReadCache();
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
            {navigation && <ScreenHeader title="Train" />}
            {navigation}
            {!navigation && <AuthText kind="heading">Exercise Library</AuthText>}

            {!navigation && onWorkouts && <AuthLink title="My workouts" onPress={onWorkouts} />}
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
                {plural(total, 'exercise')}
                {filters.availableOnly ? ' · your equipment' : ''}
              </AuthText>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const selected = selectedExercises?.find((exercise) => exercise.id === item.id);
          return (
            <View style={styles.row}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`View ${item.name}`}
                onPress={() => onOpen(item.id, item)}
                style={({ pressed }) => [styles.exercise, pressed && { opacity: 0.65 }]}
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
                  {selected && <AuthText kind="muted">Added · {selected.sets} sets</AuthText>}
                </View>
              </Pressable>
              {(onQuickAdd || onAddToWorkout) && (
                <IconButton
                  label={selected ? `Added ${item.name}` : `Add ${item.name} to workout`}
                  name={
                    selected
                      ? {
                          ios: 'checkmark.circle.fill',
                          android: 'check_circle',
                          web: 'check_circle',
                        }
                      : {
                          ios: 'plus.circle',
                          android: 'add_circle_outline',
                          web: 'add_circle_outline',
                        }
                  }
                  disabled={!!selected || addDisabled}
                  onPress={() => (onQuickAdd ? onQuickAdd(item) : onAddToWorkout?.(item.id))}
                />
              )}
              {selected && onEditSelection && (
                <IconButton
                  label={`Edit ${item.name} sets`}
                  name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
                  onPress={() => onEditSelection(item.id)}
                />
              )}
              {onLogExercise && (
                <IconButton
                  label={`Actions for ${item.name}`}
                  name={{
                    ios: 'ellipsis',
                    android: 'more_horiz',
                    web: 'more_horiz',
                  }}
                  onPress={() => setSelectedExercise(item)}
                />
              )}
            </View>
          );
        }}
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
      <ActionSheet
        title={selectedExercise?.name ?? 'Exercise actions'}
        visible={!!selectedExercise}
        onClose={() => setSelectedExercise(null)}
      >
        {onAddToWorkout && (
          <AuthButton
            title="Add to workout"
            onPress={() => {
              if (selectedExercise) {
                const id = selectedExercise.id;
                setSelectedExercise(null);
                onAddToWorkout(id);
              }
            }}
          />
        )}
        {onLogExercise && (
          <AuthButton
            title="Log exercise"
            outlined
            onPress={() => {
              if (selectedExercise) {
                const id = selectedExercise.id;
                setSelectedExercise(null);
                onLogExercise(id);
              }
            }}
          />
        )}
      </ActionSheet>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: actaroLayout.contentWidth,
    alignSelf: 'center',
    padding: 20,
    paddingBottom: 120,
    gap: 12,
  },
  header: { gap: 12 },
  chips: { flexDirection: 'row', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 76, paddingVertical: 8 },
  exercise: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
});
