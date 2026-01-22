"use client"

import React, { useEffect, useState, useContext } from 'react'
import { apiGet, apiPost } from "@/lib/api";
import { useLanguage } from '@/contexts/LanguageContext'
import PageTitleContext from '@/contexts/PageTitleContext'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import ProjectViewContent from '@/components/admin/projectsCreate/ProjectViewContent'

const ProjectViewPage = ({ params }) => {
  const { id } = params
  const { lang } = useLanguage()
  const { setPageTitle } = useContext(PageTitleContext)
  const [projectName, setProjectName] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch project data and set title
  useEffect(() => {
    let isMounted = true

    const fetchProjectAndSetTitle = async () => {
      try {
        setLoading(true)

        // Set initial title while loading
        setPageTitle({
          titleKey: 'page_title.projectDetails',
          suffix: 'WeShare',
          useSuffix: true
        })
        

        // Fetch project data
        const res = await apiGet(`/api/projects/${id}`);
        if (isMounted && res.success && res.data) {
          const name = res.data.project_name
          setProjectName(name)

          // Set title with project name
          if (name) {
            // Set the title directly with the project name
            setPageTitle({
              titleKey: name,
              suffix: 'WeShare',
              useSuffix: true
            })
          }
        }
      } catch (error) {
        console.error('Error fetching project for title:', error)
        // Keep default title on error
        if (isMounted) {
          setPageTitle({
            titleKey: 'page_title.projectDetails',
            suffix: 'WeShare',
            useSuffix: true
          })
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (id) {
      fetchProjectAndSetTitle()
    }

    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [id, setPageTitle])

  // Update title when project name or language changes
  useEffect(() => {
    if (projectName) {
      setPageTitle({
        titleKey: projectName,
        suffix: 'WeShare',
        useSuffix: true
      })
    } else {
      setPageTitle({
        titleKey: 'page_title.projectDetails',
        suffix: 'WeShare',
        useSuffix: true
      })
    }
  }, [lang, projectName, setPageTitle])

  return (
    <>
      <PageHeader>
        {/* You can add a header component later if needed */}
      </PageHeader>
      <div className='main-content'>
        <div className='row'>
          <ProjectViewContent projectId={id} />
        </div>
      </div>
    </>
  )
}

export default ProjectViewPage
