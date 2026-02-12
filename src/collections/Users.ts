// collections/Users.ts
import type { CollectionConfig } from 'payload';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'password',
      type: 'password',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      options: [
        { label: 'Super Admin', value: 'super-admin' },
        { label: 'Tenant User', value: 'tenant-user' },
      ],
      defaultValue: 'tenant-user',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: false,

      // Allow super-admin to read/write this field
      access: {
        create: ({ req }) => req.user?.role === 'super-admin',
        update: ({ req }) => req.user?.role === 'super-admin',
        read: ({ req }) => !!req.user,  // ← changed to allow logged-in users to read (helps dropdown)
      },

      // Crucial: super-admin sees ALL tenants in dropdown
      filterOptions: ({ req }) => {
        if (req.user?.role === 'super-admin') {
          return true; // no filter → all tenants visible
        }
        // For tenant users (if they ever see this field)
        return {
          id: { equals: req.user?.tenant },
        };
      },

      admin: {
        position: 'sidebar',
        condition: (data, siblingData, { user }) => user?.role === 'super-admin',
        description: 'Super admins must select a tenant for new tenant-users',
      },
    },
  ],

  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation !== 'create' && operation !== 'update') return data;

        if (!data) data = {};

        // Super admin → no tenant
        if (data.role === 'super-admin') {
          data.tenant = null;
          return data;
        }

        // Tenant-user creation / update
        let tenantId = data.tenant?.id ?? data.tenant;

        if (!tenantId) {
          tenantId = req.user?.tenant?.id ?? req.user?.tenant;
        }

        if (!tenantId) {
          throw new Error(
            'A tenant must be selected when creating a Tenant User. ' +
            'Choose one from the dropdown.'
          );
        }

        data.tenant = tenantId;
        return data;
      },
    ],
  },

  access: {
    read: ({ req }) => {
      if (!req.user) return false;
      if (req.user.role === 'super-admin') return true;
      if (!req.user.tenant) return false;

      const tenantId =
        typeof req.user.tenant === 'object' && req.user.tenant?.id
          ? req.user.tenant.id
          : req.user.tenant;

      return {
        tenant: {
          equals: tenantId,
        },
      };
    },

    create: ({ req }) => !!req.user,

    update: ({ req, doc }) => {
      if (!req.user) return false;
      if (req.user.role === 'super-admin') return true;
      if (!req.user.tenant || !doc?.tenant) return false;

      const userTenantId =
        typeof req.user.tenant === 'object' ? req.user.tenant.id : req.user.tenant;
      const docTenantId =
        typeof doc.tenant === 'object' ? doc.tenant.id : doc.tenant;

      return docTenantId === userTenantId;
    },

    delete: ({ req, doc }) => {
      if (!req.user) return false;
      if (req.user.role === 'super-admin') return true;
      if (!req.user.tenant || !doc?.tenant) return false;

      const userTenantId =
        typeof req.user.tenant === 'object' ? req.user.tenant.id : req.user.tenant;
      const docTenantId =
        typeof doc.tenant === 'object' ? doc.tenant.id : doc.tenant;

      return docTenantId === userTenantId;
    },
  },
};