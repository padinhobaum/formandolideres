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
      achievements: {
        Row: {
          description: string
          icon: string
          id: string
          sort_order: number
          title: string
          xp_bonus: number
        }
        Insert: {
          description: string
          icon?: string
          id: string
          sort_order?: number
          title: string
          xp_bonus?: number
        }
        Update: {
          description?: string
          icon?: string
          id?: string
          sort_order?: number
          title?: string
          xp_bonus?: number
        }
        Relationships: []
      }
      banners: {
        Row: {
          button_text: string | null
          button_url: string | null
          category: string | null
          created_at: string
          created_by: string
          ends_at: string | null
          highlight_color: string | null
          id: string
          media_type: string
          media_url: string
          starts_at: string
          title: string
        }
        Insert: {
          button_text?: string | null
          button_url?: string | null
          category?: string | null
          created_at?: string
          created_by: string
          ends_at?: string | null
          highlight_color?: string | null
          id?: string
          media_type?: string
          media_url: string
          starts_at?: string
          title: string
        }
        Update: {
          button_text?: string | null
          button_url?: string | null
          category?: string | null
          created_at?: string
          created_by?: string
          ends_at?: string | null
          highlight_color?: string | null
          id?: string
          media_type?: string
          media_url?: string
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          body_text: string
          created_at: string
          created_by: string
          id: string
          issued_date: string
          show_liceu_logo: boolean
          signatures: Json
          title: string
          user_id: string
          verification_code: string
        }
        Insert: {
          body_text: string
          created_at?: string
          created_by: string
          id?: string
          issued_date?: string
          show_liceu_logo?: boolean
          signatures?: Json
          title: string
          user_id: string
          verification_code?: string
        }
        Update: {
          body_text?: string
          created_at?: string
          created_by?: string
          id?: string
          issued_date?: string
          show_liceu_logo?: boolean
          signatures?: Json
          title?: string
          user_id?: string
          verification_code?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_group: boolean
          name: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_group?: boolean
          name?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_group?: boolean
          name?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      class_climate_responses: {
        Row: {
          class_name: string
          comment: string | null
          created_at: string
          id: string
          mood_score: number
          user_id: string
          week_start: string
        }
        Insert: {
          class_name: string
          comment?: string | null
          created_at?: string
          id?: string
          mood_score: number
          user_id: string
          week_start: string
        }
        Update: {
          class_name?: string
          comment?: string | null
          created_at?: string
          id?: string
          mood_score?: number
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
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
      edital_config: {
        Row: {
          allow_multiple_votes_same_proposal: boolean
          current_phase: string
          id: string
          is_active: boolean
          max_votes_per_user: number
          scheduled_close_at: string | null
          scheduled_open_at: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allow_multiple_votes_same_proposal?: boolean
          current_phase?: string
          id?: string
          is_active?: boolean
          max_votes_per_user?: number
          scheduled_close_at?: string | null
          scheduled_open_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allow_multiple_votes_same_proposal?: boolean
          current_phase?: string
          id?: string
          is_active?: boolean
          max_votes_per_user?: number
          scheduled_close_at?: string | null
          scheduled_open_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          event_date: string
          event_time: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          event_date: string
          event_time?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      forum_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
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
          image_url: string | null
          parent_reply_id: string | null
          topic_id: string
        }
        Insert: {
          author_avatar_url?: string | null
          author_id: string
          author_name?: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          parent_reply_id?: string | null
          topic_id: string
        }
        Update: {
          author_avatar_url?: string | null
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          parent_reply_id?: string | null
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
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
          category_id: string | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_pinned: boolean
          is_poll: boolean
          title: string
          updated_at: string
        }
        Insert: {
          author_avatar_url?: string | null
          author_id: string
          author_name?: string
          category_id?: string | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          is_poll?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          author_avatar_url?: string | null
          author_id?: string
          author_name?: string
          category_id?: string | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          is_poll?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_topics_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_completions: {
        Row: {
          completed_at: string
          id: string
          lesson_id: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          completed_at?: string
          id?: string
          lesson_id: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          completed_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string
          duration_seconds: number | null
          extra_material_url: string | null
          id: string
          module_id: string
          sort_order: number
          title: string
          updated_at: string
          video_url: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: string
          duration_seconds?: number | null
          extra_material_url?: string | null
          id?: string
          module_id: string
          sort_order?: number
          title: string
          updated_at?: string
          video_url: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string
          duration_seconds?: number | null
          extra_material_url?: string | null
          id?: string
          module_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
          video_url?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      live_streams: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          platform: string
          stream_url: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          platform?: string
          stream_url: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          platform?: string
          stream_url?: string
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
      modules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          sort_order: number
          title: string
          track_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title: string
          track_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title?: string
          track_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      notice_reads: {
        Row: {
          id: string
          notice_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notice_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notice_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notice_reads_notice_id_fkey"
            columns: ["notice_id"]
            isOneToOne: false
            referencedRelation: "notices"
            referencedColumns: ["id"]
          },
        ]
      }
      notice_relays: {
        Row: {
          created_at: string
          id: string
          notice_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notice_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notice_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notice_relays_notice_id_fkey"
            columns: ["notice_id"]
            isOneToOne: false
            referencedRelation: "notices"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          author_id: string
          author_name: string
          content: string
          created_at: string
          cta_buttons: Json | null
          event_id: string | null
          id: string
          image_url: string | null
          is_pinned: boolean
          requires_relay: boolean
          target_user_ids: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          author_name?: string
          content: string
          created_at?: string
          cta_buttons?: Json | null
          event_id?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          requires_relay?: boolean
          target_user_ids?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string
          cta_buttons?: Json | null
          event_id?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          requires_relay?: boolean
          target_user_ids?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_last_read: {
        Row: {
          cleared_at: string | null
          last_read_at: string
          user_id: string
        }
        Insert: {
          cleared_at?: string | null
          last_read_at?: string
          user_id: string
        }
        Update: {
          cleared_at?: string | null
          last_read_at?: string
          user_id?: string
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
      proposal_collaborators: {
        Row: {
          created_at: string
          id: string
          invited_by: string
          proposal_id: string
          status: string
          user_avatar_url: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by: string
          proposal_id: string
          status?: string
          user_avatar_url?: string | null
          user_id: string
          user_name?: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string
          proposal_id?: string
          status?: string
          user_avatar_url?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_collaborators_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_comments: {
        Row: {
          author_avatar_url: string | null
          author_id: string
          author_name: string
          content: string
          created_at: string
          id: string
          proposal_id: string
        }
        Insert: {
          author_avatar_url?: string | null
          author_id: string
          author_name?: string
          content: string
          created_at?: string
          id?: string
          proposal_id: string
        }
        Update: {
          author_avatar_url?: string | null
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          proposal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_comments_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_direction_feedback: {
        Row: {
          author_id: string
          author_name: string
          content: string
          created_at: string
          id: string
          is_official: boolean
          proposal_id: string
        }
        Insert: {
          author_id: string
          author_name?: string
          content: string
          created_at?: string
          id?: string
          is_official?: boolean
          proposal_id: string
        }
        Update: {
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          is_official?: boolean
          proposal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_direction_feedback_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_history: {
        Row: {
          changes: Json
          created_at: string
          edited_by: string
          edited_by_name: string
          id: string
          proposal_id: string
        }
        Insert: {
          changes?: Json
          created_at?: string
          edited_by: string
          edited_by_name?: string
          id?: string
          proposal_id: string
        }
        Update: {
          changes?: Json
          created_at?: string
          edited_by?: string
          edited_by_name?: string
          id?: string
          proposal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_history_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_internal_comments: {
        Row: {
          author_avatar_url: string | null
          author_id: string
          author_name: string
          content: string
          created_at: string
          id: string
          proposal_id: string
        }
        Insert: {
          author_avatar_url?: string | null
          author_id: string
          author_name?: string
          content: string
          created_at?: string
          id?: string
          proposal_id: string
        }
        Update: {
          author_avatar_url?: string | null
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          proposal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_internal_comments_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_votes: {
        Row: {
          created_at: string
          id: string
          proposal_id: string
          user_id: string
          vote_type: number
        }
        Insert: {
          created_at?: string
          id?: string
          proposal_id: string
          user_id: string
          vote_type?: number
        }
        Update: {
          created_at?: string
          id?: string
          proposal_id?: string
          user_id?: string
          vote_type?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_votes_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          author_avatar_url: string | null
          author_id: string
          author_name: string
          category: string
          comment_count: number
          created_at: string
          description: string
          estimated_effort: string
          expected_impact: string
          id: string
          image_url: string | null
          negative_vote_count: number
          positive_vote_count: number
          score: number
          status: string
          target_audience: string | null
          title: string
          updated_at: string
          vote_count: number
        }
        Insert: {
          author_avatar_url?: string | null
          author_id: string
          author_name?: string
          category?: string
          comment_count?: number
          created_at?: string
          description: string
          estimated_effort?: string
          expected_impact?: string
          id?: string
          image_url?: string | null
          negative_vote_count?: number
          positive_vote_count?: number
          score?: number
          status?: string
          target_audience?: string | null
          title: string
          updated_at?: string
          vote_count?: number
        }
        Update: {
          author_avatar_url?: string | null
          author_id?: string
          author_name?: string
          category?: string
          comment_count?: number
          created_at?: string
          description?: string
          estimated_effort?: string
          expected_impact?: string
          id?: string
          image_url?: string | null
          negative_vote_count?: number
          positive_vote_count?: number
          score?: number
          status?: string
          target_audience?: string | null
          title?: string
          updated_at?: string
          vote_count?: number
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
      reply_likes: {
        Row: {
          created_at: string
          id: string
          reply_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reply_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reply_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reply_likes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
        ]
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
      survey_leaders: {
        Row: {
          created_at: string
          id: string
          leader_user_id: string
          survey_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          leader_user_id: string
          survey_id: string
        }
        Update: {
          created_at?: string
          id?: string
          leader_user_id?: string
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_leaders_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          comments: string | null
          contributes_environment: boolean
          created_at: string
          id: string
          keeps_informed: boolean
          opens_space: boolean
          score_communication: number
          score_general: number
          student_name: string
          student_rm: string
          survey_id: string
        }
        Insert: {
          comments?: string | null
          contributes_environment: boolean
          created_at?: string
          id?: string
          keeps_informed: boolean
          opens_space: boolean
          score_communication: number
          score_general: number
          student_name: string
          student_rm: string
          survey_id: string
        }
        Update: {
          comments?: string | null
          contributes_environment?: boolean
          created_at?: string
          id?: string
          keeps_informed?: boolean
          opens_space?: boolean
          score_communication?: number
          score_general?: number
          student_name?: string
          student_rm?: string
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          bimester: number
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          results_released: boolean
          short_code: string
          title: string
          updated_at: string
        }
        Insert: {
          bimester: number
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          results_released?: boolean
          short_code?: string
          title: string
          updated_at?: string
        }
        Update: {
          bimester?: number
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          results_released?: boolean
          short_code?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      track_completions: {
        Row: {
          completed_at: string
          id: string
          track_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          track_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_completions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          cover_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_published: boolean
          is_sequential: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_published?: boolean
          is_sequential?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_published?: boolean
          is_sequential?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
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
      user_streaks: {
        Row: {
          current_streak: number
          last_activity_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_xp: {
        Row: {
          level: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          level?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          level?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      xp_events: {
        Row: {
          action: string
          created_at: string
          id: string
          reference_id: string
          user_id: string
          xp_amount: number
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          reference_id: string
          user_id: string
          xp_amount: number
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          reference_id?: string
          user_id?: string
          xp_amount?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_xp: {
        Args: {
          _action: string
          _reference_id: string
          _user_id: string
          _xp_amount: number
        }
        Returns: undefined
      }
      calculate_level: { Args: { xp: number }; Returns: number }
      complete_lesson: { Args: { _lesson_id: string }; Returns: Json }
      get_week_start: { Args: { _d?: string }; Returns: string }
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
