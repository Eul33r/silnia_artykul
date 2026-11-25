
import { createClient } from
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://erengpssouoxuwkexdfo.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_yF7BPmrr3fx4HR9jjD6yLw_vvTWxpuD';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
