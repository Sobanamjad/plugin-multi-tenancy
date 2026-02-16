import { CollectionConfig, CollectionBeforeChangeHook } from 'payload'
import { TranslationService } from '@/lib/translate' // ← your file from before

const autoTranslateHook: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  // Only run on create + update (not on read/delete)
  if (operation !== 'create' && operation !== 'update') return data

  const defaultLocale = req.payload.collections['products'].config.localization?.defaultLocale || 'en'
  const locales = req.payload.collections['products'].config.localization?.locales || ['en']

  // We only auto-translate if English exists and is non-empty
  if (!data.name?.[defaultLocale]?.trim() && !data.shortDescription?.[defaultLocale]?.trim()) {
    return data // skip if no English content
  }

  // Prepare result (we mutate a copy)
  const newData = { ...data }

  // List of localized text(-like) fields we want to translate
  const fieldsToTranslate = [
    { name: 'name', type: 'text' },
    { name: 'shortDescription', type: 'textarea' },
    { name: 'description', type: 'richText' },
    { name: 'category', type: 'select' },     // we translate the label, not value
    { name: 'tags', type: 'text' },           // comma separated → translate each
  ]

  for (const locale of locales) {
    if (locale === defaultLocale) continue

    // Skip if this locale already has good content (prevents overwriting manual edits)
    if (newData.name?.[locale]?.trim() && newData.shortDescription?.[locale]?.trim()) {
      continue
    }

    for (const field of fieldsToTranslate) {
      const englishValue = newData[field.name]?.[defaultLocale]

      if (!englishValue || typeof englishValue !== 'string') continue

      let translated = englishValue

      try {
        if (field.type === 'richText') {
          // Use your rich text translator
          translated = await TranslationService.translateRichText(englishValue, locale)
        } else {
          // Simple text / textarea / select label / tags
          translated = await TranslationService.translate(englishValue, locale)
        }

        // For category (select): translate the displayed label, but maybe keep value same
        // If you want value also localized → change logic here
        if (field.name === 'category' && translated !== englishValue) {
          // Option A: translate label only, keep value English
          // Option B: make category values themselves localized strings
        }

        // For tags (array of strings)
        if (field.name === 'tags' && Array.isArray(englishValue)) {
          translated = await Promise.all(
            englishValue.map(tag => TranslationService.translate(tag.trim(), locale))
          )
        }

        // Write back
        newData[field.name] = {
          ...(newData[field.name] || {}),
          [locale]: translated,
        }
      } catch (err) {
        console.error(`Auto-translation failed for ${field.name} → ${locale}:`, err)
        // Optionally fallback: newData[field.name][locale] = englishValue
      }
    }

    // Gallery altText (nested localized field)
    if (Array.isArray(newData.gallery)) {
      newData.gallery = await Promise.all(
        newData.gallery.map(async (item: any) => {
          const enAlt = item.altText?.[defaultLocale]
          if (!enAlt || item.altText?.[locale]) return item

          try {
            const translatedAlt = await TranslationService.translate(enAlt, locale)
            return {
              ...item,
              altText: {
                ...(item.altText || {}),
                [locale]: translatedAlt,
              },
            }
          } catch {
            return item
          }
        })
      )
    }
  }

  return newData
}
export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    defaultColumns: ['name', 'price', 'shortDescription', 'image', 'tenant', 'updatedAt'],
  },
  hooks: {
    beforeChange: [autoTranslateHook],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Product Name',
      localized: true,
      admin: {
        placeholder: 'Enter product name...'
      },
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
      localized: true,
      admin: {
        placeholder: 'Brief description...',
        rows: 3,
      },
    },
    
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
      localized: true,
    },
    
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Product Image',
      admin: {
        position: 'sidebar',
      },
    },
    
    {
      name: 'gallery',
      type: 'array',
      label: 'Product Gallery',
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
          localized: true,
        }
      ],
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
      localized: true,
      admin: {
        position: 'sidebar',
      }
    },
    
    {
      name: 'tags',
      type: 'text',
      label: 'Tags',
      hasMany: true,
      localized: true,
      admin: {
        position: 'sidebar',
      }
    },
    
    // YEH FIELDS WAPAS ADD KARO - ye missing thein!
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
      },
    },
    
    {
      name: 'inStock',
      type: 'checkbox',
      label: 'In Stock',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
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
      },
    },
    
    {
      name: 'sku',
      type: 'text',
      label: 'SKU',
      unique: true,
      admin: {
        position: 'sidebar',
        placeholder: 'e.g., PRD-001'
      },
    },
  ],
}