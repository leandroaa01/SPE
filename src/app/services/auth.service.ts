import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

interface LoginResponse {
    token: string;
    role?: string;
    roles?: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private tokenKey = 'auth_token';
    private rolesKey = 'auth_roles';
    private userInfoSubject = new BehaviorSubject<any>(null);
    userInfo$ = this.userInfoSubject.asObservable();

    constructor(private http: HttpClient) {
        const token = this.getToken();
        if (token && this.isTokenValid(token)) {
            this.userInfoSubject.next(this.decodeToken(token));
        } else {
            this.logout();
        }
    }

    login(username: string, password: string): Observable<LoginResponse> {
        return this.http.post<LoginResponse>('http://localhost:8080/auth/login', { username, password }).pipe(
            tap((res) => {
                this.setToken(res.token);
                const resolvedRoles = this.extractRolesFromResponse(res);
                this.setRoles(resolvedRoles);
                this.userInfoSubject.next(this.decodeToken(res.token));
            })
        );
    }

    setToken(token: string) {
        localStorage.setItem(this.tokenKey, token);
    }

    getToken(): string | null {
        const raw = localStorage.getItem(this.tokenKey);
        const trimmed = raw?.trim?.() ?? '';
        if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
            return null;
        }
        return trimmed;
    }

    isAuthenticated(): boolean {
        const token = this.getToken();
        if (!token || !this.isTokenValid(token)) {
            return false;
        }
        const payload = this.decodeToken(token);
        if (!payload) {
            return false;
        }

        // JWT exp é em segundos
        const exp = payload?.exp;
        if (typeof exp === 'number') {
            const nowSeconds = Math.floor(Date.now() / 1000);
            if (exp <= nowSeconds) {
                this.logout();
                return false;
            }
        }

        return true;
    }

    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.rolesKey);
        this.userInfoSubject.next(null);
    }

    setRoles(roles: string[]) {
        localStorage.setItem(this.rolesKey, JSON.stringify(roles));
    }

    getRoles(): string[] {
        const raw = localStorage.getItem(this.rolesKey);
        if (!raw) {
            return [];
        }
        try {
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

    getNormalizedRoles(): string[] {
        return this.getRoles().map((role) => role.replace(/^ROLE_/, ''));
    }

    getDefaultRouteByRole(): string {
        const roles = this.getNormalizedRoles();
        if (roles.includes('ADMIN')) {
            return '/admin';
        }
        return '/home';
    }

    decodeToken(token: string): any {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                return null;
            }
            const payloadJson = this.base64UrlToJson(parts[1]);
            if (!payloadJson) {
                return null;
            }
            return JSON.parse(payloadJson);
        } catch {
            return null;
        }
    }

    private isTokenValid(token: string): boolean {
        const trimmed = token?.trim?.() ?? '';
        if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
            return false;
        }
        const parts = trimmed.split('.');
        if (parts.length !== 3) {
            return false;
        }
        // payload precisa ser decodificável
        return this.base64UrlToJson(parts[1]) !== null;
    }

    private base64UrlToJson(base64Url: string): string | null {
        try {
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
            return atob(padded);
        } catch {
            return null;
        }
    }

    private extractRolesFromResponse(response: LoginResponse): string[] {
        if (Array.isArray(response.roles) && response.roles.length > 0) {
            return response.roles as string[];
        }
        if (response.role) {
            return [response.role];
        }
        return [];
    }
}
