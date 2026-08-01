import { z } from "zod";

export const authDto = {
  loginSchema: z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
};

export type LoginDto = z.infer<typeof authDto.loginSchema>;
