import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/admin-dashboard.css";
import "../styles/admin-layout.css";
import {
  approveAccessRequestRequest,
  createUserRequest,
  getAccessRequestByIdRequest,
  getAccessRequestsSummaryRequest,
  getUserByIdRequest,
  getStudiesAdminSummaryRequest,
  getUsersAdminSummaryRequest,
  listAccessRequestsRequest,
  listStudiesAdminRequest,
  listAllStudiesAdminRequest,
  listUsersRequest,
  rejectAccessRequestRequest,
  resetUserPasswordRequest,
  updateUserRequest,
  updateUserStatusRequest,
  type AccessRequestResponse,
  type AccessRequestStatus,
  type AccessRequestSummaryResponse,
  type ParticipantListItemResponse,
  type ParticipantSubmissionStatus,
  type StudyDataSummaryResponse,
  type StudyAdminOverviewResponse,
  type StudySubmissionListItemResponse,
  type StudyType,
  type UserResponse,
  type UserRole,
  type StudyAdminSummaryResponse,
  type UserAdminSummaryResponse,
} from "../admin/adminApi";
import { SESSION_EXPIRED_ERROR } from "../auth/authFetch";
import AdminLayout from "../components/layout/AdminLayout";
import type { AdminNavigationKey } from "../components/layout/AdminSidebar";
import AdminAccessRequests from "./AdminAccessRequests";
import AdminUsers from "./AdminUsers";
import AdminStudies from "./AdminStudies";

const ACCESS_REQUESTS_PAGE_SIZE = 10;

const ACCESS_REQUEST_STATUS_LABELS: Record<AccessRequestStatus, string> = {
  pending: "În așteptare",
  approved: "Aprobată",
  rejected: "Respinsă",
};

const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  researcher: "Cercetător",
};

const STUDY_TYPE_LABELS: Record<StudyType, string> = {
  observational_prospective: "Observațional prospectiv",
  observational_retrospective: "Observațional retrospectiv",
  observational_mixed: "Observațional mixt",
};

const STUDY_STATUS_LABELS = {
  draft: "Ciornă",
  active: "Activ",
  in_analysis: "În analiză",
  completed: "Finalizat",
} as const;

const SUBMISSION_STATUS_LABELS: Record<ParticipantSubmissionStatus, string> = {
  submitted: "Trimisă",
  validated: "Validată",
  rejected: "Respinsă",
};

