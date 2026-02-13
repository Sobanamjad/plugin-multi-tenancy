'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalTenants, setTotalTenants] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchProductCount = async () => {
    const res = await fetch ('/api/products?limit=0')
    const data = await res.json()
    setTotalProducts(data.totalDocs || 0)
    setLoading(false)
  }

  const fetchTenantCount = async () => {
    const res = await fetch('/api/tenants?limit=0')
    const data = await res.json()
    setTotalTenants(data.totalDocs || 0)
    setLoading(false)
  }

  useEffect(() => {
    fetch('/api/users/me') 
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
          fetchProductCount()
          fetchTenantCount()
        } else {
          router.push('/login')
        }
      })
  }, [])


  const handleLogout = async () => {
    await fetch('/api/users/logout', { method: 'POST' })
    router.push('/login')
  }

  if (!user) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <h2 style={styles.logo}>Multi-Tenant CMS</h2>
        </div>

        <div style={styles.navRight}>
          {/* Profile Section with Dropdown */}
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

            {/* Dropdown Menu */}
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
        <h1 style={styles.welcomeTitle}>
          Welcome back, {user.email?.split('@')[0]}!
        </h1>
        <p style={styles.role}>Role: {user.role}</p>
        
        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h3>Total Products</h3>
            <p style={styles.statNumber}>{loading ? '...' : totalProducts}</p>
          </div>
          <div style={styles.statCard}>
            <h3>Active Tenants</h3>
            <p style={styles.statNumber}>{ loading ? '...': totalTenants}</p>
          </div>
          <div style={styles.statCard}>
            <h3>Users</h3>
            <p style={styles.statNumber}>0</p>
          </div>
        </div>

        {/* Quick Links */}
        <div style={styles.quickLinks}>
          <h2 style={styles.sectionTitle}>Quick Actions</h2>
          <div style={styles.linksGrid}>
            <Link href="/products" style={styles.linkCard}>
              <div style={styles.linkIcon}>📦</div>
              <h3>Manage Products</h3>
              <p>Add, edit or delete products</p>
            </Link>
            <Link href="/tenants" style={styles.linkCard}>
              <div style={styles.linkIcon}>🏢</div>
              <h3>Manage Tenants</h3>
              <p>View and manage tenants</p>
            </Link>
            <Link href="/users" style={styles.linkCard}>
              <div style={styles.linkIcon}>👥</div>
              <h3>Manage Users</h3>
              <p>View and manage users</p>
            </Link>
            <Link href="/reports" style={styles.linkCard}>
              <div style={styles.linkIcon}>📊</div>
              <h3>Reports</h3>
              <p>View analytics and reports</p>
            </Link>
          </div>
        </div>
      </main>
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
    margin: 0,
    color: '#667eea',
    fontSize: '20px'
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
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
    transition: 'background 0.3s',
    ':hover': {
      background: '#f0f0f0'
    }
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
    transition: 'background 0.3s',
    ':hover': {
      background: '#f5f5f5'
    }
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
  welcomeTitle: {
    fontSize: '32px',
    color: '#333',
    marginBottom: '10px'
  },
  role: {
    color: '#666',
    fontSize: '16px',
    marginBottom: '30px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  },
  statCard: {
    background: 'white',
    padding: '25px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
  },
  statNumber: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#667eea',
    margin: '10px 0 0 0'
  },
  quickLinks: {
    marginTop: '40px'
  },
  sectionTitle: {
    fontSize: '24px',
    color: '#333',
    marginBottom: '20px'
  },
  linksGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  },
  linkCard: {
    background: 'white',
    padding: '25px',
    borderRadius: '10px',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'transform 0.3s, box-shadow 0.3s',
    ':hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
    }
  },
  linkIcon: {
    fontSize: '40px',
    marginBottom: '15px'
  }
} as const