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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      change_proposals: {
        Row: {
          client_message: string | null
          client_name: string | null
          created_at: string | null
          id: string
          manager_notes: string | null
          offer_id: string
          original_total: number | null
          price_diff: number | null
          proposed_people_count: number | null
          proposed_total: number | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["proposal_status"]
        }
        Insert: {
          client_message?: string | null
          client_name?: string | null
          created_at?: string | null
          id?: string
          manager_notes?: string | null
          offer_id: string
          original_total?: number | null
          price_diff?: number | null
          proposed_people_count?: number | null
          proposed_total?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
        }
        Update: {
          client_message?: string | null
          client_name?: string | null
          created_at?: string | null
          id?: string
          manager_notes?: string | null
          offer_id?: string
          original_total?: number | null
          price_diff?: number | null
          proposed_people_count?: number | null
          proposed_total?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
        }
        Relationships: [
          {
            foreignKeyName: "change_proposals_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          client_type: Database["public"]["Enums"]["client_type"] | null
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          is_returning: boolean | null
          name: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          client_type?: Database["public"]["Enums"]["client_type"] | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_returning?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          client_type?: Database["public"]["Enums"]["client_type"] | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_returning?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      dish_categories: {
        Row: {
          code: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          code: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          code?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      dish_photos: {
        Row: {
          created_at: string | null
          dish_id: string
          id: string
          is_primary: boolean | null
          photo_url: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          dish_id: string
          id?: string
          is_primary?: boolean | null
          photo_url: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          dish_id?: string
          id?: string
          is_primary?: boolean | null
          photo_url?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dish_photos_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
        ]
      }
      dishes: {
        Row: {
          allergens: string[] | null
          category_id: string
          cost_per_unit: number | null
          created_at: string | null
          description_sales: string | null
          description_short: string | null
          diet_tags: string[] | null
          display_name: string
          event_tags: string[] | null
          id: string
          is_active: boolean | null
          is_modifiable: boolean | null
          margin_percent: number | null
          min_order_quantity: number | null
          modifiable_items: Json | null
          name: string
          photo_url: string | null
          portion_weight_g: number | null
          price_per_kg: number | null
          price_per_person: number | null
          price_per_piece: number | null
          price_per_set: number | null
          season_tags: string[] | null
          serves_people: number | null
          serving_style: string[] | null
          sort_order: number | null
          subcategory: string | null
          tags: string[] | null
          unit_type: Database["public"]["Enums"]["unit_type"]
          updated_at: string | null
        }
        Insert: {
          allergens?: string[] | null
          category_id: string
          cost_per_unit?: number | null
          created_at?: string | null
          description_sales?: string | null
          description_short?: string | null
          diet_tags?: string[] | null
          display_name: string
          event_tags?: string[] | null
          id?: string
          is_active?: boolean | null
          is_modifiable?: boolean | null
          margin_percent?: number | null
          min_order_quantity?: number | null
          modifiable_items?: Json | null
          name: string
          photo_url?: string | null
          portion_weight_g?: number | null
          price_per_kg?: number | null
          price_per_person?: number | null
          price_per_piece?: number | null
          price_per_set?: number | null
          season_tags?: string[] | null
          serves_people?: number | null
          serving_style?: string[] | null
          sort_order?: number | null
          subcategory?: string | null
          tags?: string[] | null
          unit_type: Database["public"]["Enums"]["unit_type"]
          updated_at?: string | null
        }
        Update: {
          allergens?: string[] | null
          category_id?: string
          cost_per_unit?: number | null
          created_at?: string | null
          description_sales?: string | null
          description_short?: string | null
          diet_tags?: string[] | null
          display_name?: string
          event_tags?: string[] | null
          id?: string
          is_active?: boolean | null
          is_modifiable?: boolean | null
          margin_percent?: number | null
          min_order_quantity?: number | null
          modifiable_items?: Json | null
          name?: string
          photo_url?: string | null
          portion_weight_g?: number | null
          price_per_kg?: number | null
          price_per_person?: number | null
          price_per_piece?: number | null
          price_per_set?: number | null
          season_tags?: string[] | null
          serves_people?: number | null
          serving_style?: string[] | null
          sort_order?: number | null
          subcategory?: string | null
          tags?: string[] | null
          unit_type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dishes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "dish_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      event_type_photos: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string | null
          event_type_id: string
          height: number | null
          id: string
          is_hero: boolean | null
          photo_url: string
          sort_order: number | null
          tags: string[] | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          event_type_id: string
          height?: number | null
          id?: string
          is_hero?: boolean | null
          photo_url: string
          sort_order?: number | null
          tags?: string[] | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          event_type_id?: string
          height?: number | null
          id?: string
          is_hero?: boolean | null
          photo_url?: string
          sort_order?: number | null
          tags?: string[] | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_type_photos_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "event_type_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_type_profiles: {
        Row: {
          cta_text: string | null
          description_long: string | null
          description_short: string
          features: Json | null
          headline: string
          hero_image_url: string | null
          id: string
          is_active: boolean | null
          testimonial_author: string | null
          testimonial_event: string | null
          testimonial_text: string | null
          updated_at: string | null
        }
        Insert: {
          cta_text?: string | null
          description_long?: string | null
          description_short: string
          features?: Json | null
          headline: string
          hero_image_url?: string | null
          id: string
          is_active?: boolean | null
          testimonial_author?: string | null
          testimonial_event?: string | null
          testimonial_text?: string | null
          updated_at?: string | null
        }
        Update: {
          cta_text?: string | null
          description_long?: string | null
          description_short?: string
          features?: Json | null
          headline?: string
          hero_image_url?: string | null
          id?: string
          is_active?: boolean | null
          testimonial_author?: string | null
          testimonial_event?: string | null
          testimonial_text?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_type_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "offer_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          lead_id: string
          type: Database["public"]["Enums"]["activity_type"]
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          lead_id: string
          type: Database["public"]["Enums"]["activity_type"]
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          lead_id?: string
          type?: Database["public"]["Enums"]["activity_type"]
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          client_id: string | null
          created_at: string | null
          estimated_value: number | null
          event_date: string | null
          event_type: Database["public"]["Enums"]["event_type"] | null
          id: string
          lost_notes: string | null
          lost_reason: Database["public"]["Enums"]["lost_reason"] | null
          notes: string | null
          original_message: string | null
          people_count: number | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string | null
          won_final_value: number | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          estimated_value?: number | null
          event_date?: string | null
          event_type?: Database["public"]["Enums"]["event_type"] | null
          id?: string
          lost_notes?: string | null
          lost_reason?: Database["public"]["Enums"]["lost_reason"] | null
          notes?: string | null
          original_message?: string | null
          people_count?: number | null
          source: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string | null
          won_final_value?: number | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          estimated_value?: number | null
          event_date?: string | null
          event_type?: Database["public"]["Enums"]["event_type"] | null
          id?: string
          lost_notes?: string | null
          lost_reason?: Database["public"]["Enums"]["lost_reason"] | null
          notes?: string | null
          original_message?: string | null
          people_count?: number | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string | null
          won_final_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          event_type: string
          id: string
          is_read: boolean | null
          link: string | null
          offer_id: string | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string | null
          event_type: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          offer_id?: string | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string | null
          event_type?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          offer_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_corrections: {
        Row: {
          client_name: string | null
          created_at: string | null
          id: string
          manager_response: string | null
          message: string
          offer_id: string
          resolved_at: string | null
          resolved_notes: string | null
          responded_at: string | null
          responded_by: string | null
          status: Database["public"]["Enums"]["correction_status"]
          type: string | null
        }
        Insert: {
          client_name?: string | null
          created_at?: string | null
          id?: string
          manager_response?: string | null
          message: string
          offer_id: string
          resolved_at?: string | null
          resolved_notes?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: Database["public"]["Enums"]["correction_status"]
          type?: string | null
        }
        Update: {
          client_name?: string | null
          created_at?: string | null
          id?: string
          manager_response?: string | null
          message?: string
          offer_id?: string
          resolved_at?: string | null
          resolved_notes?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: Database["public"]["Enums"]["correction_status"]
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offer_corrections_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_events: {
        Row: {
          browser: string | null
          created_at: string | null
          device_type: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_hash: string | null
          offer_id: string
          session_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string | null
          device_type?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_hash?: string | null
          offer_id: string
          session_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string | null
          device_type?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_hash?: string | null
          offer_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_events_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_services: {
        Row: {
          custom_price: number | null
          id: string
          notes: string | null
          offer_id: string
          quantity: number | null
          service_id: string
        }
        Insert: {
          custom_price?: number | null
          id?: string
          notes?: string | null
          offer_id: string
          quantity?: number | null
          service_id: string
        }
        Update: {
          custom_price?: number | null
          id?: string
          notes?: string | null
          offer_id?: string
          quantity?: number | null
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_services_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_templates: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          is_active: boolean | null
          name: string
          pricing_mode: Database["public"]["Enums"]["pricing_mode"]
          template_data: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          is_active?: boolean | null
          name: string
          pricing_mode: Database["public"]["Enums"]["pricing_mode"]
          template_data: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          is_active?: boolean | null
          name?: string
          pricing_mode?: Database["public"]["Enums"]["pricing_mode"]
          template_data?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      offer_terms: {
        Row: {
          display_order: number | null
          id: string
          is_active: boolean | null
          key: string
          label: string
          updated_at: string | null
          value: string
        }
        Insert: {
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          key: string
          label: string
          updated_at?: string | null
          value: string
        }
        Update: {
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          key?: string
          label?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      offer_themes: {
        Row: {
          accent_color: string
          background_color: string
          font_family: string
          header_font: string | null
          hero_pattern: string | null
          icon_set: string | null
          id: string
          mood: string
          name: string
          primary_color: string
          secondary_color: string
          text_color: string
        }
        Insert: {
          accent_color: string
          background_color?: string
          font_family: string
          header_font?: string | null
          hero_pattern?: string | null
          icon_set?: string | null
          id: string
          mood: string
          name: string
          primary_color: string
          secondary_color: string
          text_color?: string
        }
        Update: {
          accent_color?: string
          background_color?: string
          font_family?: string
          header_font?: string | null
          hero_pattern?: string | null
          icon_set?: string | null
          id?: string
          mood?: string
          name?: string
          primary_color?: string
          secondary_color?: string
          text_color?: string
        }
        Relationships: []
      }
      offer_upsell_selections: {
        Row: {
          added_at: string | null
          confirmed_at: string | null
          id: string
          offer_id: string
          quantity: number
          status: Database["public"]["Enums"]["upsell_selection_status"]
          total_price: number
          unit_price: number
          upsell_item_id: string
        }
        Insert: {
          added_at?: string | null
          confirmed_at?: string | null
          id?: string
          offer_id: string
          quantity?: number
          status?: Database["public"]["Enums"]["upsell_selection_status"]
          total_price: number
          unit_price: number
          upsell_item_id: string
        }
        Update: {
          added_at?: string | null
          confirmed_at?: string | null
          id?: string
          offer_id?: string
          quantity?: number
          status?: Database["public"]["Enums"]["upsell_selection_status"]
          total_price?: number
          unit_price?: number
          upsell_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_upsell_selections_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_upsell_selections_upsell_item_id_fkey"
            columns: ["upsell_item_id"]
            isOneToOne: false
            referencedRelation: "upsell_items"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_variants: {
        Row: {
          description: string | null
          id: string
          is_recommended: boolean | null
          name: string
          offer_id: string
          price_per_person: number | null
          sort_order: number | null
          total_value: number | null
        }
        Insert: {
          description?: string | null
          id?: string
          is_recommended?: boolean | null
          name: string
          offer_id: string
          price_per_person?: number | null
          sort_order?: number | null
          total_value?: number | null
        }
        Update: {
          description?: string | null
          id?: string
          is_recommended?: boolean | null
          name?: string
          offer_id?: string
          price_per_person?: number | null
          sort_order?: number | null
          total_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "offer_variants_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_versions: {
        Row: {
          change_summary: string | null
          changed_by: string
          created_at: string | null
          id: string
          offer_id: string
          snapshot: Json
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          changed_by: string
          created_at?: string | null
          id?: string
          offer_id: string
          snapshot: Json
          version_number: number
        }
        Update: {
          change_summary?: string | null
          changed_by?: string
          created_at?: string | null
          id?: string
          offer_id?: string
          snapshot?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "offer_versions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          accepted_at: string | null
          accepted_variant_id: string | null
          ai_parsed_data: Json | null
          ai_summary: string | null
          client_id: string | null
          client_requirements: Json | null
          created_at: string | null
          created_by: string
          current_version: number | null
          delivery_cost: number | null
          delivery_type: Database["public"]["Enums"]["delivery_type"] | null
          discount_percent: number | null
          discount_value: number | null
          event_date: string | null
          event_location: string | null
          event_time_from: string | null
          event_time_to: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          greeting_text: string | null
          id: string
          inquiry_text: string | null
          is_people_count_editable: boolean | null
          lead_id: string | null
          min_offer_price: number | null
          notes_client: string | null
          notes_internal: string | null
          offer_number: string | null
          people_count: number | null
          price_display_mode: Database["public"]["Enums"]["price_display_mode"]
          price_per_person: number | null
          pricing_mode: Database["public"]["Enums"]["pricing_mode"]
          public_token: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["offer_status"]
          theme_id: string | null
          total_dishes_value: number | null
          total_services_value: number | null
          total_value: number | null
          updated_at: string | null
          upsell_enabled: boolean | null
          upsell_total: number | null
          valid_until: string | null
          validity_days: number | null
          viewed_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_variant_id?: string | null
          ai_parsed_data?: Json | null
          ai_summary?: string | null
          client_id?: string | null
          client_requirements?: Json | null
          created_at?: string | null
          created_by: string
          current_version?: number | null
          delivery_cost?: number | null
          delivery_type?: Database["public"]["Enums"]["delivery_type"] | null
          discount_percent?: number | null
          discount_value?: number | null
          event_date?: string | null
          event_location?: string | null
          event_time_from?: string | null
          event_time_to?: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          greeting_text?: string | null
          id?: string
          inquiry_text?: string | null
          is_people_count_editable?: boolean | null
          lead_id?: string | null
          min_offer_price?: number | null
          notes_client?: string | null
          notes_internal?: string | null
          offer_number?: string | null
          people_count?: number | null
          price_display_mode?: Database["public"]["Enums"]["price_display_mode"]
          price_per_person?: number | null
          pricing_mode?: Database["public"]["Enums"]["pricing_mode"]
          public_token?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          theme_id?: string | null
          total_dishes_value?: number | null
          total_services_value?: number | null
          total_value?: number | null
          updated_at?: string | null
          upsell_enabled?: boolean | null
          upsell_total?: number | null
          valid_until?: string | null
          validity_days?: number | null
          viewed_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_variant_id?: string | null
          ai_parsed_data?: Json | null
          ai_summary?: string | null
          client_id?: string | null
          client_requirements?: Json | null
          created_at?: string | null
          created_by?: string
          current_version?: number | null
          delivery_cost?: number | null
          delivery_type?: Database["public"]["Enums"]["delivery_type"] | null
          discount_percent?: number | null
          discount_value?: number | null
          event_date?: string | null
          event_location?: string | null
          event_time_from?: string | null
          event_time_to?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          greeting_text?: string | null
          id?: string
          inquiry_text?: string | null
          is_people_count_editable?: boolean | null
          lead_id?: string | null
          min_offer_price?: number | null
          notes_client?: string | null
          notes_internal?: string | null
          offer_number?: string | null
          people_count?: number | null
          price_display_mode?: Database["public"]["Enums"]["price_display_mode"]
          price_per_person?: number | null
          pricing_mode?: Database["public"]["Enums"]["pricing_mode"]
          public_token?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          theme_id?: string | null
          total_dishes_value?: number | null
          total_services_value?: number | null
          total_value?: number | null
          updated_at?: string | null
          upsell_enabled?: boolean | null
          upsell_total?: number | null
          valid_until?: string | null
          validity_days?: number | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_accepted_variant"
            columns: ["accepted_variant_id"]
            isOneToOne: false
            referencedRelation: "offer_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "offer_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_items: {
        Row: {
          change_type: Database["public"]["Enums"]["change_type"]
          decided_at: string | null
          decided_by: string | null
          id: string
          manager_note: string | null
          original_dish_id: string
          original_price: number
          original_quantity: number
          proposal_id: string
          proposed_dish_id: string | null
          proposed_price: number
          proposed_quantity: number | null
          proposed_variant_option: string | null
          split_details: Json | null
          status: Database["public"]["Enums"]["proposal_item_status"]
          variant_item_id: string | null
        }
        Insert: {
          change_type: Database["public"]["Enums"]["change_type"]
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          manager_note?: string | null
          original_dish_id: string
          original_price: number
          original_quantity: number
          proposal_id: string
          proposed_dish_id?: string | null
          proposed_price: number
          proposed_quantity?: number | null
          proposed_variant_option?: string | null
          split_details?: Json | null
          status?: Database["public"]["Enums"]["proposal_item_status"]
          variant_item_id?: string | null
        }
        Update: {
          change_type?: Database["public"]["Enums"]["change_type"]
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          manager_note?: string | null
          original_dish_id?: string
          original_price?: number
          original_quantity?: number
          proposal_id?: string
          proposed_dish_id?: string | null
          proposed_price?: number
          proposed_quantity?: number | null
          proposed_variant_option?: string | null
          split_details?: Json | null
          status?: Database["public"]["Enums"]["proposal_item_status"]
          variant_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_items_original_dish_id_fkey"
            columns: ["original_dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "change_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_items_proposed_dish_id_fkey"
            columns: ["proposed_dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_items_variant_item_id_fkey"
            columns: ["variant_item_id"]
            isOneToOne: false
            referencedRelation: "variant_items"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          price_type: Database["public"]["Enums"]["price_type"]
          sort_order: number | null
          type: Database["public"]["Enums"]["service_type"]
        }
        Insert: {
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          price_type: Database["public"]["Enums"]["price_type"]
          sort_order?: number | null
          type: Database["public"]["Enums"]["service_type"]
        }
        Update: {
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          price_type?: Database["public"]["Enums"]["price_type"]
          sort_order?: number | null
          type?: Database["public"]["Enums"]["service_type"]
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      upsell_items: {
        Row: {
          created_at: string | null
          default_quantity: number
          description: string | null
          dish_id: string | null
          emoji: string | null
          id: string
          image_url: string | null
          is_active: boolean
          item_type: Database["public"]["Enums"]["upsell_item_type"]
          name: string
          price: number
          price_type: Database["public"]["Enums"]["upsell_price_type"]
          service_id: string | null
          set_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string | null
          default_quantity?: number
          description?: string | null
          dish_id?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          item_type?: Database["public"]["Enums"]["upsell_item_type"]
          name: string
          price: number
          price_type?: Database["public"]["Enums"]["upsell_price_type"]
          service_id?: string | null
          set_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string | null
          default_quantity?: number
          description?: string | null
          dish_id?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          item_type?: Database["public"]["Enums"]["upsell_item_type"]
          name?: string
          price?: number
          price_type?: Database["public"]["Enums"]["upsell_price_type"]
          service_id?: string | null
          set_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "upsell_items_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_items_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "upsell_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      upsell_sets: {
        Row: {
          category: Database["public"]["Enums"]["upsell_category"]
          created_at: string | null
          description: string | null
          event_types: string[]
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["upsell_category"]
          created_at?: string | null
          description?: string | null
          event_types?: string[]
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["upsell_category"]
          created_at?: string | null
          description?: string | null
          event_types?: string[]
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      variant_items: {
        Row: {
          allowed_modifications: Json | null
          custom_name: string | null
          custom_price: number | null
          dish_id: string
          id: string
          is_client_editable: boolean | null
          notes: string | null
          quantity: number | null
          selected_variant_option: string | null
          sort_order: number | null
          variant_id: string
        }
        Insert: {
          allowed_modifications?: Json | null
          custom_name?: string | null
          custom_price?: number | null
          dish_id: string
          id?: string
          is_client_editable?: boolean | null
          notes?: string | null
          quantity?: number | null
          selected_variant_option?: string | null
          sort_order?: number | null
          variant_id: string
        }
        Update: {
          allowed_modifications?: Json | null
          custom_name?: string | null
          custom_price?: number | null
          dish_id?: string
          id?: string
          is_client_editable?: boolean | null
          notes?: string | null
          quantity?: number | null
          selected_variant_option?: string | null
          sort_order?: number | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_items_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "offer_variants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_offer_by_email_and_number: {
        Args: { p_email: string; p_offer_number: string }
        Returns: {
          client_name: string
          offer_number: string
          public_token: string
          status: Database["public"]["Enums"]["offer_status"]
        }[]
      }
      generate_short_token: { Args: { length?: number }; Returns: string }
      get_setting: { Args: { p_key: string }; Returns: string }
      get_unread_notification_count: { Args: never; Returns: number }
      insert_notification: {
        Args: {
          p_body: string
          p_event_type: string
          p_link?: string
          p_offer_id: string
          p_title: string
        }
        Returns: string
      }
      mark_all_notifications_read: { Args: never; Returns: undefined }
      mark_notification_read: { Args: { p_id: string }; Returns: undefined }
      reorder_variant_items: { Args: { items: Json }; Returns: undefined }
    }
    Enums: {
      activity_type:
        | "NOTE"
        | "CALL"
        | "EMAIL"
        | "OFFER_SENT"
        | "STATUS_CHANGE"
        | "PROPOSAL_RECEIVED"
        | "PROPOSAL_RESOLVED"
      change_type: "SWAP" | "VARIANT_CHANGE" | "SPLIT" | "QUANTITY_CHANGE"
      client_type:
        | "PRIVATE"
        | "BUSINESS"
        | "INSTITUTION"
        | "AGENCY"
        | "RETURNING"
      correction_status: "new" | "read" | "resolved"
      delivery_type: "COLD" | "HEATED" | "FULL_SERVICE"
      event_type:
        | "KOM"
        | "WES"
        | "FIR"
        | "KON"
        | "PRY"
        | "GAL"
        | "STY"
        | "GRI"
        | "B2B"
        | "BOX"
        | "KAW"
        | "SPE"
      lead_source: "EMAIL" | "FORM" | "PHONE" | "IG" | "TENDER" | "OTHER"
      lead_status:
        | "new"
        | "qualifying"
        | "offer_sent"
        | "follow_up"
        | "negotiation"
        | "won"
        | "lost"
      lost_reason:
        | "PRICE_HIGH"
        | "PRICE_LOW"
        | "TOO_SLOW"
        | "MENU_MISMATCH"
        | "NO_RESPONSE"
        | "COMPETITOR"
        | "CANCELLED"
        | "OUT_OF_RANGE"
        | "NO_CAPACITY"
        | "OTHER"
      offer_status:
        | "draft"
        | "ready"
        | "sent"
        | "viewed"
        | "revision"
        | "accepted"
        | "won"
        | "lost"
      price_display_mode:
        | "DETAILED"
        | "PER_PERSON_AND_TOTAL"
        | "TOTAL_ONLY"
        | "PER_PERSON_ONLY"
        | "HIDDEN"
      price_type: "PER_HOUR" | "PER_EVENT" | "PER_PIECE" | "PER_PERSON"
      pricing_mode: "PER_PERSON" | "FIXED_QUANTITY"
      proposal_item_status: "pending" | "accepted" | "rejected" | "invalidated"
      proposal_status:
        | "draft_client"
        | "pending"
        | "accepted"
        | "partially_accepted"
        | "rejected"
      service_type: "STAFF" | "EQUIPMENT" | "LOGISTICS"
      unit_type: "PERSON" | "PIECE" | "KG" | "SET"
      upsell_category: "FOOD" | "DRINK" | "DESSERT" | "SERVICE" | "EQUIPMENT"
      upsell_item_type: "DISH" | "SERVICE" | "CUSTOM"
      upsell_price_type: "FIXED" | "PER_PERSON"
      upsell_selection_status: "active" | "removed"
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
      activity_type: [
        "NOTE",
        "CALL",
        "EMAIL",
        "OFFER_SENT",
        "STATUS_CHANGE",
        "PROPOSAL_RECEIVED",
        "PROPOSAL_RESOLVED",
      ],
      change_type: ["SWAP", "VARIANT_CHANGE", "SPLIT", "QUANTITY_CHANGE"],
      client_type: [
        "PRIVATE",
        "BUSINESS",
        "INSTITUTION",
        "AGENCY",
        "RETURNING",
      ],
      correction_status: ["new", "read", "resolved"],
      delivery_type: ["COLD", "HEATED", "FULL_SERVICE"],
      event_type: [
        "KOM",
        "WES",
        "FIR",
        "KON",
        "PRY",
        "GAL",
        "STY",
        "GRI",
        "B2B",
        "BOX",
        "KAW",
        "SPE",
      ],
      lead_source: ["EMAIL", "FORM", "PHONE", "IG", "TENDER", "OTHER"],
      lead_status: [
        "new",
        "qualifying",
        "offer_sent",
        "follow_up",
        "negotiation",
        "won",
        "lost",
      ],
      lost_reason: [
        "PRICE_HIGH",
        "PRICE_LOW",
        "TOO_SLOW",
        "MENU_MISMATCH",
        "NO_RESPONSE",
        "COMPETITOR",
        "CANCELLED",
        "OUT_OF_RANGE",
        "NO_CAPACITY",
        "OTHER",
      ],
      offer_status: [
        "draft",
        "ready",
        "sent",
        "viewed",
        "revision",
        "accepted",
        "won",
        "lost",
      ],
      price_display_mode: [
        "DETAILED",
        "PER_PERSON_AND_TOTAL",
        "TOTAL_ONLY",
        "PER_PERSON_ONLY",
        "HIDDEN",
      ],
      price_type: ["PER_HOUR", "PER_EVENT", "PER_PIECE", "PER_PERSON"],
      pricing_mode: ["PER_PERSON", "FIXED_QUANTITY"],
      proposal_item_status: ["pending", "accepted", "rejected", "invalidated"],
      proposal_status: [
        "draft_client",
        "pending",
        "accepted",
        "partially_accepted",
        "rejected",
      ],
      service_type: ["STAFF", "EQUIPMENT", "LOGISTICS"],
      unit_type: ["PERSON", "PIECE", "KG", "SET"],
      upsell_category: ["FOOD", "DRINK", "DESSERT", "SERVICE", "EQUIPMENT"],
      upsell_item_type: ["DISH", "SERVICE", "CUSTOM"],
      upsell_price_type: ["FIXED", "PER_PERSON"],
      upsell_selection_status: ["active", "removed"],
    },
  },
} as const
