"use client"
import React, { useState } from 'react'
import { 
  DollarSign, 
  Calendar, 
  FileText, 
  Tag, 
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Send,
  Shield,
  UserX
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/useAuth'

// Type definitions
interface ProjectFormData {
  title: string
  description: string
  category: 'design' | 'coding' | 'writing' | 'tutoring' | 'other'
  budget_min: number
  budget_max: number
  deadline: string
}

const AddProject: React.FC = () => {
  const { user: currentAuthUser, profile: currentUserProfile, loading: authLoading } = useAuth()
  
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    category: 'coding',
    budget_min: 0,
    budget_max: 0,
    deadline: ''
  })

  const [errors, setErrors] = useState<Partial<ProjectFormData>>({})

  // Category options
  const categories = [
    { value: 'coding', label: 'Coding & Development', description: 'Web development, mobile apps, software' },
    { value: 'design', label: 'Design & Creative', description: 'UI/UX, graphics, branding' },
    { value: 'writing', label: 'Writing & Content', description: 'Copywriting, articles, documentation' },
    { value: 'tutoring', label: 'Tutoring & Teaching', description: 'Academic help, skill training' },
    { value: 'other', label: 'Other', description: 'Any other services' }
  ]

  // Handle input changes
  const handleInputChange = (field: keyof ProjectFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<ProjectFormData> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required'
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title should be at least 10 characters'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required'
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description should be at least 50 characters'
    }

    if (formData.budget_min <= 0) {
      newErrors.budget_min = 'Minimum budget must be greater than 0'
    }

    if (formData.budget_max <= 0) {
      newErrors.budget_max = 'Maximum budget must be greater than 0'
    }

    if (formData.budget_min >= formData.budget_max) {
      newErrors.budget_max = 'Maximum budget must be greater than minimum budget'
    }

    if (!formData.deadline) {
      newErrors.deadline = 'Project deadline is required'
    } else {
      const deadlineDate = new Date(formData.deadline)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (deadlineDate <= today) {
        newErrors.deadline = 'Deadline must be in the future'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!currentUserProfile || currentUserProfile.role !== 'client') {
      setError('Only clients can create projects')
      return
    }

    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Create deadline timestamp in the correct format
      const deadlineTimestamp = new Date(formData.deadline + 'T23:59:59').toISOString()

      // Replace the existing insert block (around line 133-147) with this:
      const { data, error: insertError } = await supabase
        .from('projects')
        .insert({
<<<<<<< HEAD
          client_id: parseInt(currentUserProfile.id), // Use current user's ID as integer
=======
          client_id: currentUserProfile.id,
>>>>>>> bcb7121c651eb5d5df9cd206339eb90317ae2d21
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          budget_min: formData.budget_min * 100,
          budget_max: formData.budget_max * 100,
          deadline: deadlineTimestamp,
          status: 'open'
        } as any)  // Add type assertion here
        .select()

      if (insertError) {
        console.error('Supabase insert error:', insertError)
        throw insertError
      }

      console.log('Project created successfully:', data)
      setSuccess(true)
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          title: '',
          description: '',
          category: 'coding',
          budget_min: 0,
          budget_max: 0,
          deadline: ''
        })
        setSuccess(false)
      }, 3000)

    } catch (err) {
      console.error('Error creating project:', err)
      setError(err.message || 'Failed to create project. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Get minimum date for deadline (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-2">Loading...</div>
          <div className="text-sm text-muted-foreground">Authenticating user...</div>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!currentAuthUser || !currentUserProfile) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center max-w-md">
          <UserX className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <div className="text-xl mb-2">Authentication Required</div>
          <div className="text-sm text-muted-foreground mb-4">
            Please log in to post a project
          </div>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  // Not a client
  if (currentUserProfile.role !== 'client') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center max-w-md">
          <Shield className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <div className="text-xl mb-2">Access Restricted</div>
          <div className="text-sm text-muted-foreground mb-4">
            Only clients can post projects. Your account is registered as a <strong>{currentUserProfile.role}</strong>.
          </div>
          <div className="text-xs text-muted-foreground mb-6">
            If you need to change your account type, please contact support or update your profile settings.
          </div>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          {/* User Info */}
          <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border mt-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Posting as:</p>
                  <p className="font-semibold text-foreground">
                    {currentUserProfile.name} (Client)
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>ID: {currentUserProfile.id}</p>
                <p>Email: {currentUserProfile.email}</p>
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-2">Post a New Project</h1>
          <p className="text-muted-foreground text-lg">
            Connect with talented student freelancers on GigCampus
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              <div>
                <h3 className="text-green-800 font-semibold">Project Posted Successfully!</h3>
                <p className="text-green-700 text-sm">Your project is now live and freelancers can start bidding.</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <div>
                <h3 className="text-red-800 font-semibold">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="p-8 space-y-6">
            {/* Project Title */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <FileText className="w-4 h-4 inline-block mr-2" />
                Project Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.title ? 'border-red-300' : 'border-border'
                }`}
                placeholder="e.g., Build a responsive website for my startup"
                maxLength={100}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
              <p className="text-muted-foreground text-xs mt-1">
                {formData.title.length}/100 characters
              </p>
            </div>

            {/* Project Category */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Tag className="w-4 h-4 inline-block mr-2" />
                Category *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <div
                    key={category.value}
                    className={`flex flex-col p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      formData.category === category.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-border'
                    }`}
                    onClick={() => handleInputChange('category', category.value)}
                  >
                    <span className="font-medium text-foreground">{category.label}</span>
                    <span className="text-sm text-muted-foreground mt-1">{category.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Project Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={6}
                className={`w-full px-4 py-3 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                  errors.description ? 'border-red-300' : 'border-border'
                }`}
                placeholder="Describe your project in detail. Include requirements, expectations, deliverables, and any specific skills needed..."
                maxLength={2000}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
              <p className="text-muted-foreground text-xs mt-1">
                {formData.description.length}/2000 characters
              </p>
            </div>

            {/* Budget Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <DollarSign className="w-4 h-4 inline-block mr-2" />
                  Minimum Budget ($) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={formData.budget_min || ''}
                  onChange={(e) => handleInputChange('budget_min', parseInt(e.target.value) || 0)}
                  className={`w-full px-4 py-3 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.budget_min ? 'border-red-300' : 'border-border'
                  }`}
                  placeholder="50"
                />
                {errors.budget_min && (
                  <p className="text-red-500 text-sm mt-1">{errors.budget_min}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Maximum Budget ($) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={formData.budget_max || ''}
                  onChange={(e) => handleInputChange('budget_max', parseInt(e.target.value) || 0)}
                  className={`w-full px-4 py-3 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.budget_max ? 'border-red-300' : 'border-border'
                  }`}
                  placeholder="200"
                />
                {errors.budget_max && (
                  <p className="text-red-500 text-sm mt-1">{errors.budget_max}</p>
                )}
              </div>
            </div>

            {/* Budget Preview */}
            {formData.budget_min > 0 && formData.budget_max > 0 && formData.budget_min < formData.budget_max && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  <strong>Budget Range:</strong> ${formData.budget_min.toLocaleString()} - ${formData.budget_max.toLocaleString()}
                  <span className="text-blue-600 ml-2">
                    (stored as {(formData.budget_min * 100).toLocaleString()} - {(formData.budget_max * 100).toLocaleString()} cents)
                  </span>
                </p>
              </div>
            )}

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Calendar className="w-4 h-4 inline-block mr-2" />
                Project Deadline *
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
                min={getMinDate()}
                className={`w-full px-4 py-3 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.deadline ? 'border-red-300' : 'border-border'
                }`}
              />
              {errors.deadline && (
                <p className="text-red-500 text-sm mt-1">{errors.deadline}</p>
              )}
              {formData.deadline && (
                <p className="text-muted-foreground text-xs mt-1">
                  Deadline will be set to end of day: {new Date(formData.deadline + 'T23:59:59').toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                * Required fields
              </p>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Posting Project...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Post Project
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">Tips for a Great Project Post</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>• Be specific about your requirements and expectations</li>
            <li>• Set a realistic budget and timeline for your project</li>
            <li>• Include any relevant files, mockups, or reference materials</li>
            <li>• Mention preferred skills or experience level</li>
            <li>• Be responsive to freelancer questions and proposals</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AddProject