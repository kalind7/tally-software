"use server";

import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { AuthError } from "next-auth";

export async function registerUser(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const name = (formData.get("name") as string)?.trim();

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.create({
    data: { email, passwordHash, name: name || null },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/companies" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Registration succeeded but sign-in failed." };
    }
    throw error;
  }
}

export async function loginUser(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", { email, password, redirectTo: "/companies" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
}
