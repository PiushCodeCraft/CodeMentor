import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'mentor']).default('student'),
  skills: z.array(z.string().trim()).optional().default([]),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional().default(''),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .optional(),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
  skills: z.array(z.string().trim()).optional(),
  avatar: z.string().url('Avatar must be a valid URL').or(z.literal('')).optional(),
  isAvailable: z.boolean().optional(),
});

export const createRequestSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .max(120, 'Title cannot exceed 120 characters'),
  description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional().default(''),
  code: z
    .string({ required_error: 'Code snippet is required' })
    .min(5, 'Code snippet must be at least 5 characters'),
  repoUrl: z.string().url('Repo URL must be a valid URL').or(z.literal('')).optional().default(''),
  tech: z.array(z.string().trim()).optional().default([]),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  price: z.number().min(0, 'Price cannot be negative').default(0),
});

export const createCommentSchema = z.object({
  line: z
    .number({ required_error: 'Line number is required' })
    .int('Line number must be an integer')
    .min(1, 'Line number must be at least 1'),
  text: z
    .string({ required_error: 'Comment text is required' })
    .trim()
    .min(1, 'Comment text cannot be empty')
    .max(2000, 'Comment text cannot exceed 2000 characters'),
});

export const resolveCommentSchema = z.object({
  status: z.enum(['open', 'resolved']).optional(),
});

export const createReviewSchema = z.object({
  sessionId: z.string({ required_error: 'sessionId is required' }).min(1, 'sessionId is required'),
  rating: z
    .number({ required_error: 'Rating is required' })
    .int('Rating must be an integer between 1 and 5')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  comment: z.string().max(1000, 'Comment cannot exceed 1000 characters').optional().default(''),
});

/**
 * Middleware factory to validate request body with a Zod schema
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return res.status(400).json({
      success: false,
      message: errors[0]?.message || 'Validation error',
      errors,
    });
  }

  req.body = result.data;
  next();
};
