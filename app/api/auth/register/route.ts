import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
	try {
		const { name, email, password } = await req.json();
		if (!name || !email || !password) {
			return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
		}
		if (password.length < 6) {
			return NextResponse.json({ message: 'Password must be at least 6 characters.' }, { status: 400 });
		}
		await dbConnect();
		const existing = await User.findOne({ email });
		if (existing) {
			return NextResponse.json({ message: 'Email already registered.' }, { status: 409 });
		}
		const hashed = await bcrypt.hash(password, 10);
		const user = new User({ name, email, password: hashed });
		await user.save();
		return NextResponse.json({ message: 'Registration successful.' }, { status: 201 });
	} catch (err) {
		console.error('Registration error:', err);
		return NextResponse.json({ message: 'Server error.' }, { status: 500 });
	}
}
