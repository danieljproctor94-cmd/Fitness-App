import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";

export interface Set {
    id: string;
    weight: number;
    reps: number;
}

export interface Exercise {
    id: string;
    name: string;
    sets: Set[];
}

export interface Workout {
    id: string;
    name: string;
    date: string;
    time?: string;
    duration: string;
    exercises: Exercise[];
}

export interface Measurement {
    id: string;
    date: string;
    weight: number;
    height?: number;
    waist?: number;
    neck?: number;
    chest?: number;
    arms?: number;
    created_at?: string;
}

export interface UserProfile {
    displayName: string;
    photoURL: string;
    gender: 'male' | 'female';
    height: string;
    waist: string;
    neck: string;
    chest: string;
    arms: string;
    age?: string;
    activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    subscription_tier?: string;
    email?: string;
    last_sign_in_at?: string;
    id?: string;
    weekly_workout_goal?: number;
    starting_weight?: number;
}

export interface MindsetLog {
    id: string;
    date: string;
    grateful_for: string;
    improvements: string;
    created_at?: string;
}

export interface ToDo {
    id: string;
    title: string;
    description?: string | null;
    due_date?: string | null;
    due_time?: string | null;
    completed: boolean;
    recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
    notify: boolean;
    notify_before?: '10_min' | '1_hour' | '1_day' | null;
    urgency?: 'low' | 'normal' | 'high' | 'critical';
    created_at?: string;
    shared_with?: string[];
}

export interface Collaboration {
    id: string;
    requester_id: string;
    receiver_id: string;
    status: 'pending' | 'accepted';
    profile?: UserProfile;
}

interface DataContextType {
    workouts: Workout[];
    measurements: Measurement[];
    mindsetLogs: MindsetLog[];
    todos: ToDo[];
    userProfile: UserProfile;
    collaborations: Collaboration[];
    addWorkout: (workout: Omit<Workout, 'id'>) => Promise<void>;
    deleteWorkout: (id: string) => Promise<void>;
    addMeasurement: (measurement: Omit<Measurement, 'id'>) => Promise<void>;
    deleteMeasurement: (id: string) => Promise<void>;
    addMindsetLog: (log: Omit<MindsetLog, 'id'>) => Promise<void>;
    addToDo: (todo: Omit<ToDo, 'id'>) => Promise<ToDo | null>;
    updateToDo: (id: string, updates: Partial<ToDo>) => Promise<void>;
    deleteToDo: (id: string) => Promise<void>;
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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

const initialUserProfile: UserProfile = {
    displayName: '',
    photoURL: '',
    gender: 'male',
    height: '',
    waist: '',
    neck: '',
    chest: '',
    arms: '',
    weekly_workout_goal: 4
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [measurements, setMeasurements] = useState<Measurement[]>([]);

    const [mindsetLogs, setMindsetLogs] = useState<MindsetLog[]>([]);
    const [todos, setTodos] = useState<ToDo[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile>(initialUserProfile);
    const [appLogo, setAppLogo] = useState<string>(() => localStorage.getItem('app_logo_url') || '/logo.png'); // Default from cache or fallback
    const [appFavicon, setAppFavicon] = useState<string>(() => localStorage.getItem('app_favicon_url') || '/favicon.ico');
    const [socialUrl, setSocialUrl] = useState<string>(() => localStorage.getItem('social_url') || '');
    const [isLoading, setIsLoading] = useState(true);
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);

    const fetchCollaborations = async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('collaborations')
            .select(`
                *,
                requester:profiles!requester_id(*),
                receiver:profiles!receiver_id(*)
            `)
            .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

        if (error) {
            console.error("Error fetching collaborations:", error);
            return;
        }

        const processed = data.map((c: any) => {
            const isRequester = c.requester_id === user.id;
            const otherProfile = isRequester ? c.receiver : c.requester;
            return {
                ...c,
                profile: {
                    id: otherProfile?.id,
                    displayName: otherProfile?.full_name,
                    photoURL: otherProfile?.avatar_url,
                    weekly_workout_goal: otherProfile?.weekly_workout_goal,
                }
            };
        });

        setCollaborations(processed);
    };

