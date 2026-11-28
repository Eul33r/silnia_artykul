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

interface SaveTaskPayload {
  task_id?: string | null;
  edition_id: string;
  day_number: number;
  unlock_at: string;
  title: string;
  category: string;
  difficulty: number;
  points: number;
  is_published: boolean;
  content: { prompt: string };
  correct_answer: number;
  tolerance?: number | null;
  hint?: { text: string } | null;
  explanation?: { text: string } | null;
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
        { error: 'Only teachers can access this function' },
        403
      );
    }

    // 5. Parse request body
    const body = await req.json();
    const { action, payload } = body;

    // 6. Handle list action
    if (action === 'list') {
      return await handleListTasks(supabase);
    }

    // 7. Handle save action
    if (action === 'save') {
      return await handleSaveTask(supabase, payload as SaveTaskPayload);
    }

    return jsonResponse(
      { error: 'Unknown action' },
      400
    );

  } catch (error) {
    console.error('manage-tasks-ts error:', error);
    return jsonResponse(
      { error: 'Internal server error', details: String(error) },
      500
    );
  }
});

// Handle list action: get active edition and all tasks
async function handleListTasks(supabase: any) {
  try {
    // 1. Get active edition
    const { data: edition, error: editionError } =
      await supabase
        .from('advent_editions')
        .select('id, year, timezone')
        .eq('is_active', true)
        .order('year', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (editionError) {
      throw editionError;
    }

    if (!edition) {
      return jsonResponse({
        edition: null,
        tasks: [],
      });
    }

    // 2. Get all tasks (not just published, since teacher sees all)
    const { data: tasks, error: tasksError } =
      await supabase
        .from('advent_tasks')
        .select(`
          id,
          day_number,
          title,
          category,
          difficulty,
          points,
          unlock_at,
          is_published,
          content,
          answer_type
        `)
        .eq('edition_id', edition.id)
        .order('day_number', { ascending: true });

    if (tasksError) {
      throw tasksError;
    }

    // 3. For each task, get solution if exists
    const enrichedTasks = await Promise.all(
      (tasks ?? []).map(async (task: any) => {
        const { data: solution } =
          await supabase
            .from('task_solutions')
            .select('correct_answer, tolerance, hint, explanation')
            .eq('task_id', task.id)
            .maybeSingle();

        return {
          ...task,
          solution: solution || null,
        };
      })
    );

    return jsonResponse({
      edition: {
        id: edition.id,
        year: edition.year,
        timezone: edition.timezone,
      },
      tasks: enrichedTasks,
    });

  } catch (error) {
    console.error('handleListTasks error:', error);
    return jsonResponse(
      { error: 'Failed to list tasks', details: String(error) },
      500
    );
  }
}

// Handle save action: create or update task and solution
async function handleSaveTask(supabase: any, payload: SaveTaskPayload) {
  try {
    if (!payload.edition_id || !payload.day_number || !payload.title) {
      return jsonResponse(
        { error: 'Missing required fields' },
        400
      );
    }

    // Generate task_id if creating new task
    const task_id = payload.task_id || crypto.randomUUID();

    // Call admin_save_advent_task SQL function
    const { data: result, error: functionError } =
      await supabase
        .rpc('admin_save_advent_task', {
          p_task_id: task_id,
          p_edition_id: payload.edition_id,
          p_day_number: payload.day_number,
          p_unlock_at: payload.unlock_at,
          p_title: payload.title,
          p_category: payload.category,
          p_difficulty: payload.difficulty,
          p_points: payload.points,
          p_is_published: payload.is_published,
          p_content: payload.content,
          p_correct_answer: payload.correct_answer, // Will be passed as numeric value
          p_tolerance: payload.tolerance || null,
          p_hint: payload.hint || null,
          p_explanation: payload.explanation || null,
        });

    if (functionError) {
      console.error('Function error:', functionError);
      return jsonResponse(
        { error: 'Failed to save task', details: String(functionError) },
        400
      );
    }

    return jsonResponse({
      success: true,
      task_id: task_id,
    });

  } catch (error) {
    console.error('handleSaveTask error:', error);
    return jsonResponse(
      { error: 'Failed to save task', details: String(error) },
      500
    );
  }
}
