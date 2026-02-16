'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function LanguageSelector() {
  const router = useRouter()
  const [currentLang, setCurrentLang] = useState('en')

  useEffect(() => {
    // Payload ki locale cookie read karo - multiple formats check karo
    const cookies = document.cookie.split(';')
    
    // Payload ke different cookie formats
    const payloadLocale = cookies.find(c => c.trim().startsWith('payload-locale='))
    const locale = cookies.find(c => c.trim().startsWith('locale='))
    const i18n = cookies.find(c => c.trim().startsWith('i18n='))
    
    if (payloadLocale) {
      setCurrentLang(payloadLocale.split('=')[1].trim())
    } else if (locale) {
      setCurrentLang(locale.split('=')[1].trim())
    } else if (i18n) {
      setCurrentLang(i18n.split('=')[1].trim())
    }
  }, [])

  const changeLanguage = (lang: string) => {
    // Multiple cookies set karo to be safe
    document.cookie = `payload-locale=${lang}; path=/; max-age=31536000`
    document.cookie = `locale=${lang}; path=/; max-age=31536000`
    document.cookie = `i18n=${lang}; path=/; max-age=31536000`
    
    setCurrentLang(lang)
    
    // Force page reload to apply language
    window.location.href = window.location.pathname
  }

  return (
    <select 
      value={currentLang}
      onChange={(e) => changeLanguage(e.target.value)}
      style={{
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #e0e0e0',
        background: 'white',
        cursor: 'pointer',
        fontSize: '14px',
        marginRight: '15px',
        zIndex: 1000
      }}
    >
      <option value="en">🇬🇧 English</option>
      <option value="ur">🇵🇰 اردو</option>
    </select>
  )
}