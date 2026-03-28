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
      campus_statuses: {
        Row: {
          content: string
          created_at: string
          expires_at: string
          id: string
          latitude: number
          longitude: number
          student_id: string
        }
        Insert: {
          content: string
          created_at?: string
          expires_at?: string
          id?: string
          latitude: number
          longitude: number
          student_id: string
        }
        Update: {
          content?: string
          created_at?: string
          expires_at?: string
          id?: string
          latitude?: number
          longitude?: number
          student_id?: string
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
          cin: string | null
          city: string | null
          company_description: string | null
          company_domain: string | null
          company_name: string | null
          company_size: string | null
          created_at: string
          funding_stage: string | null
          gst_number: string | null
          gstin: string | null
          head_office_address: string | null
          hiring_roles: string[] | null
          hr_contact_name: string | null
          hr_designation: string | null
          hr_email: string | null
          hr_phone: string | null
          id: string
          industry: string | null
          is_verified: boolean | null
          linkedin_profile: string | null
          logo_url: string | null
          manager_contact_name: string | null
          manager_designation: string | null
          manager_email: string | null
          manager_phone: string | null
          onboarding_completed_at: string | null
          onboarding_status: string
          onboarding_step: number
          pan_number: string | null
          pincode: string | null
          state: string | null
          updated_at: string
          user_id: string
          verification_method: string | null
          verified_at: string | null
          verified_domain: string | null
          website: string | null
          work_email_verified: boolean | null
          year_established: number | null
        }
        Insert: {
          cin?: string | null
          city?: string | null
          company_description?: string | null
          company_domain?: string | null
          company_name?: string | null
          company_size?: string | null
          created_at?: string
          funding_stage?: string | null
          gst_number?: string | null
          gstin?: string | null
          head_office_address?: string | null
          hiring_roles?: string[] | null
          hr_contact_name?: string | null
          hr_designation?: string | null
          hr_email?: string | null
          hr_phone?: string | null
          id?: string
          industry?: string | null
          is_verified?: boolean | null
          linkedin_profile?: string | null
          logo_url?: string | null
          manager_contact_name?: string | null
          manager_designation?: string | null
          manager_email?: string | null
          manager_phone?: string | null
          onboarding_completed_at?: string | null
          onboarding_status?: string
          onboarding_step?: number
          pan_number?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          verification_method?: string | null
          verified_at?: string | null
          verified_domain?: string | null
          website?: string | null
          work_email_verified?: boolean | null
          year_established?: number | null
        }
        Update: {
          cin?: string | null
          city?: string | null
          company_description?: string | null
          company_domain?: string | null
          company_name?: string | null
          company_size?: string | null
          created_at?: string
          funding_stage?: string | null
          gst_number?: string | null
          gstin?: string | null
          head_office_address?: string | null
          hiring_roles?: string[] | null
          hr_contact_name?: string | null
          hr_designation?: string | null
          hr_email?: string | null
          hr_phone?: string | null
          id?: string
          industry?: string | null
          is_verified?: boolean | null
          linkedin_profile?: string | null
          logo_url?: string | null
          manager_contact_name?: string | null
          manager_designation?: string | null
          manager_email?: string | null
          manager_phone?: string | null
          onboarding_completed_at?: string | null
          onboarding_status?: string
          onboarding_step?: number
          pan_number?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          verification_method?: string | null
          verified_at?: string | null
          verified_domain?: string | null
          website?: string | null
          work_email_verified?: boolean | null
          year_established?: number | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
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
      internship_feedback: {
        Row: {
          company_id: string
          created_at: string
          id: string
          internship_id: string
          rating: number
          review: string | null
          student_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          internship_id: string
          rating: number
          review?: string | null
          student_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          internship_id?: string
          rating?: number
          review?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internship_feedback_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
        ]
      }
      internships: {
        Row: {
          app_cap: number
          application_count: number
          benefits: string[] | null
          created_at: string
          day_to_day_tasks: string | null
          deadline: string | null
          department: string | null
          description: string | null
          duration_months: number | null
          eligibility: string[] | null
          employer_id: string
          id: string
          industry: string | null
          internship_category: string | null
          interview_required: boolean | null
          joining_process: string | null
          location: string | null
          projects: string | null
          requirements: string | null
          resume_screening: boolean | null
          roles_responsibilities: string | null
          skills_required: string[] | null
          slots: number
          start_date: string | null
          status: Database["public"]["Enums"]["internship_status"]
          stipend_amount: number | null
          stipend_type: string | null
          test_assignment: string | null
          title: string
          type: Database["public"]["Enums"]["internship_type"]
          updated_at: string
          working_days: string | null
          working_hours: string | null
        }
        Insert: {
          app_cap?: number
          application_count?: number
          benefits?: string[] | null
          created_at?: string
          day_to_day_tasks?: string | null
          deadline?: string | null
          department?: string | null
          description?: string | null
          duration_months?: number | null
          eligibility?: string[] | null
          employer_id: string
          id?: string
          industry?: string | null
          internship_category?: string | null
          interview_required?: boolean | null
          joining_process?: string | null
          location?: string | null
          projects?: string | null
          requirements?: string | null
          resume_screening?: boolean | null
          roles_responsibilities?: string | null
          skills_required?: string[] | null
          slots?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["internship_status"]
          stipend_amount?: number | null
          stipend_type?: string | null
          test_assignment?: string | null
          title: string
          type?: Database["public"]["Enums"]["internship_type"]
          updated_at?: string
          working_days?: string | null
          working_hours?: string | null
        }
        Update: {
          app_cap?: number
          application_count?: number
          benefits?: string[] | null
          created_at?: string
          day_to_day_tasks?: string | null
          deadline?: string | null
          department?: string | null
          description?: string | null
          duration_months?: number | null
          eligibility?: string[] | null
          employer_id?: string
          id?: string
          industry?: string | null
          internship_category?: string | null
          interview_required?: boolean | null
          joining_process?: string | null
          location?: string | null
          projects?: string | null
          requirements?: string | null
          resume_screening?: boolean | null
          roles_responsibilities?: string | null
          skills_required?: string[] | null
          slots?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["internship_status"]
          stipend_amount?: number | null
          stipend_type?: string | null
          test_assignment?: string | null
          title?: string
          type?: Database["public"]["Enums"]["internship_type"]
          updated_at?: string
          working_days?: string | null
          working_hours?: string | null
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
      recommendation_cache: {
        Row: {
          created_at: string
          expires_at: string
          explanation: string | null
          id: string
          interest_alignment_score: number | null
          internship_id: string
          location_match_score: number | null
          match_score: number
          skill_match_score: number | null
          student_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          explanation?: string | null
          id?: string
          interest_alignment_score?: number | null
          internship_id: string
          location_match_score?: number | null
          match_score?: number
          skill_match_score?: number | null
          student_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          explanation?: string | null
          id?: string
          interest_alignment_score?: number | null
          internship_id?: string
          location_match_score?: number | null
          match_score?: number
          skill_match_score?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_cache_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_feedback: {
        Row: {
          action: string
          created_at: string
          id: string
          internship_id: string
          student_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          internship_id: string
          student_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          internship_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_feedback_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_test_results: {
        Row: {
          created_at: string
          id: string
          passed: boolean
          score: number
          skill_name: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          passed?: boolean
          score: number
          skill_name: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          passed?: boolean
          score?: number
          skill_name?: string
          student_id?: string
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
      status_replies: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_id: string
          status_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_id: string
          status_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          status_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_replies_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "campus_statuses"
            referencedColumns: ["id"]
          },
        ]
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
          phone_number: string | null
          preferred_course: string | null
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
          phone_number?: string | null
          preferred_course?: string | null
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
          phone_number?: string | null
          preferred_course?: string | null
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
      update_student_reputation: {
        Args: { _student_id: string }
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
