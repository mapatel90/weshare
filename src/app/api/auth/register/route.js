import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma-db'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      firstName,
      lastName,
      username,
      email,
      password,
      phoneNumber,
      userRole, 
      address1,
      address2,
      city,
      state,
      country,
      zipcode
    } = body

    // Validate required fields
    if (!firstName || !lastName || !username || !password) {
      return NextResponse.json(
        { success: false, message: 'First name, last name, username, and password are required' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUsername) {
      return NextResponse.json(
        { success: false, message: 'User with this username already exists', field: 'username' },
        { status: 409 }
      )
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user (store username and email)
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        username,
        email,
        password: hashedPassword,
        phoneNumber,
        userRole,
        address1,
        address2,
        city,
        state,
        country,
        zipcode,
        status: 1
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        phoneNumber: true,
        userRole: true,
        status: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      data: newUser
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error during registration' },
      { status: 500 }
    )
  }
}
