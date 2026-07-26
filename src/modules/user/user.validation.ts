import { z } from "zod";

export const createUserSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(8, "Пароль должен быть не менее 8 символов")
    .max(100, "Пароль слишком длинный"),
  // .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\W_]{8,}$/, {
  //   message: "Пароль должен содержать минимум одну букву и одну цифру",
  // }),
});
