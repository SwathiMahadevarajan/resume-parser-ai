import { z } from 'zod';

export const PersonalInfoSchema = z.object({
  fullName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  portfolio: z.string().url().optional().nullable(),
});

export const WorkExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  current: z.boolean().optional().nullable(),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
});

export const EducationSchema = z.object({
  institution: z.string(),
  degree: z.string().optional().nullable(),
  field: z.string().optional().nullable(),
  graduationDate: z.string().optional().nullable(),
  gpa: z.string().optional().nullable(),
});

export const ResumeSchema = z.object({
  personal: PersonalInfoSchema,
  experience: z.array(WorkExperienceSchema).optional().nullable(),
  education: z.array(EducationSchema).optional().nullable(),
  skills: z.array(z.string()).optional().nullable(),
  summary: z.string().optional().nullable(),
});

export const validateResumeData = (data) => {
  try {
    return {
      success: true,
      data: ResumeSchema.parse(data),
    };
  } catch (error) {
    return {
      success: false,
      error: error.errors,
    };
  }
};
