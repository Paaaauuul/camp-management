export interface Database {
  public: {
    Tables: {
      sites: {
        Row: {
          id: number;
          name: string;
          capacity_amps: string;
          max_length: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['sites']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['sites']['Insert']>;
      };
      bookings: {
        Row: {
          id: number;
          site_id: number;
          guest_name: string;
          check_in: string;
          check_out: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
      };
      customers: {
        Row: {
          id: number;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
      };
    };
  };
}