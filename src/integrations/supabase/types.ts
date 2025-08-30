export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          asset_id: string | null
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          asset_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          asset_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          category: Database["public"]["Enums"]["asset_category"]
          created_at: string
          currency: string | null
          description: string | null
          estimated_value: number | null
          id: string
          images: string[] | null
          owner_id: string
          region_id: string | null
          specifications: Json | null
          status: Database["public"]["Enums"]["asset_status"]
          title: string
          updated_at: string
          verification_documents: string[] | null
        }
        Insert: {
          category: Database["public"]["Enums"]["asset_category"]
          created_at?: string
          currency?: string | null
          description?: string | null
          estimated_value?: number | null
          id?: string
          images?: string[] | null
          owner_id: string
          region_id?: string | null
          specifications?: Json | null
          status?: Database["public"]["Enums"]["asset_status"]
          title: string
          updated_at?: string
          verification_documents?: string[] | null
        }
        Update: {
          category?: Database["public"]["Enums"]["asset_category"]
          created_at?: string
          currency?: string | null
          description?: string | null
          estimated_value?: number | null
          id?: string
          images?: string[] | null
          owner_id?: string
          region_id?: string | null
          specifications?: Json | null
          status?: Database["public"]["Enums"]["asset_status"]
          title?: string
          updated_at?: string
          verification_documents?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      auctions: {
        Row: {
          asset_id: string
          bid_increment: number
          created_at: string
          currency: string
          current_price: number
          description: string | null
          end_time: string
          id: string
          reserve_price: number
          start_time: string
          starting_price: number
          status: string
          updated_at: string
        }
        Insert: {
          asset_id: string
          bid_increment?: number
          created_at?: string
          currency?: string
          current_price: number
          description?: string | null
          end_time: string
          id?: string
          reserve_price: number
          start_time: string
          starting_price: number
          status?: string
          updated_at?: string
        }
        Update: {
          asset_id?: string
          bid_increment?: number
          created_at?: string
          currency?: string
          current_price?: number
          description?: string | null
          end_time?: string
          id?: string
          reserve_price?: number
          start_time?: string
          starting_price?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auctions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          amount: number
          auction_id: string
          bidder_id: string
          created_at: string
          currency: string
          id: string
          is_automatic: boolean
          max_bid_amount: number | null
        }
        Insert: {
          amount: number
          auction_id: string
          bidder_id: string
          created_at?: string
          currency?: string
          id?: string
          is_automatic?: boolean
          max_bid_amount?: number | null
        }
        Update: {
          amount?: number
          auction_id?: string
          bidder_id?: string
          created_at?: string
          currency?: string
          id?: string
          is_automatic?: boolean
          max_bid_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      currency_rates: {
        Row: {
          from_currency: string
          id: string
          last_updated: string
          rate: number
          source: string
          to_currency: string
        }
        Insert: {
          from_currency: string
          id?: string
          last_updated?: string
          rate: number
          source?: string
          to_currency: string
        }
        Update: {
          from_currency?: string
          id?: string
          last_updated?: string
          rate?: number
          source?: string
          to_currency?: string
        }
        Relationships: []
      }
      fractional_shares: {
        Row: {
          asset_id: string
          available_shares: number
          created_at: string
          currency: string
          description: string | null
          id: string
          minimum_investment: number
          price_per_share: number
          status: string
          total_shares: number
          updated_at: string
        }
        Insert: {
          asset_id: string
          available_shares: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          minimum_investment: number
          price_per_share: number
          status?: string
          total_shares: number
          updated_at?: string
        }
        Update: {
          asset_id?: string
          available_shares?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          minimum_investment?: number
          price_per_share?: number
          status?: string
          total_shares?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fractional_shares_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_submissions: {
        Row: {
          additional_documents: string[] | null
          created_at: string
          document_type: string
          document_url: string
          id: string
          notes: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["kyc_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_documents?: string[] | null
          created_at?: string
          document_type: string
          document_url: string
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_documents?: string[] | null
          created_at?: string
          document_type?: string
          document_url?: string
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lending_pools: {
        Row: {
          created_at: string
          currency: string
          current_amount: number
          description: string | null
          id: string
          interest_rate: number
          max_loan_amount: number
          min_loan_amount: number
          name: string
          status: string
          target_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          current_amount?: number
          description?: string | null
          id?: string
          interest_rate: number
          max_loan_amount: number
          min_loan_amount: number
          name: string
          status?: string
          target_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          current_amount?: number
          description?: string | null
          id?: string
          interest_rate?: number
          max_loan_amount?: number
          min_loan_amount?: number
          name?: string
          status?: string
          target_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      loans: {
        Row: {
          amount: number
          asset_id: string
          borrower_id: string
          collateral_ratio: number
          created_at: string
          currency: string
          duration_months: number
          id: string
          interest_rate: number
          pool_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          asset_id: string
          borrower_id: string
          collateral_ratio?: number
          created_at?: string
          currency?: string
          duration_months: number
          id?: string
          interest_rate: number
          pool_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          asset_id?: string
          borrower_id?: string
          collateral_ratio?: number
          created_at?: string
          currency?: string
          duration_months?: number
          id?: string
          interest_rate?: number
          pool_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "lending_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      nft_tokens: {
        Row: {
          asset_id: string
          blockchain: string | null
          contract_address: string | null
          created_at: string
          id: string
          metadata_uri: string | null
          minted_at: string | null
          minted_by: string | null
          token_id: string | null
        }
        Insert: {
          asset_id: string
          blockchain?: string | null
          contract_address?: string | null
          created_at?: string
          id?: string
          metadata_uri?: string | null
          minted_at?: string | null
          minted_by?: string | null
          token_id?: string | null
        }
        Update: {
          asset_id?: string
          blockchain?: string | null
          contract_address?: string | null
          created_at?: string
          id?: string
          metadata_uri?: string | null
          minted_at?: string | null
          minted_by?: string | null
          token_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nft_tokens_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          profile_image_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          full_name?: string | null
          id?: string
          phone?: string | null
          profile_image_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          profile_image_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provenance_records: {
        Row: {
          asset_id: string
          created_at: string
          current_owner_id: string
          id: string
          notes: string | null
          previous_owner_id: string | null
          transaction_hash: string | null
          transfer_currency: string | null
          transfer_date: string
          transfer_method: string | null
          transfer_price: number | null
        }
        Insert: {
          asset_id: string
          created_at?: string
          current_owner_id: string
          id?: string
          notes?: string | null
          previous_owner_id?: string | null
          transaction_hash?: string | null
          transfer_currency?: string | null
          transfer_date?: string
          transfer_method?: string | null
          transfer_price?: number | null
        }
        Update: {
          asset_id?: string
          created_at?: string
          current_owner_id?: string
          id?: string
          notes?: string | null
          previous_owner_id?: string | null
          transaction_hash?: string | null
          transfer_currency?: string | null
          transfer_date?: string
          transfer_method?: string | null
          transfer_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "provenance_records_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          country: string
          created_at: string
          currency_code: string
          id: string
          is_active: boolean
          language_code: string
          name: string
          timezone: string
          updated_at: string
        }
        Insert: {
          country: string
          created_at?: string
          currency_code?: string
          id?: string
          is_active?: boolean
          language_code?: string
          name: string
          timezone: string
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          currency_code?: string
          id?: string
          is_active?: boolean
          language_code?: string
          name?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          asset_id: string
          blockchain_network: string | null
          buyer_id: string
          completed_at: string | null
          created_at: string
          currency: string | null
          id: string
          price: number
          seller_id: string
          status: string | null
          transaction_hash: string | null
        }
        Insert: {
          asset_id: string
          blockchain_network?: string | null
          buyer_id: string
          completed_at?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          price: number
          seller_id: string
          status?: string | null
          transaction_hash?: string | null
        }
        Update: {
          asset_id?: string
          blockchain_network?: string | null
          buyer_id?: string
          completed_at?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          price?: number
          seller_id?: string
          status?: string | null
          transaction_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
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
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          user_uuid: string
          required_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "verified_user" | "pending_user" | "kyc_reviewer"
      asset_category:
        | "jewelry"
        | "watches"
        | "art"
        | "real_estate"
        | "cars"
        | "wine"
        | "collectibles"
      asset_status:
        | "draft"
        | "pending_verification"
        | "verified"
        | "tokenized"
        | "listed"
        | "sold"
      kyc_status:
        | "pending"
        | "under_review"
        | "approved"
        | "rejected"
        | "requires_resubmission"
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
      app_role: ["admin", "verified_user", "pending_user", "kyc_reviewer"],
      asset_category: [
        "jewelry",
        "watches",
        "art",
        "real_estate",
        "cars",
        "wine",
        "collectibles",
      ],
      asset_status: [
        "draft",
        "pending_verification",
        "verified",
        "tokenized",
        "listed",
        "sold",
      ],
      kyc_status: [
        "pending",
        "under_review",
        "approved",
        "rejected",
        "requires_resubmission",
      ],
    },
  },
} as const
