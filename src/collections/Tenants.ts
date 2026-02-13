import { CollectionConfig } from 'payload'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'name',
    group: 'System',
  },
  access: {
    // ✅ Sab users read kar sakte hain
    read: () => true,
    
    // ✅ Sirf Super Admin create/update/delete kar sakta hai
    create: ({ req: { user } }) => user?.role === 'super-admin',
    update: ({ req: { user } }) => user?.role === 'super-admin',
    delete: ({ req: { user } }) => user?.role === 'super-admin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      hooks: {
        beforeValidate: [
          ({ data }) => {
            if (data?.name && !data?.slug) {
              return data.name.toLowerCase().replace(/\s+/g, '-')
            }
            return data?.slug
          },
        ],
      },
    }
  ],
}