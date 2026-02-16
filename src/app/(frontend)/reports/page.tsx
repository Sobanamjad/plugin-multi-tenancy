'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ReportsPage() {
  const [user, setUser] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    products: {
      total: 0,
      published: 0,
      draft: 0,
      archived: 0,
      inStock: 0,
      outOfStock: 0,
      byCategory: {},
      recent: []
    },
    users: {
      total: 0,
      superAdmin: 0,
      tenantAdmin: 0,
      regular: 0
    },
    tenants: {
      total: 0,
      active: 0
    }
  })
  const router = useRouter()

  useEffect(() => {
    fetch('/api/users/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
          fetchReportsData()
        } else {
          router.push('/login')
        }
      })
  }, [])

  const fetchReportsData = async () => {
    setLoading(true)
    
    try {
      // Fetch products
      const productsRes = await fetch('/api/products?limit=100')
      const productsData = await productsRes.json()
      const products = productsData.docs || []
      
      // Fetch users (if super admin)
      let users = []
      if (user?.role === 'super-admin') {
        const usersRes = await fetch('/api/users?limit=100')
        const usersData = await usersRes.json()
        users = usersData.docs || []
      }
      
      // Fetch tenants (if super admin)
      let tenants = []
      if (user?.role === 'super-admin') {
        const tenantsRes = await fetch('/api/tenants')
        const tenantsData = await tenantsRes.json()
        tenants = tenantsData.docs || []
      }

      // Calculate product stats
      const productStats = {
        total: products.length,
        published: products.filter(p => p.status === 'published').length,
        draft: products.filter(p => p.status === 'draft').length,
        archived: products.filter(p => p.status === 'archived').length,
        inStock: products.filter(p => p.inStock === true).length,
        outOfStock: products.filter(p => p.inStock === false).length,
        byCategory: {},
        recent: products.slice(0, 5) // Last 5 products
      }

      // Calculate category stats
      products.forEach(product => {
        if (product.category) {
          productStats.byCategory[product.category] = (productStats.byCategory[product.category] || 0) + 1
        }
      })

      // Calculate user stats
      const userStats = {
        total: users.length,
        superAdmin: users.filter(u => u.role === 'super-admin').length,
        tenantAdmin: users.filter(u => u.role === 'tenant-admin').length,
        regular: users.filter(u => u.role === 'user').length
      }

      // Calculate tenant stats
      const tenantStats = {
        total: tenants.length,
        active: tenants.filter(t => t.status === 'active').length
      }

      setStats({
        products: productStats,
        users: userStats,
        tenants: tenantStats
      })
    } catch (error) {
      console.error('Error fetching reports data:', error)
    } finally {
      setLoading(false)
    }
  }

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
          <Link href="/dashboard" style={styles.logo}>
            Multi-Tenant CMS
          </Link>
        </div>

        <div style={styles.navRight}>
          <Link href="/dashboard" style={styles.navLink}>Dashboard</Link>
          <Link href="/products" style={styles.navLink}>Products</Link>
          {user.role === 'super-admin' && (
            <>
              <Link href="/tenants" style={styles.navLink}>Tenants</Link>
              <Link href="/users" style={styles.navLink}>Users</Link>
            </>
          )}
          <Link href="/reports" style={{...styles.navLink, ...styles.activeLink}}>Reports</Link>
          
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
          <h1 style={styles.title}>Reports & Analytics</h1>
          <p style={styles.subtitle}>View statistics and insights about your data</p>
        </div>

        {loading ? (
          <div style={styles.loading}>Loading reports...</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>📦</div>
                <div style={styles.statContent}>
                  <h3 style={styles.statLabel}>Total Products</h3>
                  <p style={styles.statNumber}>{stats.products.total}</p>
                </div>
              </div>

              {user.role === 'super-admin' && (
                <>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>👥</div>
                    <div style={styles.statContent}>
                      <h3 style={styles.statLabel}>Total Users</h3>
                      <p style={styles.statNumber}>{stats.users.total}</p>
                    </div>
                  </div>

                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>🏢</div>
                    <div style={styles.statContent}>
                      <h3 style={styles.statLabel}>Total Tenants</h3>
                      <p style={styles.statNumber}>{stats.tenants.total}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Products Status Chart */}
            <div style={styles.chartSection}>
              <h2 style={styles.sectionTitle}>Product Status</h2>
              <div style={styles.chartContainer}>
                <div style={styles.progressBarContainer}>
                  <div style={styles.progressBar}>
                    <div style={{
                      ...styles.progressSegment,
                      width: `${(stats.products.published / (stats.products.total || 1)) * 100}%`,
                      backgroundColor: '#48bb78'
                    }} />
                    <div style={{
                      ...styles.progressSegment,
                      width: `${(stats.products.draft / (stats.products.total || 1)) * 100}%`,
                      backgroundColor: '#ecc94b'
                    }} />
                    <div style={{
                      ...styles.progressSegment,
                      width: `${(stats.products.archived / (stats.products.total || 1)) * 100}%`,
                      backgroundColor: '#f56565'
                    }} />
                  </div>
                  <div style={styles.progressLabels}>
                    <span style={styles.progressLabel}><span style={{...styles.dot, backgroundColor: '#48bb78'}}></span> Published ({stats.products.published})</span>
                    <span style={styles.progressLabel}><span style={{...styles.dot, backgroundColor: '#ecc94b'}}></span> Draft ({stats.products.draft})</span>
                    <span style={styles.progressLabel}><span style={{...styles.dot, backgroundColor: '#f56565'}}></span> Archived ({stats.products.archived})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Status */}
            <div style={styles.chartSection}>
              <h2 style={styles.sectionTitle}>Stock Status</h2>
              <div style={styles.stockGrid}>
                <div style={styles.stockCard}>
                  <div style={styles.stockIcon}>✅</div>
                  <div>
                    <h4 style={styles.stockLabel}>In Stock</h4>
                    <p style={styles.stockNumber}>{stats.products.inStock}</p>
                  </div>
                </div>
                <div style={styles.stockCard}>
                  <div style={styles.stockIcon}>❌</div>
                  <div>
                    <h4 style={styles.stockLabel}>Out of Stock</h4>
                    <p style={styles.stockNumber}>{stats.products.outOfStock}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Distribution */}
            {Object.keys(stats.products.byCategory).length > 0 && (
              <div style={styles.chartSection}>
                <h2 style={styles.sectionTitle}>Products by Category</h2>
                <div style={styles.categoryGrid}>
                  {Object.entries(stats.products.byCategory).map(([category, count]) => (
                    <div key={category} style={styles.categoryCard}>
                      <h4 style={styles.categoryName}>{category}</h4>
                      <p style={styles.categoryCount}>{count as number}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Distribution (Super Admin only) */}
            {user.role === 'super-admin' && stats.users.total > 0 && (
              <div style={styles.chartSection}>
                <h2 style={styles.sectionTitle}>User Distribution</h2>
                <div style={styles.userGrid}>
                  <div style={styles.userCard}>
                    <h4 style={styles.userLabel}>Super Admins</h4>
                    <p style={styles.userCount}>{stats.users.superAdmin}</p>
                  </div>
                  <div style={styles.userCard}>
                    <h4 style={styles.userLabel}>Tenant Admins</h4>
                    <p style={styles.userCount}>{stats.users.tenantAdmin}</p>
                  </div>
                  <div style={styles.userCard}>
                    <h4 style={styles.userLabel}>Regular Users</h4>
                    <p style={styles.userCount}>{stats.users.regular}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Products */}
            <div style={styles.recentSection}>
              <h2 style={styles.sectionTitle}>Recent Products</h2>
              <div style={styles.recentList}>
                {stats.products.recent.map(product => (
                  <div key={product.id} style={styles.recentItem}>
                    <div style={styles.recentInfo}>
                      <strong>{product.name}</strong>
                      <span style={styles.recentPrice}>${product.price}</span>
                    </div>
                    <span style={styles.recentDate}>
                      {new Date(product.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {stats.products.recent.length === 0 && (
                  <p style={styles.noData}>No products found</p>
                )}
              </div>
            </div>
          </>
        )}
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
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#999'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  statIcon: {
    fontSize: '30px'
  },
  statContent: {
    flex: 1
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '5px'
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#667eea',
    margin: 0
  },
  chartSection: {
    background: 'white',
    borderRadius: '10px',
    padding: '25px',
    marginBottom: '30px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
  },
  sectionTitle: {
    fontSize: '20px',
    color: '#333',
    marginBottom: '20px'
  },
  chartContainer: {
    marginTop: '15px'
  },
  progressBarContainer: {
    width: '100%'
  },
  progressBar: {
    display: 'flex',
    height: '30px',
    borderRadius: '15px',
    overflow: 'hidden',
    marginBottom: '15px'
  },
  progressSegment: {
    height: '100%',
    transition: 'width 0.3s ease'
  },
  progressLabels: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap'
  },
  progressLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#666'
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block'
  },
  stockGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px'
  },
  stockCard: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  stockIcon: {
    fontSize: '24px'
  },
  stockLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '5px'
  },
  stockNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '15px'
  },
  categoryCard: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center'
  },
  categoryName: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '5px',
    textTransform: 'capitalize'
  },
  categoryCount: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#667eea',
    margin: 0
  },
  userGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px'
  },
  userCard: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px'
  },
  userLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '5px'
  },
  userCount: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#667eea',
    margin: 0
  },
  recentSection: {
    background: 'white',
    borderRadius: '10px',
    padding: '25px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
  },
  recentList: {
    marginTop: '15px'
  },
  recentItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #e9ecef'
  },
  recentInfo: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center'
  },
  recentPrice: {
    color: '#667eea',
    fontWeight: '500'
  },
  recentDate: {
    color: '#999',
    fontSize: '12px'
  },
  noData: {
    textAlign: 'center',
    padding: '20px',
    color: '#999'
  }
} as const