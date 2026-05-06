import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { UserResponse, UserRole } from "../admin/adminApi";

type AdminUsersProps = {
  users: UserResponse[];
  usersLoading: boolean;
  selectedUser: UserResponse | null;
  setSelectedUser: React.Dispatch<React.SetStateAction<UserResponse | null>>;
  isCreateUserModalOpen: boolean;
  setIsCreateUserModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  userPassword: string;
  setUserPassword: React.Dispatch<React.SetStateAction<string>>;
  userActionLoading: boolean;

  newUserEmail: string;
  setNewUserEmail: React.Dispatch<React.SetStateAction<string>>;
  newUserFullName: string;
  setNewUserFullName: React.Dispatch<React.SetStateAction<string>>;
  newUserPassword: string;
  setNewUserPassword: React.Dispatch<React.SetStateAction<string>>;
  newUserRole: UserRole;
  setNewUserRole: React.Dispatch<React.SetStateAction<UserRole>>;
  newUserInstitution: string;
  setNewUserInstitution: React.Dispatch<React.SetStateAction<string>>;
  newUserDepartment: string;
  setNewUserDepartment: React.Dispatch<React.SetStateAction<string>>;
  newUserSpecialization: string;
  setNewUserSpecialization: React.Dispatch<React.SetStateAction<string>>;
  newUserPhone: string;
  setNewUserPhone: React.Dispatch<React.SetStateAction<string>>;
  newUserBio: string;
  setNewUserBio: React.Dispatch<React.SetStateAction<string>>;

  userRoleLabels: Record<UserRole, string>;
  totalUsers: number;
  activeUsersCount: number;
  inactiveUsersCount: number;
  verifiedUsersCount: number;
  adminsCount: number;
  researchersCount: number;
  formatDate: (value?: string | null) => string;
  onOpenUser: (userId: number) => void;
  onSaveUserEdits: () => void;
  onToggleUserStatus: () => void;
  onResetUserPassword: () => void;
  onCreateUser: (event: React.FormEvent<HTMLFormElement>) => void;
};

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8.25" r="3.25" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5.5 18.75C5.5 15.9886 8.18629 14.25 12 14.25C15.8137 14.25 18.5 15.9886 18.5 18.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4.25L18 6.5V11.25C18 15.1 15.65 18.35 12 19.75C8.35 18.35 6 15.1 6 11.25V6.5L12 4.25Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 11.9L11.1 13.8L14.9 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 18.5H19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7.5 16V10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 16V7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M16.5 16V12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "#ef9647",
  researcher: "#76b65c",
};

const USERS_PAGE_SIZE = 10;

