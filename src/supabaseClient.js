import { createClient } from '@supabase/supabase-js'

// 1. Your Project URL
const supabaseUrl = 'https://ilrwioxxrdzbmtpbxxjg.supabase.co'

// 2. Your REAL Anon Key (The one you just gave me)
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlscndpb3h4cmR6Ym10cGJ4eGpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTk4ODUsImV4cCI6MjA4NTg3NTg4NX0.sHhGEfUGQC2eV_qbNGI2JRj3gJggM4OOpM-YdJbgBL8'

export const supabase = createClient(supabaseUrl, supabaseKey)