    // Fetch Data
    useEffect(() => {
        if (!user) {
            setWorkouts([]);
            setMeasurements([]);
            setMindsetLogs([]);
            setTodos([]);
            setUserProfile(initialUserProfile);
            setCollaborations([]);
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);

            // 1. Workouts
            const { data: wData } = await supabase.from('workouts').select('*').order('created_at', { ascending: false });
            if (wData) setWorkouts(wData as any);

            // 2. Measurements
            const { data: mData } = await supabase.from('measurements').select('*').order('date', { ascending: true });
            if (mData) setMeasurements(mData);

            // 3. Mindset Logs
            const { data: mlData } = await supabase.from('mindset_logs').select('*').order('date', { ascending: false });
            if (mlData) setMindsetLogs(mlData);

            // 4. ToDos
            const { data: tData } = await supabase
                .from('todos')
                .select('*, todo_collaborators(user_id)')
                .order('created_at', { ascending: false });

            if (tData) {
                const processedTodos = tData.map((t: any) => ({
                    ...t,
                    shared_with: t.todo_collaborators?.map((tc: any) => tc.user_id) || []
                }));
                setTodos(processedTodos);
            }

            // 5. Profile
            const { data: pData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (pData) {
                setUserProfile({
                    id: pData.id,
                    displayName: pData.full_name || '',
                    photoURL: pData.avatar_url || '',
                    gender: pData.gender || 'male',
                    height: pData.height || '',
                    waist: pData.waist || '',
                    neck: pData.neck || '',
                    chest: pData.chest || '',
                    arms: pData.arms || '',
                    subscription_tier: pData.subscription_tier,
                    weekly_workout_goal: pData.weekly_workout_goal || 4,
                    age: pData.age,
                    starting_weight: pData.starting_weight,
                    activity_level: pData.activity_level
                } as UserProfile);
            }

            // 6. App Settings (Logo)
            const { data: sData } = await supabase.from('app_settings').select('value').eq('key', 'app_logo').single();
            if (sData) {
                setAppLogo(sData.value);
                localStorage.setItem('app_logo_url', sData.value);
            }

            // 7. App Settings (Social URL)
            const { data: socialData } = await supabase.from('app_settings').select('value').eq('key', 'social_url').single();
            if (socialData) {
                setSocialUrl(socialData.value);
                localStorage.setItem('social_url', socialData.value);
            }

            if (socialData) {
                setSocialUrl(socialData.value);
                localStorage.setItem('social_url', socialData.value);
            }

            // 8. App Settings (Favicon)
            const { data: faviconData } = await supabase.from('app_settings').select('value').eq('key', 'app_favicon').single();
            if (faviconData) {
                setAppFavicon(faviconData.value);
                localStorage.setItem('app_favicon_url', faviconData.value);
            }

            await fetchCollaborations();

            setIsLoading(false);
        };

        fetchData();

    }, [user]);

    const addWorkout = async (workout: Omit<Workout, 'id'>) => {
        if (!user) {
            toast.error("No user logged in!");
            return;
        }

        const { data, error } = await supabase.from('workouts').insert([{
            user_id: user.id,
            name: workout.name,
            date: workout.date,
            time: workout.time,
            duration: workout.duration,
            exercises: workout.exercises
        }]).select();

        if (error) {
            console.error("Error adding workout:", error);
            toast.error(`Failed to save workout: ${error.message}`);
            return;
        }

        if (data) {
            setWorkouts(prev => [data[0] as any, ...prev]);
            toast.success("Workout saved successfully!");
        }
    };

    const deleteWorkout = async (id: string) => {
        if (!user) return;
        const { error } = await supabase.from('workouts').delete().eq('id', id);

        if (error) {
            console.error("Error deleting workout:", error);
            toast.error(`Failed to delete workout: ${error.message}`);
            return;
        }

        setWorkouts(prev => prev.filter(w => w.id !== id));
        toast.success("Workout deleted!");
    };

