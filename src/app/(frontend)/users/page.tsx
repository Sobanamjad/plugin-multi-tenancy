'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [tenants, setTenants] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({ 
    email: '',
    password: '',
    name: '',
    role: 'user',
    tenants: []
  })
  const [user, setUser] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/users/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
          if (data.user.role === 'super-admin' || data.user.role === 'tenant-admin') {
            fetchTenantsAndUsers()
          } else {
            router.push('/dashboard')
          }
        } else {
          router.push('/login')
        }
      })
  }, [])

  // Tenants aur users ek saath fetch karo
  const fetchTenantsAndUsers = async () => {
    setLoading(true)
    
    // Pehle tenants fetch karo
    const tenantsRes = await fetch('/api/tenants')
    const tenantsData = await tenantsRes.json()
    setTenants(tenantsData.docs || [])
    
    // Phir users fetch karo
    const usersRes = await fetch('/api/users')
    const usersData = await usersRes.json()
    setUsers(usersData.docs || [])
    
    setLoading(false)
  }

  // Users fetch karo (for refresh after operations)
  const fetchUsers = async () => {
    const usersRes = await fetch('/api/users')
    const usersData = await usersRes.json()
    setUsers(usersData.docs || [])
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleTenantChange = (tenantId) => {
    const currentTenants = [...formData.tenants]
    const index = currentTenants.findIndex(t => t.tenant === tenantId)
    
    if (index === -1) {
      // Add tenant
      currentTenants.push({ tenant: tenantId, roles: ['user'] })
    } else {
      // Remove tenant
      currentTenants.splice(index, 1)
    }
    
    setFormData({
      ...formData,
      tenants: currentTenants
    })
  }

  const handleRoleChange = (tenantId, role) => {
    const currentTenants = [...formData.tenants]
    const index = currentTenants.findIndex(t => t.tenant === tenantId)
    
    if (index !== -1) {
      currentTenants[index].roles = [role]
      setFormData({
        ...formData,
        tenants: currentTenants
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const userData = {
      email: formData.email,
      password: formData.password,
      name: formData.name,
      role: formData.role,
      tenants: formData.tenants
    }

    // Agar edit mode mein hain to password optional hai
    if (editingUser && !formData.password) {
      delete userData.password
    }
    
    const url = editingUser 
      ? `/api/users/${editingUser.id}`
      : '/api/users'
    
    const method = editingUser ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })

    if (res.ok) {
      setShowModal(false)
      setEditingUser(null)
      setFormData({ 
        email: '', 
        password: '',
        name: '',
        role: 'user',
        tenants: []
      })
      fetchUsers()
    } else {
      const error = await res.json()
      alert('Error: ' + (error.errors?.[0]?.message || 'Something went wrong'))
    }
  }

  const handleEdit = (userToEdit) => {
    setEditingUser(userToEdit)
    setFormData({
      email: userToEdit.email,
      password: '',
      name: userToEdit.name || '',
      role: userToEdit.role,
      tenants: userToEdit.tenants || []
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this user?')) {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchUsers()
      }
    }
  }

  const handleLogout = async () => {
    await fetch('/api/users/logout', { method: 'POST' })
    router.push('/login')
  }

  // ✅ FIXED: Tenant names display with loading state
  const getUserTenants = (user) => {
    if (!user.tenants || user.tenants.length === 0) return 'No tenants'
    
    // Agar tenants array abhi load nahi hua to loading show karo
    if (tenants.length === 0) return 'Loading tenants...'
    
    return user.tenants.map(t => {
      const tenantId = typeof t.tenant === 'object' ? t.tenant.id : t.tenant
      const tenant = tenants.find(ten => ten.id === tenantId)
      return tenant ? tenant.name : 'Unknown'
    }).join(', ')
  }

  // Agar user nahi hai to loading show karo
  if (!user) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading...</p>
      </div>
    )
  }

  // Agar user Super Admin ya Tenant Admin nahi hai to access denied
  if (user.role !== 'super-admin' && user.role !== 'tenant-admin') {
    return (
      <div style={styles.accessDenied}>
        <h1>Access Denied</h1>
        <p>Only Super Admins and Tenant Admins can manage users.</p>
        <Link href="/dashboard" style={styles.backLink}>Go to Dashboard</Link>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <Link href="/dashboard" style={styles.logo}>
            Multi-Tenant CMS
          </Link>
        </div>

        <div style={styles.navRight}>
          <Link href="/dashboard" style={styles.navLink}>Dashboard</Link>
          <Link href="/products" style={styles.navLink}>Products</Link>
          {user.role === 'super-admin' && (
            <Link href="/tenants" style={styles.navLink}>Tenants</Link>
          )}
          <Link href="/users" style={{...styles.navLink, ...styles.activeLink}}>Users</Link>
          
          <div style={styles.profileContainer}>
            <div 
              style={styles.profileInfo}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div style={styles.avatar}>
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <span style={styles.userEmail}>{user.email}</span>
              <span style={styles.dropdownIcon}>▼</span>
            </div>

            {showDropdown && (
              <div style={styles.dropdown}>
                <Link href="/profile" style={styles.dropdownItem}>
                  <span>👤</span> Profile
                </Link>
                <Link href="/settings" style={styles.dropdownItem}>
                  <span>⚙️</span> Settings
                </Link>
                <div style={styles.dropdownDivider}></div>
                <button onClick={handleLogout} style={styles.dropdownItem}>
                  <span>🚪</span> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Manage Users</h1>
            <p style={styles.subtitle}>
              {user.role === 'super-admin' 
                ? 'Manage all users across all tenants'
                : 'Manage users in your tenant'}
            </p>
          </div>
          <button 
            style={styles.addButton}
            onClick={() => {
              setEditingUser(null)
              setFormData({ 
                email: '', 
                password: '',
                name: '',
                role: 'user',
                tenants: []
              })
              setShowModal(true)
            }}
          >
            + Add New User
          </button>
        </div>

        {/* Users Table */}
        <div style={styles.tableContainer}>
          {loading ? (
            <div style={styles.loading}>Loading users...</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>S.No</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Tenants</th>
                  <th style={styles.th}>Created</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, index) => (
                  <tr key={u.id} style={styles.tr}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>
                      <strong>{u.name || '—'}</strong>
                    </td>
                    <td style={styles.td}>{u.email}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.roleBadge,
                        backgroundColor: u.role === 'super-admin' ? '#fef3c7' :
                                       u.role === 'tenant-admin' ? '#c7e6f4' : '#e0e7ff',
                        color: u.role === 'super-admin' ? '#92400e' :
                              u.role === 'tenant-admin' ? '#065666' : '#3730a3'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.tenantList}>
                        {getUserTenants(u)}
                      </div>
                    </td>
                    <td style={styles.td}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={styles.td}>
                      <button 
                        style={styles.editBtn}
                        onClick={() => handleEdit(u)}
                      >
                        Edit
                      </button>
                      {u.id !== user.id && (
                        <button 
                          style={styles.deleteBtn}
                          onClick={() => handleDelete(u.id)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="7" style={styles.noData}>
                      No users found. Click "Add New User" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Info Card */}
        <div style={styles.infoCard}>
          <h3 style={styles.infoTitle}>ℹ️ About Users</h3>
          <p style={styles.infoText}>
            <strong>User Roles:</strong>
          </p>
          <ul style={styles.infoList}>
            <li><strong>Super Admin</strong> - Full access to everything, can manage all tenants</li>
            <li><strong>Tenant Admin</strong> - Can manage users and products within their tenant</li>
            <li><strong>User</strong> - Can create and manage products within their tenant</li>
          </ul>
          <p style={styles.infoNote}>
            <strong>Note:</strong> Tenant Admins can only create users for their own tenant.
          </p>
        </div>
      </main>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>
              {editingUser ? 'Edit User' : 'Add New User'}
            </h2>
            
            <form onSubmit={handleSubmit} style={styles.modalForm}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                    placeholder="user@example.com"
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    {editingUser ? 'Password (leave blank to keep current)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    style={styles.input}
                    required={!editingUser}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Role *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    style={styles.select}
                    required
                  >
                    <option value="user">User</option>
                    <option value="tenant-admin">Tenant Admin</option>
                    {user.role === 'super-admin' && (
                      <option value="super-admin">Super Admin</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Tenant Assignment - Sirf Super Admin ya Tenant Admin ke liye */}
              {(user.role === 'super-admin' || user.role === 'tenant-admin') && 
               formData.role !== 'super-admin' && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Assign Tenants</label>
                  <div style={styles.tenantCheckboxes}>
                    {tenants
                      .filter(t => {
                        // Tenant Admin sirf apne tenant dekh sakta hai
                        if (user.role === 'tenant-admin') {
                          const userTenantIds = user.tenants?.map(t => 
                            typeof t.tenant === 'object' ? t.tenant.id : t.tenant
                          ) || []
                          return userTenantIds.includes(t.id)
                        }
                        return true // Super Admin sab dekh sakta hai
                      })
                      .map(tenant => {
                        const isSelected = formData.tenants.some(t => t.tenant === tenant.id)
                        const selectedRole = formData.tenants.find(t => t.tenant === tenant.id)?.roles?.[0] || 'user'
                        
                        return (
                          <div key={tenant.id} style={styles.tenantItem}>
                            <div style={styles.tenantCheckbox}>
                              <input
                                type="checkbox"
                                id={`tenant-${tenant.id}`}
                                checked={isSelected}
                                onChange={() => handleTenantChange(tenant.id)}
                              />
                              <label htmlFor={`tenant-${tenant.id}`}>{tenant.name}</label>
                            </div>
                            
                            {isSelected && (
                              <div style={styles.tenantRole}>
                                <select
                                  value={selectedRole}
                                  onChange={(e) => handleRoleChange(tenant.id, e.target.value)}
                                  style={styles.roleSelect}
                                >
                                  <option value="user">User</option>
                                  <option value="tenant-admin">Tenant Admin</option>
                                </select>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    
                    {tenants.length === 0 && (
                      <p style={styles.noTenants}>No tenants available. Create a tenant first.</p>
                    )}
                  </div>
                </div>
              )}

              <div style={styles.modalActions}>
                <button 
                  type="button" 
                  style={styles.cancelBtn}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.saveBtn}>
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Styles
const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5'
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f5'
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '10px'
  },
  accessDenied: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f5',
    textAlign: 'center',
    padding: '20px'
  },
  backLink: {
    marginTop: '20px',
    color: '#667eea',
    textDecoration: 'none',
    fontSize: '16px'
  },
  navbar: {
    background: 'white',
    padding: '15px 30px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center'
  },
  logo: {
    color: '#667eea',
    fontSize: '20px',
    fontWeight: 'bold',
    textDecoration: 'none'
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '30px'
  },
  navLink: {
    color: '#666',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'color 0.3s'
  },
  activeLink: {
    color: '#667eea',
    borderBottom: '2px solid #667eea',
    paddingBottom: '5px'
  },
  profileContainer: {
    position: 'relative'
  },
  profileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    padding: '5px 10px',
    borderRadius: '8px',
    transition: 'background 0.3s'
  },
  avatar: {
    width: '35px',
    height: '35px',
    borderRadius: '50%',
    background: '#667eea',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '18px'
  },
  userEmail: {
    color: '#333',
    fontSize: '14px'
  },
  dropdownIcon: {
    fontSize: '12px',
    color: '#999'
  },
  dropdown: {
    position: 'absolute',
    top: '50px',
    right: 0,
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 5px 20px rgba(0,0,0,0.15)',
    width: '200px',
    zIndex: 1000
  },
  dropdownItem: {
    padding: '12px 15px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#333',
    textDecoration: 'none',
    fontSize: '14px',
    border: 'none',
    background: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background 0.3s'
  },
  dropdownDivider: {
    height: '1px',
    background: '#eee',
    margin: '5px 0'
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '32px',
    color: '#333',
    marginBottom: '5px'
  },
  subtitle: {
    color: '#666',
    fontSize: '16px'
  },
  addButton: {
    background: '#667eea',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.3s'
  },
  tableContainer: {
    background: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    overflow: 'hidden',
    marginBottom: '30px'
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#999',
    fontSize: '14px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    background: '#f8f9fa',
    padding: '15px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    color: '#555',
    borderBottom: '2px solid #e9ecef'
  },
  tr: {
    borderBottom: '1px solid #e9ecef',
    transition: 'background 0.3s'
  },
  td: {
    padding: '15px',
    fontSize: '14px',
    color: '#333',
    verticalAlign: 'middle'
  },
  roleBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500'
  },
  tenantList: {
    fontSize: '12px',
    color: '#666',
    maxWidth: '200px'
  },
  editBtn: {
    background: 'none',
    border: '1px solid #667eea',
    color: '#667eea',
    padding: '5px 15px',
    borderRadius: '5px',
    fontSize: '13px',
    cursor: 'pointer',
    marginRight: '8px',
    transition: 'all 0.3s'
  },
  deleteBtn: {
    background: 'none',
    border: '1px solid #f56565',
    color: '#f56565',
    padding: '5px 15px',
    borderRadius: '5px',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  noData: {
    padding: '40px',
    textAlign: 'center',
    color: '#999',
    fontSize: '14px'
  },
  infoCard: {
    background: 'white',
    borderRadius: '10px',
    padding: '25px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    border: '1px solid #e9ecef'
  },
  infoTitle: {
    fontSize: '18px',
    color: '#333',
    marginBottom: '15px'
  },
  infoText: {
    color: '#666',
    fontSize: '14px',
    marginBottom: '10px'
  },
  infoList: {
    marginLeft: '20px',
    color: '#666',
    fontSize: '14px',
    marginBottom: '15px'
  },
  infoNote: {
    color: '#667eea',
    fontSize: '14px',
    background: '#f0f4ff',
    padding: '10px',
    borderRadius: '5px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: 'white',
    borderRadius: '10px',
    padding: '30px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  modalTitle: {
    fontSize: '24px',
    color: '#333',
    marginBottom: '25px'
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '15px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  label: {
    color: '#555',
    fontSize: '14px',
    fontWeight: '500'
  },
  input: {
    padding: '10px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border-color 0.3s'
  },
  select: {
    padding: '10px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white'
  },
  tenantCheckboxes: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '15px',
    maxHeight: '200px',
    overflow: 'auto'
  },
  tenantItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0'
  },
  tenantCheckbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  tenantRole: {
    marginLeft: '20px'
  },
  roleSelect: {
    padding: '4px 8px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    fontSize: '12px'
  },
  noTenants: {
    color: '#999',
    fontSize: '12px',
    textAlign: 'center',
    padding: '10px'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '15px',
    marginTop: '20px'
  },
  cancelBtn: {
    background: 'none',
    border: '1px solid #cbd5e0',
    color: '#4a5568',
    padding: '10px 24px',
    borderRadius: '8px',
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  saveBtn: {
    background: '#667eea',
    color: 'white',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.3s'
  }
} as const