export default function AdminUsers({
  users,
  usersLoading,
  selectedUser,
  setSelectedUser,
  isCreateUserModalOpen,
  setIsCreateUserModalOpen,
  userPassword,
  setUserPassword,
  userActionLoading,
  newUserEmail,
  setNewUserEmail,
  newUserFullName,
  setNewUserFullName,
  newUserPassword,
  setNewUserPassword,
  newUserRole,
  setNewUserRole,
  newUserInstitution,
  setNewUserInstitution,
  newUserDepartment,
  setNewUserDepartment,
  newUserSpecialization,
  setNewUserSpecialization,
  newUserPhone,
  setNewUserPhone,
  newUserBio,
  setNewUserBio,
  userRoleLabels,
  totalUsers,
  activeUsersCount,
  inactiveUsersCount,
  verifiedUsersCount,
  adminsCount,
  researchersCount,
  formatDate,
  onOpenUser,
  onSaveUserEdits,
  onToggleUserStatus,
  onResetUserPassword,
  onCreateUser,
}: AdminUsersProps) {

  const [usersPage, setUsersPage] = useState(1);

  const roleData = useMemo(
    () =>
      [
        {
          key: "admin",
          name: "Administratori",
          value: adminsCount,
          color: ROLE_COLORS.admin,
        },
        {
          key: "researcher",
          name: "Cercetători",
          value: researchersCount,
          color: ROLE_COLORS.researcher,
        },
      ].filter((item) => item.value > 0),
    [adminsCount, researchersCount]
  );

  const statusData = useMemo(
    () => [
      { name: "Active", value: activeUsersCount },
      { name: "Inactivi", value: inactiveUsersCount },
      { name: "Verificați", value: verifiedUsersCount },
    ],
    [activeUsersCount, inactiveUsersCount, verifiedUsersCount]
  );

  const activeRate = totalUsers > 0 ? Math.round((activeUsersCount / totalUsers) * 100) : 0;
  const verifiedRate =
    totalUsers > 0 ? Math.round((verifiedUsersCount / totalUsers) * 100) : 0;

  const usersTotalPages = Math.max(1, Math.ceil(users.length / USERS_PAGE_SIZE));

  const paginatedUsers = useMemo(() => {
    const start = (usersPage - 1) * USERS_PAGE_SIZE;
    return users.slice(start, start + USERS_PAGE_SIZE);
  }, [users, usersPage]);

  const usersRowStart =
    users.length === 0 ? 0 : (usersPage - 1) * USERS_PAGE_SIZE + 1;

  const usersRowEnd = Math.min(usersPage * USERS_PAGE_SIZE, users.length);

  useEffect(() => {
    if (usersPage > usersTotalPages) {
      setUsersPage(usersTotalPages);
    }
  }, [usersPage, usersTotalPages]);

  return (
    <>
      <section className="admin-users-overview">
        <div className="admin-kpi-grid admin-kpi-grid--users-page">
          <article className="admin-kpi-card admin-kpi-card--users">
            <div className="admin-kpi-card__top">
              <span>Total utilizatori</span>
              <div className="admin-kpi-icon">
                <UserIcon />
              </div>
            </div>
            <strong>{totalUsers}</strong>
            <small>Conturi disponibile în platformă pentru administrare.</small>
          </article>

          <article className="admin-kpi-card admin-kpi-card--analysis">
            <div className="admin-kpi-card__top">
              <span>Utilizatori activi</span>
              <div className="admin-kpi-icon">
                <ShieldIcon />
              </div>
            </div>
            <strong>{activeUsersCount}</strong>
            <small>Conturi care au acces activ în platformă.</small>
            <div className="admin-kpi-progress">
              <div
                className="admin-kpi-progress__bar"
                style={{ width: `${activeRate}%` }}
              />
            </div>
          </article>

          <article className="admin-kpi-card admin-kpi-card--requests">
            <div className="admin-kpi-card__top">
              <span>Conturi verificate</span>
              <div className="admin-kpi-icon">
                <ChartIcon />
              </div>
            </div>
            <strong>{verifiedUsersCount}</strong>
            <small>Utilizatori marcați ca verificați.</small>
            <div className="admin-kpi-progress">
              <div
                className="admin-kpi-progress__bar"
                style={{ width: `${verifiedRate}%` }}
              />
            </div>
          </article>

          <article className="admin-kpi-card admin-kpi-card--studies">
            <div className="admin-kpi-card__top">
              <span>Structură roluri</span>
              <div className="admin-kpi-icon">#</div>
            </div>
            <strong>
              {adminsCount} / {researchersCount}
            </strong>
            <small>Administratori versus cercetători înregistrați.</small>
          </article>
        </div>

        <div className="admin-section-grid admin-section-grid--access">
          <section className="admin-panel">
            <div className="admin-panel__header">
              <div>
                {/*<div className="admin-panel__hint">Distribuție roluri</div>*/}
                <h2>Structura utilizatorilor</h2>
              </div>
            </div>

            {roleData.length === 0 ? (
              <p className="admin-empty">Nu există date pentru afișarea rolurilor.</p>
            ) : (
              <>
                <div className="admin-chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roleData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={86}
                        paddingAngle={3}
                      >
                        {roleData.map((entry) => (
                          <Cell key={entry.key} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="admin-legend-list">
                  {roleData.map((item) => (
                    <div key={item.key}>
                      <span
                        className="admin-legend-dot"
                        style={{ background: item.color }}
                      />
                      <span>{item.name}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          <section className="admin-panel">
            <div className="admin-panel__header">
              <div>
                {/*<div className="admin-panel__hint">Rezumat statusuri</div>*/}
                <h2>Activitate și verificare</h2>
              </div>
            </div>

            <div className="admin-chart-box admin-chart-box--wide">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => [value, "Utilizatori"]} />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={70} fill="#76b65c" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </section>

      <div className="admin-section-grid admin-section-grid--users-list">
        <section className="admin-panel">
          <div className="admin-panel__header">
            <div>
              {/*<div className="admin-panel__hint">Administrare conturi</div>*/}
              <h2>Utilizatori existenți</h2>
            </div>
          </div>

          {usersLoading ? (
            <p className="admin-loading">Se încarcă utilizatorii...</p>
          ) : (
            <>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Nume</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Activ</th>
                      <th>Verificat</th>
                      <th>Creat</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="admin-table__empty">
                          Nu există utilizatori disponibili.
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((item) => (
                        <tr
                          key={item.id}
                          className="admin-table-clickable-row"
                          onClick={() => onOpenUser(item.id)}
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              onOpenUser(item.id);
                            }
                          }}
                        >
                          <td>{item.full_name}</td>
                          <td>{item.email}</td>
                          <td>{userRoleLabels[item.role]}</td>
                          <td>{item.is_active ? "Da" : "Nu"}</td>
                          <td>{item.is_verified ? "Da" : "Nu"}</td>
                          <td>{formatDate(item.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="admin-table-footer">
                <span>
                  Afișare {usersRowStart} - {usersRowEnd} din {users.length} utilizatori
                </span>

                <div className="admin-pagination">
                  <button
                    type="button"
                    onClick={() => setUsersPage((prev) => Math.max(1, prev - 1))}
                    disabled={usersPage === 1 || usersLoading}
                  >
                    ‹
                  </button>

                  <button type="button" className="is-active" disabled>
                    {usersPage}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setUsersPage((prev) => Math.min(usersTotalPages, prev + 1))
                    }
                    disabled={usersPage === usersTotalPages || usersLoading}
                  >
                    ›
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
      {selectedUser && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal admin-modal--user">
            <div className="admin-modal__header">
              <div>
                <div className="admin-panel__hint">Detalii și acțiuni</div>
                <h2>Utilizator selectat</h2>
              </div>
      
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setSelectedUser(null)}
                aria-label="Închide detaliile utilizatorului"
              >
                ×
              </button>
            </div>
      
            <div className="admin-form">
              <label>
                <span>Nume complet</span>
                <input
                  type="text"
                  value={selectedUser.full_name}
                  onChange={(event) =>
                    setSelectedUser((prev) =>
                      prev ? { ...prev, full_name: event.target.value } : prev
                    )
                  }
                />
              </label>
              
              <label>
                <span>Email</span>
                <input type="email" value={selectedUser.email} disabled />
              </label>
              
              <label>
                <span>Rol</span>
                <select
                  value={selectedUser.role}
                  onChange={(event) =>
                    setSelectedUser((prev) =>
                      prev ? { ...prev, role: event.target.value as UserRole } : prev
                    )
                  }
                >
                  <option value="admin">Admin</option>
                  <option value="researcher">Cercetător</option>
                </select>
              </label>
              
              <label>
                <span>Instituție</span>
                <input
                  type="text"
                  value={selectedUser.institution ?? ""}
                  onChange={(event) =>
                    setSelectedUser((prev) =>
                      prev ? { ...prev, institution: event.target.value } : prev
                    )
                  }
                />
              </label>
              
              <label>
                <span>Departament</span>
                <input
                  type="text"
                  value={selectedUser.department ?? ""}
                  onChange={(event) =>
                    setSelectedUser((prev) =>
                      prev ? { ...prev, department: event.target.value } : prev
                    )
                  }
                />
              </label>
              
              <label>
                <span>Specializare</span>
                <input
                  type="text"
                  value={selectedUser.specialization ?? ""}
                  onChange={(event) =>
                    setSelectedUser((prev) =>
                      prev ? { ...prev, specialization: event.target.value } : prev
                    )
                  }
                />
              </label>
              
              <label>
                <span>Telefon</span>
                <input
                  type="text"
                  value={selectedUser.phone ?? ""}
                  onChange={(event) =>
                    setSelectedUser((prev) =>
                      prev ? { ...prev, phone: event.target.value } : prev
                    )
                  }
                />
              </label>
              
              <label>
                <span>Bio</span>
                <textarea
                  rows={4}
                  value={selectedUser.bio ?? ""}
                  onChange={(event) =>
                    setSelectedUser((prev) =>
                      prev ? { ...prev, bio: event.target.value } : prev
                    )
                  }
                />
              </label>
              
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={selectedUser.is_verified}
                  onChange={(event) =>
                    setSelectedUser((prev) =>
                      prev ? { ...prev, is_verified: event.target.checked } : prev
                    )
                  }
                />
                <span>Cont verificat</span>
              </label>
              
              <div className="admin-detail-block admin-detail-block--surface">
                <span>Informații suplimentare</span>
                <p>
                  Creat la: <strong>{formatDate(selectedUser.created_at)}</strong>
                </p>
                <p>
                  Ultima actualizare:{" "}
                  <strong>{formatDate(selectedUser.updated_at)}</strong>
                </p>
                <p>
                  Status curent:{" "}
                  <strong>{selectedUser.is_active ? "Activ" : "Inactiv"}</strong>
                </p>
              </div>
              
              <div className="admin-actions-row">
                <button
                  type="button"
                  className="admin-btn"
                  disabled={userActionLoading}
                  onClick={onSaveUserEdits}
                >
                  Salvează
                </button>
              
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  disabled={userActionLoading}
                  onClick={onToggleUserStatus}
                >
                  {selectedUser.is_active ? "Dezactivează" : "Activează"}
                </button>
              </div>
              
              <div className="admin-password-box">
                <span>Resetare parolă</span>
                <input
                  type="password"
                  placeholder="Introdu parola nouă"
                  value={userPassword}
                  onChange={(event) => setUserPassword(event.target.value)}
                />
      
                <button
                  type="button"
                  className="admin-btn admin-btn--warning"
                  disabled={userActionLoading}
                  onClick={onResetUserPassword}
                >
                  Resetează parola
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreateUserModalOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal admin-modal--user">
            <div className="admin-modal__header">
              <div>
                <div className="admin-panel__hint">Creare cont nou</div>
                <h2>Adaugă utilizator</h2>
              </div>
      
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setIsCreateUserModalOpen(false)}
                aria-label="Închide formularul de creare utilizator"
              >
                ×
              </button>
            </div>
      
            <form className="admin-form" onSubmit={onCreateUser}>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(event) => setNewUserEmail(event.target.value)}
                  required
                />
              </label>
      
              <label>
                <span>Nume complet</span>
                <input
                  type="text"
                  value={newUserFullName}
                  onChange={(event) => setNewUserFullName(event.target.value)}
                  required
                />
              </label>
      
              <label>
                <span>Parolă</span>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(event) => setNewUserPassword(event.target.value)}
                  required
                />
              </label>
      
              <label>
                <span>Rol</span>
                <select
                  value={newUserRole}
                  onChange={(event) => setNewUserRole(event.target.value as UserRole)}
                >
                  <option value="researcher">Cercetător</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
      
              <label>
                <span>Instituție</span>
                <input
                  type="text"
                  value={newUserInstitution}
                  onChange={(event) => setNewUserInstitution(event.target.value)}
                />
              </label>
      
              <label>
                <span>Departament</span>
                <input
                  type="text"
                  value={newUserDepartment}
                  onChange={(event) => setNewUserDepartment(event.target.value)}
                />
              </label>
      
              <label>
                <span>Specializare</span>
                <input
                  type="text"
                  value={newUserSpecialization}
                  onChange={(event) => setNewUserSpecialization(event.target.value)}
                />
              </label>
      
              <label>
                <span>Telefon</span>
                <input
                  type="text"
                  value={newUserPhone}
                  onChange={(event) => setNewUserPhone(event.target.value)}
                />
              </label>
      
              <label>
                <span>Bio</span>
                <textarea
                  rows={4}
                  value={newUserBio}
                  onChange={(event) => setNewUserBio(event.target.value)}
                />
              </label>
      
              <div className="admin-actions-row admin-actions-row--modal">
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  onClick={() => setIsCreateUserModalOpen(false)}
                  disabled={userActionLoading}
                >
                  Anulează
                </button>
      
                <button type="submit" className="admin-btn" disabled={userActionLoading}>
                  Creează utilizator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}