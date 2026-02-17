import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";

export interface Set { id: string; weight: number; reps: number; }
export interface Exercise { id: string; name: string; sets: Set[]; }
export interface Workout { id: string; name: string; date: string; time?: string; duration: string; exercises: Exercise[]; }
export interface Measurement { id: string; date: string; weight: number; height?: number; waist?: number; neck?: number; chest?: number; arms?: number; photo_url?: string; created_at?: string; }
export interface UserProfile { displayName: string; photoURL: string; gender: 'male' | 'female'; height: string; waist: string; neck: string; chest: string; arms: string; age?: string; activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'; subscription_tier?: string; email?: string; last_sign_in_at?: string; id?: string; weekly_workout_goal?: number; starting_weight?: number; mindset_reminder_enabled?: boolean; mindset_reminder_time?: string; }
export interface MindsetLog { id: string; date: string; grateful_for: string; improvements: string; created_at?: string; }
export interface ToDo { id: string; title: string; description?: string | null; due_date?: string | null; due_time?: string | null; completed: boolean; recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'; notify: boolean; notify_before?: '10_min' | '1_hour' | '1_day' | null; urgency?: 'low' | 'normal' | 'high' | 'critical'; created_at?: string; shared_with?: string[]; }
export interface ToDoCompletion { id: string; todo_id: string; user_id: string; completed_date: string; created_at?: string; }
export interface ToDoException { id: string; todo_id: string; user_id: string; exception_date: string; created_at?: string; }
export interface Goal { id: string; user_id: string; title: string; category: "Money" | "Travel" | "Relationships" | "Fitness" | "Career" | "Other"; target_date?: string; status: "pending" | "completed" | "abandoned"; progress: number; image_url?: string; color?: string; description?: string; created_at?: string; shared_with?: string[]; }
export interface Collaboration { id: string; requester_id: string; receiver_id: string; status: 'pending' | 'accepted'; profile?: UserProfile; }

interface DataContextType {
    workouts: Workout[];
    measurements: Measurement[];
    mindsetLogs: MindsetLog[];
    todos: ToDo[];
    goals: Goal[];
    addGoal: (goal: Omit<Goal, "id" | "user_id" | "created_at">) => Promise<Goal | null>;
    updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
    deleteGoal: (id: string) => Promise<void>;
    shareGoal: (goalId: string, userId: string) => Promise<void>;
    removeGoalCollaborator: (goalId: string, userId: string) => Promise<void>;
    todoCompletions: ToDoCompletion[];
    todoExceptions: ToDoException[];
    userProfile: UserProfile;
    collaborations: Collaboration[];
    addWorkout: (workout: Omit<Workout, 'id'>) => Promise<void>;
    deleteWorkout: (id: string) => Promise<void>;
    addMeasurement: (measurement: Omit<Measurement, 'id'>) => Promise<void>;
    updateMeasurement: (id: string, updates: Partial<Measurement>) => Promise<void>;
    deleteMeasurement: (id: string) => Promise<void>;
    addMindsetLog: (log: Omit<MindsetLog, 'id'>) => Promise<void>;
    addToDo: (todo: Omit<ToDo, 'id'>) => Promise<ToDo | null>;
    updateToDo: (id: string, updates: Partial<ToDo>) => Promise<void>;
    deleteToDo: (id: string) => Promise<void>;
    toggleRecurringCompletion: (todoId: string, date: string, isCompleted: boolean) => Promise<void>;
    excludeRecurringTask: (todoId: string, date: string) => Promise<void>;
    shareToDo: (todoId: string, userId: string) => Promise<void>;
    updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
    fetchAllUsers: () => Promise<UserProfile[]>;
    appLogo: string;
    updateAppLogo: (url: string) => Promise<void>;
    socialUrl: string;
    updateSocialUrl: (url: string) => Promise<void>;
    appFavicon: string;
    updateAppFavicon: (url: string) => Promise<void>;
    sendFriendRequest: (email: string) => Promise<void>;
    acceptFriendRequest: (id: string) => Promise<void>;
    resendFriendRequest: (id: string) => Promise<void>;
    removeFriend: (id: string) => Promise<void>;
    refreshCollaborations: () => Promise<void>;
    isLoading: boolean;
    isTimerRunning: boolean;
    timerStartTime: Date | null;
    elapsedSeconds: number;
    startTimer: () => void;
    stopTimer: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within a DataProvider');
    return context;
};

const initialUserProfile: UserProfile = {
    displayName: '', photoURL: '', gender: 'male', height: '', waist: '', neck: '', chest: '', arms: '', weekly_workout_goal: 4
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [measurements, setMeasurements] = useState<Measurement[]>([]);
    const [mindsetLogs, setMindsetLogs] = useState<MindsetLog[]>([]);
    const [todos, setTodos] = useState<ToDo[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [todoCompletions, setTodoCompletions] = useState<ToDoCompletion[]>([]);
    const [todoExceptions, setTodoExceptions] = useState<ToDoException[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile>(initialUserProfile);
    const [appLogo, setAppLogo] = useState<string>(() => localStorage.getItem('app_logo_url') || '');
    const [appFavicon, setAppFavicon] = useState<string>(() => localStorage.getItem('app_favicon_url') || '');
    const [socialUrl, setSocialUrl] = useState<string>(() => localStorage.getItem('social_url') || '');
    const [isLoading, setIsLoading] = useState(true);
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
    const [isTimerRunning, setIsTimerRunning] = useState(() => localStorage.getItem('workout_timer_running') === 'true');
    const [timerStartTime, setTimerStartTime] = useState<Date | null>(() => {
        const stored = localStorage.getItem('workout_timer_start');
        return stored ? new Date(stored) : null;
    });
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning) {
            if (timerStartTime) {
                const now = new Date();
                const diff = Math.floor((now.getTime() - timerStartTime.getTime()) / 1000);
                setElapsedSeconds(diff > 0 ? diff : 0);
            }
            interval = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
        } else {
             setElapsedSeconds(0);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timerStartTime]);

    const startTimer = () => {
        const now = new Date();
        setIsTimerRunning(true);
        setTimerStartTime(now);
        setElapsedSeconds(0);
        localStorage.setItem('workout_timer_running', 'true');
        localStorage.setItem('workout_timer_start', now.toISOString());
    };

    const stopTimer = () => {
        setIsTimerRunning(false);
        setTimerStartTime(null);
        setElapsedSeconds(0);
        localStorage.removeItem('workout_timer_running');
        localStorage.removeItem('workout_timer_start');
    };

    const fetchCollaborations = async () => {
        if (!user) return;
        const { data, error } = await supabase.from('collaborations').select('*, requester:profiles!requester_id(*), receiver:profiles!receiver_id(*)').or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);
        if (error) { console.error("Error fetching collaborations:", error); return; }
        const processed = data.map((c: any) => {
            const isRequester = c.requester_id === user.id;
            const otherProfile = isRequester ? c.receiver : c.requester;
            return {
                ...c,
                profile: {
                    id: otherProfile?.id, displayName: otherProfile?.full_name, photoURL: otherProfile?.avatar_url, weekly_workout_goal: otherProfile?.weekly_workout_goal,
                }
            };
        });
        setCollaborations(processed);
    };

