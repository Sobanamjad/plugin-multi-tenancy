import { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    defaultColumns: ['name', 'price', 'tenant'],
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
  ],
}