export interface RegistrationWindow {
  opensAt: Date;
  closesAt: Date;
}

export function isWindowOpen(window: RegistrationWindow, now: Date = new Date()): boolean {
  return now >= window.opensAt && now <= window.closesAt;
}

export function validateWindow(window: RegistrationWindow): void {
  if (window.closesAt <= window.opensAt) {
    throw new Error("Registration window close date must be after open date");
  }
}
