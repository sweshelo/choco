export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      achievement: {
        Row: {
          category: Json[] | null
          created_at: string
          discoverer: string | null
          icon_first: string | null
          icon_last: string | null
          id: number
          markup: string | null
          title: string
        }
        Insert: {
          category?: Json[] | null
          created_at?: string
          discoverer?: string | null
          icon_first?: string | null
          icon_last?: string | null
          id?: number
          markup?: string | null
          title: string
        }
        Update: {
          category?: Json[] | null
          created_at?: string
          discoverer?: string | null
          icon_first?: string | null
          icon_last?: string | null
          id?: number
          markup?: string | null
          title?: string
        }
        Relationships: []
      }
      player: {
        Row: {
          average: number | null
          created_at: string
          deviation_value: number | null
          effective_average: number | null
          id: number
          name: string
          points: number | null
          ranking: number | null
          updated_at: string | null
        }
        Insert: {
          average?: number | null
          created_at?: string
          deviation_value?: number | null
          effective_average?: number | null
          id?: number
          name: string
          points?: number | null
          ranking?: number | null
          updated_at?: string | null
        }
        Update: {
          average?: number | null
          created_at?: string
          deviation_value?: number | null
          effective_average?: number | null
          id?: number
          name?: string
          points?: number | null
          ranking?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      record: {
        Row: {
          achievement: string
          chara: string
          created_at: string
          diff: number | null
          elapsed: number | null
          id: number
          player_name: string
          point: number
          ranking: number
          recorded_at: string | null
          version: string | null
        }
        Insert: {
          achievement: string
          chara: string
          created_at?: string
          diff?: number | null
          elapsed?: number | null
          id?: number
          player_name: string
          point: number
          ranking: number
          recorded_at?: string | null
          version?: string | null
        }
        Update: {
          achievement?: string
          chara?: string
          created_at?: string
          diff?: number | null
          elapsed?: number | null
          id?: number
          player_name?: string
          point?: number
          ranking?: number
          recorded_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "records_player_name_fkey"
            columns: ["player_name"]
            isOneToOne: false
            referencedRelation: "player"
            referencedColumns: ["name"]
          },
        ]
      }
      schedule: {
        Row: {
          created_at: string
          ended_at: string | null
          even_time: string | null
          id: number
          odd_time: string | null
          started_at: string | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          even_time?: string | null
          id?: number
          odd_time?: string | null
          started_at?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          even_time?: string | null
          id?: number
          odd_time?: string | null
          started_at?: string | null
        }
        Relationships: []
      }
      season: {
        Row: {
          created_at: string
          ended_at: string | null
          id: number
          number: number
          started_at: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: number
          number: number
          started_at: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: number
          number?: number
          started_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_all_player_achievements: {
        Args: never
        Returns: {
          achievement: string
          player_name: string
        }[]
      }
      get_distinct_achievements: {
        Args: { player_name_param: string }
        Returns: {
          achievement: string
        }[]
      }
      get_play_count_ranking: {
        Args: never
        Returns: {
          achievement: string
          chara: string
          play_count: number
          player_name: string
        }[]
      }
      get_player_record: {
        Args: { player_name: string }
        Returns: {
          achievement: string
          id: number
          name: string
          point: number
          ranking: number
        }[]
      }
      get_records_by_player_names: {
        Args: { player_names: string[] }
        Returns: {
          id: number
          player_name: string
          point: number
          recorded_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
