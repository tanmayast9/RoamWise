import { useEffect, useState } from 'react'

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return stored === null ? initialValue : JSON.parse(stored)
    } catch (error) {
      console.error(`Could not read local storage value "${key}". Using the in-memory default.`, error)
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Could not save local storage value "${key}". Changes will not persist after reload.`, error)
    }
  }, [key, value])

  return [value, setValue]
}
