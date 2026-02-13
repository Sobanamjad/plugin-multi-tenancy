'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({ 
    name: '', 
    price: '',
    shortDescription: '',
    description: '',
    category: '',
    status: 'draft',
    inStock: true,
    quantity: 0,
    sku: '',
    image: null
  })
  const [user, setUser] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetch('/api/users/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
          fetchProducts()
        } else {
          router.push('/login')
        }
      })
  }, [])

  const fetchProducts = async () => {
    const res = await fetch('/api/products')
    const data = await res.json()
    setProducts(data.docs || [])
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const uploadImage = async () => {
    if (!selectedFile) return null

    const formData = new FormData()
    formData.append('file', selectedFile)

    const res = await fetch('/api/media', {
      method: 'POST',
      body: formData
    })

    if (res.ok) {
      const data = await res.json()
      return data.doc
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    let imageData = null
    if (selectedFile) {
      imageData = await uploadImage()
    }

    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity) || 0
    }

    if (imageData) {
      productData.image = imageData.id
    }
    
    const url = editingProduct 
      ? `/api/products/${editingProduct.id}`
      : '/api/products'
    
    const method = editingProduct ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    })

    if (res.ok) {
      setShowModal(false)
      setEditingProduct(null)
      setSelectedFile(null)
      setPreviewUrl('')
      setFormData({ 
        name: '', 
        price: '',
        shortDescription: '',
        description: '',
        category: '',
        status: 'draft',
        inStock: true,
        quantity: 0,
        sku: '',
        image: null
      })
      fetchProducts()
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      price: product.price,
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      category: product.category || '',
      status: product.status || 'draft',
      inStock: product.inStock ?? true,
      quantity: product.quantity || 0,
      sku: product.sku || '',
      image: product.image || null
    })
    if (product.image) {
      setPreviewUrl(product.image.url)
    }
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await fetch(`/api/products/${id}`, { method: 'DELETE' })
      fetchProducts()
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
          <Link href="/products" style={{...styles.navLink, ...styles.activeLink}}>Products</Link>
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
            <h1 style={styles.title}>Products</h1>
            <p style={styles.subtitle}>Manage your products</p>
          </div>
          <button 
            style={styles.addButton}
            onClick={() => {
              setEditingProduct(null)
              setSelectedFile(null)
              setPreviewUrl('')
              setFormData({ 
                name: '', 
                price: '',
                shortDescription: '',
                description: '',
                category: '',
                status: 'draft',
                inStock: true,
                quantity: 0,
                sku: '',
                image: null
              })
              setShowModal(true)
            }}
          >
            + Add New Product
          </button>
        </div>

        {/* Products Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Image</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} style={styles.tr}>
                  <td style={styles.td}>
                    {product.image ? (
                      <img 
                        src={product.image.url} 
                        alt={product.name}
                        style={styles.productImage}
                      />
                    ) : (
                      <div style={styles.noImage}>📷</div>
                    )}
                  </td>
                  <td style={styles.td}>
                    <strong>{product.name}</strong>
                    <div style={styles.sku}>SKU: {product.sku || 'N/A'}</div>
                  </td>
                  <td style={styles.td}>${product.price}</td>
                  <td style={styles.td}>{product.category || 'N/A'}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: product.status === 'published' ? '#c6f6d5' : 
                                     product.status === 'draft' ? '#fff3cd' : '#fed7d7',
                      color: product.status === 'published' ? '#22543d' : 
                            product.status === 'draft' ? '#856404' : '#742a2a'
                    }}>
                      {product.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {product.inStock ? (
                      <span style={styles.inStock}>✓ {product.quantity}</span>
                    ) : (
                      <span style={styles.outOfStock}>✗ Out</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <button 
                      style={styles.editBtn}
                      onClick={() => handleEdit(product)}
                    >
                      Edit
                    </button>
                    <button 
                      style={styles.deleteBtn}
                      onClick={() => handleDelete(product.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan="7" style={styles.noData}>
                    No products found. Click "Add New Product" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            
            <form onSubmit={handleSubmit} style={styles.modalForm}>
              {/* Image Upload Field - NEW */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Product Image</label>
                <div style={styles.imageUploadContainer}>
                  {previewUrl ? (
                    <div style={styles.imagePreview}>
                      <img src={previewUrl} alt="Preview" style={styles.previewImage} />
                      <button 
                        type="button"
                        style={styles.removeImageBtn}
                        onClick={() => {
                          setSelectedFile(null)
                          setPreviewUrl('')
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div style={styles.uploadArea}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={styles.fileInput}
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" style={styles.uploadLabel}>
                        📸 Click to upload image
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                    placeholder="Enter product name"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Price *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* SKU and Category */}
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>SKU</label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="e.g., PRD-001"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    style={styles.select}
                  >
                    <option value="">Select Category</option>
                    <option value="electronics">Electronics</option>
                    <option value="clothing">Clothing</option>
                    <option value="books">Books</option>
                    <option value="home-garden">Home & Garden</option>
                    <option value="sports">Sports</option>
                    <option value="toys">Toys</option>
                    <option value="food">Food</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Short Description */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Short Description</label>
                <textarea
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  style={styles.textarea}
                  rows="2"
                  maxLength="200"
                  placeholder="Brief description (max 200 chars)"
                />
              </div>

              {/* Full Description */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  style={styles.textarea}
                  rows="4"
                  placeholder="Detailed product description"
                />
              </div>

              {/* Status and Stock */}
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    style={styles.select}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="inStock"
                      checked={formData.inStock}
                      onChange={handleInputChange}
                    />
                    In Stock
                  </label>
                  
                  {formData.inStock && (
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      style={{...styles.input, marginTop: '10px'}}
                      placeholder="Quantity"
                      min="0"
                    />
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div style={styles.modalActions}>
                <button 
                  type="button" 
                  style={styles.cancelBtn}
                  onClick={() => {
                    setShowModal(false)
                    setSelectedFile(null)
                    setPreviewUrl('')
                  }}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.saveBtn}>
                  {editingProduct ? 'Update Product' : 'Create Product'}
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
    overflow: 'hidden'
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
  productImage: {
    width: '50px',
    height: '50px',
    objectFit: 'cover',
    borderRadius: '5px'
  },
  noImage: {
    width: '50px',
    height: '50px',
    background: '#f0f0f0',
    borderRadius: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    color: '#999'
  },
  sku: {
    fontSize: '12px',
    color: '#999',
    marginTop: '4px'
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500'
  },
  inStock: {
    color: '#22543d',
    backgroundColor: '#c6f6d5',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  outOfStock: {
    color: '#742a2a',
    backgroundColor: '#fed7d7',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px'
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
    maxWidth: '700px',
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
    gridTemplateColumns: '1fr 1fr',
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
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#555',
    fontSize: '14px',
    cursor: 'pointer'
  },
  input: {
    padding: '10px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border-color 0.3s'
  },
  textarea: {
    padding: '10px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  select: {
    padding: '10px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white'
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
  },
   imageUploadContainer: {
    marginBottom: '10px'
  },
  imagePreview: {
    position: 'relative',
    width: '200px',
    height: '200px',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '2px solid #e0e0e0'
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  removeImageBtn: {
    position: 'absolute',
    top: '5px',
    right: '5px',
    background: 'rgba(0,0,0,0.5)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '25px',
    height: '25px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadArea: {
    border: '2px dashed #e0e0e0',
    borderRadius: '8px',
    padding: '30px',
    textAlign: 'center',
    background: '#f9f9f9'
  },
  fileInput: {
    display: 'none'
  },
  uploadLabel: {
    cursor: 'pointer',
    color: '#667eea',
    fontSize: '14px',
    fontWeight: '500'
  }
} as const