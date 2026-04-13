import ComponentsPptGen from '@/components/pptgen/components-ppt-gen';
import React from 'react'

type Props = {
    params: Promise<{ id: string }>;
};

const page = async ({params}: Props) => {
   const { id } = await params;
   
    if (!id) {
        return <div className="p-4 text-red-500">PPT data not found.</div>;
    }
  return <ComponentsPptGen id={JSON.parse(JSON.stringify(id))} />;
}

export default page
