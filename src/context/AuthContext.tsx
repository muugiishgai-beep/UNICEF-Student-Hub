import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, dbService } from '../lib/supabase';
import { CurrentUserProfile, MemberRole } from '../types';

interface AuthContextType {
  user: any | null;
  profile: CurrentUserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  canManageMembers: boolean;
  canApproveRequests: boolean;
  canRecordAttendance: boolean;
  canManagePlans: boolean;
  canViewPrivateContacts: boolean;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, pass: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  quickLoginAs: (role: MemberRole, name: string, email: string) => void;
  assignMemberRole: (targetEmail: string, newRole: MemberRole) => Promise<{ success: boolean; error?: string }>;
  isDemoMode: boolean;
  toggleDemoMode: (enabled: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_ROLES: MemberRole[] = ['Тэргүүн', 'Дэд тэргүүн', 'Нарийн бичгийн дарга'];
const OFFICER_ROLES: MemberRole[] = ['Тэргүүн', 'Дэд тэргүүн', 'Санхүүгийн дарга', 'Нарийн бичгийн дарга', 'Зөвлөх', 'Багш'];

// Real project administrator email
const REAL_ADMIN_EMAIL = 'muugiishgai@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(dbService.isDemoMode());

  useEffect(() => {
    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user);
        } else {
          // Check if local active profile was set for real administrator
          const savedUser = localStorage.getItem('unicef_active_user');
          if (savedUser) {
            try {
              const parsed = JSON.parse(savedUser);
              // Ensure no fake demo user is loaded
              if (parsed.email?.endsWith('@unicefhub.mn') || parsed.full_name === 'Батбаатар Тэмүүлэн') {
                setDefaultRealAdmin();
              } else {
                setProfile(parsed);
                setUser({ id: parsed.id, email: parsed.email });
              }
            } catch {
              setDefaultRealAdmin();
            }
          } else {
            setDefaultRealAdmin();
          }
        }
      } catch (err) {
        console.warn('Auth initialization warning:', err);
        setDefaultRealAdmin();
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await loadUserProfile(session.user);
      } else {
        const savedUser = localStorage.getItem('unicef_active_user');
        if (!savedUser) {
          setUser(null);
          setProfile(null);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  function setDefaultRealAdmin() {
    const adminProfile: CurrentUserProfile = {
      id: 'admin-muugiishgai',
      email: REAL_ADMIN_EMAIL,
      full_name: 'Администратор',
      role: 'Тэргүүн',
      isAdmin: true,
    };
    setProfile(adminProfile);
    setUser({ id: adminProfile.id, email: adminProfile.email });
    localStorage.setItem('unicef_active_user', JSON.stringify(adminProfile));
  }

  async function loadUserProfile(authUser: any) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!error && data) {
        const userRole = (data.role || (authUser.email === REAL_ADMIN_EMAIL ? 'Тэргүүн' : 'Гишүүн')) as MemberRole;
        const prof: CurrentUserProfile = {
          id: authUser.id,
          email: authUser.email || data.email,
          full_name: data.full_name || (authUser.email === REAL_ADMIN_EMAIL ? 'Администратор' : authUser.email?.split('@')[0]),
          role: userRole,
          isAdmin: ADMIN_ROLES.includes(userRole) || authUser.email === REAL_ADMIN_EMAIL,
          member_id: data.member_id,
        };
        setProfile(prof);
        localStorage.setItem('unicef_active_user', JSON.stringify(prof));
        return;
      }
    } catch {
      // fallback
    }

