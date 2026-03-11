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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      custom_links: {
        Row: {
          created_at: string
          icon_url: string | null
          id: string
          label: string
          sort_order: number
          url: string
        }
        Insert: {
          created_at?: string
          icon_url?: string | null
          id?: string
          label: string
          sort_order?: number
          url: string
        }
        Update: {
          created_at?: string
          icon_url?: string | null
          id?: string
          label?: string
          sort_order?: number
          url?: string
        }
        Relationships: []
      }
      forum_replies: {
        Row: {
          author_avatar_url: string | null
          author_id: string
          author_name: string
          content: string
          created_at: string
          id: string
          topic_id: string
        }
        Insert: {
          author_avatar_url?: string | null
          author_id: string
          author_name?: string
          content: string
          created_at?: string
          id?: string
          topic_id: string
        }
        Update: {
          author_avatar_url?: string | null
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_topics: {
        Row: {
          author_avatar_url: string | null
          author_id: string
          author_name: string
          content: string
          created_at: string
          id: string
          is_poll: boolean
          title: string
          updated_at: string
        }
        Insert: {
          author_avatar_url?: string | null
          author_id: string
          author_name?: string
          content: string
          created_at?: string
          id?: string
          is_poll?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          author_avatar_url?: string | null
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          is_poll?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          category: string
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          title: string
          uploaded_by: string
        }
        Insert: {
          category?: string
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          title: string
          uploaded_by: string
        }
        Update: {
          category?: string
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          title?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      notices: {
        Row: {
          author_id: string
          author_name: string
          content: string
          created_at: string
          cta_buttons: Json | null
          id: string
          image_url: string | null
          is_pinned: boolean
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          author_name?: string
          content: string
          created_at?: string
          cta_buttons?: Json | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string
          cta_buttons?: Json | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          id: string
          label: string
          sort_order: number
          topic_id: string
        }
        Insert: {
          id?: string
          label: string
          sort_order?: number
          topic_id: string
        }
        Update: {
          id?: string
          label?: string
          sort_order?: number
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          class_name: string | null
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          class_name?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          class_name?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          call_number: number | null
          class_name: string
          created_at: string
          full_name: string
          guardian_contact: string | null
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          call_number?: number | null
          class_name: string
          created_at?: string
          full_name: string
          guardian_contact?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          call_number?: number | null
          class_name?: string
          created_at?: string
          full_name?: string
          guardian_contact?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          is_online: boolean
          last_seen: string
          user_id: string
        }
        Insert: {
          is_online?: boolean
          last_seen?: string
          user_id: string
        }
        Update: {
          is_online?: boolean
          last_seen?: string
          user_id?: string
        }
        Relationships: []
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
      video_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          user_id: string
          user_name: string
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_id: string
          user_name?: string
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          user_id?: string
          user_name?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      video_lessons: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          title: string
          video_url: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          title: string
          video_url: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          title?: string
          video_url?: string
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
      app_role: "admin" | "leader"
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
      app_role: ["admin", "leader"],
    },
  },
} as const
