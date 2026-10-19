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


 export const bookingSchema = z.object({
  tourId: z.string().min(1),
  additionalGuests: z.coerce.number().int().min(0).max(19),
  travelDate: z.coerce.date().refine((date) => date.getTime() > Date.now(), {
    message: "Travel date must be in the future",
  }),
});

export const bookingStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]),
});

export const aiRecommendSchema = z.object({
  interests: z.string().trim().min(2).max(300),
  budget: z.coerce.number().int().min(1).max(1_000_000),
  durationDays: z.coerce.number().int().min(1).max(14),
  preferredLocation: z.string().trim().max(100).optional(),
  travelCompanion: z.enum(["solo", "couple", "family", "friends"]).default("solo"),
  startingFrom: z.enum(["Dhaka", "Chattogram", "Sylhet", "Other"]).default("Dhaka"),
  travelPace: z.enum(["budget", "standard", "luxury"]).default("standard"),
});