    useEffect(() => {
        const fetchPublicSettings = async () => {
            const { data: sData } = await supabase.from('app_settings').select('value').eq('key', 'app_logo').single();
            if (sData) { setAppLogo(sData.value); localStorage.setItem('app_logo_url', sData.value); }
            const { data: socialData } = await supabase.from('app_settings').select('value').eq('key', 'social_url').single();
            if (socialData) { setSocialUrl(socialData.value); localStorage.setItem('social_url', socialData.value); }
            const { data: faviconData } = await supabase.from('app_settings').select('value').eq('key', 'app_favicon').single();
            if (faviconData) { setAppFavicon(faviconData.value); localStorage.setItem('app_favicon_url', faviconData.value); }
        };
        fetchPublicSettings();

        if (!user) {
            setWorkouts([]); setMeasurements([]); setMindsetLogs([]); setTodos([]); setGoals([]); setTodoCompletions([]); setUserProfile(initialUserProfile); setCollaborations([]); setIsLoading(false); return;
        }

        const fetchUserData = async () => {
            setIsLoading(true);
            try {
                const [{ data: wData }, { data: mData }, { data: mlData }, { data: tData }, { data: tcData }, { data: pData }] = await Promise.all([
                    supabase.from('workouts').select('*').order('created_at', { ascending: false }),
                    supabase.from('measurements').select('*').order('date', { ascending: true }),
                    supabase.from('mindset_logs').select('*').order('date', { ascending: false }),
                    supabase.from('todos').select('*, todo_collaborators(user_id)').order('created_at', { ascending: false }),
                    supabase.from('todo_completions').select('*'),
                    supabase.from('profiles').select('*').eq('id', user.id).single()
                ]);
                
                if (wData) setWorkouts(wData as any);
                if (mData) setMeasurements(mData);
                if (mlData) setMindsetLogs(mlData);
                if (tData) setTodos(tData.map((t: any) => ({ ...t, shared_with: t.todo_collaborators?.map((tc: any) => tc.user_id) || [] })));
                if (tcData) setTodoCompletions(tcData);
                if (pData) setUserProfile({ ...initialUserProfile, id: pData.id, displayName: pData.full_name || '', photoURL: pData.avatar_url || '', gender: pData.gender || 'male', height: pData.height || '', waist: pData.waist || '', neck: pData.neck || '', chest: pData.chest || '', arms: pData.arms || '', subscription_tier: pData.subscription_tier, weekly_workout_goal: pData.weekly_workout_goal || 4, age: pData.age, starting_weight: pData.starting_weight, activity_level: pData.activity_level, mindset_reminder_enabled: pData.mindset_reminder_enabled, mindset_reminder_time: pData.mindset_reminder_time } as UserProfile);
                
                await fetchCollaborations();
                
                // Attempt to fetch with collaborators
                try {
                const { data: joinedData, error: joinedError } = await supabase.from("goals").select("*, goal_collaborators(user_id)").order("created_at", { ascending: false });
                
                if (joinedError) { throw joinedError; }
                if (joinedData) {
                    setGoals(joinedData.map((g: any) => ({ ...g, shared_with: g.goal_collaborators?.map((gc: any) => gc.user_id) || [] })));
                }
                } catch (fallbackErr) {
                    console.warn("Falling back to simple goal fetch:", fallbackErr);
                    const { data: simpleData } = await supabase.from("goals").select("*").order("created_at", { ascending: false });
                    if (simpleData) setGoals(simpleData as any);
                }
            } catch (error) {
                console.error("Error fetching user data:", error); toast.error("Failed to load data.");
            } finally { setIsLoading(false); }
        };
        fetchUserData();
    }, [user]);

