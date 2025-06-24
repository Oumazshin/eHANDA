    import { createClient } from '@supabase/supabase-js'

    const supabaseUrl = 'https://ejzoaoihgrzccpiwtwsb.supabase.co' // Replace with your actual Supabase URL
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqem9hb2loZ3J6Y2NwaXd0d3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MjYwNDEsImV4cCI6MjA2NjIwMjA0MX0.TjK5ceVxB-sMOWHQuWIqWnsNBZcJtM6pPxWADrR6BZI' // Replace with your actual Supabase Anon Key

    export const supabase = createClient(supabaseUrl, supabaseAnonKey)
    export { supabaseAnonKey }; // NEW: Export the anonKey for use in frontend fetch calls