import { createClient } from "@supabase/supabase-js";
import { Database } from "./types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials");
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
    },
    db: {
        schema: "public",
    },
    global: {
        headers: {
            "Content-Type": "application/json",
            "x-client-info": "supabase-js",
        },
    },
});
