import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma-db'

export async function POST(request) {
  try {
    const { username } = await request.json()

    if (!username) {
      return NextResponse.json(
        { available: false, message: 'Username is required' },
        { status: 400 }
      )
    }

    // Check if username exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    return NextResponse.json({
      available: !existingUser,
      message: existingUser ? 'Username already taken' : 'Username available'
    })

  } catch (error) {
    console.error('Error checking username:', error)
    return NextResponse.json(
      { available: false, message: 'Error checking username' },
      { status: 500 }
    )
  }
}
