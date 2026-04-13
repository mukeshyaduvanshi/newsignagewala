'use client'
import ComponentsDashboard from '@/components/(user)/vendor/components-dashboard';
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/context/AuthContext';
import React from 'react'

const page = () => {
  const { logout } = useAuth();
  return (
    <>
    <div className="m-4">
        <ComponentsDashboard />
      </div>
    </>
  )
}

export default page