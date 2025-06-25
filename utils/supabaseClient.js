    import { createClient } from '@supabase/supabase-js'

    const supabaseUrl = 'https://alotzazgiupmuamvrvme.supabase.co' // Replace with your actual Supabase URL
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsb3R6YXpnaXVwbXVhbXZydm1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MjU5ODcsImV4cCI6MjA2NjIwMTk4N30.aB1psavGgFczX9OEMlyapR55jl0ADn5dcSSHimPK83g'
    export const supabase = createClient(supabaseUrl, supabaseAnonKey)
    export { supabaseAnonKey }; // NEW: Export the anonKey for use in frontend fetch calls