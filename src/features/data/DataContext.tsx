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
    // Optional body stats for history
    height?: number;
    waist?: number;
    neck?: number;
    chest?: number;
    arms?: number;
    created_at?: string; // For precise sorting
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
}

interface DataContextType {
    workouts: Workout[];
    measurements: Measurement[];
    mindsetLogs: MindsetLog[];
    todos: ToDo[];
    userProfile: UserProfile;
    addWorkout: (workout: Omit<Workout, 'id'>) => Promise<void>;
    deleteWorkout: (id: string) => Promise<void>;
    addMeasurement: (measurement: Omit<Measurement, 'id'>) => Promise<void>;
    deleteMeasurement: (id: string) => Promise<void>;
    addMindsetLog: (log: Omit<MindsetLog, 'id'>) => Promise<void>;
    addToDo: (todo: Omit<ToDo, 'id'>) => Promise<void>;
    updateToDo: (id: string, updates: Partial<ToDo>) => Promise<void>;
    deleteToDo: (id: string) => Promise<void>;
    updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
    fetchAllUsers: () => Promise<UserProfile[]>;
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
    const [isLoading, setIsLoading] = useState(true);

    // Fetch Data
    useEffect(() => {
        if (!user) {
            setWorkouts([]);
            setMeasurements([]);

            setMindsetLogs([]);
            setTodos([]);
            setUserProfile(initialUserProfile);
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            // 1. Workouts
            const { data: wData, error: wError } = await supabase.from('workouts').select('*').order('created_at', { ascending: false });
            if (wError) console.error("Error fetching workouts:", wError);
            if (wData) setWorkouts(wData as any);

            // 2. Measurements
            const { data: mData, error: mError } = await supabase.from('measurements').select('*').order('date', { ascending: true });
            if (mError) console.error("Error fetching measurements:", mError);
            if (mData) setMeasurements(mData);

            // 3. Mindset Logs
            const { data: mlData, error: mlError } = await supabase.from('mindset_logs').select('*').order('date', { ascending: false });
            // Suppress error if table doesn't exist yet (common during dev)
            if (mlError && mlError.code !== '42P01') console.error("Error fetching mindset logs:", mlError);
            if (mlData) setMindsetLogs(mlData);

            // 4. ToDos
            const { data: tData, error: tError } = await supabase.from('todos').select('*').order('created_at', { ascending: false });
            if (tError && tError.code !== '42P01') console.error("Error fetching todos:", tError);
            if (tData) setTodos(tData as any);

            // 5. Profile
            const { data: pData, error: pError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (pError && pError.code !== 'PGRST116') console.error("Error fetching profile:", pError);

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
                    weekly_workout_goal: pData.weekly_workout_goal || 4
                } as UserProfile);
            }
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

    const addToDo = async (todo: Omit<ToDo, 'id'>) => {
        if (!user) return;

        const { data, error } = await supabase.from('todos').insert([{
            user_id: user.id,
            ...todo
        }]).select();

        if (error) {
            console.error("Error adding todo:", error);
            toast.error(`Failed to save task: ${error.message}`);
            return;
        }

        if (data) {
            setTodos(prev => [data[0] as any, ...prev]);
            toast.success("Task saved!");
        }
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
        // Recurrence logic could go here or in the component calling this.
        // For simplicity, we'll confirm update.
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

        // FIXED: Removed 'updated_at' to prevent "Column not found" error
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

    const fetchAllUsers = async (): Promise<UserProfile[]> => {
        if (!user) return [];
        // This query relies on the RLS policy "Admins can view all profiles"
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching all users:", error);
            // Don't show toast here as it might spam if non-admin tries to load page logic
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
            weekly_workout_goal: p.weekly_workout_goal
        })) || [];
    };

    return (
        <DataContext.Provider value={{
            workouts,
            measurements,
            mindsetLogs,
            todos,
            userProfile,
            addWorkout,
            deleteWorkout,
            addMeasurement,
            deleteMeasurement,
            addMindsetLog,
            addToDo,
            updateToDo,
            deleteToDo,
            updateUserProfile,
            fetchAllUsers,
            isLoading
        }}>
            {children}
        </DataContext.Provider>
    );
};

