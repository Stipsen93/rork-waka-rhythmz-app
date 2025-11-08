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
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          password: string
          role: 'admin' | 'member'
          password_changed_by_user?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          password?: string
          role?: 'admin' | 'member'
          password_changed_by_user?: boolean
          created_at?: string
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
          id?: string
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
          submissions: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          assigned_user_ids?: string[] | null
          due_date?: string | null
          media_uri?: string | null
          media_type?: 'video' | 'image' | 'audio' | null
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
          submissions?: Json | null
          created_at?: string
        }
      }
      trainings: {
        Row: {
          id: string
          name: string
          day_of_week: number
          time: string
          location: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          day_of_week: number
          time: string
          location: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          day_of_week?: number
          time?: string
          location?: string
          created_at?: string
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
          id?: string
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
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          category: 'Feestje' | 'Verrassingsfeest' | 'Huwelijk' | 'Verjaardag' | 'Overig'
          date: string
          time: string
          location: string
          member_ids?: string[] | null
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          category?: 'Feestje' | 'Verrassingsfeest' | 'Huwelijk' | 'Verjaardag' | 'Overig'
          date?: string
          time?: string
          location?: string
          member_ids?: string[] | null
          created_at?: string
          created_by?: string
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
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
