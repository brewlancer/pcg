'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(prevState: any, formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    const correctUsername = process.env.APP_USERNAME || 'admin';
    const correctPassword = process.env.APP_PASSWORD || 'password123';

    if (username === correctUsername && password === correctPassword) {
        const cookieStore = await cookies();
        cookieStore.set('pcg_session', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });
        redirect('/');
    }

    return { error: 'Invalid username or password' };
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('pcg_session');
    redirect('/login');
}
