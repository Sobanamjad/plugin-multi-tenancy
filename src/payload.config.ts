import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Tenants } from './collections/Tenants'
import { Products } from './collections/Products'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users, Tenants, Products],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [
    multiTenantPlugin({
      // ✅ YEH SAHI TARIKA HAI - collections object ke andar slug use karo
      collections: {
        // Collection slug = 'products'
        products: {
          tenantField: {
            name: 'tenant',  // Field name
            relationTo: 'tenants',  // Related collection
            required: true,
          }
        }
      },
      tenantsSlug: 'tenants',
      tenantsArrayField: {
        name: 'tenants',  // Users collection mein yeh field add hoga
        arrayFieldName: 'tenants',
        arrayTenantFieldName: 'tenant',
      },
      userHasAccessToAllTenants: (user) => user?.role === 'super-admin',
    }),
  ],
})