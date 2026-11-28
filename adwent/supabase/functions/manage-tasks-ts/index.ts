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

    if (action === 'dashboard') {
      return await handleDashboard(supabase);
    }

    if (action === 'students') {
      return await handleStudents(supabase);
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

    // 2. Zadania wraz z rozwiązaniami (private.task_solutions) przez funkcję SQL
    const { data: tasks, error: tasksError } =
      await supabase.rpc('admin_list_advent_tasks', {
        p_edition_id: edition.id,
      });

    if (tasksError) {
      throw tasksError;
    }

    return jsonResponse({
      edition: {
        id: edition.id,
        year: edition.year,
        timezone: edition.timezone,
      },
      tasks: tasks ?? [],
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
    if (!payload?.edition_id || !payload.day_number || !payload.title?.trim()) {
      return jsonResponse({ error: 'Missing required fields' }, 400);
    }

    if (
      !Number.isInteger(payload.day_number) ||
      payload.day_number < 1 || payload.day_number > 24
    ) {
      return jsonResponse({ error: 'day_number must be 1-24' }, 400);
    }

    if (!payload.unlock_at || isNaN(Date.parse(payload.unlock_at))) {
      return jsonResponse({ error: 'Invalid unlock_at' }, 400);
    }

    if (typeof payload.correct_answer !== 'number' || !isFinite(payload.correct_answer)) {
      return jsonResponse({ error: 'correct_answer must be a number' }, 400);
    }

    if (payload.tolerance != null && (typeof payload.tolerance !== 'number' || payload.tolerance < 0)) {
      return jsonResponse({ error: 'tolerance must be a non-negative number' }, 400);
    }

    // Dla nowego zadania p_task_id musi być NULL (SQL robi wtedy INSERT)
    const task_id = payload.task_id || null;

    const { data: savedId, error: functionError } =
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
          p_correct_answer: payload.correct_answer,
          p_tolerance: payload.tolerance ?? null,
          p_hint: payload.hint ?? null,
          p_explanation: payload.explanation ?? null,
        });

    if (functionError) {
      console.error('Function error:', functionError);
      return jsonResponse(
        { error: functionError.message || 'Failed to save task' },
        400
      );
    }

    return jsonResponse({
      success: true,
      task_id: savedId,
    });

  } catch (error) {
    console.error('handleSaveTask error:', error);
    return jsonResponse(
      { error: 'Failed to save task', details: String(error) },
      500
    );
  }
}

// Statystyki pulpitu (task_attempts nie jest dostępne dla nauczyciela przez REST/RLS)
async function handleDashboard(supabase: any) {
  try {
    const since = new Date(Date.now() - 7 * 86400000).toISOString();

    const { data: recent, error: recentError } = await supabase
      .from('task_attempts')
      .select('user_id')
      .gte('attempted_at', since);
    if (recentError) throw recentError;

    const { data: last, error: lastError } = await supabase
      .from('task_attempts')
      .select('id, attempted_at, is_correct, user_id, task_id')
      .order('attempted_at', { ascending: false })
      .limit(10);
    if (lastError) throw lastError;

    const userIds = [...new Set((last ?? []).map((a: any) => a.user_id))];
    const taskIds = [...new Set((last ?? []).map((a: any) => a.task_id))];

    const { data: users } = userIds.length
      ? await supabase.from('profiles').select('id, display_name').in('id', userIds)
      : { data: [] };
    const { data: tasks } = taskIds.length
      ? await supabase.from('advent_tasks').select('id, title').in('id', taskIds)
      : { data: [] };

    const userMap = new Map((users ?? []).map((u: any) => [u.id, u.display_name]));
    const taskMap = new Map((tasks ?? []).map((t: any) => [t.id, t.title]));

    return jsonResponse({
      active_students: new Set((recent ?? []).map((a: any) => a.user_id)).size,
      last_attempt_at: last?.[0]?.attempted_at ?? null,
      recent_attempts: (last ?? []).map((a: any) => ({
        id: a.id,
        attempted_at: a.attempted_at,
        is_correct: a.is_correct,
        student_name: userMap.get(a.user_id) ?? '?',
        task_title: taskMap.get(a.task_id) ?? '?',
      })),
    });
  } catch (error) {
    console.error('handleDashboard error:', error);
    return jsonResponse({ error: 'Failed to load dashboard', details: String(error) }, 500);
  }
}

// Lista uczniów z postępem i ostatnią aktywnością
async function handleStudents(supabase: any) {
  try {
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, display_name, class_name, created_at')
      .eq('role', 'student')
      .order('display_name', { ascending: true });
    if (studentsError) throw studentsError;

    const { data: progress, error: progressError } = await supabase
      .from('task_progress')
      .select('user_id')
      .eq('is_completed', true);
    if (progressError) throw progressError;

    const { data: attempts, error: attemptsError } = await supabase
      .from('task_attempts')
      .select('user_id, attempted_at')
      .order('attempted_at', { ascending: false })
      .limit(5000);
    if (attemptsError) throw attemptsError;

    const completed = new Map<string, number>();
    for (const p of progress ?? []) {
      completed.set(p.user_id, (completed.get(p.user_id) ?? 0) + 1);
    }

    const lastActivity = new Map<string, string>();
    for (const a of attempts ?? []) {
      if (!lastActivity.has(a.user_id)) lastActivity.set(a.user_id, a.attempted_at);
    }

    return jsonResponse({
      students: (students ?? []).map((s: any) => ({
        ...s,
        completed_count: completed.get(s.id) ?? 0,
        last_activity: lastActivity.get(s.id) ?? null,
      })),
    });
  } catch (error) {
    console.error('handleStudents error:', error);
    return jsonResponse({ error: 'Failed to load students', details: String(error) }, 500);
  }
}
