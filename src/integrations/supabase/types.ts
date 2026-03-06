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
      applications: {
        Row: {
          applied_at: string
          cover_letter: string | null
          id: string
          internship_id: string
          resume_url: string | null
          status: Database["public"]["Enums"]["application_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          applied_at?: string
          cover_letter?: string | null
          id?: string
          internship_id: string
          resume_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          applied_at?: string
          cover_letter?: string | null
          id?: string
          internship_id?: string
          resume_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      employer_invitations: {
        Row: {
          created_at: string
          email: string
          id: string
          invitation_role: string
          inviter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invitation_role?: string
          inviter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invitation_role?: string
          inviter_id?: string
          status?: string
        }
        Relationships: []
      }
      employer_profiles: {
        Row: {
          company_domain: string | null
          company_name: string | null
          company_size: string | null
          created_at: string
          funding_stage: string | null
          hiring_roles: string[] | null
          id: string
          industry: string | null
          logo_url: string | null
          onboarding_completed_at: string | null
          onboarding_status: string
          onboarding_step: number
          updated_at: string
          user_id: string
          verification_method: string | null
          verified_at: string | null
          verified_domain: string | null
          website: string | null
          work_email_verified: boolean | null
        }
        Insert: {
          company_domain?: string | null
          company_name?: string | null
          company_size?: string | null
          created_at?: string
          funding_stage?: string | null
          hiring_roles?: string[] | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          onboarding_completed_at?: string | null
          onboarding_status?: string
          onboarding_step?: number
          updated_at?: string
          user_id: string
          verification_method?: string | null
          verified_at?: string | null
          verified_domain?: string | null
          website?: string | null
          work_email_verified?: boolean | null
        }
        Update: {
          company_domain?: string | null
          company_name?: string | null
          company_size?: string | null
          created_at?: string
          funding_stage?: string | null
          hiring_roles?: string[] | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          onboarding_completed_at?: string | null
          onboarding_status?: string
          onboarding_step?: number
          updated_at?: string
          user_id?: string
          verification_method?: string | null
          verified_at?: string | null
          verified_domain?: string | null
          website?: string | null
          work_email_verified?: boolean | null
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          created_at: string
          group_id: string
          id: string
          sender_id: string
          sender_name: string
          text: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          sender_id: string
          sender_name?: string
          text: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          sender_id?: string
          sender_name?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          centroid_lat: number | null
          centroid_lng: number | null
          company_id: string | null
          created_at: string
          geohash: string | null
          id: string
          internship_id: string | null
          label: string
          type: string
        }
        Insert: {
          centroid_lat?: number | null
          centroid_lng?: number | null
          company_id?: string | null
          created_at?: string
          geohash?: string | null
          id?: string
          internship_id?: string | null
          label: string
          type: string
        }
        Update: {
          centroid_lat?: number | null
          centroid_lng?: number | null
          company_id?: string | null
          created_at?: string
          geohash?: string | null
          id?: string
          internship_id?: string | null
          label?: string
          type?: string
        }
        Relationships: []
      }
      internships: {
        Row: {
          app_cap: number
          application_count: number
          created_at: string
          deadline: string | null
          description: string | null
          employer_id: string
          id: string
          industry: string | null
          location: string | null
          requirements: string | null
          skills_required: string[] | null
          slots: number
          status: Database["public"]["Enums"]["internship_status"]
          title: string
          type: Database["public"]["Enums"]["internship_type"]
          updated_at: string
        }
        Insert: {
          app_cap?: number
          application_count?: number
          created_at?: string
          deadline?: string | null
          description?: string | null
          employer_id: string
          id?: string
          industry?: string | null
          location?: string | null
          requirements?: string | null
          skills_required?: string[] | null
          slots?: number
          status?: Database["public"]["Enums"]["internship_status"]
          title: string
          type?: Database["public"]["Enums"]["internship_type"]
          updated_at?: string
        }
        Update: {
          app_cap?: number
          application_count?: number
          created_at?: string
          deadline?: string | null
          description?: string | null
          employer_id?: string
          id?: string
          industry?: string | null
          location?: string | null
          requirements?: string | null
          skills_required?: string[] | null
          slots?: number
          status?: Database["public"]["Enums"]["internship_status"]
          title?: string
          type?: Database["public"]["Enums"]["internship_type"]
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string | null
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          function_name: string
          id: string
          timestamps: number[]
          updated_at: string
          user_id: string
        }
        Insert: {
          function_name: string
          id?: string
          timestamps?: number[]
          updated_at?: string
          user_id: string
        }
        Update: {
          function_name?: string
          id?: string
          timestamps?: number[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      student_culture: {
        Row: {
          career_track: string | null
          created_at: string
          environment_preference: string | null
          id: string
          job_description_text: string | null
          job_priorities: string[] | null
          motivation_type: string | null
          quiet_importance: string | null
          remote_importance: string | null
          tech_avoid: string[] | null
          tech_interests: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          career_track?: string | null
          created_at?: string
          environment_preference?: string | null
          id?: string
          job_description_text?: string | null
          job_priorities?: string[] | null
          motivation_type?: string | null
          quiet_importance?: string | null
          remote_importance?: string | null
          tech_avoid?: string[] | null
          tech_interests?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          career_track?: string | null
          created_at?: string
          environment_preference?: string | null
          id?: string
          job_description_text?: string | null
          job_priorities?: string[] | null
          motivation_type?: string | null
          quiet_importance?: string | null
          remote_importance?: string | null
          tech_avoid?: string[] | null
          tech_interests?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_preferences: {
        Row: {
          company_size_preferences: Json | null
          created_at: string
          currency: string | null
          desired_salary: number | null
          id: string
          job_search_status: string | null
          job_types: string[] | null
          needs_sponsorship: boolean | null
          preferred_locations: string[] | null
          preferred_roles: string[] | null
          remote_ok: boolean | null
          updated_at: string
          us_authorized: boolean | null
          user_id: string
        }
        Insert: {
          company_size_preferences?: Json | null
          created_at?: string
          currency?: string | null
          desired_salary?: number | null
          id?: string
          job_search_status?: string | null
          job_types?: string[] | null
          needs_sponsorship?: boolean | null
          preferred_locations?: string[] | null
          preferred_roles?: string[] | null
          remote_ok?: boolean | null
          updated_at?: string
          us_authorized?: boolean | null
          user_id: string
        }
        Update: {
          company_size_preferences?: Json | null
          created_at?: string
          currency?: string | null
          desired_salary?: number | null
          id?: string
          job_search_status?: string | null
          job_types?: string[] | null
          needs_sponsorship?: boolean | null
          preferred_locations?: string[] | null
          preferred_roles?: string[] | null
          remote_ok?: boolean | null
          updated_at?: string
          us_authorized?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          created_at: string
          current_company: string | null
          current_job_title: string | null
          experience_years: string | null
          geohash: string | null
          graduation_year: number | null
          id: string
          is_student: boolean | null
          lat: number | null
          linkedin_url: string | null
          lng: number | null
          location: string | null
          major: string | null
          not_employed: boolean | null
          onboarding_completed_at: string | null
          onboarding_status: string
          onboarding_step: number
          profile_role: string | null
          resume_url: string | null
          skills: string[] | null
          university: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          current_company?: string | null
          current_job_title?: string | null
          experience_years?: string | null
          geohash?: string | null
          graduation_year?: number | null
          id?: string
          is_student?: boolean | null
          lat?: number | null
          linkedin_url?: string | null
          lng?: number | null
          location?: string | null
          major?: string | null
          not_employed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_status?: string
          onboarding_step?: number
          profile_role?: string | null
          resume_url?: string | null
          skills?: string[] | null
          university?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          current_company?: string | null
          current_job_title?: string | null
          experience_years?: string | null
          geohash?: string | null
          graduation_year?: number | null
          id?: string
          is_student?: boolean | null
          lat?: number | null
          linkedin_url?: string | null
          lng?: number | null
          location?: string | null
          major?: string | null
          not_employed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_status?: string
          onboarding_step?: number
          profile_role?: string | null
          resume_url?: string | null
          skills?: string[] | null
          university?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
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
      set_initial_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "student" | "employer" | "admin"
      application_status:
        | "pending"
        | "reviewed"
        | "interview"
        | "accepted"
        | "rejected"
      internship_status: "draft" | "published" | "closed"
      internship_type: "remote" | "onsite" | "hybrid"
      notification_type:
        | "application_submitted"
        | "status_changed"
        | "new_match"
        | "internship_approved"
        | "internship_rejected"
        | "general"
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
      app_role: ["student", "employer", "admin"],
      application_status: [
        "pending",
        "reviewed",
        "interview",
        "accepted",
        "rejected",
      ],
      internship_status: ["draft", "published", "closed"],
      internship_type: ["remote", "onsite", "hybrid"],
      notification_type: [
        "application_submitted",
        "status_changed",
        "new_match",
        "internship_approved",
        "internship_rejected",
        "general",
      ],
    },
  },
} as const
