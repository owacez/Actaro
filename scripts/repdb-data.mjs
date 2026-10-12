// Node-only dataset boundary. Never imported by the mobile application.
export const REPDB_REVISION = 'd86f9612bee19db1069557bcac5c957021057eb9';
export const REPDB_ROOT = `https://raw.githubusercontent.com/RepDB/exercise-dataset/${REPDB_REVISION}`;
export const REPDB_LICENSE = 'RepDB Free Tier License v1.0';
export const REPDB_ATTRIBUTION = 'Exercise data by RepDB (repdb.co)';

function text(value, label, max = 5000) {
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    throw new Error(`Invalid RepDB ${label}`);
  return value.trim();
}
function slug(value) {
  const result = text(value, 'slug', 80).replaceAll('_', '-');
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(result)) throw new Error('Invalid RepDB slug');
  return result;
}
function strings(value, label, required = false) {
  if (value == null && !required) return [];
  if (!Array.isArray(value) || (required && !value.length) || value.length > 40)
    throw new Error(`Invalid RepDB ${label}`);
  return value.map((entry) => text(entry, label));
}

export function parseRepdb(input) {
  if (
    !input ||
    !Array.isArray(input.exercises) ||
    input.count !== input.exercises.length ||
    !input.exercises.length ||
    input.exercises.length > 1000
  )
    throw new Error('Invalid RepDB dataset/count');
  const seen = new Set();
  return input.exercises.map((entry) => {
    const id = text(entry.id, 'exercise ID', 120);
    if (!/^[a-z0-9_-]+$/.test(id)) throw new Error('Invalid RepDB exercise ID');
    if (seen.has(id)) throw new Error('Duplicate RepDB exercise ID');
    seen.add(id);
    if (!['beginner', 'intermediate', 'advanced'].includes(entry.difficulty))
      throw new Error('Invalid RepDB difficulty');
    const flat = entry.images?.flat;
    if (!flat || typeof flat !== 'object' || Array.isArray(flat))
      throw new Error('Missing RepDB poses');
    const media = Object.entries(flat).map(([pose, path]) => {
      if (
        !['start', 'peak', 'main'].includes(pose) ||
        typeof path !== 'string' ||
        !/^images\/flat\/[a-z0-9_-]+\.webp$/.test(path)
      )
        throw new Error('Invalid RepDB media path/pose');
      return { pose, path };
    });
    if (!(
      (media.length === 1 && media[0].pose === 'main') ||
      (media.length === 2 &&
        media.some((x) => x.pose === 'start') &&
        media.some((x) => x.pose === 'peak'))
    ))
      throw new Error('Incomplete RepDB poses');
    return {
      source_external_id: id,
      name: text(entry.name_en, 'name', 160),
      description: entry.description_en == null ? null : text(entry.description_en, 'description'),
      instructions: strings(entry.instructions_en, 'instructions', true),
      primary_muscles: [
        ...new Set(strings(entry.primary_muscles, 'primary muscles', true).map(slug)),
      ],
      secondary_muscles: [
        ...new Set(strings(entry.secondary_muscles, 'secondary muscles').map(slug)),
      ],
      equipment: entry.equipment == null ? null : slug(entry.equipment),
      difficulty: entry.difficulty,
      category: text(entry.category, 'category', 80),
      movement_pattern:
        entry.force_type == null ? null : text(entry.force_type, 'movement pattern', 80),
      media,
    };
  });
}
