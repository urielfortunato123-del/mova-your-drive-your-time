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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          latitude: number | null
          longitude: number | null
          message: string
          message_type: string
          ride_id: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          latitude?: number | null
          longitude?: number | null
          message: string
          message_type?: string
          ride_id: string
          sender_id: string
          sender_type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          latitude?: number | null
          longitude?: number | null
          message?: string
          message_type?: string
          ride_id?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: []
      }
      driver_profiles: {
        Row: {
          city: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          operadora: string | null
          phone: string | null
          photo: string | null
          plano: string | null
          plate: string | null
          premium_inicio: string | null
          premium_status: string | null
          updated_at: string
          user_id: string
          vehicle: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          operadora?: string | null
          phone?: string | null
          photo?: string | null
          plano?: string | null
          plate?: string | null
          premium_inicio?: string | null
          premium_status?: string | null
          updated_at?: string
          user_id: string
          vehicle?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          operadora?: string | null
          phone?: string | null
          photo?: string | null
          plano?: string | null
          plate?: string | null
          premium_inicio?: string | null
          premium_status?: string | null
          updated_at?: string
          user_id?: string
          vehicle?: string | null
        }
        Relationships: []
      }
      premium_history: {
        Row: {
          beneficio_telefonia: boolean | null
          bonus_recebido: number | null
          bonus_telefonia: number | null
          corridas_total: number | null
          created_at: string | null
          driver_id: string
          horas_total: number | null
          id: string
          litros_total: number | null
          manutencao_total: number | null
          metas_atingidas: boolean | null
          month_year: string
          status_final: string | null
        }
        Insert: {
          beneficio_telefonia?: boolean | null
          bonus_recebido?: number | null
          bonus_telefonia?: number | null
          corridas_total?: number | null
          created_at?: string | null
          driver_id: string
          horas_total?: number | null
          id?: string
          litros_total?: number | null
          manutencao_total?: number | null
          metas_atingidas?: boolean | null
          month_year: string
          status_final?: string | null
        }
        Update: {
          beneficio_telefonia?: boolean | null
          bonus_recebido?: number | null
          bonus_telefonia?: number | null
          corridas_total?: number | null
          created_at?: string | null
          driver_id?: string
          horas_total?: number | null
          id?: string
          litros_total?: number | null
          manutencao_total?: number | null
          metas_atingidas?: boolean | null
          month_year?: string
          status_final?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "premium_history_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_monthly_goals: {
        Row: {
          bonus_status: string | null
          bonus_valor: number | null
          corridas_mes: number | null
          created_at: string | null
          driver_id: string
          gasto_manutencao_mes: number | null
          horas_app_mes: number | null
          horas_logadas_mes: number | null
          id: string
          litros_combustivel_mes: number | null
          meta_telefonia: boolean | null
          month_year: string
          seguro_ativo: boolean | null
          updated_at: string | null
        }
        Insert: {
          bonus_status?: string | null
          bonus_valor?: number | null
          corridas_mes?: number | null
          created_at?: string | null
          driver_id: string
          gasto_manutencao_mes?: number | null
          horas_app_mes?: number | null
          horas_logadas_mes?: number | null
          id?: string
          litros_combustivel_mes?: number | null
          meta_telefonia?: boolean | null
          month_year: string
          seguro_ativo?: boolean | null
          updated_at?: string | null
        }
        Update: {
          bonus_status?: string | null
          bonus_valor?: number | null
          corridas_mes?: number | null
          created_at?: string | null
          driver_id?: string
          gasto_manutencao_mes?: number | null
          horas_app_mes?: number | null
          horas_logadas_mes?: number | null
          id?: string
          litros_combustivel_mes?: number | null
          meta_telefonia?: boolean | null
          month_year?: string
          seguro_ativo?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "premium_monthly_goals_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_partners: {
        Row: {
          cidade: string | null
          created_at: string | null
          endereco: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          nome: string
          servicos: string[] | null
          tag: string | null
          tipo: string
        }
        Insert: {
          cidade?: string | null
          created_at?: string | null
          endereco?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          nome: string
          servicos?: string[] | null
          tag?: string | null
          tipo: string
        }
        Update: {
          cidade?: string | null
          created_at?: string | null
          endereco?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          nome?: string
          servicos?: string[] | null
          tag?: string | null
          tipo?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