    const addMeasurement = async (measurement: Omit<Measurement, 'id'>) => {
        if (!user) return;

        const { data, error } = await supabase.from('measurements').insert([{
            user_id: user.id,
            ...measurement
        }]).select();

        if (error) {
            console.error("Error adding measurement:", error);
            toast.error(`Failed to save measurement: ${error.message}`);
            return;
        }

        if (data) {
            setMeasurements(prev => [...prev, data[0]]);
            toast.success("Measurement saved!");
        }
    };

    const deleteMeasurement = async (id: string) => {
        if (!user) return;

        const { error } = await supabase.from('measurements').delete().eq('id', id);

        if (error) {
            console.error("Error deleting measurement:", error);
            toast.error(`Failed to delete measurement: ${error.message}`);
            return;
        }

        setMeasurements(prev => prev.filter(m => m.id !== id));
        toast.success("Measurement deleted!");
    };

    const addMindsetLog = async (log: Omit<MindsetLog, 'id'>) => {
        if (!user) return;

        const { data, error } = await supabase.from('mindset_logs').insert([{
            user_id: user.id,
            ...log
        }]).select();

        if (error) {
            console.error("Error adding mindset log:", error);
            toast.error(`Failed to save log: ${error.message}`);
            return;
        }

        if (data) {
            setMindsetLogs(prev => [data[0], ...prev]);
            toast.success("Log saved!");
        }
    };

    const addToDo = async (todo: Omit<ToDo, 'id'>): Promise<ToDo | null> => {
        if (!user) return null;

        const { data, error } = await supabase.from('todos').insert([{
            user_id: user.id,
            ...todo
        }]).select();

        if (error) {
            console.error("Error adding todo:", error);
            toast.error(`Failed to save task: ${error.message}`);
            return null;
        }

        if (data) {
            setTodos(prev => [data[0] as any, ...prev]);
            toast.success("Task saved!");
            return data[0] as ToDo;
        }
        return null;
    };

