
import { supabase } from './supabase.js';

// Pobranie użytkownika i jego profilu
export async function getCurrentUser() {
    const { data: { user }, error } =
        await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }

    const { data: profile, error: profileError } =
        await supabase
            .from('profiles')
            .select('id, display_name, class_name, role')
            .eq('id', user.id)
            .single();

    if (profileError || !profile) {
        console.error('Nie udało się pobrać profilu:', profileError);
        return null;
    }

    return { user, profile };
}

// Ochrona strony wymagającej zalogowania
export async function requireAuth() {
    const account = await getCurrentUser();

    if (!account) {
        window.location.replace('./login.html');
        return null;
    }

    return account;
}

// Ochrona strony nauczyciela
export async function requireTeacher() {
    const account = await requireAuth();

    if (!account) return null;

    if (account.profile.role !== 'teacher') {
        window.location.replace('./dashboard.html');
        return null;
    }

    return account;
}

// Wylogowanie
export async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error('Błąd wylogowania:', error);
        return;
    }

    window.location.replace('./login.html');
}
