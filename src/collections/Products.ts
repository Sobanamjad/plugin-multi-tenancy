import { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    defaultColumns: ['name', 'price', 'tenant'],
  },
  access: {
    // ✅ Read - sab apne tenant ke products dekh sakte hain
    read: ({ req: { user } }) => {
      if (user?.role === 'super-admin') return true
      // Sirf apne tenant ke products dikhao
      const tenantIds = user?.tenants?.map(({ tenant }) => 
        typeof tenant === 'object' ? tenant.id : tenant
      ) || []
      return {
        tenant: {
          in: tenantIds
        }
      }
    },
    
    // ✅ Create - Tenant Admin bhi create kar sakta hai
    create: ({ req: { user } }) => {
      if (user?.role === 'super-admin') return true
      if (user?.role === 'tenant-admin' && user?.tenants?.length > 0) return true
      return false
    },
    
    // ✅ Update - Tenant Admin apne tenant ke products edit kar sakta hai
    update: ({ req: { user } }) => {
      if (user?.role === 'super-admin') return true
      if (user?.role === 'tenant-admin') {
        const tenantIds = user?.tenants?.map(({ tenant }) => 
          typeof tenant === 'object' ? tenant.id : tenant
        ) || []
        return {
          tenant: {
            in: tenantIds
          }
        }
      }
      return false
    },
    
    // ✅ Delete - Tenant Admin apne tenant ke products delete kar sakta hai
    delete: ({ req: { user } }) => {
      if (user?.role === 'super-admin') return true
      if (user?.role === 'tenant-admin') {
        const tenantIds = user?.tenants?.map(({ tenant }) => 
          typeof tenant === 'object' ? tenant.id : tenant
        ) || []
        return {
          tenant: {
            in: tenantIds
          }
        }
      }
      return false
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Product Name',
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      label: 'Price',
      min: 0,
    },
    // Tenant field plugin auto-add karega
  ],
}