    const addWorkout = async (workout: Omit<Workout, 'id'>) => {
        if (!user) { toast.error("No user logged in!"); return; }
        const { data, error } = await supabase.from('workouts').insert([{ user_id: user.id, ...workout }]).select();
        if (error) { console.error("Error adding workout:", error); toast.error(`Failed to save workout: ${error.message}`); return; }
        if (data) { setWorkouts(prev => [data[0] as any, ...prev]); toast.success("Workout saved successfully!"); }
    };
    const deleteWorkout = async (id: string) => {
        if (!user) return;
        const { error } = await supabase.from('workouts').delete().eq('id', id);
        if (error) { console.error("Error deleting workout:", error); toast.error(`Failed to delete workout: ${error.message}`); return; }
        setWorkouts(prev => prev.filter(w => w.id !== id)); toast.success("Workout deleted!");
    };
    const addMeasurement = async (m: Omit<Measurement, 'id'>) => {
        if (!user) return;
        const { data, error } = await supabase.from('measurements').insert([{ user_id: user.id, ...m }]).select();
        if (error) { console.error("Error adding measurement:", error); toast.error(`Failed: ${error.message}`); return; }
        if (data) { setMeasurements(prev => [...prev, data[0]]); toast.success("Measurement saved!"); }
    };
    const updateMeasurement = async (id: string, updates: Partial<Measurement>) => {
         if (!user) return;
         const { error } = await supabase.from('measurements').update(updates).eq('id', id);
         if (error) { toast.error("Failed to update: " + error.message); return; }
         setMeasurements(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m)); toast.success("Measurement updated!");
    };
    const deleteMeasurement = async (id: string) => {
        if (!user) return;
        const { error } = await supabase.from('measurements').delete().eq('id', id);
        if (error) { toast.error(`Failed: ${error.message}`); return; }
        setMeasurements(prev => prev.filter(m => m.id !== id)); toast.success("Measurement deleted!");
    };
    const addMindsetLog = async (log: Omit<MindsetLog, 'id'>) => {
        if (!user) return;
        const { data, error } = await supabase.from('mindset_logs').insert([{ user_id: user.id, ...log }]).select();
        if (error) { toast.error(`Failed: ${error.message}`); return; }
        if (data) { setMindsetLogs(prev => [data[0], ...prev]); toast.success("Log saved!"); }
    };
            const addToDo = async (todo: Omit<ToDo, 'id'>): Promise<ToDo | null> => {
        if (!user) return null;
        const { data, error } = await supabase.from('todos').insert([{ user_id: user.id, ...todo }]).select();
        if (error) { toast.error(`Failed: ${error.message}`); return null; }
        if (data) { setTodos(prev => [data[0] as any, ...prev]); toast.success('Task saved!'); return data[0] as ToDo; } return null;
    };
    const updateToDo = async (id: string, updates: Partial<ToDo>) => {
        if (!user) return;
        const { error } = await supabase.from('todos').update(updates).eq('id', id);
        if (error) { toast.error(`Failed: ${error.message}`); return; }
        setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };
    const deleteToDo = async (id: string) => {
        if (!user) return;
        const { error } = await supabase.from('todos').delete().eq('id', id);
        if (error) { toast.error(`Failed: ${error.message}`); return; }
        setTodos(prev => prev.filter(t => t.id !== id)); toast.success("Task deleted!");
    };
    const toggleRecurringCompletion = async (todoId: string, date: string, isCompleted: boolean) => {
        if (!user) return;
        const optimisticCompletion: ToDoCompletion = { id: 'opt_' + Date.now(), todo_id: todoId, user_id: user.id, completed_date: date, created_at: new Date().toISOString() };
        if (isCompleted) {
            setTodoCompletions(prev => [...prev, optimisticCompletion]);
            const { data, error } = await supabase.from('todo_completions').insert({ todo_id: todoId, user_id: user.id, completed_date: date }).select();
            if (error) { toast.error("Failed."); setTodoCompletions(prev => prev.filter(tc => tc.id !== optimisticCompletion.id)); return; }
            if (data) setTodoCompletions(prev => prev.map(tc => tc.id === optimisticCompletion.id ? data[0] : tc));
        } else {
            setTodoCompletions(prev => prev.filter(tc => !(tc.todo_id === todoId && tc.completed_date === date)));
            const { error } = await supabase.from('todo_completions').delete().eq('todo_id', todoId).eq('completed_date', date);
            if (error) { toast.error("Failed."); const { data } = await supabase.from('todo_completions').select('*'); if (data) setTodoCompletions(data); }
        }
    };
    const excludeRecurringTask = async (todoId: string, date: string) => {
        if (!user) return;
        const optimisticException: ToDoException = { id: 'opt_ex_' + Date.now(), todo_id: todoId, user_id: user.id, exception_date: date, created_at: new Date().toISOString() };
        setTodoExceptions(prev => [...prev, optimisticException]);
        const { data, error } = await supabase.from('todo_exceptions').insert({ todo_id: todoId, user_id: user.id, exception_date: date }).select();
        if (error) { toast.error("Failed."); setTodoExceptions(prev => prev.filter(ex => ex.id !== optimisticException.id)); return; }
        if (data) setTodoExceptions(prev => prev.map(ex => ex.id === optimisticException.id ? data[0] : ex));
    };
    const shareToDo = async (todoId: string, userId: string) => {
        if (!user) return;
        const { error } = await supabase.from('todo_collaborators').insert({ todo_id: todoId, user_id: userId, permission: 'edit' });
        if (error) { if (error.code === '23505') toast.error("Already shared."); else toast.error("Failed: " + error.message); }
        else {
            const todo = todos.find(t => t.id === todoId);
            await supabase.from('notifications').insert({ user_id: userId, type: 'share_todo', title: 'New Shared Task', message: `${user?.user_metadata?.full_name || 'A teammate'} shared a task: "${todo?.title}"`, read: false, data: { todo_id: todoId } });
            toast.success("Task shared!");
            setTodos(prev => prev.map(t => t.id === todoId ? { ...t, shared_with: [...(t.shared_with || []), userId] } : t));
        }
    };
    const shareGoal = async (goalId: string, userId: string) => {
        if (!user) return;
        const { error } = await supabase.from("goal_collaborators").insert({ goal_id: goalId, user_id: userId, permission: "edit" });
        if (error) { if (error.code === "23505") toast.error("Already shared."); else toast.error("Failed: " + error.message); }
        else {
            const goal = goals.find(g => g.id === goalId);
            await supabase.from("notifications").insert({ user_id: userId, type: "share_goal", title: "New Shared Goal", message: `${user?.user_metadata?.full_name || "A teammate"} shared a goal: "${goal?.title}"`, read: false, data: { goal_id: goalId } });
            toast.success("Goal shared!");
            setGoals(prev => prev.map(g => g.id === goalId ? { ...g, shared_with: [...(g.shared_with || []), userId] } : g));
        }
    };

