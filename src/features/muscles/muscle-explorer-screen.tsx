import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ActionRow, ScreenHeader, Segments } from '@/components/product-ui';
import {
  AuthButton,
  AuthCard,
  AuthChoice,
  AuthFrame,
  AuthInput,
  AuthLoading,
  AuthNotice,
  AuthText,
  BackLink,
  authStyles,
} from '@/features/auth/auth-components';
import { plural } from '@/lib/format';
import { profileService } from '@/features/profile/profile-service';
import { BodyMap } from './body-map';
import type { BodyFigure } from './body-paths';
import {
  figureForSex,
  muscleRegions,
  regionExercises,
  regionOf,
  type MuscleLink,
  type MuscleRegion,
} from './muscle-model';
import { muscleService } from './muscle-service';

const page = 40;

// Browse the exercise library by tapping a muscle on the body map. Kept separate from the
// main library while the feature matures.
export function MuscleExplorerScreen({
  userId,
  onBack,
  onOpen,
}: {
  userId: string;
  onBack: () => void;
  onOpen: (exerciseId: string) => void;
}) {
  const [figure, setFigure] = useState<BodyFigure>('male'),
    [selected, setSelected] = useState<MuscleRegion | null>(null),
    [links, setLinks] = useState<MuscleLink[] | null>(null),
    [error, setError] = useState<string | null>(null),
    [attempt, setAttempt] = useState(0),
    [query, setQuery] = useState(''),
    [shown, setShown] = useState(page),
    // undefined while the profile loads; null when the profile leaves the figure open.
    [profileFigure, setProfileFigure] = useState<BodyFigure | null | undefined>(undefined);
  useEffect(() => {
    let active = true;
    void profileService
      .getProfile(userId)
      .then((profile) => {
        if (!active) return;
        const match = figureForSex(profile.sex);
        setProfileFigure(match);
        if (match) setFigure(match);
      })
      .catch(() => {
        if (active) setProfileFigure(null);
      });
    return () => {
      active = false;
    };
  }, [userId]);
  useEffect(() => {
    if (!selected) return;
    let active = true;
    void muscleService
      .links(selected)
      .then((value) => {
        if (active) setLinks(value);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load. Retry.');
      });
    return () => {
      active = false;
    };
  }, [selected, attempt]);
  function choose(region: MuscleRegion) {
    setLinks(null);
    setError(null);
    setQuery('');
    setShown(page);
    setSelected((current) => (current === region ? null : region));
  }
  const rows = links ? regionExercises(links, query) : [];
  const label = selected ? regionOf(selected)?.label : null;
  return (
    <AuthFrame header={<ScreenHeader title="Explore by muscle" subtitle="NEW" />}>
      <BackLink label="Train" onPress={onBack} />
      <AuthText>
        Tap a muscle on the body, or choose one below, to see exercises that train it.
      </AuthText>
      {profileFigure === null && (
        <Segments
          options={[
            { value: 'male', label: 'Male figure' },
            { value: 'female', label: 'Female figure' },
          ]}
          value={figure}
          onChange={setFigure}
        />
      )}
      <AuthCard>
        <BodyMap figure={figure} selected={selected} onSelect={choose} height={320} />
        <View style={[authStyles.row, { justifyContent: 'space-around' }]}>
          <AuthText kind="eyebrow">Front</AuthText>
          <AuthText kind="eyebrow">Back</AuthText>
        </View>
      </AuthCard>
      <View style={authStyles.choices}>
        {muscleRegions.map((region) => (
          <AuthChoice
            key={region.slug}
            title={region.label}
            selected={selected === region.slug}
            onPress={() => choose(region.slug)}
          />
        ))}
      </View>
      {selected && (
        <>
          <AuthText kind="heading">
            {label}
            {links ? ` · ${plural(regionExercises(links).length, 'exercise')}` : ''}
          </AuthText>
          {error ? (
            <>
              <AuthNotice error>{error}</AuthNotice>
              <AuthButton
                title="Retry"
                onPress={() => {
                  setError(null);
                  setAttempt((value) => value + 1);
                }}
              />
            </>
          ) : !links ? (
            <AuthLoading>Finding exercises…</AuthLoading>
          ) : (
            <>
              <AuthInput
                label={`Filter ${label} exercises`}
                hideLabel
                placeholder="Filter by name"
                value={query}
                onChangeText={(value) => {
                  setQuery(value);
                  setShown(page);
                }}
                maxLength={120}
                autoCorrect={false}
              />
              {!rows.length ? (
                <AuthText>No exercises match. Try another name or muscle.</AuthText>
              ) : (
                <AuthCard>
                  {rows.slice(0, shown).map((row) => (
                    <ActionRow
                      key={row.id}
                      title={row.name}
                      detail={row.primary ? 'Primary target' : 'Also trains'}
                      onPress={() => onOpen(row.id)}
                    />
                  ))}
                </AuthCard>
              )}
              {rows.length > shown && (
                <AuthButton
                  title={`Show more (${rows.length - shown} left)`}
                  outlined
                  onPress={() => setShown((value) => value + page)}
                />
              )}
            </>
          )}
        </>
      )}
      <AuthText kind="muted">
        Body outlines from MuscleMap by Melih Colpan (MIT). Exercise data by RepDB (repdb.co).
      </AuthText>
    </AuthFrame>
  );
}
