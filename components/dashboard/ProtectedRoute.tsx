'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { 
  isAuthenticated, 
  getUserRole, 
  isTokenExpired, 
  getToken,
  clearTokens 
} from '@/lib/jwt';

/* ============================================
   PROTECTED ROUTE COMPONENT
   ============================================
   
   Ce composant vérifie l'authentification et les permissions
   en décodant le JWT EN TEMPS RÉEL à chaque rendu.
   
   SÉCURITÉ:
   ---------
   - Le rôle est TOUJOURS extrait du JWT, jamais du localStorage
   - Si le token est modifié manuellement, la signature devient invalide
   - Le backend rejettera toutes les requêtes avec un token modifié
   - Ce composant offre une protection côté client pour l'UX
   - La vraie sécurité est côté backend (vérification de signature)
   
   ============================================ */

interface ProtectedRouteProps {
  children: ReactNode;
  /** Roles autorisés à accéder à cette route */
  allowedRoles?: string[];
  /** Route de redirection si non authentifié */
  loginRedirect?: string;
  /** Route de redirection si non autorisé (mauvais rôle) */
  unauthorizedRedirect?: string;
  /** Afficher un loader personnalisé */
  loadingComponent?: ReactNode;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  loginRedirect = '/login',
  unauthorizedRedirect = '/dashboard',
  loadingComponent,
}: ProtectedRouteProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');

  useEffect(() => {
    // Vérification en temps réel du token
    const checkAuth = () => {
      const token = getToken();
      
      // Pas de token → redirection login
      if (!token) {
        router.replace(loginRedirect);
        return;
      }

      // Token expiré → clear et redirection login
      if (isTokenExpired(token)) {
        clearTokens();
        router.replace(loginRedirect);
        return;
      }

      // Authentifié mais pas les bons rôles → redirection unauthorized
      if (allowedRoles && allowedRoles.length > 0) {
        const userRole = getUserRole();
        
        if (!userRole || !allowedRoles.includes(userRole)) {
          setStatus('unauthorized');
          router.replace(unauthorizedRedirect);
          return;
        }
      }

      // Tout est OK
      setStatus('authorized');
    };

    checkAuth();

    // Re-vérifier toutes les 30 secondes (expiration du token)
    const interval = setInterval(checkAuth, 30000);
    
    return () => clearInterval(interval);
  }, [router, allowedRoles, loginRedirect, unauthorizedRedirect]);

  // Loading state
  if (status === 'loading') {
    return loadingComponent || (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-10 h-10 border-4 border-[var(--color-brand)] border-t-transparent rounded-full" />
          <p className="text-sm text-[var(--color-text-muted)]">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Unauthorized - en attente de redirection
  if (status === 'unauthorized') {
    return loadingComponent || (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-[var(--color-brand)]/10 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-[var(--color-brand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-7V4a2 2 0 10-4 0v1.5" />
            </svg>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">Accès non autorisé. Redirection...</p>
        </div>
      </div>
    );
  }

  // Authorized - render children
  return <>{children}</>;
}

/* ============================================
   ROLE-SPECIFIC GUARDS
   ============================================ */

interface RoleGuardProps {
  children: ReactNode;
  loadingComponent?: ReactNode;
}

/**
 * Admin-only route protection
 * Redirects to /dashboard if not Admin
 */
export function AdminRoute({ children, loadingComponent }: RoleGuardProps) {
  return (
    <ProtectedRoute 
      allowedRoles={['Admin']} 
      unauthorizedRedirect="/dashboard"
      loadingComponent={loadingComponent}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * Staff route protection (Admin, Veterinaire, Ouvrier)
 * Redirects to /dashboard if not staff
 */
export function StaffRoute({ children, loadingComponent }: RoleGuardProps) {
  return (
    <ProtectedRoute 
      allowedRoles={['Admin', 'Veterinaire', 'Ouvrier']} 
      unauthorizedRedirect="/dashboard"
      loadingComponent={loadingComponent}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * Veterinaire-only route protection
 */
export function VetRoute({ children, loadingComponent }: RoleGuardProps) {
  return (
    <ProtectedRoute 
      allowedRoles={['Admin', 'Veterinaire']} 
      unauthorizedRedirect="/dashboard"
      loadingComponent={loadingComponent}
    >
      {children}
    </ProtectedRoute>
  );
}
