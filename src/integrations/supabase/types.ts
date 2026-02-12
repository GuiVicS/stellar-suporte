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
      checklist_items: {
        Row: {
          checked: boolean | null
          checked_at: string | null
          created_at: string | null
          id: string
          label: string
          note: string | null
          os_id: string
          required: boolean | null
        }
        Insert: {
          checked?: boolean | null
          checked_at?: string | null
          created_at?: string | null
          id?: string
          label: string
          note?: string | null
          os_id: string
          required?: boolean | null
        }
        Update: {
          checked?: boolean | null
          checked_at?: string | null
          created_at?: string | null
          id?: string
          label?: string
          note?: string | null
          os_id?: string
          required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          city: string
          created_at: string | null
          customer_id: string
          id: string
          is_default: boolean | null
          label: string | null
          lat: number | null
          lng: number | null
          number: string | null
          state: string | null
          street: string
          zip: string | null
        }
        Insert: {
          city: string
          created_at?: string | null
          customer_id: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          lat?: number | null
          lng?: number | null
          number?: string | null
          state?: string | null
          street: string
          zip?: string | null
        }
        Update: {
          city?: string
          created_at?: string | null
          customer_id?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          lat?: number | null
          lng?: number | null
          number?: string | null
          state?: string | null
          street?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          cpf_cnpj: string | null
          created_at: string | null
          email: string | null
          id: string
          main_contact_name: string | null
          name: string
          phone: string | null
        }
        Insert: {
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          main_contact_name?: string | null
          name: string
          phone?: string | null
        }
        Update: {
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          main_contact_name?: string | null
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      evidences: {
        Row: {
          created_at: string | null
          created_by: string | null
          file_url: string
          id: string
          kind: Database["public"]["Enums"]["evidence_kind"]
          os_id: string
          thumb_url: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          file_url: string
          id?: string
          kind?: Database["public"]["Enums"]["evidence_kind"]
          os_id: string
          thumb_url?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          file_url?: string
          id?: string
          kind?: Database["public"]["Enums"]["evidence_kind"]
          os_id?: string
          thumb_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidences_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      machines: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          model: string
          notes: string | null
          purchase_date: string | null
          serial_number: string | null
          warranty_until: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          model: string
          notes?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          warranty_until?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          model?: string
          notes?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          warranty_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "machines_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          read: boolean
          reference_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          read?: boolean
          reference_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read?: boolean
          reference_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      parts_used: {
        Row: {
          cost: number | null
          created_at: string | null
          id: string
          note: string | null
          os_id: string
          part_name: string
          quantity: number | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          id?: string
          note?: string | null
          os_id: string
          part_name: string
          quantity?: number | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          id?: string
          note?: string | null
          os_id?: string
          part_name?: string
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_used_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      service_orders: {
        Row: {
          actual_departure_at: string | null
          address_id: string | null
          arrived_at: string | null
          code: string
          created_at: string | null
          created_by: string | null
          customer_id: string
          customer_signature_doc: string | null
          customer_signature_image: string | null
          customer_signature_name: string | null
          diagnosis: string | null
          estimated_duration_min: number | null
          finished_at: string | null
          id: string
          machine_id: string | null
          next_steps: string | null
          priority: Database["public"]["Enums"]["priority"]
          problem_description: string
          resolution: string | null
          scheduled_end: string | null
          scheduled_start: string
          started_at: string | null
          status: Database["public"]["Enums"]["os_status"]
          technician_id: string | null
          type: Database["public"]["Enums"]["os_type"]
          updated_at: string | null
        }
        Insert: {
          actual_departure_at?: string | null
          address_id?: string | null
          arrived_at?: string | null
          code: string
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          customer_signature_doc?: string | null
          customer_signature_image?: string | null
          customer_signature_name?: string | null
          diagnosis?: string | null
          estimated_duration_min?: number | null
          finished_at?: string | null
          id?: string
          machine_id?: string | null
          next_steps?: string | null
          priority?: Database["public"]["Enums"]["priority"]
          problem_description?: string
          resolution?: string | null
          scheduled_end?: string | null
          scheduled_start?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["os_status"]
          technician_id?: string | null
          type?: Database["public"]["Enums"]["os_type"]
          updated_at?: string | null
        }
        Update: {
          actual_departure_at?: string | null
          address_id?: string | null
          arrived_at?: string | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          customer_signature_doc?: string | null
          customer_signature_image?: string | null
          customer_signature_name?: string | null
          diagnosis?: string | null
          estimated_duration_min?: number | null
          finished_at?: string | null
          id?: string
          machine_id?: string | null
          next_steps?: string | null
          priority?: Database["public"]["Enums"]["priority"]
          problem_description?: string
          resolution?: string | null
          scheduled_end?: string | null
          scheduled_start?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["os_status"]
          technician_id?: string | null
          type?: Database["public"]["Enums"]["os_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_comments: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          kind: string
          message: string
          os_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          kind?: string
          message: string
          os_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          kind?: string
          message?: string
          os_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_comments_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gerente" | "tecnico"
      evidence_kind: "photo" | "audio" | "file"
      os_status:
        | "a_fazer"
        | "em_deslocamento"
        | "em_atendimento"
        | "aguardando_peca"
        | "concluido"
        | "cancelado"
      os_type: "instalacao" | "corretiva" | "preventiva" | "treinamento"
      priority: "baixa" | "media" | "alta" | "urgente"
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
    Enums: {
      app_role: ["admin", "gerente", "tecnico"],
      evidence_kind: ["photo", "audio", "file"],
      os_status: [
        "a_fazer",
        "em_deslocamento",
        "em_atendimento",
        "aguardando_peca",
        "concluido",
        "cancelado",
      ],
      os_type: ["instalacao", "corretiva", "preventiva", "treinamento"],
      priority: ["baixa", "media", "alta", "urgente"],
    },
  },
} as const
