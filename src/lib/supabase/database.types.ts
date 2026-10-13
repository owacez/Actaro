export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      equipment: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      exercise_equipment: {
        Row: {
          equipment_id: string;
          exercise_id: string;
        };
        Insert: {
          equipment_id: string;
          exercise_id: string;
        };
        Update: {
          equipment_id?: string;
          exercise_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'exercise_equipment_equipment_id_fkey';
            columns: ['equipment_id'];
            isOneToOne: false;
            referencedRelation: 'equipment';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'exercise_equipment_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
        ];
      };
      exercise_media: {
        Row: {
          attribution: string;
          byte_size: number;
          created_at: string;
          exercise_id: string;
          id: string;
          license: string;
          media_type: string;
          pose: string;
          sha256: string;
          source: string;
          source_external_id: string;
          storage_path: string;
        };
        Insert: {
          attribution: string;
          byte_size: number;
          created_at?: string;
          exercise_id: string;
          id?: string;
          license: string;
          media_type?: string;
          pose: string;
          sha256: string;
          source: string;
          source_external_id: string;
          storage_path: string;
        };
        Update: {
          attribution?: string;
          byte_size?: number;
          created_at?: string;
          exercise_id?: string;
          id?: string;
          license?: string;
          media_type?: string;
          pose?: string;
          sha256?: string;
          source?: string;
          source_external_id?: string;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'exercise_media_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
        ];
      };
      exercise_muscles: {
        Row: {
          exercise_id: string;
          muscle_id: string;
          role: string;
        };
        Insert: {
          exercise_id: string;
          muscle_id: string;
          role: string;
        };
        Update: {
          exercise_id?: string;
          muscle_id?: string;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'exercise_muscles_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'exercise_muscles_muscle_id_fkey';
            columns: ['muscle_id'];
            isOneToOne: false;
            referencedRelation: 'muscles';
            referencedColumns: ['id'];
          },
        ];
      };
      exercises: {
        Row: {
          attribution: string;
          category: string | null;
          created_at: string;
          description: string | null;
          difficulty: string | null;
          id: string;
          instructions: string[];
          license: string;
          movement_pattern: string | null;
          name: string;
          source: string;
          source_external_id: string;
          source_revision: string;
        };
        Insert: {
          attribution: string;
          category?: string | null;
          created_at?: string;
          description?: string | null;
          difficulty?: string | null;
          id?: string;
          instructions: string[];
          license: string;
          movement_pattern?: string | null;
          name: string;
          source: string;
          source_external_id: string;
          source_revision: string;
        };
        Update: {
          attribution?: string;
          category?: string | null;
          created_at?: string;
          description?: string | null;
          difficulty?: string | null;
          id?: string;
          instructions?: string[];
          license?: string;
          movement_pattern?: string | null;
          name?: string;
          source?: string;
          source_external_id?: string;
          source_revision?: string;
        };
        Relationships: [];
      };
      muscles: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recovery_check_ins: {
        Row: {
          created_at: string;
          energy: number;
          local_date: string;
          notes: string | null;
          sleep_quality: number;
          soreness: number;
          stress: number | null;
          time_zone: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          energy: number;
          local_date: string;
          notes?: string | null;
          sleep_quality: number;
          soreness: number;
          stress?: number | null;
          time_zone: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          energy?: number;
          local_date?: string;
          notes?: string | null;
          sleep_quality?: number;
          soreness?: number;
          stress?: number | null;
          time_zone?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recovery_check_ins_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      training_plans: {
        Row: {
          days: Json;
          days_per_week: number;
          description: string;
          experience: string;
          goal: string;
          id: string;
          name: string;
          slug: string;
          source_url: string;
          workouts: Json;
        };
        Insert: {
          days: Json;
          days_per_week: number;
          description: string;
          experience: string;
          goal: string;
          id?: string;
          name: string;
          slug: string;
          source_url: string;
          workouts: Json;
        };
        Update: {
          days?: Json;
          days_per_week?: number;
          description?: string;
          experience?: string;
          goal?: string;
          id?: string;
          name?: string;
          slug?: string;
          source_url?: string;
          workouts?: Json;
        };
        Relationships: [];
      };
      training_split_days: {
        Row: {
          is_rest: boolean;
          split_id: string;
          user_id: string;
          weekday: number;
          workout_id: string | null;
        };
        Insert: {
          is_rest: boolean;
          split_id: string;
          user_id: string;
          weekday: number;
          workout_id?: string | null;
        };
        Update: {
          is_rest?: boolean;
          split_id?: string;
          user_id?: string;
          weekday?: number;
          workout_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'training_split_days_split_id_user_id_fkey';
            columns: ['split_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'training_splits';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'training_split_days_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'training_split_days_workout_id_user_id_fkey';
            columns: ['workout_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'workout_templates';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
      training_splits: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          source_plan_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          source_plan_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          source_plan_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'training_splits_source_plan_id_fkey';
            columns: ['source_plan_id'];
            isOneToOne: false;
            referencedRelation: 'training_plans';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'training_splits_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_equipment: {
        Row: {
          equipment_id: string;
          user_id: string;
        };
        Insert: {
          equipment_id: string;
          user_id: string;
        };
        Update: {
          equipment_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_equipment_equipment_id_fkey';
            columns: ['equipment_id'];
            isOneToOne: false;
            referencedRelation: 'equipment';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_equipment_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_preferences: {
        Row: {
          created_at: string;
          distance_unit: string;
          energy_unit: string;
          gamification_enabled: boolean;
          length_unit: string;
          notifications_enabled: boolean;
          theme: string;
          time_zone: string;
          updated_at: string;
          user_id: string;
          weight_unit: string;
        };
        Insert: {
          created_at?: string;
          distance_unit?: string;
          energy_unit?: string;
          gamification_enabled?: boolean;
          length_unit?: string;
          notifications_enabled?: boolean;
          theme?: string;
          time_zone?: string;
          updated_at?: string;
          user_id: string;
          weight_unit?: string;
        };
        Update: {
          created_at?: string;
          distance_unit?: string;
          energy_unit?: string;
          gamification_enabled?: boolean;
          length_unit?: string;
          notifications_enabled?: boolean;
          theme?: string;
          time_zone?: string;
          updated_at?: string;
          user_id?: string;
          weight_unit?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      workout_session_exercises: {
        Row: {
          exercise_id: string;
          exercise_name: string;
          id: string;
          notes: string | null;
          position: number;
          primary_muscle_ids: string[];
          session_id: string;
          user_id: string;
        };
        Insert: {
          exercise_id: string;
          exercise_name?: string;
          id?: string;
          notes?: string | null;
          position: number;
          primary_muscle_ids?: string[];
          session_id: string;
          user_id: string;
        };
        Update: {
          exercise_id?: string;
          exercise_name?: string;
          id?: string;
          notes?: string | null;
          position?: number;
          primary_muscle_ids?: string[];
          session_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_session_exercises_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workout_session_exercises_session_id_user_id_fkey';
            columns: ['session_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'workout_sessions';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'workout_session_exercises_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      workout_sessions: {
        Row: {
          created_at: string;
          duration_seconds: number | null;
          ended_at: string | null;
          id: string;
          last_mutation_id: string | null;
          local_date: string;
          mode: string;
          name: string;
          notes: string | null;
          started_at: string;
          status: string;
          template_id: string | null;
          time_zone: string;
          updated_at: string;
          user_id: string;
          version: number;
        };
        Insert: {
          created_at?: string;
          duration_seconds?: number | null;
          ended_at?: string | null;
          id?: string;
          last_mutation_id?: string | null;
          local_date: string;
          mode: string;
          name: string;
          notes?: string | null;
          started_at?: string;
          status?: string;
          template_id?: string | null;
          time_zone: string;
          updated_at?: string;
          user_id: string;
          version?: number;
        };
        Update: {
          created_at?: string;
          duration_seconds?: number | null;
          ended_at?: string | null;
          id?: string;
          last_mutation_id?: string | null;
          local_date?: string;
          mode?: string;
          name?: string;
          notes?: string | null;
          started_at?: string;
          status?: string;
          template_id?: string | null;
          time_zone?: string;
          updated_at?: string;
          user_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_sessions_template_id_user_id_fkey';
            columns: ['template_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'workout_templates';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'workout_sessions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      workout_sets: {
        Row: {
          completed_at: string | null;
          id: string;
          notes: string | null;
          position: number;
          reps: number | null;
          rest_seconds: number;
          rpe: number | null;
          session_exercise_id: string;
          user_id: string;
          weight_kg: number | null;
        };
        Insert: {
          completed_at?: string | null;
          id?: string;
          notes?: string | null;
          position: number;
          reps?: number | null;
          rest_seconds?: number;
          rpe?: number | null;
          session_exercise_id: string;
          user_id: string;
          weight_kg?: number | null;
        };
        Update: {
          completed_at?: string | null;
          id?: string;
          notes?: string | null;
          position?: number;
          reps?: number | null;
          rest_seconds?: number;
          rpe?: number | null;
          session_exercise_id?: string;
          user_id?: string;
          weight_kg?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_sets_session_exercise_id_user_id_fkey';
            columns: ['session_exercise_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'workout_session_exercises';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'workout_sets_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      workout_template_exercises: {
        Row: {
          exercise_id: string;
          id: string;
          notes: string | null;
          position: number;
          template_id: string;
          user_id: string;
        };
        Insert: {
          exercise_id: string;
          id?: string;
          notes?: string | null;
          position: number;
          template_id: string;
          user_id: string;
        };
        Update: {
          exercise_id?: string;
          id?: string;
          notes?: string | null;
          position?: number;
          template_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_template_exercises_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workout_template_exercises_template_id_user_id_fkey';
            columns: ['template_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'workout_templates';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'workout_template_exercises_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      workout_template_sets: {
        Row: {
          id: string;
          notes: string | null;
          position: number;
          reps: number | null;
          rest_seconds: number;
          rpe: number | null;
          template_exercise_id: string;
          user_id: string;
          weight_kg: number | null;
        };
        Insert: {
          id?: string;
          notes?: string | null;
          position: number;
          reps?: number | null;
          rest_seconds?: number;
          rpe?: number | null;
          template_exercise_id: string;
          user_id: string;
          weight_kg?: number | null;
        };
        Update: {
          id?: string;
          notes?: string | null;
          position?: number;
          reps?: number | null;
          rest_seconds?: number;
          rpe?: number | null;
          template_exercise_id?: string;
          user_id?: string;
          weight_kg?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_template_sets_template_exercise_id_user_id_fkey';
            columns: ['template_exercise_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'workout_template_exercises';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'workout_template_sets_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      workout_templates: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          notes: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          notes?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          notes?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_templates_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      adopt_training_plan: {
        Args: { p_plan_id: string; p_split_id: string };
        Returns: string;
      };
      get_exercise_performance: {
        Args: {
          p_before: string;
          p_exclude_session?: string;
          p_exercise_ids: string[];
        };
        Returns: {
          best: Json;
          exercise_id: string;
          previous: Json;
        }[];
      };
      get_training_history: {
        Args: { p_mode?: string; p_offset?: number; p_query?: string };
        Returns: {
          duration_seconds: number;
          exercises: number;
          id: string;
          local_date: string;
          mode: string;
          name: string;
          reps: number;
          sets: number;
          started_at: string;
          unknown_weight_sets: number;
          version: number;
          volume_kg: number;
        }[];
      };
      get_training_overview: {
        Args: { p_from: string; p_to: string };
        Returns: Json;
      };
      get_training_plans: {
        Args: {
          p_available_only?: boolean;
          p_days?: number;
          p_experience?: string;
          p_goal?: string;
        };
        Returns: {
          days_per_week: number;
          description: string;
          experience: string;
          goal: string;
          id: string;
          name: string;
          required_equipment: string[];
          schedule: string[];
          source_url: string;
          workouts: Json;
        }[];
      };
      import_repdb: {
        Args: { p_exercises: Json; p_revision: string };
        Returns: number;
      };
      save_equipment_profile: {
        Args: { p_equipment_ids: string[] };
        Returns: {
          equipment_id: string;
          user_id: string;
        }[];
        SetofOptions: {
          from: '*';
          to: 'user_equipment';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      save_recovery_check: {
        Args: {
          p_date: string;
          p_energy: number;
          p_notes?: string;
          p_sleep: number;
          p_soreness: number;
          p_stress?: number;
          p_time_zone: string;
          p_user_id: string;
        };
        Returns: string;
      };
      save_training_split: {
        Args: {
          p_days: Json;
          p_id: string;
          p_is_active: boolean;
          p_name: string;
        };
        Returns: string;
      };
      save_workout_session: {
        Args: {
          p_expected_version: number;
          p_mutation_id: string;
          p_session: Json;
        };
        Returns: number;
      };
      save_workout_template: {
        Args: {
          p_exercises: Json;
          p_id: string;
          p_name: string;
          p_notes: string;
        };
        Returns: string;
      };
      search_exercises: {
        Args: {
          p_available_only?: boolean;
          p_bodyweight?: boolean;
          p_equipment_id?: string;
          p_limit?: number;
          p_muscle_id?: string;
          p_offset?: number;
          p_query?: string;
        };
        Returns: {
          difficulty: string;
          equipment: string[];
          id: string;
          muscles: string[];
          name: string;
          thumbnail_path: string;
          total_count: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
