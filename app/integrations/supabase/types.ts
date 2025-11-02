
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
      couples: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      couple_profiles: {
        Row: {
          id: string
          user_id: string
          partner_email: string | null
          couple_id: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          partner_email?: string | null
          couple_id?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          partner_email?: string | null
          couple_id?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          couple_id: string
          created_by: string
          title: string
          date: string
          type: 'vacation' | 'date' | 'trip' | 'event'
          description: string | null
          color: string
          emoji: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          couple_id: string
          created_by: string
          title: string
          date: string
          type: 'vacation' | 'date' | 'trip' | 'event'
          description?: string | null
          color: string
          emoji?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          couple_id?: string
          created_by?: string
          title?: string
          date?: string
          type?: 'vacation' | 'date' | 'trip' | 'event'
          description?: string | null
          color?: string
          emoji?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          couple_id: string
          created_by: string
          title: string
          description: string
          progress: number
          target_date: string | null
          color: string
          emoji: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          couple_id: string
          created_by: string
          title: string
          description: string
          progress?: number
          target_date?: string | null
          color: string
          emoji?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          couple_id?: string
          created_by?: string
          title?: string
          description?: string
          progress?: number
          target_date?: string | null
          color?: string
          emoji?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reminders: {
        Row: {
          id: string
          couple_id: string
          created_by: string
          title: string
          completed: boolean
          due_date: string | null
          shared: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          couple_id: string
          created_by: string
          title: string
          completed?: boolean
          due_date?: string | null
          shared?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          couple_id?: string
          created_by?: string
          title?: string
          completed?: boolean
          due_date?: string | null
          shared?: boolean
          created_at?: string
          updated_at?: string
        }
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
  }
}
