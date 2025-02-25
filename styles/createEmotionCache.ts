import createCache from '@emotion/cache'
import { isBrowser } from '../utils/isBrowser'

// On the client side, Create a meta tag at the top of the <head> and set it as insertionPoint.
// This assures that MUI styles are loaded first.
// It allows developers to easily override MUI styles with other styling solutions, like CSS modules.
function createEmotionInsertionPoint() {
  if (!isBrowser) return undefined

  const emotionInsertionPoint = document.createElement('meta')
  emotionInsertionPoint.setAttribute('name', 'emotion-insertion-point')
  emotionInsertionPoint.setAttribute('content', '')

  document.head.insertBefore(emotionInsertionPoint, document.head.firstChild)
  return emotionInsertionPoint
}

export const createEmotionCache = () => {
  return createCache({
    key: 'css',
    prepend: true,
    insertionPoint: createEmotionInsertionPoint()
  })
} 