'use server'
import connectDB from '@/lib/db'
import Setting from '@/models/Setting'

// Helper function to serialize Mongoose document to plain object
function serializeSettings(settings) {
  const obj = settings.toObject()
  return {
    ...obj,
    _id: obj._id.toString(), // Convert ObjectId to string
    createdAt: obj.createdAt?.toISOString(), // Convert dates to ISO strings
    updatedAt: obj.updatedAt?.toISOString(),
  }
}

// Get settings (public - no password required)
export async function getSettings() {
  try {
    await connectDB()
    const settings = await Setting.getSettings()
    
    // Serialize and remove password
    const serialized = serializeSettings(settings)
    const { ...settingsData } = serialized
    
    return {
      success: true,
      data: settingsData,
    }
  } catch (error) {
    console.error('Error fetching settings:', error)
    return {
      success: false,
      error: 'Failed to fetch settings',
    }
  }
}

// Verify password
export async function verifyPassword(inputPassword) {
  try {
    await connectDB()
    const settings = await Setting.getSettings()
    
    // Simple password comparison (in production, use bcrypt)
    if (settings.password === inputPassword) {
      return { success: true }
    }
    
    return {
      success: false,
      error: 'Invalid password',
    }
  } catch (error) {
    console.error('Error verifying password:', error)
    return {
      success: false,
      error: 'Verification failed',
    }
  }
}

// Update settings (requires password)
export async function updateSettings(password, updates) {
  try {
    await connectDB()
    
    // Verify password first
    const verification = await verifyPassword(password)
    if (!verification.success) {
      return {
        success: false,
        error: 'Invalid password',
      }
    }
    
    // Don't allow password update through this function
    const { password: _, ...allowedUpdates } = updates
    
    const settings = await Setting.getSettings()
    Object.assign(settings, allowedUpdates)
    await settings.save()
    
    // Serialize and return without password
    const serialized = serializeSettings(settings)
    const { password: __, ...settingsData } = serialized
    
    return {
      success: true,
      data: settingsData,
      message: 'Settings updated successfully',
    }
  } catch (error) {
    console.error('Error updating settings:', error)
    return {
      success: false,
      error: 'Failed to update settings',
    }
  }
}

// Change password (requires old password)
export async function changePassword(oldPassword, newPassword) {
  try {
    await connectDB()
    
    // Verify old password
    const verification = await verifyPassword(oldPassword)
    if (!verification.success) {
      return {
        success: false,
        error: 'Current password is incorrect',
      }
    }
    
    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        error: 'New password must be at least 6 characters',
      }
    }
    
    // Update password
    const settings = await Setting.getSettings()
    settings.password = newPassword
    await settings.save()
    
    return {
      success: true,
      message: 'Password changed successfully',
    }
  } catch (error) {
    console.error('Error changing password:', error)
    return {
      success: false,
      error: 'Failed to change password',
    }
  }
}