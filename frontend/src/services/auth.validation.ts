import { ApiError } from "@/src/services/api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AuthFieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function validateLogin(email: string, password: string): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  if (!EMAIL_PATTERN.test(email.trim())) errors.email = "Masukkan email yang valid";
  if (!password) errors.password = "Password wajib diisi";
  return errors;
}

export function validateRegistration(
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
): AuthFieldErrors {
  const errors = validateLogin(email, password);
  if (name.trim().length < 2) errors.name = "Nama minimal 2 karakter";
  if (password.length < 8) errors.password = "Password minimal 8 karakter";
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.password = "Gunakan kombinasi huruf dan angka";
  } else if (new TextEncoder().encode(password).length > 72) {
    errors.password = "Password terlalu panjang";
  }
  if (confirmPassword !== password) {
    errors.confirmPassword = "Konfirmasi password tidak cocok";
  }
  return errors;
}

export function authErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.detail === "invalid_credentials") return "Email atau password salah";
    if (error.detail === "email_already_registered") return "Email sudah terdaftar";
    if (error.status === 422) return "Periksa kembali data yang dimasukkan";
    if (error.status >= 500) return "Server sedang bermasalah. Coba lagi nanti";
  }
  if (error instanceof Error && error.message === "session_storage_failed") {
    return "Sesi tidak dapat disimpan di perangkat";
  }
  return "Tidak dapat terhubung. Periksa koneksi lalu coba lagi";
}