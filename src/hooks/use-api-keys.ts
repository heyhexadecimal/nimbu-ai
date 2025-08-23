import { useState, useEffect, useCallback } from 'react'
import { hasValidAPIKey, getAPIKeys } from '@/lib/api-keys'

export function useAPIKeys() {
  const [hasKeys, setHasKeys] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [keys, setKeys] = useState(getAPIKeys())

  useEffect(() => {
    const checkKeys = () => {
      const valid = hasValidAPIKey()
      setHasKeys(valid)
      if (!valid) {
        setIsModalOpen(true)
      }
    }

    checkKeys()

    const handleStorageChange = () => {
      checkKeys()
      setKeys(getAPIKeys())
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const openModal = useCallback(() => setIsModalOpen(true), [])
  const closeModal = useCallback(() => setIsModalOpen(false), [])

  const refreshKeys = useCallback(() => {
    console.log('refreshKeys called')
    const newKeys = getAPIKeys()
    console.log('New keys from localStorage:', newKeys)
    const valid = hasValidAPIKey()
    console.log('Has valid keys:', valid)
    
    setKeys(newKeys)
    setHasKeys(valid)
    
    if (valid) {
      closeModal()
    }
  }, [closeModal])

  return {
    hasKeys,
    isModalOpen,
    keys,
    openModal,
    closeModal,
    refreshKeys
  }
} 