// composable/useUserSession.ts

import { ID } from "appwrite";
import { type Models } from 'appwrite';
import { account } from "~/utils/appwrite";

const current = ref<Models.Session | null>(null); // Reference to current user object
const currentUser = ref<Models.User<Models.Preferences> | null>(null); // Reference to current user account data

export const useUserSession = () => {
    const register = async (email: string, password: string, name?: string): Promise<void> => {
        await account.create({
            userId: ID.unique(),
            email,
            password,
            name: name || email.split('@')[0] // Use name or fallback to email prefix
        }); // Register new user in Appwrite
        await login(email, password); // Login registered user
    };

    const login = async (email: string, password: string): Promise<void> => {
        const authUser = await account.createEmailPasswordSession({
            email,
            password
        }); // Open user session in Appwrite
        current.value = authUser; // Pass user data to current ref
        
        // Also get the user account data
        const userData = await account.get();
        currentUser.value = userData;
        
        navigateTo("/");
    };

    const logout = async (): Promise<void> => {
        await account.deleteSession({
            sessionId: 'current'
        }); // Delete Appwrite user session
        current.value = null; // Clear current ref
        currentUser.value = null; // Clear user data ref
        navigateTo("/");
    };

    const deactivateAccount = async (): Promise<void> => {
        try {
            // Deactivate the account using Appwrite's updateStatus method
            // This sets the account status to false (deactivated)
            await account.updateStatus();
            
            // Log out all sessions after deactivation
            await account.deleteSessions();
            
            // Clear local state
            current.value = null;
            currentUser.value = null;
            
            console.log('Account deactivated successfully - user logged out from all sessions');
            
            // Use nextTick to ensure state is updated before redirect
            await nextTick();
            
            // Redirect to home page with replace to prevent back navigation
            await navigateTo("/", { replace: true });
        } catch (error) {
            console.error('Failed to deactivate account:', error);
            throw error; // Re-throw to handle in component
        }
    };

    // Check if already logged in to initialize the store.
    account.getSession({
        sessionId: 'current'
    }).then(async (user: Models.Session) => {
        current.value = user;
        // Also get user account data
        try {
            const userData = await account.get();
            currentUser.value = userData;
        } catch (error) {
            console.error('Failed to get user data:', error);
        }
    }).catch(() => {
        // User not logged in, clear state
        current.value = null;
        currentUser.value = null;
    });

    const updateName = async (name: string): Promise<void> => {
        try {
            await account.updateName({ name });
            // Refresh user data
            const userData = await account.get();
            currentUser.value = userData;
        } catch (error) {
            console.error('Failed to update name:', error);
            throw error;
        }
    };

    const updateEmail = async (email: string, password: string): Promise<void> => {
        try {
            await account.updateEmail({ email, password });
            // Refresh user data
            const userData = await account.get();
            currentUser.value = userData;
        } catch (error) {
            console.error('Failed to update email:', error);
            throw error;
        }
    };

    const updatePassword = async (password: string, oldPassword: string): Promise<void> => {
        try {
            await account.updatePassword({ password, oldPassword });
        } catch (error) {
            console.error('Failed to update password:', error);
            throw error;
        }
    };

    return {
        current,
        currentUser,
        login,
        logout,
        register,
        deactivateAccount,
        updateName,
        updateEmail,
        updatePassword,
    };
};
