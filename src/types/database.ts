export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          is_admin: boolean;
          admin_permissions: Json;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          is_admin?: boolean;
          admin_permissions?: Json;
        };
        Update: {
          display_name?: string | null;
          is_admin?: boolean;
          admin_permissions?: Json;
        };
        Relationships: [];
      };
      custom_systems: {
        Row: {
          id: string;
          name: string;
          position_x: number;
          position_y: number;
          position_z: number;
          custom_color: string | null;
          marker_size: number | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          position_x: number;
          position_y?: number;
          position_z: number;
          custom_color?: string | null;
          marker_size?: number | null;
          created_by: string;
        };
        Update: {
          name?: string;
          position_x?: number;
          position_y?: number;
          position_z?: number;
          custom_color?: string | null;
          marker_size?: number | null;
        };
        Relationships: [];
      };
      custom_planets: {
        Row: {
          id: string;
          system_id: string;
          name: string;
          type: string;
          radius: number;
          faction: string;
          description: string | null;
          population: string | null;
          climate: string | null;
          terrain: string | null;
          notable: string[] | null;
          faction_control: Json | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          system_id: string;
          name: string;
          type?: string;
          radius?: number;
          faction?: string;
          description?: string | null;
          population?: string | null;
          climate?: string | null;
          terrain?: string | null;
          notable?: string[] | null;
          faction_control?: Json | null;
          created_by: string;
        };
        Update: {
          name?: string;
          type?: string;
          radius?: number;
          faction?: string;
          description?: string | null;
          population?: string | null;
          climate?: string | null;
          terrain?: string | null;
          notable?: string[] | null;
          faction_control?: Json | null;
        };
        Relationships: [];
      };
      custom_fleets: {
        Row: {
          id: string;
          name: string;
          faction: string;
          position_x: number;
          position_y: number;
          position_z: number;
          ship_count: number;
          flagship: string | null;
          commander: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          faction?: string;
          position_x: number;
          position_y?: number;
          position_z: number;
          ship_count?: number;
          flagship?: string | null;
          commander?: string | null;
          created_by: string;
        };
        Update: {
          name?: string;
          faction?: string;
          position_x?: number;
          position_y?: number;
          position_z?: number;
          ship_count?: number;
          flagship?: string | null;
          commander?: string | null;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string;
          content: string;
          cover_image_url: string | null;
          tags: string[];
          status: 'draft' | 'published';
          reading_time_minutes: number;
          published_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          excerpt?: string;
          content: string;
          cover_image_url?: string | null;
          tags?: string[];
          status?: 'draft' | 'published';
          reading_time_minutes?: number;
          published_at?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          title?: string;
          excerpt?: string;
          content?: string;
          cover_image_url?: string | null;
          tags?: string[];
          status?: 'draft' | 'published';
          reading_time_minutes?: number;
          published_at?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      planet_stats_overrides: {
        Row: {
          planet_id: string;
          system_id: string;
          population: string | null;
          faction_control: Json | null;
          description: string | null;
          climate: string | null;
          terrain: string | null;
          notable: string[] | null;
          updated_by: string;
          updated_at: string;
        };
        Insert: {
          planet_id: string;
          system_id: string;
          population?: string | null;
          faction_control?: Json | null;
          description?: string | null;
          climate?: string | null;
          terrain?: string | null;
          notable?: string[] | null;
          updated_by: string;
        };
        Update: {
          population?: string | null;
          faction_control?: Json | null;
          description?: string | null;
          climate?: string | null;
          terrain?: string | null;
          notable?: string[] | null;
          updated_by?: string;
        };
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: number;
          event_type: string;
          entity_type: string | null;
          entity_id: string | null;
          message: string;
          metadata: Json | null;
          actor_id: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          event_type: string;
          entity_type?: string | null;
          entity_id?: string | null;
          message: string;
          metadata?: Json | null;
          actor_id: string;
          created_at?: string;
        };
        Update: {
          event_type?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          message?: string;
          metadata?: Json | null;
          actor_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      action_history: {
        Row: {
          id: number;
          action_type: string;
          do_payload: Json;
          undo_payload: Json;
          actor_id: string;
          undone_at: string | null;
          undone_by: string | null;
          discarded: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          action_type: string;
          do_payload: Json;
          undo_payload: Json;
          actor_id: string;
          undone_at?: string | null;
          undone_by?: string | null;
          discarded?: boolean;
          created_at?: string;
        };
        Update: {
          action_type?: string;
          do_payload?: Json;
          undo_payload?: Json;
          actor_id?: string;
          undone_at?: string | null;
          undone_by?: string | null;
          discarded?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
