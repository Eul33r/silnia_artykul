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

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    try {
        // 1. Pobieramy klucz serwerowy.
        // Obsługujemy nowe i starsze nazewnictwo Supabase.

        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS');

        const serviceKey = secretKeys
            ? JSON.parse(secretKeys).default
            : Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceKey) {
            throw new Error('Missing Supabase environment variables');
        }

        // 2. Tworzymy klienta backendowego.
        // Ten klient omija RLS, dlatego sami filtrujemy dane użytkownika.

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

        // 3. Weryfikujemy token użytkownika.

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

        // 4. Pobieramy profil użytkownika.

        const { data: profile, error: profileError } =
            await supabase
                .from('profiles')
                .select('display_name, role, class_name')
                .eq('id', user.id)
                .single();

        if (profileError || !profile) {
            return jsonResponse(
                { error: 'Profile not found' },
                404
            );
        }

        // 5. Pobieramy aktywną edycję adwentu.

        const { data: edition, error: editionError } =
            await supabase
                .from('advent_editions')
                .select('id, year, timezone, starts_at, ends_at')
                .eq('is_active', true)
                .order('year', { ascending: false })
                .limit(1)
                .maybeSingle();

        if (editionError) {
            throw editionError;
        }

        if (!edition) {
            return jsonResponse({
                user: {
                    display_name: profile.display_name,
                    role: profile.role,
                    class_name: profile.class_name,
                },
                edition: null,
                days: [],
                server_time: new Date().toISOString(),
            });
        }

        // 6. Pobieramy opublikowane zadania tej edycji.

        const { data: tasks, error: tasksError } =
            await supabase
                .from('advent_tasks')
                .select(`
                    id,
                    day_number,
                    unlock_at,
                    title,
                    category,
                    difficulty,
                    points
                `)
                .eq('edition_id', edition.id)
                .eq('is_published', true)
                .order('day_number');

        if (tasksError) {
            throw tasksError;
        }

        const now = new Date();

        // 7. Pobieramy postępy tylko zalogowanego użytkownika.

        const taskIds = (tasks ?? []).map((task: { id: any; }) => task.id);

        let progressRows: any[] = [];

        if (taskIds.length > 0) {
            const { data: progress, error: progressError } =
                await supabase
                    .from('task_progress')
                    .select(`
                        task_id,
                        attempts_count,
                        is_completed,
                        best_points,
                        completed_at
                    `)
                    .eq('user_id', user.id)
                    .in('task_id', taskIds);

            if (progressError) {
                throw progressError;
            }

            progressRows = progress ?? [];
        }

        const progressMap = new Map(
            progressRows.map(row => [row.task_id, row])
        );

        const taskMap = new Map<number, any>(
            (tasks ?? []).map((task: any) => [task.day_number, task] as [number, any])
        );

        // 8. Budujemy kalendarz 24 dni.
        // Nie ujawniamy danych przyszłych zadań.

        const days = Array.from({ length: 24 }, (_, index) => {
            const dayNumber = index + 1;
            const task = taskMap.get(dayNumber);

            if (!task) {
                return {
                    day_number: dayNumber,
                    is_open: false,
                    title: null,
                    category: null,
                    difficulty: null,
                    points: null,
                    progress: null,
                };
            }

            const isOpen = now >= new Date(task.unlock_at);

            if (!isOpen) {
                return {
                    day_number: dayNumber,
                    is_open: false,
                    title: null,
                    category: null,
                    difficulty: null,
                    points: null,
                    progress: null,
                };
            }

            const progress = progressMap.get(task.id);

            return {
                day_number: dayNumber,
                is_open: true,
                title: task.title,
                category: task.category,
                difficulty: task.difficulty,
                points: task.points,

                progress: {
                    attempts_count: progress?.attempts_count ?? 0,
                    is_completed: progress?.is_completed ?? false,
                    best_points: progress?.best_points ?? 0,
                    completed_at: progress?.completed_at ?? null,
                },
            };
        });

        // 9. Zwracamy wynik.

        return jsonResponse({
            user: {
                display_name: profile.display_name,
                role: profile.role,
                class_name: profile.class_name,
            },

            edition: {
                year: edition.year,
                timezone: edition.timezone,
            },

            server_time: now.toISOString(),
            days,
        });

    } catch (error) {
        console.error('get-calendar error:', error);

        return jsonResponse(
            { error: 'Internal server error' },
            500
        );
    }
});