function formatDate(value?: string | null): string {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export default function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const navigate = useNavigate();

  const rawTab = searchParams.get("tab") as AdminNavigationKey | null;
  const activeTab: AdminNavigationKey =
    rawTab === "users" || rawTab === "studies" || rawTab === "access_requests"
      ? rawTab
      : "access_requests";

  const [pageError, setPageError] = useState("");

  const [accessRequests, setAccessRequests] = useState<AccessRequestResponse[]>([]);
  const [accessRequestsTotal, setAccessRequestsTotal] = useState(0);
  const [accessRequestsLoading, setAccessRequestsLoading] = useState(true);
  const [accessRequestsPage, setAccessRequestsPage] = useState(1);
  const [accessRequestStatusFilter, setAccessRequestStatusFilter] = useState<
    AccessRequestStatus | ""
  >("");
  const [accessRequestSearch, setAccessRequestSearch] = useState("");
  const [selectedAccessRequest, setSelectedAccessRequest] =
    useState<AccessRequestResponse | null>(null);
  const [accessReviewNotes, setAccessReviewNotes] = useState("");
  const [accessActionLoading, setAccessActionLoading] = useState(false);
  const [accessRequestsSummary, setAccessRequestsSummary] =
    useState<AccessRequestSummaryResponse>({
      total_requests: 0,
      pending_requests: 0,
      approved_requests: 0,
      rejected_requests: 0,
      monthly_requests: [],
    });

  const [usersSummary, setUsersSummary] = useState<UserAdminSummaryResponse>({
    total_users: 0,
    admin_users: 0,
    researcher_users: 0,
    active_users: 0,
    inactive_users: 0,
    verified_users: 0,
    unverified_users: 0,
    monthly_users: [],
  });

  const [studiesSummary, setStudiesSummary] = useState<StudyAdminSummaryResponse>({
    total_studies: 0,
    draft_studies: 0,
    active_studies: 0,
    studies_in_analysis: 0,
    completed_studies: 0,
    monthly_studies: [],
  });

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [userPassword, setUserPassword] = useState("");
  const [userActionMessage, setUserActionMessage] = useState("");
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);

  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("researcher");
  const [newUserInstitution, setNewUserInstitution] = useState("");
  const [newUserDepartment, setNewUserDepartment] = useState("");
  const [newUserSpecialization, setNewUserSpecialization] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserBio, setNewUserBio] = useState("");

  const [studies, setStudies] = useState<StudyAdminOverviewResponse[]>([]);
  const [studiesLoading, setStudiesLoading] = useState(true);

  function handleTabChange(tab: AdminNavigationKey) {
    if (tab === "dashboard") {
      setSearchParams({ tab: "access_requests" });
      return;
    }

    setSearchParams({ tab });
  }

  async function loadAccessRequests() {
    setAccessRequestsLoading(true);

    try {
      const response = await listAccessRequestsRequest({
        page: accessRequestsPage,
        page_size: ACCESS_REQUESTS_PAGE_SIZE,
        status: accessRequestStatusFilter,
        search: accessRequestSearch.trim(),
      });

      setAccessRequests(response.items);
      setAccessRequestsTotal(response.total);
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
        return;
      }

      setPageError(
        error instanceof Error
          ? error.message
          : "Nu s-au putut încărca cererile de acces."
      );
    } finally {
      setAccessRequestsLoading(false);
    }
  }

  async function loadAccessRequestsSummary() {
    try {
      const response = await getAccessRequestsSummaryRequest();
      setAccessRequestsSummary(response);
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
        return;
      }

      setPageError(
        error instanceof Error
          ? error.message
          : "Nu s-au putut încărca statisticile cererilor de acces."
      );
    }
  }

  async function loadUsersSummary() {
    try {
      const response = await getUsersAdminSummaryRequest();
      setUsersSummary(response);
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
        return;
      }

      setPageError(
        error instanceof Error
          ? error.message
          : "Nu s-au putut încărca statisticile utilizatorilor."
      );
    }
  }

  async function loadStudiesSummary() {
    try {
      const response = await getStudiesAdminSummaryRequest();
      setStudiesSummary(response);
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
        return;
      }

      setPageError(
        error instanceof Error
          ? error.message
          : "Nu s-au putut încărca statisticile studiilor."
      );
    }
  }

  async function loadUsers() {
    setUsersLoading(true);

    try {
      const response = await listUsersRequest();
      setUsers(response);
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
        return;
      }

      setPageError(
        error instanceof Error ? error.message : "Nu s-au putut încărca utilizatorii."
      );
    } finally {
      setUsersLoading(false);
    }
  }

  async function loadStudies() {
    setStudiesLoading(true);

    try {
      const allStudies = await listAllStudiesAdminRequest();
      setStudies(allStudies);
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) {
        return;
      }

      setPageError(
        error instanceof Error ? error.message : "Nu s-au putut încărca studiile."
      );
    } finally {
      setStudiesLoading(false);
    }
  }

  useEffect(() => {
    void loadAccessRequests();
    void loadAccessRequestsSummary();
    void loadUsers();
    void loadUsersSummary();
    void loadStudies();
    void loadStudiesSummary();
  }, []);

  useEffect(() => {
    void loadAccessRequests();
  }, [accessRequestStatusFilter, accessRequestsPage]);

  const pendingRequestsCount = accessRequestsSummary.pending_requests;
  const approvedRequestsCount = accessRequestsSummary.approved_requests;
  const rejectedRequestsCount = accessRequestsSummary.rejected_requests;
  const totalAccessRequestsCount = accessRequestsSummary.total_requests;

  const totalUsersCount = usersSummary.total_users;
  const activeUsersCount = usersSummary.active_users;
  const inactiveUsersCount = usersSummary.inactive_users;
  const verifiedUsersCount = usersSummary.verified_users;
  const adminsCount = usersSummary.admin_users;
  const researchersCount = usersSummary.researcher_users;

  const totalStudiesCount = studiesSummary.total_studies;
  const activeStudiesCount = studiesSummary.active_studies;
  const studiesInAnalysisCount = studiesSummary.studies_in_analysis;
  const completedStudiesCount = studiesSummary.completed_studies;
  const draftStudiesCount = studiesSummary.draft_studies;

  async function handleOpenAccessRequest(accessRequestId: number) {
    setPageError("");

    try {
      const detail = await getAccessRequestByIdRequest(accessRequestId);
      setSelectedAccessRequest(detail);
      setAccessReviewNotes(detail.review_notes ?? "");
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Nu s-au putut încărca detaliile cererii."
      );
    }
  }

  async function handleApproveAccessRequest() {
    if (!selectedAccessRequest) {
      return;
    }

    setAccessActionLoading(true);
    setPageError("");

    try {
      const updated = await approveAccessRequestRequest(
        selectedAccessRequest.id,
        accessReviewNotes.trim() || null
      );

      setSelectedAccessRequest(updated);
      await Promise.all([loadAccessRequests(), loadUsers()]);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Nu s-a putut aproba cererea."
      );
    } finally {
      setAccessActionLoading(false);
    }
  }

  async function handleRejectAccessRequest() {
    if (!selectedAccessRequest) {
      return;
    }

    setAccessActionLoading(true);
    setPageError("");

    try {
      const updated = await rejectAccessRequestRequest(
        selectedAccessRequest.id,
        accessReviewNotes.trim() || null
      );

      setSelectedAccessRequest(updated);
      await loadAccessRequests();
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Nu s-a putut respinge cererea."
      );
    } finally {
      setAccessActionLoading(false);
    }
  }

  async function handleOpenUser(userId: number) {
    setPageError("");
    setUserActionMessage("");
    setUserPassword("");

    try {
      const detail = await getUserByIdRequest(userId);
      setSelectedUser(detail);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Nu s-au putut încărca detaliile utilizatorului."
      );
    }
  }

  async function handleToggleUserStatus() {
    if (!selectedUser) {
      return;
    }

    setUserActionLoading(true);
    setPageError("");
    setUserActionMessage("");

    try {
      const updated = await updateUserStatusRequest(selectedUser.id, !selectedUser.is_active);
      setSelectedUser(updated);
      setUserActionMessage("Statusul utilizatorului a fost actualizat.");
      await loadUsers();
      await loadUsersSummary();
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Nu s-a putut actualiza statusul utilizatorului."
      );
    } finally {
      setUserActionLoading(false);
    }
  }

  async function handleResetUserPassword() {
    if (!selectedUser || !userPassword.trim()) {
      return;
    }

    setUserActionLoading(true);
    setPageError("");
    setUserActionMessage("");

    try {
      const response = await resetUserPasswordRequest(selectedUser.id, userPassword.trim());
      setUserActionMessage(response.message);
      setUserPassword("");
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Nu s-a putut reseta parola utilizatorului."
      );
    } finally {
      setUserActionLoading(false);
    }
  }

  async function handleSaveUserEdits() {
    if (!selectedUser) {
      return;
    }

    setUserActionLoading(true);
    setPageError("");
    setUserActionMessage("");

    try {
      const updated = await updateUserRequest(selectedUser.id, {
        full_name: selectedUser.full_name,
        role: selectedUser.role,
        is_verified: selectedUser.is_verified,
        institution: selectedUser.institution,
        department: selectedUser.department,
        specialization: selectedUser.specialization,
        phone: selectedUser.phone,
        bio: selectedUser.bio,
      });

      setSelectedUser(updated);
      setUserActionMessage("Datele utilizatorului au fost actualizate.");
      await loadUsers();
      await loadUsersSummary();
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Nu s-a putut actualiza utilizatorul."
      );
    } finally {
      setUserActionLoading(false);
    }
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setUserActionLoading(true);
    setPageError("");
    setUserActionMessage("");

    try {
      await createUserRequest({
        email: newUserEmail.trim(),
        full_name: newUserFullName.trim(),
        password: newUserPassword,
        role: newUserRole,
        institution: newUserInstitution.trim() || null,
        department: newUserDepartment.trim() || null,
        specialization: newUserSpecialization.trim() || null,
        phone: newUserPhone.trim() || null,
        bio: newUserBio.trim() || null,
      });

      setUserActionMessage("Utilizatorul a fost creat cu succes.");

      setNewUserEmail("");
      setNewUserFullName("");
      setNewUserPassword("");
      setNewUserRole("researcher");
      setNewUserInstitution("");
      setNewUserDepartment("");
      setNewUserSpecialization("");
      setNewUserPhone("");
      setNewUserBio("");
      setIsCreateUserModalOpen(false);

      await loadUsers();
      await loadUsersSummary();
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Nu s-a putut crea utilizatorul."
      );
    } finally {
      setUserActionLoading(false);
    }
  }

  function handleOpenStudy(studyId: number) {
    navigate(`/admin/studii/${studyId}`);
  }

  return (
    <AdminLayout
      activeItem={activeTab}
      title="Administrare VitalStudy"
      actions={
        activeTab === "users" ? (
          <button
            type="button"
            className="admin-btn"
            onClick={() => setIsCreateUserModalOpen(true)}
          >
            Adaugă utilizator
          </button>
        ) : undefined
      }
    >
      <div className="admin-page">
        <section className="admin-shell">
          {pageError ? <div className="admin-banner admin-banner--error">{pageError}</div> : null}

          {userActionMessage ? (
            <div className="admin-banner admin-banner--success">{userActionMessage}</div>
          ) : null}

          {activeTab === "access_requests" ? (
            <AdminAccessRequests
              accessRequests={accessRequests}
              accessRequestsTotal={accessRequestsTotal}
              accessRequestsGlobalTotal={totalAccessRequestsCount}
              accessRequestsMonthlyData={accessRequestsSummary.monthly_requests}
              accessRequestsLoading={accessRequestsLoading}
              accessRequestsPage={accessRequestsPage}
              setAccessRequestsPage={setAccessRequestsPage}
              accessRequestsPageSize={ACCESS_REQUESTS_PAGE_SIZE}
              accessRequestStatusFilter={accessRequestStatusFilter}
              setAccessRequestStatusFilter={setAccessRequestStatusFilter}
              accessRequestSearch={accessRequestSearch}
              setAccessRequestSearch={setAccessRequestSearch}
              selectedAccessRequest={selectedAccessRequest}
              accessReviewNotes={accessReviewNotes}
              setAccessReviewNotes={setAccessReviewNotes}
              accessActionLoading={accessActionLoading}
              accessRequestStatusLabels={ACCESS_REQUEST_STATUS_LABELS}
              formatDate={formatDate}
              pendingRequestsCount={pendingRequestsCount}
              approvedRequestsCount={approvedRequestsCount}
              rejectedRequestsCount={rejectedRequestsCount}
              onReloadAccessRequests={loadAccessRequests}
              onOpenAccessRequest={handleOpenAccessRequest}
              onApproveAccessRequest={handleApproveAccessRequest}
              onRejectAccessRequest={handleRejectAccessRequest}
              onCloseAccessRequest={() => {
                setSelectedAccessRequest(null);
                setAccessReviewNotes("");
              }}
            />
          ) : null}

          {activeTab === "users" ? (
            <AdminUsers
              users={users}
              usersLoading={usersLoading}
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              isCreateUserModalOpen={isCreateUserModalOpen}
              setIsCreateUserModalOpen={setIsCreateUserModalOpen}
              userPassword={userPassword}
              setUserPassword={setUserPassword}
              userActionLoading={userActionLoading}
              newUserEmail={newUserEmail}
              setNewUserEmail={setNewUserEmail}
              newUserFullName={newUserFullName}
              setNewUserFullName={setNewUserFullName}
              newUserPassword={newUserPassword}
              setNewUserPassword={setNewUserPassword}
              newUserRole={newUserRole}
              setNewUserRole={setNewUserRole}
              newUserInstitution={newUserInstitution}
              setNewUserInstitution={setNewUserInstitution}
              newUserDepartment={newUserDepartment}
              setNewUserDepartment={setNewUserDepartment}
              newUserSpecialization={newUserSpecialization}
              setNewUserSpecialization={setNewUserSpecialization}
              newUserPhone={newUserPhone}
              setNewUserPhone={setNewUserPhone}
              newUserBio={newUserBio}
              setNewUserBio={setNewUserBio}
              userRoleLabels={USER_ROLE_LABELS}
              totalUsers={totalUsersCount}
              activeUsersCount={activeUsersCount}
              inactiveUsersCount={inactiveUsersCount}
              verifiedUsersCount={verifiedUsersCount}
              adminsCount={adminsCount}
              researchersCount={researchersCount}
              formatDate={formatDate}
              onOpenUser={handleOpenUser}
              onSaveUserEdits={handleSaveUserEdits}
              onToggleUserStatus={handleToggleUserStatus}
              onResetUserPassword={handleResetUserPassword}
              onCreateUser={handleCreateUser}
            />
          ) : null}

          {activeTab === "studies" ? (
            <AdminStudies
              studies={studies}
              studiesLoading={studiesLoading}
              studyTypeLabels={STUDY_TYPE_LABELS}
              studyStatusLabels={STUDY_STATUS_LABELS}
              formatDate={formatDate}
              totalStudies={totalStudiesCount}
              activeStudiesCount={activeStudiesCount}
              studiesInAnalysisCount={studiesInAnalysisCount}
              completedStudiesCount={completedStudiesCount}
              draftStudiesCount={draftStudiesCount}
              monthlyStudies={studiesSummary.monthly_studies}
              onOpenStudy={(studyId) => void handleOpenStudy(studyId)}
            />
          ) : null}
        </section>
      </div>
    </AdminLayout>
  );
}