    const removeGoalCollaborator = async (goalId: string, userId: string) => {
        if (!user) return;
        const { error } = await supabase.from("goal_collaborators").delete().eq("goal_id", goalId).eq("user_id", userId);
        if (error) { toast.error("Failed to remove: " + error.message); }
        else {
            toast.success("Collaborator removed.");
            setGoals(prev => prev.map(g => g.id === goalId ? { ...g, shared_with: (g.shared_with || []).filter(id => id !== userId) } : g));
        }
    };

    const updateUserProfile = async (profile: Partial<UserProfile>) => {
        if (!user) return;
        const { error } = await supabase.from('profiles').upsert({ id: user.id, ...profile });
        if (error) { toast.error(`Failed: ${error.message}`); } else { setUserProfile(prev => ({ ...prev, ...profile })); toast.success("Profile updated!"); }
    };
    const updateAppLogo = async (url: string) => { if (!user) return; setAppLogo(url); localStorage.setItem('app_logo_url', url); const { error } = await supabase.from('app_settings').upsert({ key: 'app_logo', value: url }); if (!error) toast.success("Logo saved!"); };
    const updateSocialUrl = async (url: string) => { if (!user) return; setSocialUrl(url); localStorage.setItem('social_url', url); const { error } = await supabase.from('app_settings').upsert({ key: 'social_url', value: url }); if (!error) toast.success("Social URL saved!"); };
    const updateAppFavicon = async (url: string) => { if (!user) return; setAppFavicon(url); localStorage.setItem('app_favicon_url', url); const { error } = await supabase.from('app_settings').upsert({ key: 'app_favicon', value: url }); if (!error) toast.success("Favicon saved!"); };
    const fetchAllUsers = async (): Promise<UserProfile[]> => {
        if (!user) return [];
        const { data, error } = await supabase.from('profiles').select('*').order('full_name', { ascending: true });
        if (error) return [];
        return data?.map(p => ({ id: p.id, displayName: p.full_name, photoURL: p.avatar_url, email: p.email, gender: p.gender, height: p.height, waist: p.waist, neck: p.neck, chest: p.chest, arms: p.arms, age: p.age, activity_level: p.activity_level, weekly_workout_goal: p.weekly_workout_goal, starting_weight: p.starting_weight })) || [];
    };
    const sendFriendRequest = async (email: string) => {
        if (!user) return;
        const { data: foundUsers } = await supabase.from('profiles').select('id').eq('email', email).single();
        if (!foundUsers) { toast.error("User not found."); return; }
        if (foundUsers.id === user.id) { toast.error("Cannot invite self."); return; }
        const { error } = await supabase.from('collaborations').insert({ requester_id: user.id, receiver_id: foundUsers.id, status: 'pending' });
        if (error) { toast.error(error.message); } else {
            await supabase.from('notifications').insert({ user_id: foundUsers.id, title: "New Team Invitation", message: `${userProfile.displayName} invited you!`, type: 'info' });
            toast.success("Request sent!"); fetchCollaborations();
        }
    };
    const acceptFriendRequest = async (id: string) => {
        const { error } = await supabase.from('collaborations').update({ status: 'accepted' }).eq('id', id);
        if (error) toast.error("Failed."); else { toast.success("Accepted!"); fetchCollaborations(); }
    };
    const resendFriendRequest = async (id: string) => {
        const { data: collab } = await supabase.from('collaborations').select('*, receiver:profiles!receiver_id(*)').eq('id', id).single();
        if (!collab) return;
        await supabase.from('notifications').insert({ user_id: collab.receiver_id, title: "Invitation Reminder", message: `${userProfile.displayName} is inviting you!`, type: 'info' });
        toast.success(`Resent to ${collab.receiver?.full_name}!`);
    };
    const removeFriend = async (id: string) => {
        const { error } = await supabase.from('collaborations').delete().eq('id', id);
        if (error) toast.error("Failed."); else { toast.success("Removed."); setCollaborations(prev => prev.filter(c => c.id !== id)); }
    };

