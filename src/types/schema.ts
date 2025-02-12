export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
          created_at: string
          icon_first: string | null
          icon_last: string | null
          id: number
          markup: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          icon_first?: string | null
          icon_last?: string | null
          id?: number
          markup?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          icon_first?: string | null
          icon_last?: string | null
          id?: number
          markup?: string | null
          title?: string | null
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
      get_player_record: {
        Args: {
          player_name: string
        }
        Returns: {
          id: number
          name: string
          achievement: string
          point: number
          ranking: number
        }[]
      }
      get_records_by_player_names: {
        Args: {
          player_names: string[]
        }
        Returns: {
          id: number
          player_name: string
          recorded_at: string
          point: number
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
