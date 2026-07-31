'use client'

// components/brand/remember-path.tsx
//
// Records the visitor's side of the fork when they land on a path page —
// including on a direct/shared link to /customers or /business, which is the
// point: those routes are real and linkable, and arriving on one IS a choice.
// The fork itself also writes the choice at commit time; this covers every
// other way in.

import { useEffect } from 'react'
import { setPathChoice, type PathChoice } from '@/lib/pathChoice'

export function RememberPath({ choice }: { choice: PathChoice }) {
  useEffect(() => {
    setPathChoice(choice)
  }, [choice])
  return null
}
