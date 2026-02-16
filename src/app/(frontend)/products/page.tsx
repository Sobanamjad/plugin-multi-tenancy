'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Language Context
const useLanguage = () => {
  const [locale, setLocale] = useState('en')

  useEffect(() => {
    const cookies = document.cookie.split(';')
    const localeCookie = cookies.find(c => c.trim().startsWith('payload-locale='))
    if (localeCookie) {
      setLocale(localeCookie.split('=')[1].trim())
    }
  }, [])

  const changeLanguage = (lang: string) => {
    document.cookie = `payload-locale=${lang}; path=/; max-age=31536000`
    document.cookie = `locale=${lang}; path=/; max-age=31536000`
    setLocale(lang)
    window.location.reload()
  }

  const t = (text: any): string => {
    if (!text) return ''
    if (typeof text === 'string') return text
    if (typeof text === 'object') {
      return text[locale] || text.en || ''
    }
    return ''
  }

  return { locale, changeLanguage, t }
}

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
    image: null,
    tenant: null
  })
  const [user, setUser] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const router = useRouter()
  
  const { locale, changeLanguage, t } = useLanguage()

  // Fetch user and tenant on mount
  useEffect(() => {
    fetch('/api/users/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
          // Set tenant from user
          if (data.user.tenant) {
            setFormData(prev => ({ ...prev, tenant: data.user.tenant.id }))
          } else {
            // If user doesn't have tenant, fetch first tenant
            fetch('/api/tenants?limit=1')
              .then(res => res.json())
              .then(tenantData => {
                if (tenantData.docs && tenantData.docs[0]) {
                  setFormData(prev => ({ ...prev, tenant: tenantData.docs[0].id }))
                }
              })
          }
          fetchProducts()
        } else {
          router.push('/login')
        }
      })
  }, [])

  // Fetch products with current locale
  const fetchProducts = async () => {
    try {
      const res = await fetch(`/api/products?locale=${locale}&depth=2`)
      const data = await res.json()
      setProducts(data.docs || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  // Reload products when locale changes
  useEffect(() => {
    if (user) {
      fetchProducts()
    }
  }, [locale])

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
    
    try {
      let imageData = null
      if (selectedFile) {
        imageData = await uploadImage()
      }

      // Get tenant ID from multiple sources
      let tenantId = formData.tenant
      if (!tenantId && user?.tenant) {
        tenantId = user.tenant.id
      }
      if (!tenantId) {
        // Try to get from localStorage or session
        const savedTenant = localStorage.getItem('currentTenant')
        if (savedTenant) {
          tenantId = savedTenant
        }
      }

      if (!tenantId) {
        alert('No tenant found. Please select a tenant first.')
        return
      }

      const productData = {
        name: formData.name,
        price: parseFloat(formData.price),
        shortDescription: formData.shortDescription,
        description: formData.description,
        category: formData.category,
        status: formData.status,
        inStock: formData.inStock,
        quantity: parseInt(formData.quantity) || 0,
        sku: formData.sku,
        tenant: tenantId // CRITICAL: Always include tenant
      }

      if (imageData) {
        productData.image = imageData.id
      }

      console.log('Submitting product data:', productData)

      const url = editingProduct 
        ? `/api/products/${editingProduct.id}?locale=${locale}`
        : `/api/products?locale=${locale}`
      
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
          image: null,
          tenant: tenantId // Preserve tenant ID
        })
        fetchProducts()
      } else {
        const error = await res.json()
        console.error('Product creation failed:', error)
        alert(`Error: ${error.errors?.[0]?.message || 'Something went wrong'}`)
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert('An error occurred while saving the product')
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: t(product.name),
      price: product.price,
      shortDescription: t(product.shortDescription),
      description: t(product.description),
      category: t(product.category),
      status: product.status || 'draft',
      inStock: product.inStock ?? true,
      quantity: product.quantity || 0,
      sku: product.sku || '',
      image: product.image || null,
      tenant: product.tenant?.id || formData.tenant // Preserve tenant
    })
    if (product.image) {
      setPreviewUrl(product.image.url)
    }
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm(t({ en: 'Are you sure you want to delete this product?', ur: 'کیا آپ واقعی یہ پروڈکٹ حذف کرنا چاہتے ہیں؟' }))) {
      try {
        await fetch(`/api/products/${id}`, { method: 'DELETE' })
        fetchProducts()
      } catch (error) {
        console.error('Delete error:', error)
      }
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
        <p>{t({ en: 'Loading...', ur: 'لوڈ ہو رہا ہے...' })}</p>
      </div>
    )
  }

  return (
    <div style={{...styles.container, direction: locale === 'ur' ? 'rtl' : 'ltr'}}>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <Link href="/dashboard" style={styles.logo}>
            {t({ en: 'Multi-Tenant CMS', ur: 'ملٹی ٹیننٹ سی ایم ایس' })}
          </Link>
        </div>

        <div style={styles.navRight}>
          {/* Language Switcher */}
          <div style={styles.languageSwitcher}>
            <button
              onClick={() => changeLanguage('en')}
              style={{
                ...styles.langBtn,
                background: locale === 'en' ? '#667eea' : 'transparent',
                color: locale === 'en' ? 'white' : '#666'
              }}
            >
              EN
            </button>
            <button
              onClick={() => changeLanguage('ur')}
              style={{
                ...styles.langBtn,
                background: locale === 'ur' ? '#667eea' : 'transparent',
                color: locale === 'ur' ? 'white' : '#666'
              }}
            >
              UR
            </button>
          </div>

          <Link href="/dashboard" style={{...styles.navLink}}>
            {t({ en: 'Dashboard', ur: 'ڈیش بورڈ' })}
          </Link>
          <Link href="/products" style={{...styles.navLink, ...styles.activeLink}}>
            {t({ en: 'Products', ur: 'مصنوعات' })}
          </Link>
          <Link href="/tenants" style={styles.navLink}>
            {t({ en: 'Tenants', ur: 'کرایہ دار' })}
          </Link>
          <Link href="/users" style={styles.navLink}>
            {t({ en: 'Users', ur: 'صارفین' })}
          </Link>

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
                  <span>👤</span> {t({ en: 'Profile', ur: 'پروفائل' })}
                </Link>
                <Link href="/settings" style={styles.dropdownItem}>
                  <span>⚙️</span> {t({ en: 'Settings', ur: 'ترتیبات' })}
                </Link>
                <div style={styles.dropdownDivider}></div>
                <button onClick={handleLogout} style={styles.dropdownItem}>
                  <span>🚪</span> {t({ en: 'Logout', ur: 'لاگ آؤٹ' })}
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
            <h1 style={styles.title}>
              {t({ en: 'Products', ur: 'مصنوعات' })}
            </h1>
            <p style={styles.subtitle}>
              {t({ en: 'Manage your products', ur: 'اپنی مصنوعات کا نظم کریں' })}
            </p>
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
                image: null,
                tenant: formData.tenant // Preserve tenant
              })
              setShowModal(true)
            }}
          >
            {t({ en: '+ Add New Product', ur: '+ نئی پروڈکٹ شامل کریں' })}
          </button>
        </div>

        {/* Products Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>{t({ en: 'Image', ur: 'تصویر' })}</th>
                <th style={styles.th}>{t({ en: 'Name', ur: 'نام' })}</th>
                <th style={styles.th}>{t({ en: 'Price', ur: 'قیمت' })}</th>
                <th style={styles.th}>{t({ en: 'Category', ur: 'زمرہ' })}</th>
                <th style={styles.th}>{t({ en: 'Status', ur: 'حالت' })}</th>
                <th style={styles.th}>{t({ en: 'Stock', ur: 'اسٹاک' })}</th>
                <th style={styles.th}>{t({ en: 'Actions', ur: 'کارروائیاں' })}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} style={styles.tr}>
                  <td style={styles.td}>
                    {product.image ? (
                      <img 
                        src={product.image.url} 
                        alt={t(product.name)}
                        style={styles.productImage}
                      />
                    ) : (
                      <div style={styles.noImage}>📷</div>
                    )}
                  </td>
                  <td style={styles.td}>
                    <strong>{t(product.name)}</strong>
                    <div style={styles.sku}>
                      {t({ en: 'SKU', ur: 'ایس کے یو' })}: {product.sku || 'N/A'}
                    </div>
                  </td>
                  <td style={styles.td}>
                    {locale === 'ur' ? 'روپیہ' : '$'} {product.price}
                  </td>
                  <td style={styles.td}>{t(product.category) || 'N/A'}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: product.status === 'published' ? '#c6f6d5' : 
                                     product.status === 'draft' ? '#fff3cd' : '#fed7d7',
                      color: product.status === 'published' ? '#22543d' : 
                            product.status === 'draft' ? '#856404' : '#742a2a'
                    }}>
                      {t({ 
                        en: product.status, 
                        ur: product.status === 'published' ? 'شائع شدہ' :
                            product.status === 'draft' ? 'مسودہ' : 'محفوظ شدہ'
                      })}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {product.inStock ? (
                      <span style={styles.inStock}>
                        ✓ {product.quantity} {t({ en: 'in stock', ur: 'اسٹاک میں' })}
                      </span>
                    ) : (
                      <span style={styles.outOfStock}>
                        {t({ en: '✗ Out of stock', ur: '✗ اسٹاک ختم' })}
                      </span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <button 
                      style={styles.editBtn}
                      onClick={() => handleEdit(product)}
                    >
                      {t({ en: 'Edit', ur: 'ترمیم' })}
                    </button>
                    <button 
                      style={styles.deleteBtn}
                      onClick={() => handleDelete(product.id)}
                    >
                      {t({ en: 'Delete', ur: 'حذف کریں' })}
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan="7" style={styles.noData}>
                    {t({ 
                      en: 'No products found. Click "Add New Product" to create one.',
                      ur: 'کوئی پروڈکٹ نہیں ملی۔ نیا بنانے کے لیے "نئی پروڈکٹ شامل کریں" پر کلک کریں۔'
                    })}
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
              {editingProduct 
                ? t({ en: 'Edit Product', ur: 'پروڈکٹ میں ترمیم' })
                : t({ en: 'Add New Product', ur: 'نئی پروڈکٹ شامل کریں' })
              }
            </h2>
            
            <form onSubmit={handleSubmit} style={styles.modalForm}>
              {/* Hidden tenant field - CRITICAL */}
              <input 
                type="hidden" 
                name="tenant" 
                value={formData.tenant || user?.tenant?.id || ''} 
              />

              {/* Image Upload Field */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  {t({ en: 'Product Image', ur: 'پروڈکٹ کی تصویر' })}
                </label>
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
                        📸 {t({ en: 'Click to upload image', ur: 'تصویر اپ لوڈ کرنے کے لیے کلک کریں' })}
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    {t({ en: 'Product Name *', ur: 'پروڈکٹ کا نام *' })}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                    placeholder={t({ en: 'Enter product name', ur: 'پروڈکٹ کا نام درج کریں' })}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    {t({ en: 'Price *', ur: 'قیمت *' })}
                  </label>
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
                  <label style={styles.label}>
                    {t({ en: 'SKU', ur: 'ایس کے یو' })}
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder={t({ en: 'e.g., PRD-001', ur: 'مثلاً، PRD-001' })}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    {t({ en: 'Category', ur: 'زمرہ' })}
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    style={styles.select}
                  >
                    <option value="">
                      {t({ en: 'Select Category', ur: 'زمرہ منتخب کریں' })}
                    </option>
                    <option value="electronics">
                      {t({ en: 'Electronics', ur: 'الیکٹرانکس' })}
                    </option>
                    <option value="clothing">
                      {t({ en: 'Clothing', ur: 'لباس' })}
                    </option>
                    <option value="books">
                      {t({ en: 'Books', ur: 'کتب' })}
                    </option>
                    <option value="home-garden">
                      {t({ en: 'Home & Garden', ur: 'گھر اور باغ' })}
                    </option>
                    <option value="sports">
                      {t({ en: 'Sports', ur: 'کھیل' })}
                    </option>
                    <option value="toys">
                      {t({ en: 'Toys', ur: 'کھلونے' })}
                    </option>
                    <option value="food">
                      {t({ en: 'Food', ur: 'کھانا' })}
                    </option>
                    <option value="other">
                      {t({ en: 'Other', ur: 'دیگر' })}
                    </option>
                  </select>
                </div>
              </div>

              {/* Short Description */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  {t({ en: 'Short Description', ur: 'مختصر تفصیل' })}
                </label>
                <textarea
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  style={styles.textarea}
                  rows="2"
                  maxLength="200"
                  placeholder={t({ en: 'Brief description (max 200 chars)', ur: 'مختصر تفصیل (زیادہ سے زیادہ 200 حروف)' })}
                />
              </div>

              {/* Full Description */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  {t({ en: 'Full Description', ur: 'مکمل تفصیل' })}
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  style={styles.textarea}
                  rows="4"
                  placeholder={t({ en: 'Detailed product description', ur: 'تفصیلی پروڈکٹ کی تفصیل' })}
                />
              </div>

              {/* Status and Stock */}
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    {t({ en: 'Status', ur: 'حالت' })}
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    style={styles.select}
                  >
                    <option value="draft">
                      {t({ en: 'Draft', ur: 'مسودہ' })}
                    </option>
                    <option value="published">
                      {t({ en: 'Published', ur: 'شائع شدہ' })}
                    </option>
                    <option value="archived">
                      {t({ en: 'Archived', ur: 'محفوظ شدہ' })}
                    </option>
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
                    {t({ en: 'In Stock', ur: 'اسٹاک میں' })}
                  </label>
                  
                  {formData.inStock && (
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      style={{...styles.input, marginTop: '10px'}}
                      placeholder={t({ en: 'Quantity', ur: 'تعداد' })}
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
                  {t({ en: 'Cancel', ur: 'منسوخ کریں' })}
                </button>
                <button type="submit" style={styles.saveBtn}>
                  {editingProduct 
                    ? t({ en: 'Update Product', ur: 'پروڈکٹ اپ ڈیٹ کریں' })
                    : t({ en: 'Create Product', ur: 'پروڈکٹ بنائیں' })
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


const additionalStyles = {
  languageSwitcher: {
    display: 'flex',
    gap: '5px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    padding: '2px',
    marginRight: '20px'
  },
  langBtn: {
    padding: '4px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s'
  }
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