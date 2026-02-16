// lib/translate.ts
export class TranslationService {
  // Google Translate API (Recommended - Most Accurate)
  static async translateWithGoogle(text: string, targetLang: string): Promise<string> {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
    )
    
    const data = await response.json()
    return data[0][0][0] || text
  }

  // MyMemory API (Free, No Key Needed)
  static async translateWithMyMemory(text: string, targetLang: string): Promise<string> {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`
    )
    
    const data = await response.json()
    return data.responseData?.translatedText || text
  }

  // LibreTranslate (Self-hostable, Open Source)
  static async translateWithLibre(text: string, targetLang: string): Promise<string> {
    const response = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: targetLang,
        format: 'text'
      })
    })
    
    const data = await response.json()
    return data.translatedText || text
  }

  // Main translate function - automatically tries multiple services
  static async translate(text: string, targetLang: string): Promise<string> {
    if (!text || targetLang === 'en') return text
    
    // Try MyMemory first (fastest, free)
    try {
      const result = await this.translateWithMyMemory(text, targetLang)
      if (result && result !== text) return result
    } catch (e) {
      console.log('MyMemory failed, trying Google...')
    }
    
    // Try Google Translate
    try {
      const result = await this.translateWithGoogle(text, targetLang)
      if (result) return result
    } catch (e) {
      console.log('Google failed, trying LibreTranslate...')
    }
    
    // Try LibreTranslate as last resort
    try {
      const result = await this.translateWithLibre(text, targetLang)
      if (result) return result
    } catch (e) {
      console.log('All translation services failed')
    }
    
    return text // Return original if all fail
  }

  // Batch translate multiple texts
  static async translateBatch(texts: string[], targetLang: string): Promise<string[]> {
    return Promise.all(texts.map(text => this.translate(text, targetLang)))
  }

  // Translate rich text content
  static async translateRichText(richText: any, targetLang: string): Promise<any> {
    if (!richText?.root?.children) return richText
    
    const translatedChildren = await Promise.all(
      richText.root.children.map(async (child: any) => {
        if (child.children) {
          const translatedTextChildren = await Promise.all(
            child.children.map(async (textChild: any) => {
              if (textChild.text) {
                return {
                  ...textChild,
                  text: await this.translate(textChild.text, targetLang)
                }
              }
              return textChild
            })
          )
          return {
            ...child,
            children: translatedTextChildren
          }
        }
        return child
      })
    )
    
    return {
      ...richText,
      root: {
        ...richText.root,
        children: translatedChildren
      }
    }
  }
}