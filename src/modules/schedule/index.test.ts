import { schedule } from ".";
import { getSupabaseClient } from "../subabase/client";

// Test requires .dev.vars file with SUPABASE_URL and SUPABASE_API_KEY
(async () => {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_API_KEY: process.env.SUPABASE_API_KEY || ''
  };
  
  const supabase = getSupabaseClient(env);
  const result = await schedule(supabase);
  
  console.log('Schedule fetched and saved successfully!');
  console.log(`Total schedules processed: ${result.length}`);
  if (result.length > 0) {
    console.log('Sample schedule:', result[0]);
  }
})();
