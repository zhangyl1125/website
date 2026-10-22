import { useEffect, useState } from 'react'
import { Alert, Button, Stack } from '@mantine/core'
import { useLocation } from 'react-router-dom'
import { loginDestination } from '../lib/loginDestination'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

export function CompanyLogin({ chinese }: { chinese: boolean }) {
  const [enabled, setEnabled] = useState(false)
  const { search } = useLocation()
  const error = new URLSearchParams(search).get('sso_error')

  useEffect(() => {
    const controller = new AbortController()
    void fetch(`${apiBaseUrl}/api/v1/auth/sso`, { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() : null)
      .then((options) => {
        if (!controller.signal.aborted) setEnabled(options?.enabled === true)
      })
      .catch(() => { /* Password login remains available when SSO is unavailable. */ })
    return () => controller.abort()
  }, [])

  if (!enabled && !error) return null

  const messages: Record<string, string> = {
    account_not_linked: chinese ? '公司账号尚未关联已有网站账号，请联系网站管理员完成关联。'
      : 'Please contact the portal administrator to link your company identity to your existing account.',
    profile_incomplete: chinese ? '公司账号信息不完整，请联系管理员检查登录配置及姓名、邮箱信息。'
      : 'Company account information is incomplete. Please ask your administrator to check sign-in configuration, name and email.',
    member_required: chinese ? '此网站仅向 Bosch 公司成员开放，暂不支持访客账号登录。'
      : 'This portal is available to Bosch members. Guest accounts cannot sign in.',
  }
  const message = (error && Object.hasOwn(messages, error) ? messages[error] : null)
    ?? (chinese ? '公司登录未完成，请重试。若仍失败，请联系管理员确认审批和账号访问权限。'
      : 'Company sign-in was not completed. Please retry or ask your administrator to check approval and access.')

  return (
    <Stack mb="lg">
      {error && <Alert color="red" role="alert">{message}</Alert>}
      {enabled && (
        <Button
          component="a"
          href={`${apiBaseUrl}/api/v1/auth/oidc/authorize/bosch?redirect=${encodeURIComponent(loginDestination(search))}`}
          fullWidth
          size="md"
        >
          {chinese ? '公司账号登录' : 'Sign in with Bosch'}
        </Button>
      )}
    </Stack>
  )
}
