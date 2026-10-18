import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72),
});

export const tourSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(10).max(1200),
  location: z.string().trim().min(2).max(100),
  durationDays: z.coerce.number().int().min(1).max(30),
  price: z.coerce.number().int().min(1).max(10_000_000),
  category: z.string().trim().min(2).max(50),
  imageUrl: z.string().url().nullable().optional(),
});

export const tourUpdateSchema = tourSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });