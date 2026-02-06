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
      admin_users: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          api_key: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          last_used_at: string | null
          name: string
          scope: string | null
        }
        Insert: {
          api_key: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          name: string
          scope?: string | null
        }
        Update: {
          api_key?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          name?: string
          scope?: string | null
        }
        Relationships: []
      }
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
      driver_profiles_v2: {
        Row: {
          created_at: string
          is_online: boolean
          last_lat: number | null
          last_lng: number | null
          last_seen: string | null
          user_id: string
          vehicle_model: string | null
          vehicle_plate: string | null
          vehicle_year: number | null
        }
        Insert: {
          created_at?: string
          is_online?: boolean
          last_lat?: number | null
          last_lng?: number | null
          last_seen?: string | null
          user_id: string
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_year?: number | null
        }
        Update: {
          created_at?: string
          is_online?: boolean
          last_lat?: number | null
          last_lng?: number | null
          last_seen?: string | null
          user_id?: string
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_profiles_v2_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
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
      ride_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          ride_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          ride_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          ride_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_events_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_offers: {
        Row: {
          created_at: string
          driver_id: string
          expires_at: string
          id: string
          ride_id: string
          status: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          expires_at: string
          id?: string
          ride_id: string
          status?: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          expires_at?: string
          id?: string
          ride_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_offers_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_offers_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      rides: {
        Row: {
          cancel_reason: string | null
          completed_at: string | null
          created_at: string
          driver_id: string
          dropoff_address: string
          estimated_value: number
          id: string
          passenger_name: string
          passenger_phone: string | null
          pickup_address: string
          pickup_time: string
          started_at: string | null
          status: string
          updated_at: string
          waiting_time: number | null
          waiting_value: number | null
        }
        Insert: {
          cancel_reason?: string | null
          completed_at?: string | null
          created_at?: string
          driver_id: string
          dropoff_address: string
          estimated_value?: number
          id?: string
          passenger_name: string
          passenger_phone?: string | null
          pickup_address: string
          pickup_time: string
          started_at?: string | null
          status?: string
          updated_at?: string
          waiting_time?: number | null
          waiting_value?: number | null
        }
        Update: {
          cancel_reason?: string | null
          completed_at?: string | null
          created_at?: string
          driver_id?: string
          dropoff_address?: string
          estimated_value?: number
          id?: string
          passenger_name?: string
          passenger_phone?: string | null
          pickup_address?: string
          pickup_time?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          waiting_time?: number | null
          waiting_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rides_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rides_v2: {
        Row: {
          created_at: string
          dest_address: string
          dest_lat: number
          dest_lng: number
          driver_id: string | null
          id: string
          origin_address: string
          origin_lat: number
          origin_lng: number
          paid_at: string | null
          passenger_id: string
          payment_method: string | null
          payment_status: string | null
          price_cents: number | null
          scheduled_for: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dest_address: string
          dest_lat: number
          dest_lng: number
          driver_id?: string | null
          id?: string
          origin_address: string
          origin_lat: number
          origin_lng: number
          paid_at?: string | null
          passenger_id: string
          payment_method?: string | null
          payment_status?: string | null
          price_cents?: number | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dest_address?: string
          dest_lat?: number
          dest_lng?: number
          driver_id?: string | null
          id?: string
          origin_address?: string
          origin_lat?: number
          origin_lng?: number
          paid_at?: string | null
          passenger_id?: string
          payment_method?: string | null
          payment_status?: string | null
          price_cents?: number | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rides_v2_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_v2_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      users_profile: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          role: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_ride_participant: { Args: { ride_uuid: string }; Returns: boolean }
      is_superadmin: { Args: { _user_id: string }; Returns: boolean }
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
