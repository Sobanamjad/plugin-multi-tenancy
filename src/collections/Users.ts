import { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: 'System',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'super-admin') return true
      if (user?.role === 'tenant-admin') {
        return {
          'tenants.tenant': {
            in: user?.tenants?.map(t => 
              typeof t.tenant === 'object' ? t.tenant.id : t.tenant
            ) || []
          }
        }
      }
      return { id: { equals: user?.id } }
    },
    create: ({ req: { user } }) => {
      if (user?.role === 'super-admin') return true
      if (user?.role === 'tenant-admin' && user?.tenants?.length > 0) return true
      return false
    },
    update: ({ req: { user } }) => {
      if (user?.role === 'super-admin') return true
      if (user?.role === 'tenant-admin') {
        return {
          'tenants.tenant': {
            in: user?.tenants?.map(t => 
              typeof t.tenant === 'object' ? t.tenant.id : t.tenant
            ) || []
          }
        }
      }
      return { id: { equals: user?.id } }
    },
    delete: ({ req: { user } }) => {
      if (user?.role === 'super-admin') return true
      if (user?.role === 'tenant-admin') {
        return {
          'tenants.tenant': {
            in: user?.tenants?.map(t => 
              typeof t.tenant === 'object' ? t.tenant.id : t.tenant
            ) || []
          }
        }
      }
      return false
    },
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      options: [
        { label: 'Super Admin', value: 'super-admin' },
        { label: 'Tenant Admin', value: 'tenant-admin' },
        { label: 'User', value: 'user' },
      ],
      defaultValue: 'user',
    },
    // ❌ tenants ARRAY MAT ADD KARO - plugin auto-add karega
  ],
}