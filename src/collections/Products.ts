import type { CollectionConfig } from 'payload';

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'price',
      type: 'number',
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: false,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],

  hooks: {
    beforeChange: [
      ({ data, req }) => {
        if (!data) data = {};

        if (req.user?.role === 'super-admin') {
          data.tenant = null;
          return data;
        }

        if (!req.user?.tenant) {
          throw new Error('Your user account has no tenant assigned');
        }

        data.tenant =
          data.tenant?.id ??
          data.tenant ??
          req.user.tenant?.id ??
          req.user.tenant;

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