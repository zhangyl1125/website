import { NavLink } from '@mantine/core'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { PermissionService } from '../../utils/permissions'
import { useAwardAccess } from '../../hooks/useAwardAccess'
import { useLanguage } from '../../contexts/LanguageContext'

export function Sidebar({ horizontal = false, onNavigate }: { horizontal?: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const { user } = useAuthStore()
  const { t, language } = useLanguage()
  const { canReview, canManage } = useAwardAccess()
  const items = [
    { label: t('sidebar.overview'), path: '/overview' },
    { label: t('sidebar.nomination'), path: '/nominate' },
    ...(canManage ? [{ label: language === 'zh' ? '评选管理' : 'Award management', path: '/awards' }] : []),
    { label: t('sidebar.projectOverview'), path: '/projects' },
    ...(canReview && !canManage ? [{ label: language === 'zh' ? '组委会评分' : 'Committee scoring', path: '/committee' }] : []),
    ...(user && (PermissionService.canManageUsers(user) || user.role === 'manager')
      ? [{ label: PermissionService.canManageUsers(user) ? t('sidebar.manageUsers') : t('sidebar.manageMembers'), path: '/admin/users' }] : []),
  ]

  return (
    <nav className={horizontal ? 'dp-top-navigation' : 'dp-mobile-navigation'} aria-label={t('sidebar.navigation')}>
      {items.map((item) => {
        const active = pathname === item.path || (item.path === '/awards' && (pathname.startsWith('/awards/') || pathname.startsWith('/hackathons/')))
        return (
          <NavLink
            component={Link}
            to={item.path}
            key={item.path}
            className="dp-navlink"
            label={item.label}
            active={active}
            aria-current={active ? 'page' : undefined}
            onClick={onNavigate}
            variant="subtle"
          />
        )
      })}
    </nav>
  )
}
