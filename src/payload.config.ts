import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Tenants } from './collections/Tenants'
import { Products } from './collections/Products'
import { Media } from './collections/Media'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'


const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users, Tenants, Products, Media,],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  localization: {
    locales: ['en', 'ur', 'ar', 'fr', 'es', 'de'], // ← add the languages you need
    defaultLocale: 'en',
    fallback: true,           // very useful — shows English if translation missing
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [
    multiTenantPlugin({
      collections: {
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
        name: 'tenants',  
        arrayFieldName: 'tenants',
        arrayTenantFieldName: 'tenant',
      },
      userHasAccessToAllTenants: (user) => user?.role === 'super-admin',
      enableLocalizedTenants: true, 
    }),
  ],
})