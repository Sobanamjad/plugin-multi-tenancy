import { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    defaultColumns: ['name', 'price', 'description', 'image', 'tenant'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Product Name',
      admin: {
        placeholder: 'Enter product name...'
      }
    },
    
    {
      name: 'price',
      type: 'number',
      required: true,
      label: 'Price',
      min: 0,
      admin: {
        placeholder: '0.00',
        step: 0.01
      }
    },
    
    {
      name: 'shortDescription',
      type: 'textarea',
      label: 'Short Description',
      admin: {
        placeholder: 'Brief description for product listings...',
        rows: 3,
        maxLength: 200,
        description: 'Maximum 200 characters'
      }
    },
    
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
      admin: {
        placeholder: 'Enter product description...',
        elements: [
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'link',
          'blockquote',
          'ul',
          'ol',
          'indent',
        ],
        leaves: [
          'bold',
          'italic',
          'underline',
          'strikethrough',
          'code',
        ],
      }
    },
    
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Product Image',
      admin: {
        position: 'sidebar',
        description: 'Upload main product image'
      }
    },
    
    {
      name: 'gallery',
      type: 'array',
      label: 'Product Gallery',
      labels: {
        singular: 'Image',
        plural: 'Images'
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'altText',
          type: 'text',
          label: 'Alt Text',
          admin: {
            placeholder: 'Describe the image for accessibility...'
          }
        }
      ],
      admin: {
        description: 'Additional product images'
      }
    },
    
    {
      name: 'category',
      type: 'select',
      label: 'Category',
      options: [
        { label: 'Electronics', value: 'electronics' },
        { label: 'Clothing', value: 'clothing' },
        { label: 'Books', value: 'books' },
        { label: 'Home & Garden', value: 'home-garden' },
        { label: 'Sports', value: 'sports' },
        { label: 'Toys', value: 'toys' },
        { label: 'Food', value: 'food' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        position: 'sidebar',
      }
    },
    
    {
      name: 'tags',
      type: 'text',
      label: 'Tags',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'Press Enter to add tags'
      }
    },
    
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: {
        position: 'sidebar',
      }
    },
    
    {
      name: 'inStock',
      type: 'checkbox',
      label: 'In Stock',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      }
    },
    
    {
      name: 'quantity',
      type: 'number',
      label: 'Quantity',
      min: 0,
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        condition: (data) => data?.inStock === true,
      }
    },
    
    {
      name: 'sku',
      type: 'text',
      label: 'SKU',
      unique: true,
      admin: {
        position: 'sidebar',
        placeholder: 'e.g., PRD-001'
      }
    },
  ],
}