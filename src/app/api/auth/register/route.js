import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { z } from 'zod';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().regex(emailRegex, 'Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export async function POST(req) {
  try {
    const body = await req.json();
    const validated = registerSchema.parse(body);

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email: validated.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Determine role
    const isAdmin = process.env.ADMIN_EMAIL && validated.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();

    // Create user
    const user = await User.create({
      name: validated.name,
      email: validated.email,
      password: validated.password,
      role: isAdmin ? 'admin' : 'user',
    });

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError || error?.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors?.[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    console.error('Registration error:', error.message);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
