'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    fetch('/api/users/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
        } else {
          // If not logged in, redirect to login
          router.push('/login')
        }
      })
  }, [])

  const handleLogout = async () => {
    await fetch('/api/users/logout', { method: 'POST' })
    router.push('/login')
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>Welcome to Dashboard</h1>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      
      <hr/>
      
      <h2>Quick Links</h2>
      <ul>
        <li><Link href="/admin">Admin Panel</Link></li>
        <li><Link href="/profile">Profile</Link></li>
      </ul>
      
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}