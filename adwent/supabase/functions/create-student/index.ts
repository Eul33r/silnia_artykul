// deno-lint-ignore-file
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

interface CreateStudentPayload {
  email: string;
  password: string;
  display_name: string;
  class_name?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    // 1. Get service key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
    const serviceKey = secretKeys
      ? JSON.parse(secretKeys).default
      : Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // 2. Create service client (bypasses RLS)
    const supabase = createClient(
      supabaseUrl,
      serviceKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

    // 3. Verify user token
    const authHeader = req.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse(
        { error: 'Unauthorized' },
        401
      );
    }

    const token = authHeader.substring(7);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return jsonResponse(
        { error: 'Invalid session' },
        401
      );
    }

    // 4. Get user profile and verify teacher role
    const { data: profile, error: profileError } =
      await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
      return jsonResponse(
        { error: 'Profile not found' },
        404
      );
    }

    if (profile.role !== 'teacher') {
      return jsonResponse(
        { error: 'Only teachers can create student accounts' },
        403
      );
    }

    // 5. Parse and validate payload
    const body = await req.json();
    const payload = body as CreateStudentPayload;

    if (!payload.email || !payload.password || !payload.display_name) {
      return jsonResponse(
        { error: 'Missing required fields: email, password, display_name' },
        400
      );
    }

    // 6. Create user via admin API
    const { data: authData, error: createError } =
      await supabase.auth.admin.createUser({
        email: payload.email,
        password: payload.password,
        email_confirm: true,
        user_metadata: {
          display_name: payload.display_name,
          class_name: payload.class_name || '',
          role: 'student',
        },
      });

    if (createError) {
      console.error('User creation error:', createError);
      return jsonResponse(
        { error: 'Failed to create user', details: String(createError) },
        400
      );
    }

    if (!authData?.user) {
      return jsonResponse(
        { error: 'User creation failed' },
        500
      );
    }

    return jsonResponse({
      success: true,
      user_id: authData.user.id,
      email: authData.user.email,
    });

  } catch (error) {
    console.error('create-student error:', error);
    return jsonResponse(
      { error: 'Internal server error', details: String(error) },
      500
    );
  }
});
