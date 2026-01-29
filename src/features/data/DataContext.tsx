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
    subscription_tier?: string;
    email?: string;
    id?: string;
}

interface DataContextType {
    workouts: Workout[];
    measurements: Measurement[];
    userProfile: UserProfile; addWorkout: (workout: Omit<Workout, 'id'>) => Promise<void>;
    deleteWorkout: (id: string) => Promise<void>;
    addMeasurement: (measurement: Omit<Measurement, 'id'>) => Promise<void>;
    deleteMeasurement: (id: string) => Promise<void>;
    updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
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
    arms: ''
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [measurements, setMeasurements] = useState<Measurement[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile>(initialUserProfile);

    // Fetch Data
    useEffect(() => {
        if (!user) {
            setWorkouts([]);
            setMeasurements([]);
            setUserProfile(initialUserProfile);
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

            // 3. Profile
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
                    subscription_tier: pData.subscription_tier
                } as UserProfile);
            }
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

    return (
        <DataContext.Provider value={{
            workouts,
            measurements,
            userProfile,
            addWorkout,
            deleteWorkout,
            addMeasurement,
            deleteMeasurement,
            updateUserProfile
        }}>
            {children}
        </DataContext.Provider>
    );
};