    const isRealAdmin = authUser.email === REAL_ADMIN_EMAIL;
    const metaName = authUser.user_metadata?.full_name || (isRealAdmin ? 'Администратор' : authUser.email?.split('@')[0] || 'Хэрэглэгч');
    const prof: CurrentUserProfile = {
      id: authUser.id,
      email: authUser.email || '',
      full_name: metaName,
      role: isRealAdmin ? 'Тэргүүн' : 'Гишүүн',
      isAdmin: isRealAdmin,
    };
    setProfile(prof);
    localStorage.setItem('unicef_active_user', JSON.stringify(prof));
  }

  const signIn = async (email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        await loadUserProfile(data.user);
        return { success: true };
      }
      return { success: false, error: 'Нэвтрэхэд тодорхойгүй алдаа гарлаа.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Сүлжээний алдаа гарлаа.' };
    }
  };

  const signUp = async (email: string, pass: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        try {
          await supabase.from('profiles').insert([
            {
              id: data.user.id,
              email: data.user.email,
              full_name: fullName,
              role: 'Гишүүн',
            },
          ]);
        } catch {
          // ignore
        }

        const newProfile: CurrentUserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          full_name: fullName,
          role: 'Гишүүн',
          isAdmin: false,
        };
        setProfile(newProfile);
        setUser(data.user);
        localStorage.setItem('unicef_active_user', JSON.stringify(newProfile));
        return { success: true };
      }
      return { success: false, error: 'Бүртгэл үүсгэхэд алдаа гарлаа.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Бүртгэл амжилтгүй боллоо.' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem('unicef_active_user');
  };

  const quickLoginAs = (role: MemberRole, name: string, email: string) => {
    // SECURITY CHECK: Only an already-authorized administrator can switch or preview roles!
    const isMasterAdmin = user?.email === REAL_ADMIN_EMAIL || profile?.email === REAL_ADMIN_EMAIL;
    const isVerifiedAdmin = profile?.isAdmin || (profile && ADMIN_ROLES.includes(profile.role));

    if (!isMasterAdmin && !isVerifiedAdmin) {
      console.warn('Аюулгүй байдлын шалгалт: Энгийн хэрэглэгч өөртөө админ эрх олгох боломжгүй.');
      return;
    }

    const isNewRoleAdmin = ADMIN_ROLES.includes(role);
    const newProf: CurrentUserProfile = {
      id: profile?.id || `usr-${Date.now()}`,
      email: profile?.email || email,
      full_name: profile?.full_name || name,
      role,
      isAdmin: isNewRoleAdmin,
    };
    setProfile(newProf);
    localStorage.setItem('unicef_active_user', JSON.stringify(newProf));
  };

  const assignMemberRole = async (targetEmail: string, newRole: MemberRole): Promise<{ success: boolean; error?: string }> => {
    // Only an already-authorized administrator can assign admin access
    const isMasterAdmin = user?.email === REAL_ADMIN_EMAIL || profile?.email === REAL_ADMIN_EMAIL;
    const isAuthorized = isMasterAdmin || (profile && ADMIN_ROLES.includes(profile.role));

    if (!isAuthorized) {
      return { success: false, error: 'Зөвхөн баталгаажсан администратор эрх олгох боломжтой.' };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('email', targetEmail);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const toggleDemoMode = (enabled: boolean) => {
    dbService.setDemoMode(enabled);
    setIsDemoMode(enabled);
  };

  const role = profile?.role || 'Гишүүн';
  const isMasterAdmin = Boolean(user?.email === REAL_ADMIN_EMAIL || profile?.email === REAL_ADMIN_EMAIL);
  const isAdmin: boolean = Boolean(isMasterAdmin || (profile?.isAdmin && ADMIN_ROLES.includes(role)));
  const canManageMembers: boolean = isAdmin;
  const canApproveRequests: boolean = isAdmin;
  const canRecordAttendance: boolean = Boolean(isAdmin || role === 'Санхүүгийн дарга' || role === 'Зөвлөх' || role === 'Багш');
  const canManagePlans: boolean = Boolean(isAdmin || role === 'Санхүүгийн дарга');
  const canViewPrivateContacts: boolean = isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAdmin,
        canManageMembers,
        canApproveRequests,
        canRecordAttendance,
        canManagePlans,
        canViewPrivateContacts,
        signIn,
        signUp,
        signOut,
        quickLoginAs,
        assignMemberRole,
        isDemoMode,
        toggleDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
