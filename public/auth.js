/**
 * @fileoverview Authentication related functionality.
 * This module handles user authentication, including login, logout,
 * and session management.
 * @module auth
 */

import { addDebugLog } from './utils.js';

/**
 * Logs in a user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<Object>} The logged in user object
 * @throws {Error} If login fails
 */
export async function login(email, password) {
    const requestId = Math.random().toString(36).substring(7);
    const startTime = Date.now();
    
    addDebugLog('info', `[${requestId}] Login Process Started`);

    try {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        addDebugLog('info', `[${requestId}] Step 1: Input Validation Passed`);
        
        const user = await Backendless.UserService.login(email, password, true);
        
        const duration = Date.now() - startTime;
        addDebugLog('info', `[${requestId}] Login Success - Duration: ${duration}ms`);
        
        return user;

    } catch (error) {
        const duration = Date.now() - startTime;
        addDebugLog('error', `[${requestId}] Login Failed - Duration: ${duration}ms - ${error.message}`);
        throw error;
    }
}

/**
 * Logs out the current user
 * @returns {Promise<void>}
 * @throws {Error} If logout fails
 */
export async function logout() {
    const requestId = Math.random().toString(36).substring(7);
    addDebugLog('info', `[${requestId}] Starting Logout Process`);

    try {
        await Backendless.UserService.logout();
        
        // Verify logout
        const verifiedUser = await Backendless.UserService.getCurrentUser();
        if (verifiedUser) {
            throw new Error('Logout succeeded but session still active');
        }

        addDebugLog('info', `[${requestId}] Logout Process Completed Successfully`);

    } catch (error) {
        addDebugLog('error', `[${requestId}] Logout Process Failed: ${error.message}`);
        throw error;
    }
}

/**
 * Checks the current login status
 * @returns {Promise<Object|null>} The current user object or null if not logged in
 */
export async function checkLoginStatus() {
    const requestId = Math.random().toString(36).substring(7);
    addDebugLog('info', `[${requestId}] Checking Login Status`);

    try {
        const user = await Backendless.UserService.getCurrentUser();
        if (user) {
            addDebugLog('info', `[${requestId}] User is logged in: ${user.email}`);
            return user;
        } else {
            addDebugLog('info', `[${requestId}] No user currently logged in`);
            return null;
        }
    } catch (error) {
        addDebugLog('error', `[${requestId}] Error checking login status: ${error.message}`);
        return null;
    }
}

/**
 * Updates the UI after successful login
 * @param {Object} user - The logged in user object
 */
export function updateUIAfterLogin(user) {
    const guestView = document.getElementById('guest-view');
    const userView = document.getElementById('user-view');
    const userName = document.getElementById('user-name');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    guestView.classList.add('hidden');
    userView.classList.remove('hidden');
    userName.textContent = user.name || user.email;
    loginForm.classList.add('hidden');
    registerForm.classList.add('hidden');
}

/**
 * Updates the UI after logout
 */
export function updateUIAfterLogout() {
    const guestView = document.getElementById('guest-view');
    const userView = document.getElementById('user-view');

    guestView.classList.remove('hidden');
    userView.classList.add('hidden');
} 