import { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: 'System',
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
        {
          label: 'Super Admin',
          value: 'super-admin',
        },
        {
          label: 'Tenant Admin',
          value: 'tenant-admin',
        },
      ],
      defaultValue: 'tenant-admin',
    },
  ],
}