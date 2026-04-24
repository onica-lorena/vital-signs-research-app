import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/admin-dashboard.css";
import "../styles/admin-layout.css";
import {
  approveAccessRequestRequest,
  createUserRequest,
  exportStudyAdminRequest,
  getAccessRequestByIdRequest,
  getStudyByIdAdminRequest,
  getStudyDataSummaryRequest,
  getStudyDataTimelineRequest,
  getStudyParticipantsSummaryRequest,
  getStudySubmissionByIdRequest,
  getUserByIdRequest,
  listAccessRequestsRequest,
  listStudiesAdminRequest,
  listStudyParticipantsRequest,
  listStudySubmissionsRequest,
  listUsersRequest,
  rejectAccessRequestRequest,
  resetUserPasswordRequest,
  updateStudySubmissionRequest,
  updateUserRequest,
  updateUserStatusRequest,
  type AccessRequestResponse,
  type AccessRequestStatus,
  type ParticipantListItemResponse,
  type ParticipantSubmissionStatus,
  type StudyDataSummaryResponse,
  type StudyDataTimelinePointResponse,
  type StudyDetailResponse,
  type StudySubmissionDetailResponse,
  type StudySubmissionListItemResponse,
  type StudyType,
  type UserResponse,
  type UserRole,
} from "../admin/adminApi";
import { SESSION_EXPIRED_ERROR } from "../auth/authFetch";
import AdminLayout from "../components/layout/AdminLayout";
import type { AdminNavigationKey } from "../components/layout/AdminSidebar";
import AdminAccessRequests from "./AdminAccessRequests";
import AdminUsers from "./AdminUsers";
import AdminStudies from "./AdminStudies";

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

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
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
  const [accessRequestStatusFilter, setAccessRequestStatusFilter] = useState<
    AccessRequestStatus | ""
  >("");
  const [accessRequestSearch, setAccessRequestSearch] = useState("");
  const [selectedAccessRequest, setSelectedAccessRequest] =
    useState<AccessRequestResponse | null>(null);
  const [accessReviewNotes, setAccessReviewNotes] = useState("");
  const [accessActionLoading, setAccessActionLoading] = useState(false);

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

  const [studies, setStudies] = useState<StudyDetailResponse[]>([]);
  const [studiesLoading, setStudiesLoading] = useState(true);
  const [selectedStudy, setSelectedStudy] = useState<StudyDetailResponse | null>(null);
  const [studyDetailLoading, setStudyDetailLoading] = useState(false);
  const [studyExportLoading, setStudyExportLoading] = useState(false);

  const [studyParticipants, setStudyParticipants] = useState<
    ParticipantListItemResponse[]
  >([]);
  const [studyParticipantsLoading, setStudyParticipantsLoading] = useState(false);
  const [studyParticipantsSummary, setStudyParticipantsSummary] = useState<{
    total_participants: number;
    invited_participants: number;
    active_participants: number;
    suspended_participants: number;
    completed_participants: number;
    withdrawn_participants: number;
  } | null>(null);

  const [studySubmissions, setStudySubmissions] = useState<
    StudySubmissionListItemResponse[]
  >([]);
  const [studySubmissionsLoading, setStudySubmissionsLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<StudySubmissionDetailResponse | null>(null);

  const [studyDataSummary, setStudyDataSummary] = useState<StudyDataSummaryResponse | null>(
    null
  );
  const [studyTimeline, setStudyTimeline] = useState<StudyDataTimelinePointResponse[]>([]);
  const [studyAnalyticsLoading, setStudyAnalyticsLoading] = useState(false);

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
        page: 1,
        page_size: 20,
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
      const response = await listStudiesAdminRequest({
        page: 1,
        page_size: 20,
        sort_by: "created_at",
        sort_order: "desc",
      });

      const detailedStudies = await Promise.all(
        response.items.map((item) => getStudyByIdAdminRequest(item.id))
      );

      setStudies(detailedStudies);
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
    void loadUsers();
    void loadStudies();
  }, []);

  useEffect(() => {
    void loadAccessRequests();
  }, [accessRequestStatusFilter]);

  const pendingRequestsCount = useMemo(
    () => accessRequests.filter((item) => item.status === "pending").length,
    [accessRequests]
  );

  const approvedRequestsCount = useMemo(
    () => accessRequests.filter((item) => item.status === "approved").length,
    [accessRequests]
  );

  const rejectedRequestsCount = useMemo(
    () => accessRequests.filter((item) => item.status === "rejected").length,
    [accessRequests]
  );

  const activeUsersCount = useMemo(
    () => users.filter((item) => item.is_active).length,
    [users]
  );

  const verifiedUsersCount = useMemo(
    () => users.filter((item) => item.is_verified).length,
    [users]
  );

  const adminsCount = useMemo(
    () => users.filter((item) => item.role === "admin").length,
    [users]
  );

  const researchersCount = useMemo(
    () => users.filter((item) => item.role === "researcher").length,
    [users]
  );

  const inactiveUsersCount = useMemo(
    () => users.filter((item) => !item.is_active).length,
    [users]
  );

  const studiesInAnalysisCount = useMemo(
    () => studies.filter((item) => item.status === "in_analysis").length,
    [studies]
  );

  const activeStudiesCount = useMemo(
    () => studies.filter((item) => item.status === "active").length,
    [studies]
  );

  const completedStudiesCount = useMemo(
    () => studies.filter((item) => item.status === "completed").length,
    [studies]
  );

  const draftStudiesCount = useMemo(
    () => studies.filter((item) => item.status === "draft").length,
    [studies]
  );

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

  async function handleExportStudy() {
    if (!selectedStudy) {
      return;
    }

    setStudyExportLoading(true);
    setPageError("");

    try {
      const result = await exportStudyAdminRequest(selectedStudy.id);
      downloadBlob(result.blob, result.filename);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Nu s-a putut exporta studiul."
      );
    } finally {
      setStudyExportLoading(false);
    }
  }

  async function handleOpenSubmission(submissionId: number) {
    if (!selectedStudy) {
      return;
    }

    setPageError("");

    try {
      const detail = await getStudySubmissionByIdRequest(selectedStudy.id, submissionId);
      setSelectedSubmission(detail);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Nu s-au putut încărca detaliile trimiterii."
      );
    }
  }

  async function handleUpdateSubmissionStatus(status: ParticipantSubmissionStatus) {
    if (!selectedStudy || !selectedSubmission) {
      return;
    }

    setPageError("");

    try {
      const updated = await updateStudySubmissionRequest(selectedStudy.id, selectedSubmission.id, {
        status,
        review_notes: selectedSubmission.review_notes ?? null,
      });

      setSelectedSubmission(updated);

      const refreshedSubmissions = await listStudySubmissionsRequest(selectedStudy.id, {
        page: 1,
        page_size: 20,
      });

      setStudySubmissions(refreshedSubmissions.items);

      const refreshedSummary = await getStudyDataSummaryRequest(selectedStudy.id);
      setStudyDataSummary(refreshedSummary);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Nu s-a putut actualiza statusul trimiterii."
      );
    }
  }

  return (
    <AdminLayout
      activeItem={activeTab}
      title="Administrare VitalStudy"
      subtitle="Panou central pentru cereri de acces, utilizatori, studii și monitorizarea administrativă."
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
              accessRequestsLoading={accessRequestsLoading}
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
              totalUsers={users.length}
              activeUsersCount={activeUsersCount}
              inactiveUsersCount={inactiveUsersCount}
              verifiedUsersCount={verifiedUsersCount}
              adminsCount={adminsCount}
              researchersCount={researchersCount}
              formatDate={formatDate}
              onOpenUser={(userId) => void handleOpenUser(userId)}
              onSaveUserEdits={() => void handleSaveUserEdits()}
              onToggleUserStatus={() => void handleToggleUserStatus()}
              onResetUserPassword={() => void handleResetUserPassword()}
              onCreateUser={handleCreateUser}
            />
          ) : null}

          {activeTab === "studies" ? (
            <AdminStudies
              studies={studies}
              studiesLoading={studiesLoading}
              selectedStudy={selectedStudy}
              studyDetailLoading={studyDetailLoading}
              studyExportLoading={studyExportLoading}
              studyParticipants={studyParticipants}
              studyParticipantsLoading={studyParticipantsLoading}
              studyParticipantsSummary={studyParticipantsSummary}
              studySubmissions={studySubmissions}
              studySubmissionsLoading={studySubmissionsLoading}
              selectedSubmission={selectedSubmission}
              setSelectedSubmission={setSelectedSubmission}
              studyDataSummary={studyDataSummary}
              studyTimeline={studyTimeline}
              studyAnalyticsLoading={studyAnalyticsLoading}
              studyTypeLabels={STUDY_TYPE_LABELS}
              studyStatusLabels={STUDY_STATUS_LABELS}
              submissionStatusLabels={SUBMISSION_STATUS_LABELS}
              formatDate={formatDate}
              totalStudies={studies.length}
              activeStudiesCount={activeStudiesCount}
              studiesInAnalysisCount={studiesInAnalysisCount}
              completedStudiesCount={completedStudiesCount}
              draftStudiesCount={draftStudiesCount}
              onOpenStudy={(studyId) => void handleOpenStudy(studyId)}
              onExportStudy={() => void handleExportStudy()}
              onOpenSubmission={(submissionId) => void handleOpenSubmission(submissionId)}
              onUpdateSubmissionStatus={(status) =>
                void handleUpdateSubmissionStatus(status)
              }
            />
          ) : null}
        </section>
      </div>
    </AdminLayout>
  );
}