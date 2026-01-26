import { NextResponse } from 'next/server';

export async function POST() {
	// Clear the token cookie and redirect to login
	const response = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'));
	response.cookies.set('token', '', {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		path: '/',
		maxAge: 0,
	});
	return response;
}
