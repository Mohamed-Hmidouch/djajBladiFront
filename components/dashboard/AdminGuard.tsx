'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getToken, 
  getUserRole, 
  isTokenExpired,
  clearTokens 
} from '@/lib/jwt';

/* ============================================
   ADMIN GUARD - SECURE VERSION
   ============================================
   
   ⚠️ IMPORTANT SECURITY NOTES:
   
   1. Le rôle est TOUJOURS extrait du JWT, jamais du localStorage/cookies
   2. Même si un utilisateur modifie le token dans le navigateur:
      - La signature JWT sera invalide
      - Le backend rejettera toutes les requêtes API
      - L'utilisateur verra une page vide (pas de données)
   
   3. Ce guard est une protection UX, pas une vraie sécurité
      - La vraie sécurité est côté backend
      - Ce guard empêche juste l'affichage de l'UI admin
   
   ============================================ */

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminAccess = () => {
      // 1. Vérifier la présence du token
      const token = getToken();
      
      if (!token) {
        router.replace('/login');
        return;
      }

      // 2. Vérifier si le token est expiré
      if (isTokenExpired(token)) {
        clearTokens();
        router.replace('/login');
        return;
      }

      // 3. Extraire le rôle UNIQUEMENT depuis le JWT
      const role = getUserRole();
      
      // 4. Vérifier le rôle Admin
      if (role !== 'Admin') {
        // Log pour debugging (peut être retiré en production)
        console.warn('[AdminGuard] Accès refusé. Rôle détecté:', role);
        router.replace('/dashboard');
        return;
      }

      // 5. Tout est OK - autoriser l'accès
      setAllowed(true);
      setChecking(false);
    };

    checkAdminAccess();

    // Re-vérifier périodiquement (au cas où le token expire)
    const interval = setInterval(checkAdminAccess, 30000);
    
    return () => clearInterval(interval);
  }, [router]);

  // Afficher un loader pendant la vérification
  if (checking && !allowed) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-10 h-10 border-4 border-[var(--color-brand)] border-t-transparent rounded-full" />
          <p className="text-sm text-[var(--color-text-muted)]">Vérification des droits admin...</p>
        </div>
      </div>
    );
  }

  // Non autorisé - ne rien afficher (redirection en cours)
  if (!allowed) {
    return null;
  }

  // Autorisé - afficher le contenu
  return <>{children}</>;
}
