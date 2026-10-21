// Prototype account store. Accounts live in this browser's localStorage only,
// so this is a stand-in for a real backend (e.g. Supabase Auth). Passwords are
// salted and hashed with SHA-256 so they are never stored in plain text, but
// that is NOT a substitute for server-side authentication.

const KEY = "tma_accounts";
const SALT = "tma-955110-v1";

function readAccounts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function hashPassword(studentId, password) {
  if (!globalThis.crypto?.subtle) throw new Error("no-crypto");
  const data = new TextEncoder().encode(`${SALT}:${studentId}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createAccount({ studentId, firstName, lastName, email, password }) {
  const accounts = readAccounts();
  if (accounts.some((account) => account.studentId === studentId)) {
    return { ok: false, error: "exists" };
  }
  const passwordHash = await hashPassword(studentId, password);
  const account = {
    studentId,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify([...accounts, account]));
  return { ok: true, account };
}

export async function verifyAccount(studentId, password) {
  const account = readAccounts().find((item) => item.studentId === studentId);
  if (!account) return { ok: false, error: "not-found" };
  const passwordHash = await hashPassword(studentId, password);
  if (passwordHash !== account.passwordHash) return { ok: false, error: "wrong-password" };
  return { ok: true, account };
}
