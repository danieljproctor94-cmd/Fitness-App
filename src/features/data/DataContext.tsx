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
    description?: string;
    due_date?: string;
    due_time?: string;
    completed: boolean;
    recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
    notify: boolean;
    notify_before?: '10_min' | '1_hour' | '1_day';
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
    sendFriendRequest: (email: string) => Promise<void>;
    acceptFriendRequest: (id: string) => Promise<void>;
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
    const [appLogo, setAppLogo] = useState<string>('/logo.png'); // Default
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
            const { data: tData } = await supabase.from('todos').select('*').order('created_at', { ascending: false });
            if (tData) setTodos(tData as any);

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
        toast.success("Task updated!");
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
            toast.success("Task shared successfully!");
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
            toast.error(error.message);
        } else {
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
        sendFriendRequest,
        acceptFriendRequest,
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