    const updateToDo = async (id: string, updates: Partial<ToDo>) => {
        if (!user) return;

        const { error } = await supabase.from('todos').update(updates).eq('id', id);

        if (error) {
            console.error("Error updating todo:", error);
            toast.error(`Failed to update task: ${error.message}`);
            return;
        }

        setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const deleteToDo = async (id: string) => {
        if (!user) return;

        const { error } = await supabase.from('todos').delete().eq('id', id);

        if (error) {
            console.error("Error deleting todo:", error);
            toast.error(`Failed to delete task: ${error.message}`);
            return;
        }

        setTodos(prev => prev.filter(t => t.id !== id));
        toast.success("Task deleted!");
    };

    const shareToDo = async (todoId: string, userId: string) => {
        if (!user) return;
        const { error } = await supabase.from('todo_collaborators').insert({
            todo_id: todoId,
            user_id: userId,
            permission: 'edit'
        });

        if (error) {
            // Check for duplicate key
            if (error.code === '23505') {
                toast.error("Already shared with this user.");
            } else {
                console.error("Error sharing todo:", error);
                toast.error("Failed to share task: " + error.message);
            }
        } else {
            // Success - Send Notification
            // 1. Get the ToDo title for the notification text
            const todo = todos.find(t => t.id === todoId);
            const todoTitle = todo ? todo.title : 'a task';

            // 2. Insert Notification
            await supabase.from('notifications').insert({
                user_id: userId, // The person receiving the share
                type: 'share_todo',
                title: 'New Shared Task',
                message: `${user?.user_metadata?.full_name || 'A teammate'} shared a task with you: "${todoTitle}"`,
                read: false,
                data: { todo_id: todoId }
            });

            toast.success("Task shared!");

            // Update local state to reflect the new collaborator instantly - Refetch or update optimistic
            // For simplicity, we might just let the subscription or partial update handle it, 
            // but strictly we should update the todos state to add the shared_with user.
            setTodos(prev => prev.map(t => {
                if (t.id === todoId) {
                    const currentShared = t.shared_with || [];
                    if (!currentShared.includes(userId)) {
                        return { ...t, shared_with: [...currentShared, userId] };
                    }
                }
                return t;
            }));
        }
    };

    const updateUserProfile = async (profile: Partial<UserProfile>) => {
        if (!user) return;

        const updates: any = {};
        if (profile.displayName !== undefined) updates.full_name = profile.displayName;
        if (profile.photoURL !== undefined) updates.avatar_url = profile.photoURL;
        if (profile.gender !== undefined) updates.gender = profile.gender;
        if (profile.height !== undefined) updates.height = profile.height;
        if (profile.waist !== undefined) updates.waist = profile.waist;
        if (profile.neck !== undefined) updates.neck = profile.neck;
        if (profile.chest !== undefined) updates.chest = profile.chest;
        if (profile.arms !== undefined) updates.arms = profile.arms;
        if (profile.subscription_tier !== undefined) updates.subscription_tier = profile.subscription_tier;
        if (profile.weekly_workout_goal !== undefined) updates.weekly_workout_goal = profile.weekly_workout_goal;
        if (profile.activity_level !== undefined) updates.activity_level = profile.activity_level;
        if (profile.age !== undefined) updates.age = profile.age;
        if (profile.starting_weight !== undefined) updates.starting_weight = profile.starting_weight;

        const { error } = await supabase.from('profiles').upsert({
            id: user.id,
            ...updates
        });

        if (error) {
            console.error("Error saving profile:", error);
            toast.error(`Failed to save profile: ${error.message}`);
        } else {
            setUserProfile(prev => ({ ...prev, ...profile }));
            toast.success("Profile updated successfully!");
        }
    };

    const updateAppLogo = async (url: string) => {
        if (!user) return;
        setAppLogo(url);
        localStorage.setItem('app_logo_url', url);

        const { error } = await supabase.from('app_settings').upsert({
            key: 'app_logo',
            value: url,
            updated_at: new Date().toISOString()
        });

        if (error) {
            console.error("Error saving logo:", error);
            toast.error("Failed to save logo setting");
        } else {
            toast.success("Global Logo Setting Saved!");
        }
    };

    const updateSocialUrl = async (url: string) => {
        if (!user) return;
        setSocialUrl(url);
        localStorage.setItem('social_url', url);

        const { error } = await supabase.from('app_settings').upsert({
            key: 'social_url',
            value: url,
            updated_at: new Date().toISOString()
        });

        if (error) {
            console.error("Error saving social url:", error);
            toast.error("Failed to save social url");
        } else {
            toast.success("Social URL Saved!");
        }
    };

    const updateAppFavicon = async (url: string) => {
        if (!user) return;
        setAppFavicon(url);
        localStorage.setItem('app_favicon_url', url);

        const { error } = await supabase.from('app_settings').upsert({
            key: 'app_favicon',
            value: url,
            updated_at: new Date().toISOString()
        });

        if (error) {
            console.error("Error saving favicon:", error);
            toast.error("Failed to save favicon");
        } else {
            toast.success("Favicon Saved!");
        }
    };

    const fetchAllUsers = async (): Promise<UserProfile[]> => {
        if (!user) return [];
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name', { ascending: true });

        if (error) {
            console.error("Error fetching all users:", error);
            return [];
        }

        return data?.map(p => ({
            id: p.id,
            displayName: p.full_name,
            photoURL: p.avatar_url,
            email: p.email,
            gender: p.gender,
            subscription_tier: p.subscription_tier,
            last_sign_in_at: p.last_sign_in_at,
            height: p.height,
            waist: p.waist,
            neck: p.neck,
            chest: p.chest,
            arms: p.arms,
            age: p.age,
            activity_level: p.activity_level,
            weekly_workout_goal: p.weekly_workout_goal,
            starting_weight: p.starting_weight
        })) || [];
    };

    const sendFriendRequest = async (email: string) => {
        if (!user) return;

        const { data: foundUsers, error: searchError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (searchError || !foundUsers) {
            toast.error("User not found with that email.");
            return;
        }

        if (foundUsers.id === user.id) {
            toast.error("You cannot invite yourself.");
            return;
        }

        const { error } = await supabase.from('collaborations').insert({
            requester_id: user.id,
            receiver_id: foundUsers.id,
            status: 'pending'
        });

        if (error) {
            // @ts-ignore
            if (error.code === '23505') {
                // Check the ACTUAL status of the existing row to give better feedback
                const { data: existing } = await supabase
                    .from('collaborations')
                    .select('status')
                    .match({ requester_id: user.id, receiver_id: foundUsers.id })
                    .maybeSingle();

                if (existing) {
                    if (existing.status === 'accepted') {
                        toast.info("This user is already in your team!");
                    } else if (existing.status === 'pending') {
                        toast.warning("Invitation is pending. If you don't see it below, try refreshing.");
                        // Force refresh just in case
                        fetchCollaborations();
                    } else {
                        toast.info(`Invitation status is currently: ${existing.status}`);
                    }
                } else {
                    toast.error("Invitation conflict detected, but could not verify status. Please refresh.");
                }
            } else {
                toast.error(error.message);
            }
        } else {
            // Send Notification
            // We do this optimistically (don't fail the whole request if notification fails)
            await supabase.from('notifications').insert({
                user_id: foundUsers.id,
                title: "New Team Invitation",
                message: `${userProfile.displayName || "Someone"} invited you to join their team!`,
                type: 'info'
            });

            toast.success("Friend request sent!");
            fetchCollaborations();
        }
    };

    const acceptFriendRequest = async (id: string) => {
        const { error } = await supabase.from('collaborations').update({ status: 'accepted' }).eq('id', id);
        if (error) {
            toast.error("Failed to accept request.");
        } else {
            toast.success("Friend request accepted!");
            fetchCollaborations();
        }
    };

    const resendFriendRequest = async (id: string) => {
        // 1. Get the collaboration details to know who to email/notify
        const { data: collab, error: fetchError } = await supabase
            .from('collaborations')
            .select('*, receiver:profiles!receiver_id(*)')
            .eq('id', id)
            .single();

        if (fetchError || !collab) {
            toast.error("Could not find invitation.");
            return;
        }

        // 2. Send Notification
        const { error: notifyError } = await supabase.from('notifications').insert({
            user_id: collab.receiver_id,
            title: "Team Invitation Reminder",
            message: `${userProfile.displayName || "Someone"} is inviting you to join their team!`,
            type: 'info'
        });

        if (notifyError) {
            toast.error("Failed to resend notification: " + notifyError.message);
        } else {
            toast.success(`Invitation resent to ${collab.receiver?.full_name || "user"}!`);
        }
    };

    const removeFriend = async (id: string) => {
        const { error } = await supabase.from('collaborations').delete().eq('id', id);

        if (error) {
            console.error("Error removing friend:", error);
            toast.error("Failed to remove teammate.");
        } else {
            toast.success("Teammate removed.");
            setCollaborations(prev => prev.filter(c => c.id !== id));
        }
    };

    const value = React.useMemo(() => ({
        workouts,
        measurements,
        mindsetLogs,
        todos,
        userProfile,
        collaborations,
        addWorkout,
        deleteWorkout,
        addMeasurement,
        deleteMeasurement,
        addMindsetLog,
        addToDo,
        updateToDo,
        deleteToDo,
        shareToDo,
        updateUserProfile,
        fetchAllUsers,
        appLogo,
        updateAppLogo,
        socialUrl,
        updateSocialUrl,
        appFavicon,
        updateAppFavicon,
        sendFriendRequest,
        acceptFriendRequest,
        resendFriendRequest,
        removeFriend,
        refreshCollaborations: fetchCollaborations,
        isLoading
    }), [
        workouts,
        measurements,
        mindsetLogs,
        todos,
        userProfile,
        collaborations,
        appLogo,
        isLoading
    ]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
