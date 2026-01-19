import React from 'react';
import DynamicTitle from '@/components/common/DynamicTitle';
import ProjectDetails from '@/components/portal/projects/sections/ProjectDetails';

const page = ({ params }) => {
  const { id } = params;
  return (
    <>
      <DynamicTitle titleKey="projecttablelabel.viewDetails" />
      <>
          <ProjectDetails project_id={id} />
      </>
    </>
  );
};

export default page;