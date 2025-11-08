export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
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
          updated_at?: string
        }
      }
      library_categories: {
        Row: {
          id: string
          name: string
          parent_id: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          parent_id?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          parent_id?: string | null
          description?: string | null
          updated_at?: string
        }
      }
      media_items: {
        Row: {
          id: string
          category_id: string | null
          type: 'video' | 'image' | 'text'
          title: string
          uri: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          type: 'video' | 'image' | 'text'
          title: string
          uri: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          type?: 'video' | 'image' | 'text'
          title?: string
          uri?: string
          notes?: string | null
          updated_at?: string
        }
      }
      media_comments: {
        Row: {
          id: string
          media_id: string
          user_id: string
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          media_id: string
          user_id: string
          text: string
          created_at?: string
        }
        Update: {
          text?: string
        }
      }
      assignments: {
        Row: {
          id: string
          title: string
          description: string
          due_date: string | null
          media_uri: string | null
          media_type: 'video' | 'image' | 'audio' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          due_date?: string | null
          media_uri?: string | null
          media_type?: 'video' | 'image' | 'audio' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          due_date?: string | null
          media_uri?: string | null
          media_type?: 'video' | 'image' | 'audio' | null
          updated_at?: string
        }
      }
      assignment_members: {
        Row: {
          id: string
          assignment_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          user_id: string
          created_at?: string
        }
        Update: {}
      }
      assignment_submissions: {
        Row: {
          id: string
          assignment_id: string
          user_id: string
          video_uri: string
          created_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          user_id: string
          video_uri: string
          created_at?: string
        }
        Update: {}
      }
      trainings: {
        Row: {
          id: string
          name: string
          day_of_week: number
          time: string
          location: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          day_of_week: number
          time: string
          location: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          day_of_week?: number
          time?: string
          location?: string
          updated_at?: string
        }
      }
      cancelled_practices: {
        Row: {
          id: string
          date: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          date?: string
          reason?: string | null
        }
      }
      announcements: {
        Row: {
          id: string
          name: string
          description: string
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          date?: string
          updated_at?: string
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
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: 'Feestje' | 'Verrassingsfeest' | 'Huwelijk' | 'Verjaardag' | 'Overig'
          date: string
          time: string
          location: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: 'Feestje' | 'Verrassingsfeest' | 'Huwelijk' | 'Verjaardag' | 'Overig'
          date?: string
          time?: string
          location?: string
          updated_at?: string
        }
      }
      appointment_members: {
        Row: {
          id: string
          appointment_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          appointment_id: string
          user_id: string
          created_at?: string
        }
        Update: {}
      }
      notification_settings: {
        Row: {
          id: string
          user_id: string
          news_enabled: boolean
          news_hours_advance: number
          assignments_enabled: boolean
          training_cancellation_enabled: boolean
          training_hours_advance: number
          performances_enabled: boolean
          performances_hours_advance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          news_enabled?: boolean
          news_hours_advance?: number
          assignments_enabled?: boolean
          training_cancellation_enabled?: boolean
          training_hours_advance?: number
          performances_enabled?: boolean
          performances_hours_advance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          news_enabled?: boolean
          news_hours_advance?: number
          assignments_enabled?: boolean
          training_cancellation_enabled?: boolean
          training_hours_advance?: number
          performances_enabled?: boolean
          performances_hours_advance?: number
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
