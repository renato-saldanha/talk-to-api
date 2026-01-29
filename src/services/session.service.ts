import { Injectable } from "@nestjs/common";

@Injectable()
export class SessionService {
  private readonly expiryMinutes: number;

  constructor() {
    this.expiryMinutes = parseInt(
      process.env.SESSION_EXPIRY_MINUTES || "15",
      10,
    );
  }

  isExpired(lastActivity: Date): boolean {
    const now = new Date();
    const diffMs = now.getTime() - lastActivity.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    return diffMinutes > this.expiryMinutes;
  }

  getExpiryMinutes(): number {
    return this.expiryMinutes;
  }
}
