import { AwardBrand } from '../components/Layout/AwardBrand'
import { useState } from 'react'
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Checkbox,
  Title,
  Text,
  Anchor,
  Container,
  Center,
  Stack,
  ActionIcon,
  UnstyledButton,
  useMantineColorScheme,
  rem,
} from '@mantine/core'
import { IconSun, IconMoon } from '@tabler/icons-react'
import { useForm } from '@mantine/form'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { notifications } from '@mantine/notifications'
import { useLanguage } from '../contexts/LanguageContext'
import { loginDestination } from '../lib/loginDestination'

const rememberedEmailKey = 'digital-award:remembered-email:v1'

function readRememberedEmail(): string {
  try {
    return localStorage.getItem(rememberedEmailKey) ?? ''
  } catch {
    return ''
  }
}

interface LoginFormData {
  email: string
  password: string
}

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loading } = useAuthStore()
  const [rememberedEmail] = useState(readRememberedEmail)
  const [rememberEmail, setRememberEmail] = useState(Boolean(rememberedEmail))
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const { language, toggleLanguage } = useLanguage()

  const form = useForm<LoginFormData>({
    initialValues: {
      email: rememberedEmail,
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
    },
  })

  const handleSubmit = async (values: LoginFormData) => {
    try {
      await login(values.email, values.password)
      try {
        if (rememberEmail) localStorage.setItem(rememberedEmailKey, values.email)
        else localStorage.removeItem(rememberedEmailKey)
      } catch {
        // Browser storage may be disabled; it must not prevent sign-in.
      }
      notifications.show({
        title: 'Welcome back!',
        message: 'Successfully logged in to Digital Award',
        color: 'green',
      })
      navigate(loginDestination(location.search), { replace: true })
    } catch (error) {
      notifications.show({
        title: 'Login failed',
        message: error instanceof Error ? error.message : 'Invalid email or password',
        color: 'red',
      })
    }
  }

  return (
    <Container size={420} my={40}>
      <UnstyledButton
        onClick={toggleLanguage}
        aria-label={language === 'zh' ? '切换到英文' : 'Switch to Chinese'}
        style={{ position: 'fixed', top: rem(20), right: rem(56) }}
      >
        <Text size="sm" fw={500} c="blue">
          {language === 'zh' ? '中' : 'EN'}
        </Text>
      </UnstyledButton>

      <ActionIcon
        variant="subtle"
        size="lg"
        onClick={toggleColorScheme}
        title="Toggle colour scheme"
        style={{ position: 'fixed', top: rem(16), right: rem(16) }}
      >
        {colorScheme === 'dark'
          ? <IconSun style={{ width: rem(20), height: rem(20) }} />
          : <IconMoon style={{ width: rem(20), height: rem(20) }} />}
      </ActionIcon>

      <Center mb={30}>
        <Stack align="center" gap="xs">
          <AwardBrand />
        </Stack>
      </Center>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Title ta="center" order={2} mb="md">
          Welcome back!
        </Title>
        
        <Text c="dimmed" size="sm" ta="center" mt={5} mb="xl">
          Sign in to the Digital Pioneer Award portal
        </Text>

        <form onSubmit={form.onSubmit(handleSubmit)} autoComplete="on">
          <Stack>
            <TextInput
              label="Email"
              placeholder="your@email.com"
              name="username"
              autoComplete="username"
              inputMode="email"
              required
              {...form.getInputProps('email')}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              name="password"
              autoComplete="current-password"
              required
              {...form.getInputProps('password')}
            />

            <Checkbox
              label={language === 'zh' ? '记住邮箱' : 'Remember email'}
              checked={rememberEmail}
              onChange={(event) => {
                const checked = event.currentTarget.checked
                setRememberEmail(checked)
                if (!checked) {
                  try { localStorage.removeItem(rememberedEmailKey) } catch { /* Storage is optional. */ }
                }
              }}
            />
            <Text size="xs" c="dimmed">
              {language === 'zh'
                ? '可使用浏览器密码管理器保存密码，下次登录时自动填充。'
                : 'Use your browser’s password manager to save your password and autofill it next time.'}
            </Text>

            <Button type="submit" fullWidth mt="xl" size="md" loading={loading}>
              Sign in
            </Button>
          </Stack>
        </form>

        <Text c="dimmed" size="sm" ta="center" mt={20}>
          Don't have an account yet?{' '}
          <Anchor size="sm" component={Link} to="/register">
            Create account
          </Anchor>
        </Text>

      </Paper>
    </Container>
  )
}
