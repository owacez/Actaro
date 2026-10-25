export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      activity_targets: {
        Row: {
          created_at: string;
          steps_target: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          steps_target: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          steps_target?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'activity_targets_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      body_measurements: {
        Row: {
          created_at: string;
          local_date: string;
          measurement: string;
          notes: string | null;
          time_zone: string;
          updated_at: string;
          user_id: string;
          value_cm: number;
        };
        Insert: {
          created_at?: string;
          local_date: string;
          measurement: string;
          notes?: string | null;
          time_zone: string;
          updated_at?: string;
          user_id: string;
          value_cm: number;
        };
        Update: {
          created_at?: string;
          local_date?: string;
          measurement?: string;
          notes?: string | null;
          time_zone?: string;
          updated_at?: string;
          user_id?: string;
          value_cm?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'body_measurements_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      body_weights: {
        Row: {
          created_at: string;
          local_date: string;
          notes: string | null;
          time_zone: string;
          updated_at: string;
          user_id: string;
          weight_kg: number;
        };
        Insert: {
          created_at?: string;
          local_date: string;
          notes?: string | null;
          time_zone: string;
          updated_at?: string;
          user_id: string;
          weight_kg: number;
        };
        Update: {
          created_at?: string;
          local_date?: string;
          notes?: string | null;
          time_zone?: string;
          updated_at?: string;
          user_id?: string;
          weight_kg?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'body_weights_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      daily_activity: {
        Row: {
          created_at: string;
          distance_km: number | null;
          local_date: string;
          steps: number | null;
          steps_source: string | null;
          time_zone: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          distance_km?: number | null;
          local_date: string;
          steps?: number | null;
          steps_source?: string | null;
          time_zone: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          distance_km?: number | null;
          local_date?: string;
          steps?: number | null;
          steps_source?: string | null;
          time_zone?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'daily_activity_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
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
      food_favorites: {
        Row: {
          food_id: string;
          user_id: string;
        };
        Insert: {
          food_id: string;
          user_id: string;
        };
        Update: {
          food_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'food_favorites_food_id_fkey';
            columns: ['food_id'];
            isOneToOne: false;
            referencedRelation: 'foods';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'food_favorites_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      food_logs: {
        Row: {
          base_amount: number;
          base_calories: number;
          base_carbs: number;
          base_fat: number;
          base_protein: number;
          base_unit: string;
          calories: number | null;
          carbs: number | null;
          created_at: string;
          fat: number | null;
          food_id: string | null;
          food_name: string;
          id: string;
          local_date: string;
          meal: string;
          portion_amount: number;
          portion_label: string;
          protein: number | null;
          quantity: number;
          request_food_id: string | null;
          request_unit: string | null;
          source: string;
          source_external_id: string | null;
          time_zone: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          base_amount: number;
          base_calories: number;
          base_carbs: number;
          base_fat: number;
          base_protein: number;
          base_unit: string;
          calories?: number | null;
          carbs?: number | null;
          created_at?: string;
          fat?: number | null;
          food_id?: string | null;
          food_name: string;
          id?: string;
          local_date: string;
          meal: string;
          portion_amount: number;
          portion_label: string;
          protein?: number | null;
          quantity: number;
          request_food_id?: string | null;
          request_unit?: string | null;
          source: string;
          source_external_id?: string | null;
          time_zone: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          base_amount?: number;
          base_calories?: number;
          base_carbs?: number;
          base_fat?: number;
          base_protein?: number;
          base_unit?: string;
          calories?: number | null;
          carbs?: number | null;
          created_at?: string;
          fat?: number | null;
          food_id?: string | null;
          food_name?: string;
          id?: string;
          local_date?: string;
          meal?: string;
          portion_amount?: number;
          portion_label?: string;
          protein?: number | null;
          quantity?: number;
          request_food_id?: string | null;
          request_unit?: string | null;
          source?: string;
          source_external_id?: string | null;
          time_zone?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'food_logs_food_id_fkey';
            columns: ['food_id'];
            isOneToOne: false;
            referencedRelation: 'foods';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'food_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      foods: {
        Row: {
          archived: boolean;
          attribution: string | null;
          base_amount: number;
          base_unit: string;
          brand: string | null;
          calories: number;
          carbs: number;
          cooked_weight_g: number | null;
          created_at: string;
          fat: number;
          id: string;
          ingredients: Json;
          kind: string;
          license: string | null;
          name: string;
          portions: Json;
          protein: number;
          recipe_servings: number | null;
          source: string;
          source_external_id: string | null;
          source_revision: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          archived?: boolean;
          attribution?: string | null;
          base_amount: number;
          base_unit: string;
          brand?: string | null;
          calories: number;
          carbs: number;
          cooked_weight_g?: number | null;
          created_at?: string;
          fat: number;
          id?: string;
          ingredients?: Json;
          kind: string;
          license?: string | null;
          name: string;
          portions?: Json;
          protein: number;
          recipe_servings?: number | null;
          source: string;
          source_external_id?: string | null;
          source_revision?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          archived?: boolean;
          attribution?: string | null;
          base_amount?: number;
          base_unit?: string;
          brand?: string | null;
          calories?: number;
          carbs?: number;
          cooked_weight_g?: number | null;
          created_at?: string;
          fat?: number;
          id?: string;
          ingredients?: Json;
          kind?: string;
          license?: string | null;
          name?: string;
          portions?: Json;
          protein?: number;
          recipe_servings?: number | null;
          source?: string;
          source_external_id?: string | null;
          source_revision?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'foods_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      goals: {
        Row: {
          archived: boolean;
          baseline: number;
          created_at: string;
          direction: string;
          end_date: string | null;
          exercise_id: string | null;
          habit_id: string | null;
          id: string;
          measurement: string | null;
          metric: string;
          name: string;
          start_date: string;
          target: number;
          time_zone: string;
          tolerance: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          archived?: boolean;
          baseline: number;
          created_at?: string;
          direction: string;
          end_date?: string | null;
          exercise_id?: string | null;
          habit_id?: string | null;
          id?: string;
          measurement?: string | null;
          metric: string;
          name: string;
          start_date: string;
          target: number;
          time_zone: string;
          tolerance?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          archived?: boolean;
          baseline?: number;
          created_at?: string;
          direction?: string;
          end_date?: string | null;
          exercise_id?: string | null;
          habit_id?: string | null;
          id?: string;
          measurement?: string | null;
          metric?: string;
          name?: string;
          start_date?: string;
          target?: number;
          time_zone?: string;
          tolerance?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'goals_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'goals_habit_id_user_id_fkey';
            columns: ['habit_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'habits';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'goals_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      habit_logs: {
        Row: {
          created_at: string;
          habit_id: string;
          local_date: string;
          notes: string | null;
          updated_at: string;
          user_id: string;
          value: number;
          version_id: string;
        };
        Insert: {
          created_at?: string;
          habit_id: string;
          local_date: string;
          notes?: string | null;
          updated_at?: string;
          user_id: string;
          value: number;
          version_id: string;
        };
        Update: {
          created_at?: string;
          habit_id?: string;
          local_date?: string;
          notes?: string | null;
          updated_at?: string;
          user_id?: string;
          value?: number;
          version_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'habit_logs_habit_id_user_id_fkey';
            columns: ['habit_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'habits';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'habit_logs_version_id_habit_id_user_id_fkey';
            columns: ['version_id', 'habit_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'habit_versions';
            referencedColumns: ['id', 'habit_id', 'user_id'];
          },
        ];
      };
      habit_versions: {
        Row: {
          effective_from: string;
          end_date: string | null;
          habit_id: string;
          id: string;
          motivation: string;
          reminder_time: string | null;
          target: number;
          user_id: string;
          weekdays: number[];
        };
        Insert: {
          effective_from: string;
          end_date?: string | null;
          habit_id: string;
          id?: string;
          motivation: string;
          reminder_time?: string | null;
          target: number;
          user_id: string;
          weekdays: number[];
        };
        Update: {
          effective_from?: string;
          end_date?: string | null;
          habit_id?: string;
          id?: string;
          motivation?: string;
          reminder_time?: string | null;
          target?: number;
          user_id?: string;
          weekdays?: number[];
        };
        Relationships: [
          {
            foreignKeyName: 'habit_versions_habit_id_user_id_fkey';
            columns: ['habit_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'habits';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
      habits: {
        Row: {
          archived: boolean;
          created_at: string;
          id: string;
          kind: string;
          name: string;
          start_date: string;
          time_zone: string;
          unit: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          archived?: boolean;
          created_at?: string;
          id?: string;
          kind: string;
          name: string;
          start_date: string;
          time_zone: string;
          unit: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          archived?: boolean;
          created_at?: string;
          id?: string;
          kind?: string;
          name?: string;
          start_date?: string;
          time_zone?: string;
          unit?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'habits_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
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
      nutrition_copy_requests: {
        Row: {
          created_at: string;
          entry_count: number;
          id: string;
          request: Json;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          entry_count: number;
          id: string;
          request: Json;
          user_id: string;
        };
        Update: {
          created_at?: string;
          entry_count?: number;
          id?: string;
          request?: Json;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'nutrition_copy_requests_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      nutrition_target_history: {
        Row: {
          calories: number;
          carbs: number;
          created_at: string;
          effective_date: string;
          fat: number;
          protein: number;
          updated_at: string;
          user_id: string;
          water_ml: number;
        };
        Insert: {
          calories: number;
          carbs: number;
          created_at?: string;
          effective_date: string;
          fat: number;
          protein: number;
          updated_at?: string;
          user_id: string;
          water_ml: number;
        };
        Update: {
          calories?: number;
          carbs?: number;
          created_at?: string;
          effective_date?: string;
          fat?: number;
          protein?: number;
          updated_at?: string;
          user_id?: string;
          water_ml?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'nutrition_target_history_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      nutrition_targets: {
        Row: {
          calories: number;
          carbs: number;
          created_at: string;
          fat: number;
          protein: number;
          updated_at: string;
          user_id: string;
          water_ml: number;
        };
        Insert: {
          calories: number;
          carbs: number;
          created_at?: string;
          fat: number;
          protein: number;
          updated_at?: string;
          user_id: string;
          water_ml: number;
        };
        Update: {
          calories?: number;
          carbs?: number;
          created_at?: string;
          fat?: number;
          protein?: number;
          updated_at?: string;
          user_id?: string;
          water_ml?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'nutrition_targets_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          date_of_birth: string | null;
          display_name: string | null;
          id: string;
          location: string | null;
          sex: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          date_of_birth?: string | null;
          display_name?: string | null;
          id: string;
          location?: string | null;
          sex?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          date_of_birth?: string | null;
          display_name?: string | null;
          id?: string;
          location?: string | null;
          sex?: string | null;
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
      run_sessions: {
        Row: {
          created_at: string;
          distance_meters: number;
          duration_seconds: number;
          ended_at: string;
          id: string;
          local_date: string;
          moving_seconds: number;
          notes: string;
          route: Json;
          route_preview: Json;
          started_at: string;
          time_zone: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          distance_meters?: number;
          duration_seconds: number;
          ended_at: string;
          id: string;
          local_date: string;
          moving_seconds?: number;
          notes?: string;
          route: Json;
          route_preview?: Json;
          started_at: string;
          time_zone: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          distance_meters?: number;
          duration_seconds?: number;
          ended_at?: string;
          id?: string;
          local_date?: string;
          moving_seconds?: number;
          notes?: string;
          route?: Json;
          route_preview?: Json;
          started_at?: string;
          time_zone?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'run_sessions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      saved_meals: {
        Row: {
          created_at: string;
          id: string;
          items: Json;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          items: Json;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          items?: Json;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'saved_meals_user_id_fkey';
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
      water_logs: {
        Row: {
          amount_ml: number;
          created_at: string;
          id: string;
          local_date: string;
          time_zone: string;
          user_id: string;
        };
        Insert: {
          amount_ml: number;
          created_at?: string;
          id?: string;
          local_date: string;
          time_zone: string;
          user_id: string;
        };
        Update: {
          amount_ml?: number;
          created_at?: string;
          id?: string;
          local_date?: string;
          time_zone?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'water_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
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
      copy_nutrition: {
        Args: {
          p_date: string;
          p_dest_meal?: string;
          p_id: string;
          p_saved_meal?: string;
          p_source_date?: string;
          p_source_meal?: string;
          p_time_zone: string;
          p_user_id: string;
        };
        Returns: number;
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
      log_habit: {
        Args: {
          p_date: string;
          p_habit_id: string;
          p_notes?: string;
          p_user_id: string;
          p_value: number;
        };
        Returns: string;
      };
      run_route_distance: { Args: { p_route: Json }; Returns: number };
      run_route_moving_seconds: { Args: { p_route: Json }; Returns: number };
      run_route_preview: { Args: { p_route: Json }; Returns: Json };
      save_activity: {
        Args: {
          p_date: string;
          p_distance?: number;
          p_source?: string;
          p_steps?: number;
          p_user_id: string;
          p_zone?: string;
        };
        Returns: string;
      };
      save_body_form: {
        Args: {
          p_date: string;
          p_date_of_birth?: string;
          p_height?: number;
          p_location?: string;
          p_notes?: string;
          p_sex?: string;
          p_user_id: string;
          p_weight?: number;
          p_zone: string;
        };
        Returns: string;
      };
      save_body_record: {
        Args: {
          p_date: string;
          p_kind: string;
          p_name?: string;
          p_notes?: string;
          p_user_id: string;
          p_value: number;
          p_zone: string;
        };
        Returns: string;
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
      save_food_log: {
        Args: {
          p_date: string;
          p_food_id: string;
          p_id: string;
          p_meal: string;
          p_quantity: number;
          p_time_zone: string;
          p_unit: string;
          p_user_id: string;
        };
        Returns: string;
      };
      save_goal: { Args: { p_goal: Json; p_user_id: string }; Returns: string };
      save_habit: {
        Args: {
          p_days: number[];
          p_end?: string;
          p_id: string;
          p_kind: string;
          p_motivation: string;
          p_name: string;
          p_reminder?: string;
          p_start: string;
          p_target: number;
          p_unit: string;
          p_user_id: string;
          p_zone: string;
        };
        Returns: string;
      };
      save_meal: {
        Args: {
          p_date: string;
          p_id: string;
          p_meal: string;
          p_name: string;
          p_user_id: string;
        };
        Returns: string;
      };
      save_recipe: {
        Args: {
          p_cooked_weight?: number;
          p_id: string;
          p_ingredients: Json;
          p_name: string;
          p_servings: number;
          p_user_id: string;
        };
        Returns: string;
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
      save_steps_target: {
        Args: { p_target: number; p_user_id: string };
        Returns: number;
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
      search_foods: {
        Args: { p_mode?: string; p_offset?: number; p_query?: string };
        Returns: {
          archived: boolean;
          attribution: string | null;
          base_amount: number;
          base_unit: string;
          brand: string | null;
          calories: number;
          carbs: number;
          cooked_weight_g: number | null;
          created_at: string;
          fat: number;
          id: string;
          ingredients: Json;
          kind: string;
          license: string | null;
          name: string;
          portions: Json;
          protein: number;
          recipe_servings: number | null;
          source: string;
          source_external_id: string | null;
          source_revision: string | null;
          updated_at: string;
          user_id: string | null;
        }[];
        SetofOptions: {
          from: '*';
          to: 'foods';
          isOneToOne: false;
          isSetofReturn: true;
        };
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