    const addGoal = async (goal: Omit<Goal, 'id' | 'user_id' | 'created_at'>): Promise<Goal | null> => {
        if (!user) return null;
        const { data, error } = await supabase.from('goals').insert([{ ...goal, user_id: user.id }]).select();
        if (error) { console.error('Error adding goal:', error); toast.error('Failed to add goal'); return null; }
        if (data) { setGoals(prev => [data[0] as any, ...prev]); toast.success('Goal added!'); return data[0] as Goal; }
        return null;
    };
    const updateGoal = async (id: string, updates: Partial<Goal>) => {
        if (!user) return;
        const { error } = await supabase.from('goals').update(updates).eq('id', id);
        if (error) { console.error('Error updating goal:', error); toast.error('Failed to update goal'); return; }
        setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g)); toast.success('Goal updated!');
    };
    const deleteGoal = async (id: string) => {
        if (!user) return;
        const { error } = await supabase.from('goals').delete().eq('id', id);
        if (error) { console.error('Error deleting goal:', error); toast.error('Failed to delete goal'); return; }
        setGoals(prev => prev.filter(g => g.id !== id)); toast.success('Goal deleted!');
    };

    const value = React.useMemo(() => ({
        workouts, measurements, mindsetLogs, todos, goals, todoCompletions, todoExceptions, userProfile, collaborations,
        addWorkout, deleteWorkout, addMeasurement, updateMeasurement, deleteMeasurement, addMindsetLog, addToDo, updateToDo, deleteToDo,
        addGoal, updateGoal, deleteGoal, shareGoal, removeGoalCollaborator,
        toggleRecurringCompletion, excludeRecurringTask, shareToDo, updateUserProfile, fetchAllUsers,
        appLogo, updateAppLogo, socialUrl, updateSocialUrl, appFavicon, updateAppFavicon,
        sendFriendRequest, acceptFriendRequest, resendFriendRequest, removeFriend, refreshCollaborations: fetchCollaborations,
        isLoading, isTimerRunning, timerStartTime, elapsedSeconds, startTimer, stopTimer
    }), [
        workouts, measurements, mindsetLogs, todos, goals, todoCompletions, todoExceptions, userProfile, collaborations,
        appLogo, isLoading, isTimerRunning, elapsedSeconds, timerStartTime
    ]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
















