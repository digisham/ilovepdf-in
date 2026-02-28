import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [defaultSignup, setDefaultSignup] = useState(false);

    useEffect(() => {

        if (!supabase) {
            setLoading(false);
            return;
        }

        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session || null);
            setLoading(false);
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            setSession(nextSession);
            if (nextSession) {
                setShowLoginModal(false);
            }
        });

        return () => {
            listener?.subscription?.unsubscribe();
        };
    }, []);

    const loginWithGoogle = async () => {
        if (!supabase) {
            alert('Supabase URL/KEY not configured. Placeholder for DB connection.');
            return;
        }

        // Vite prepends the basename in the URL, usually standard origin gets cut off
        const siteUrl = window.location.origin + '/ilovepdf-in/';

        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: siteUrl }
        });
    };

    const loginWithEmail = async (email, password) => {
        if (!supabase) return { error: { message: 'Database disconnected' } };
        return await supabase.auth.signInWithPassword({
            email,
            password
        });
    };

    const signupWithEmail = async (email, password, fullName) => {
        if (!supabase) return { error: { message: 'Database disconnected' } };
        return await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                }
            }
        });
    };

    const logout = async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
    };

    // All tools are free — no limits
    const trackUsage = () => true;

    const closeLoginModal = () => setShowLoginModal(false);

    const value = {
        session,
        user: session?.user || null,
        loading,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,
        trackUsage,
        showLoginModal,
        openLoginModal: () => { setDefaultSignup(false); setShowLoginModal(true); },
        openSignupModal: () => { setDefaultSignup(true); setShowLoginModal(true); },
        closeLoginModal,
        defaultSignup,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
