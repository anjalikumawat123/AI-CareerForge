/**
 * middleware/validate.js
 * Express middleware factory for request body validation.
 *
 * Usage:
 *   import { validate, registerSchema, loginSchema } from '../middleware/validate.js'
 *   router.post('/register', validate(registerSchema), handler)
 *
 * No external validation library is used — plain JS keeps dependencies minimal.
 * Swap this out for Zod/Joi later if requirements grow.
 */

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const registerSchema = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 80,
    label: 'Name',
  },
  email: {
    required: true,
    isEmail: true,
    label: 'Email',
  },
  password: {
    required: true,
    minLength: 8,
    maxLength: 128,
    label: 'Password',
  },
}

export const loginSchema = {
  email: {
    required: true,
    isEmail: true,
    label: 'Email',
  },
  password: {
    required: true,
    label: 'Password',
  },
}

// ---------------------------------------------------------------------------
// Validator
// ---------------------------------------------------------------------------

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

/**
 * Returns an Express middleware that validates req.body against schema.
 * Responds 400 with { errors: [...] } on failure, otherwise calls next().
 */
export function validate(schema) {
  return (req, res, next) => {
    const errors = []

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field]
      const label = rules.label ?? field

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${label} is required`)
        continue
      }

      if (value !== undefined && value !== null) {
        const str = String(value)

        if (rules.isEmail && !isValidEmail(str)) {
          errors.push(`${label} must be a valid email address`)
        }
        if (rules.minLength && str.length < rules.minLength) {
          errors.push(`${label} must be at least ${rules.minLength} characters`)
        }
        if (rules.maxLength && str.length > rules.maxLength) {
          errors.push(`${label} must be at most ${rules.maxLength} characters`)
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors })
    }

    next()
  }
}
