import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { ToastContainer, ToastMessage } from './components/Toast';
import { AuthModal } from './components/AuthModal';
import { DatabaseModal } from './components/DatabaseModal';
import { MembershipApplicationModal } from './components/MembershipApplicationModal';

// Views
import { DashboardView } from './views/DashboardView';
import { MembersView } from './views/MembersView';
import { RequestsView } from './views/RequestsView';
import { AttendanceView } from './views/AttendanceView';
import { ParticipationView } from './views/ParticipationView';
import { PlansEventsView } from './views/PlansEventsView';
import { ReportsView } from './views/ReportsView';
import { DatabaseView } from './views/DatabaseView';

import { dbService } from './lib/supabase';
import {
  Member,
  MembershipRequest,
  EventItem,
  AttendanceRecord,
  ParticipationRecord,
  PlanItem,
  Announcement,
} from './types';
import { Loader2 } from 'lucide-react';

function MainAppContent() {
  const { isDemoMode } = useAuth();

  // Navigation
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

  // Data states
  const [members, setMembers] = useState<Member[]>([]);
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [participation, setParticipation] = useState<ParticipationRecord[]>([]);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load all data
  const loadData = useCallback(async () => {
    try {
      const [
        mList,
        rList,
        eList,
        aList,
        pList,
        plList,
        anList,
      ] = await Promise.all([
        dbService.getMembers(),
        dbService.getRequests(),
        dbService.getEvents(),
        dbService.getAttendance(),
        dbService.getParticipation(),
        dbService.getPlans(),
        dbService.getAnnouncements(),
      ]);

      setMembers(mList);
      setRequests(rList);
      setEvents(eList);
      setAttendance(aList);
      setParticipation(pList);
      setPlans(plList);
      setAnnouncements(anList);
    } catch (err: any) {
      console.error('Data load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, isDemoMode]);

  const pendingRequestsCount = requests.filter((r) => r.status === 'Хүлээгдэж буй').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Navbar */}
      <Navbar
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
        onOpenApplicationModal={() => setIsApplicationModalOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          pendingRequestsCount={pendingRequestsCount}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onOpenApplicationModal={() => setIsApplicationModalOpen(true)}
          onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
              <p className="text-xs font-semibold">Өгөгдлийг уншиж байна...</p>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  members={members}
                  requests={requests}
                  events={events}
                  attendance={attendance}
                  plans={plans}
                  announcements={announcements}
                  onNavigate={setCurrentTab}
                  onOpenApplicationModal={() => setIsApplicationModalOpen(true)}
                />
              )}

              {currentTab === 'members' && (
                <MembersView
                  members={members}
                  onRefresh={loadData}
                  onShowToast={addToast}
                />
              )}

              {currentTab === 'requests' && (
                <RequestsView
                  requests={requests}
                  onRefresh={loadData}
                  onOpenApplicationModal={() => setIsApplicationModalOpen(true)}
                  onShowToast={addToast}
                />
              )}

              {currentTab === 'attendance' && (
                <AttendanceView
                  members={members}
                  events={events}
                  attendance={attendance}
                  onRefresh={loadData}
                  onShowToast={addToast}
                />
              )}

              {currentTab === 'participation' && (
                <ParticipationView
                  members={members}
                  participation={participation}
                  onRefresh={loadData}
                  onShowToast={addToast}
                />
              )}

              {currentTab === 'plans_events' && (
                <PlansEventsView
                  plans={plans}
                  events={events}
                  announcements={announcements}
                  members={members}
                  onRefresh={loadData}
                  onShowToast={addToast}
                />
              )}

              {currentTab === 'reports' && (
                <ReportsView
                  members={members}
                  attendance={attendance}
                  participation={participation}
                  plans={plans}
                  onShowToast={addToast}
                />
              )}

              {currentTab === 'database' && (
                <DatabaseView onShowToast={addToast} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onShowToast={addToast}
      />

      <DatabaseModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        onShowToast={addToast}
      />

      <MembershipApplicationModal
        isOpen={isApplicationModalOpen}
        onClose={() => setIsApplicationModalOpen(false)}
        onShowToast={addToast}
        onSuccessSubmitted={loadData}
      />

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
