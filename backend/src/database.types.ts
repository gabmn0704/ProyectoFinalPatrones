export type Database = {
  public: {
    Tables: {
      daily_logs: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          sleep_hours: number;
          stress_level: number;
          caffeine_cups: number;
          exercise_minutes: number;
          medication_taken: boolean;
          notes: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["daily_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["daily_logs"]["Insert"]>;
        Relationships: [];
      };
      seizure_events: {
        Row: {
          id: string;
          user_id: string;
          occurred_at: string;
          severity: "mild" | "moderate" | "severe";
          duration_minutes: number;
          notes: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["seizure_events"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["seizure_events"]["Insert"]>;
        Relationships: [];
      };
      emergency_contacts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          phone: string;
          priority: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["emergency_contacts"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["emergency_contacts"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
