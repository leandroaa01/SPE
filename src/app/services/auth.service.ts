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
        if (token) {
            this.userInfoSubject.next(this.decodeToken(token));
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
        return localStorage.getItem(this.tokenKey);
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
        return '/meus-dados';
    }

    decodeToken(token: string): any {
        try {
            const payload = token.split('.')[1];
            return JSON.parse(atob(payload));
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
