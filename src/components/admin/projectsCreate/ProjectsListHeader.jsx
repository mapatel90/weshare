import React from 'react'
import { FiBarChart, FiFilter, FiPaperclip, FiPlus } from 'react-icons/fi'
import Dropdown from '@/components/shared/Dropdown'
import { fileType } from '../../leads/LeadsHeader'
import ProjectsStatistics from '../../widgetsStatistics/ProjectsStatistics'
import Link from 'next/link'
import { Button } from '@mui/material'
import { useLanguage } from '@/contexts/LanguageContext'
import usePermissions from '@/hooks/usePermissions'

const ProjectsListHeader = () => {
  const { lang } = useLanguage();
  const { canCreate } = usePermissions();
  return (
    <>
      <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
        {canCreate("projects") && (
          <Button
            component={Link}
            href="/admin/projects/create"
            variant="contained"
            startIcon={<FiPlus size={16} />}
            className="common-orange-color"
          >
            {lang('projects.createproject', 'Create Project')}
          </Button>
        )}
      </div>
      <div id="collapseOne" className="accordion-collapse collapse page-header-collapse">
        <div className="accordion-body pb-2">
          <div className="row">
            <ProjectsStatistics />
          </div>
        </div>
      </div>
    </>
  )
}

export default ProjectsListHeader