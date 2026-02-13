'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function TenantsPage() {
  const [tenants, setTenants] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingTenant, setEditingTenant] = useState(null)
  const [formData, setFormData] = useState({ 
    name: '', 
    slug: ''
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
          // Sirf Super Admin hi tenants dekh sakta hai
          if (data.user.role === 'super-admin') {
            fetchTenants()
          } else {
            router.push('/dashboard')
          }
        } else {
          router.push('/login')
        }
      })
  }, [])

  const fetchTenants = async () => {
    setLoading(true)
    const res = await fetch('/api/tenants')
    const data = await res.json()
    setTenants(data.docs || [])
    setLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // Agar name field change ho raha hai to slug auto-generate karo
    if (name === 'name') {
      const slug = value.toLowerCase().replace(/\s+/g, '-')
      setFormData({
        ...formData,
        name: value,
        slug: slug
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const url = editingTenant 
      ? `/api/tenants/${editingTenant.id}`
      : '/api/tenants'
    
    const method = editingTenant ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    if (res.ok) {
      setShowModal(false)
      setEditingTenant(null)
      setFormData({ name: '', slug: '' })
      fetchTenants()
    }
  }

  const handleEdit = (tenant) => {
    setEditingTenant(tenant)
    setFormData({
      name: tenant.name,
      slug: tenant.slug
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this tenant? All associated products and users will also be affected.')) {
      await fetch(`/api/tenants/${id}`, { method: 'DELETE' })
      fetchTenants()
    }
  }

  const handleLogout = async () => {
    await fetch('/api/users/logout', { method: 'POST' })
    router.push('/login')
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

  // Agar user Super Admin nahi hai to access denied
  if (user.role !== 'super-admin') {
    return (
      <div style={styles.accessDenied}>
        <h1>Access Denied</h1>
        <p>Only Super Admins can manage tenants.</p>
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
          <Link href="/tenants" style={{...styles.navLink, ...styles.activeLink}}>Tenants</Link>
          <Link href="/users" style={styles.navLink}>Users</Link>

          
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
            <h1 style={styles.title}>Manage Tenants</h1>
            <p style={styles.subtitle}>Create and manage organizations in your system</p>
          </div>
          <button 
            style={styles.addButton}
            onClick={() => {
              setEditingTenant(null)
              setFormData({ name: '', slug: '' })
              setShowModal(true)
            }}
          >
            + Add New Tenant
          </button>
        </div>

        {/* Tenants Table */}
        <div style={styles.tableContainer}>
          {loading ? (
            <div style={styles.loading}>Loading tenants...</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>S.No</th>
                  <th style={styles.th}>Tenant Name</th>
                  <th style={styles.th}>Slug</th>
                  <th style={styles.th}>Created At</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant, index) => (
                  <tr key={tenant.id} style={styles.tr}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>
                      <strong>{tenant.name}</strong>
                    </td>
                    <td style={styles.td}>
                      <code style={styles.slug}>{tenant.slug}</code>
                    </td>
                    <td style={styles.td}>
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                    <td style={styles.td}>
                      <button 
                        style={styles.editBtn}
                        onClick={() => handleEdit(tenant)}
                      >
                        Edit
                      </button>
                      <button 
                        style={styles.deleteBtn}
                        onClick={() => handleDelete(tenant.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan="5" style={styles.noData}>
                      No tenants found. Click "Add New Tenant" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Info Card */}
        <div style={styles.infoCard}>
          <h3 style={styles.infoTitle}>ℹ️ About Tenants</h3>
          <p style={styles.infoText}>
            Tenants are separate organizations in your multi-tenant system. Each tenant has:
          </p>
          <ul style={styles.infoList}>
            <li>Their own products and data</li>
            <li>Their own users (Tenant Admins and regular Users)</li>
            <li>Complete isolation from other tenants</li>
          </ul>
          <p style={styles.infoNote}>
            <strong>Note:</strong> Only Super Admins can create, edit, or delete tenants.
          </p>
        </div>
      </main>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>
              {editingTenant ? 'Edit Tenant' : 'Add New Tenant'}
            </h2>
            
            <form onSubmit={handleSubmit} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Tenant Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                  placeholder="e.g., Acme Corporation"
                  autoFocus
                />
                <small style={styles.helpText}>
                  This will be displayed to users
                </small>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Slug *</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                  placeholder="e.g., acme-corporation"
                />
                <small style={styles.helpText}>
                  URL-friendly identifier (auto-generated from name)
                </small>
              </div>

              <div style={styles.modalActions}>
                <button 
                  type="button" 
                  style={styles.cancelBtn}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.saveBtn}>
                  {editingTenant ? 'Update Tenant' : 'Create Tenant'}
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
  slug: {
    background: '#f0f0f0',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#666'
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
    maxWidth: '500px',
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
  helpText: {
    color: '#999',
    fontSize: '12px',
    marginTop: '4px'
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