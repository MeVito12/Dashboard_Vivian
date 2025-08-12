interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  company_id: string;
  branch_id?: string;
  company?: {
    id: string;
    name: string;
    subdomain: string;
  };
}

export class SessionManager {
  private static readonly USER_KEY = 'user';
  private static readonly TOKEN_KEY = 'token';

  static setSession(user: User, token?: string): void {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      if (token) {
        localStorage.setItem(this.TOKEN_KEY, token);
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  // Alias for backward compatibility
  static saveSession(user: User, token?: string): void {
    this.setSession(user, token);
  }

  static getSession(): User | null {
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error reading session:', error);
      return null;
    }
  }

  static getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error reading token:', error);
      return null;
    }
  }

  static clearSession(): void {
    try {
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  static isAuthenticated(): boolean {
    const user = this.getSession();
    return user !== null && user.id !== undefined;
  }

  static getUserId(): string | null {
    const user = this.getSession();
    return user?.id || null;
  }

  static getCompanyId(): string | null {
    const user = this.getSession();
    return user?.company_id || null;
  }
}