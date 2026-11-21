import OperatorVMS from '@/components/Dashboard/vms/Operator/VMS/OperatorVMS'
import React, { Suspense } from 'react'

const page = () => {
  return (
    <Suspense fallback={null}>
      <OperatorVMS />
    </Suspense>
  )
}

export default page
