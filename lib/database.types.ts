export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          password: string
          role: 'admin' | 'member'
          password_changed_by_user: boolean
          email: string | null
          phone: string | null
          age: string | null
          address: string | null
          notification_preferences: Json | null
          deleted_by_user: boolean
          deleted_at: string | null
          is_crown_admin: boolean
          created_at: string
        }
        Insert: {
          id: string
          username: string
          password: string
          role: 'admin' | 'member'
          password_changed_by_user?: boolean
          email?: string | null
          phone?: string | null
          age?: string | null
          address?: string | null
          notification_preferences?: Json | null
          deleted_by_user?: boolean
          deleted_at?: string | null
          is_crown_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          password?: string
          role?: 'admin' | 'member'
          password_changed_by_user?: boolean
          email?: string | null
          phone?: string | null
          age?: string | null
          address?: string | null
          notification_preferences?: Json | null
          deleted_by_user?: boolean
          deleted_at?: string | null
          is_crown_admin?: boolean
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'member'
          password_changed_by_user: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          role?: 'admin' | 'member'
          password_changed_by_user?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'member'
          password_changed_by_user?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      library: {
        Row: {
          id: string
          name: string
          parent_id: string | null
          children_ids: string[] | null
          media: Json | null
          description: string | null
          tagged_user_ids: string[] | null
          created_at: string
        }
        Insert: {
          id: string
          name: string
          parent_id?: string | null
          children_ids?: string[] | null
          media?: Json | null
          description?: string | null
          tagged_user_ids?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          parent_id?: string | null
          children_ids?: string[] | null
          media?: Json | null
          description?: string | null
          tagged_user_ids?: string[] | null
          created_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          title: string
          description: string
          assigned_user_ids: string[] | null
          due_date: string | null
          media_uri: string | null
          media_type: 'video' | 'image' | 'audio' | null
          require_media: boolean
          completed_by: Json | null
          submissions: Json | null
          created_at: string
        }
        Insert: {
          id: string
          title: string
          description: string
          assigned_user_ids?: string[] | null
          due_date?: string | null
          media_uri?: string | null
          media_type?: 'video' | 'image' | 'audio' | null
          require_media?: boolean
          completed_by?: Json | null
          submissions?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          assigned_user_ids?: string[] | null
          due_date?: string | null
          media_uri?: string | null
          media_type?: 'video' | 'image' | 'audio' | null
          require_media?: boolean
          completed_by?: Json | null
          submissions?: Json | null
          created_at?: string
        }
      }
      trainings: {
        Row: {
          id: string
          training_id: string
          name: string
          day_of_week: number
          time: string
          location: string
          is_one_time: boolean | null
          repeat_mode: 'none' | '1x' | '2x' | 'custom' | null
          custom_date: string | null
          created_at: string
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          training_id?: string
          name: string
          day_of_week: number
          time: string
          location: string
          is_one_time?: boolean | null
          repeat_mode?: 'none' | '1x' | '2x' | 'custom' | null
          custom_date?: string | null
          created_at?: string
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          training_id?: string
          name?: string
          day_of_week?: number
          time?: string
          location?: string
          is_one_time?: boolean | null
          repeat_mode?: 'none' | '1x' | '2x' | 'custom' | null
          custom_date?: string | null
          created_at?: string
          updated_at?: string | null
          deleted_at?: string | null
        }
      }
      practice_schedule: {
        Row: {
          id: string
          regular_days: Json | null
          location: string
          cancelled_dates: Json | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          regular_days?: Json | null
          location: string
          cancelled_dates?: Json | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          regular_days?: Json | null
          location?: string
          cancelled_dates?: Json | null
          is_active?: boolean
          created_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          name: string
          description: string
          date: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          description: string
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          date?: string
          created_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          name: string
          category: 'Feestje' | 'Verrassingsfeest' | 'Huwelijk' | 'Verjaardag' | 'Overig'
          date: string
          time: string
          location: string
          member_ids: string[] | null
          created_by: string
          status: 'active' | 'cancelled'
          for_user_id: string | null
          confirmed: boolean
          cancelled_by: string | null
          created_at: string
        }
        Insert: {
          id: string
          name: string
          category: 'Feestje' | 'Verrassingsfeest' | 'Huwelijk' | 'Verjaardag' | 'Overig'
          date: string
          time: string
          location: string
          member_ids?: string[] | null
          created_by: string
          status?: 'active' | 'cancelled'
          for_user_id?: string | null
          confirmed?: boolean
          cancelled_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: 'Feestje' | 'Verrassingsfeest' | 'Huwelijk' | 'Verjaardag' | 'Overig'
          date?: string
          time?: string
          location?: string
          member_ids?: string[] | null
          created_by?: string
          status?: 'active' | 'cancelled'
          for_user_id?: string | null
          confirmed?: boolean
          cancelled_by?: string | null
          created_at?: string
        }
      }
      notification_settings: {
        Row: {
          id: string
          news_enabled: boolean
          news_hours_advance: number
          assignments_enabled: boolean
          training_cancellation_enabled: boolean
          training_hours_advance: number
          performances_enabled: boolean
          performances_hours_advance: number
          created_at: string
        }
        Insert: {
          id?: string
          news_enabled?: boolean
          news_hours_advance?: number
          assignments_enabled?: boolean
          training_cancellation_enabled?: boolean
          training_hours_advance?: number
          performances_enabled?: boolean
          performances_hours_advance?: number
          created_at?: string
        }
        Update: {
          id?: string
          news_enabled?: boolean
          news_hours_advance?: number
          assignments_enabled?: boolean
          training_cancellation_enabled?: boolean
          training_hours_advance?: number
          performances_enabled?: boolean
          performances_hours_advance?: number
          created_at?: string
        }
      }
      media_library: {
        Row: {
          id: string
          name: string
          path: string
          folder_path: string
          file_type: string
          file_size: number
          mime_type: string
          storage_path: string
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          path: string
          folder_path?: string
          file_type: string
          file_size: number
          mime_type: string
          storage_path: string
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          path?: string
          folder_path?: string
          file_type?: string
          file_size?: number
          mime_type?: string
          storage_path?: string
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          created_by: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_by?: string
          created_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          created_at?: string
        }
      }
      media_folders: {
        Row: {
          id: string
          name: string
          folder_path: string
          parent_path: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          folder_path: string
          parent_path?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          folder_path?: string
          parent_path?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      password_reset_requests: {
        Row: {
          id: string
          user_id: string
          requested_username: string
          device_last_login: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          requested_username: string
          device_last_login?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          requested_username?: string
          device_last_login?: string | null
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      get_storage_usage: {
        Args: Record<string, never>
        Returns: number
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
