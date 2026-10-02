// Professional validation utilities for OWERU Foundation

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) return 'Email is required'
  if (!emailRegex.test(email)) return 'Please enter a valid email address'
  return null
}

export const validatePhone = (phone) => {
  const phoneRegex = /^(\+255|0)?[67]\d{8}$/
  if (!phone) return 'Phone number is required'
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return 'Please enter a valid Tanzanian phone number (e.g., 0712345678 or +255712345678)'
  }
  return null
}

export const validateAmount = (amount, min = 1000) => {
  const numAmount = Number(amount)
  if (!amount) return 'Amount is required'
  if (isNaN(numAmount)) return 'Please enter a valid number'
  if (numAmount < min) return `Minimum amount is ${min} TZS`
  if (numAmount > 10000000) return 'Maximum amount is 10,000,000 TZS'
  return null
}

export const validateName = (name) => {
  if (!name) return 'Name is required'
  if (name.trim().length < 2) return 'Name must be at least 2 characters'
  if (name.trim().length > 100) return 'Name must be less than 100 characters'
  return null
}

export const validatePassword = (password) => {
  if (!password) return 'Password is required'
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter'
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number'
  return null
}

export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`
  }
  return null
}

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  return input.trim().replace(/[<>]/g, '')
}

export const formatCurrency = (amount) => {
  return 'TZS ' + Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

export const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const MAX_DONATION_TZS = 10000000

export const validateDonationForm = (data) => {
  const errors = {}
  
  const amountError = validateAmount(data.amount)
  if (amountError) errors.amount = amountError
  
  if (data.paymentMethod === 'mpesa') {
    const phoneError = validatePhone(data.mpesaPhone)
    if (phoneError) errors.mpesaPhone = phoneError
  } else if (data.paymentMethod === 'card') {
    if (!data.cardNumber || data.cardNumber.replace(/\D/g, '').length < 12) {
      errors.cardNumber = data.cardNumber ? 'Please enter a valid card number' : 'Card number is required'
    }
  } else {
    const refError = validateRequired(data.paymentRef, 'Payment reference')
    if (refError) errors.paymentRef = refError
  }
  
  if (data.asGuest && data.donorName) {
    const nameError = validateName(data.donorName)
    if (nameError) errors.donorName = nameError
  }
  
  return errors
}

export const validateLoginForm = (data) => {
  const errors = {}
  
  const emailError = validateEmail(data.email)
  if (emailError) errors.email = emailError
  
  const passwordError = validateRequired(data.password, 'Password')
  if (passwordError) errors.password = passwordError
  
  return errors
}

export const validateRegisterForm = (data) => {
  const errors = {}
  
  const nameError = validateName(data.name)
  if (nameError) errors.name = nameError
  
  const emailError = validateEmail(data.email)
  if (emailError) errors.email = emailError
  
  const passwordError = validatePassword(data.password)
  if (passwordError) errors.password = passwordError
  
  return errors
}
