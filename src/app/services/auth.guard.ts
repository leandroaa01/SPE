import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const token = auth.getToken();
    if (!token) {
        setTimeout(() => router.navigate(['/login']), 0);
        return false;
    }
    const requiredRole = route.data?.['role'] as string | string[] | undefined;
    if (requiredRole) {
        const userRoles = auth.getNormalizedRoles();
        const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        const hasAccess = requiredRoles.some((role) => userRoles.includes(role));

        if (!hasAccess) {
            setTimeout(() => router.navigate([auth.getDefaultRouteByRole()]), 0);
            return false;
        }
    }

    return true;
};
