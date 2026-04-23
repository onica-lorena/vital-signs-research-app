import type {
  UserResponse,
  UserRole,
} from "../admin/adminApi";

type AdminUsersProps = {
  users: UserResponse[];
  usersLoading: boolean;
  selectedUser: UserResponse | null;
  setSelectedUser: React.Dispatch<React.SetStateAction<UserResponse | null>>;
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
  onOpenUser: (userId: number) => void;
  onSaveUserEdits: () => void;
  onToggleUserStatus: () => void;
  onResetUserPassword: () => void;
  onCreateUser: (event: React.FormEvent<HTMLFormElement>) => void;
};

export default function AdminUsers({
  users,
  usersLoading,
  selectedUser,
  setSelectedUser,
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
  onOpenUser,
  onSaveUserEdits,
  onToggleUserStatus,
  onResetUserPassword,
  onCreateUser,
}: AdminUsersProps) {
  return (
    <div className="admin-section-grid admin-section-grid--users">
      <section className="admin-panel">
        <h2>Utilizatori existenți</h2>

        {usersLoading ? (
          <p className="admin-loading">Se încarcă utilizatorii...</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nume</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Activ</th>
                  <th>Verificat</th>
                  <th>Detalii</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id}>
                    <td>{item.full_name}</td>
                    <td>{item.email}</td>
                    <td>{userRoleLabels[item.role]}</td>
                    <td>{item.is_active ? "Da" : "Nu"}</td>
                    <td>{item.is_verified ? "Da" : "Nu"}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-inline-link"
                        onClick={() => onOpenUser(item.id)}
                      >
                        Vezi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <aside className="admin-panel">
        <h2>Detalii utilizator</h2>

        {selectedUser ? (
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
              <span>Rol</span>
              <select
                value={selectedUser.role}
                onChange={(event) =>
                  setSelectedUser((prev) =>
                    prev
                      ? { ...prev, role: event.target.value as UserRole }
                      : prev
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
        ) : (
          <p className="admin-empty">Selectează un utilizator din listă.</p>
        )}
      </aside>

      <section className="admin-panel">
        <h2>Creează utilizator nou</h2>

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

          <button type="submit" className="admin-btn" disabled={userActionLoading}>
            Creează utilizator
          </button>
        </form>
      </section>
    </div>
  );
}