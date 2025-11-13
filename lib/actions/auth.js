'use server'
import connectDB from '@/lib/db'
import Setting from '@/models/Setting'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

// Login function
export async function login(email, password) {
  try {
    await connectDB()
    
    // Get settings from database
    const settings = await Setting.getSettings()
    
    // Verify email
    if (settings.email !== email) {
      return {
        success: false,
        error: 'Invalid email or password',
      }
    }
    
    // Verify password using bcrypt comparison
    const isPasswordValid = await settings.comparePassword(password)
    
    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Invalid email or password',
      }
    }
    
    // Create JWT token
    const token = await new SignJWT({ 
      email: settings.email,
      userId: settings._id.toString(),
      iat: Math.floor(Date.now() / 1000)
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d') // Token expires in 7 days
      .sign(SECRET_KEY)
    
    // Set HTTP-only cookie
    cookies().set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    
    return {
      success: true,
      message: 'Login successful',
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: 'Login failed. Please try again.',
    }
  }
}

// Verify authentication
export async function verifyAuth() {
  try {
    const token = cookies().get('auth_token')?.value
    
    if (!token) {
      return { isAuthenticated: false }
    }
    
    const verified = await jwtVerify(token, SECRET_KEY)
    
    return {
      isAuthenticated: true,
      user: verified.payload,
    }
  } catch (error) {
    return { isAuthenticated: false }
  }
}

// Logout function
export async function logout() {
  cookies().delete('auth_token')
  return { success: true }
}