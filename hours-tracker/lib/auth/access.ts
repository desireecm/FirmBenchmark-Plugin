// Sign-in rules (PLAN.md §11): the account must be in the company domain AND on the
// app's User allow-list as an active user. Kept pure so it can be unit-tested.

export interface AllowListUser {
  isActive: boolean;
}

export function isAllowedDomain(email: string | null | undefined, domain: string): boolean {
  if (!email || !domain) return false;
  return email.toLowerCase().endsWith(`@${domain.toLowerCase()}`);
}

export function canSignIn(
  email: string | null | undefined,
  domain: string,
  user: AllowListUser | null,
): boolean {
  return isAllowedDomain(email, domain) && user != null && user.isActive;
}
