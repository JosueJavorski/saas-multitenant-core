import { login } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface LoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams
  const errorMsg = typeof resolvedSearchParams.error === 'string' ? resolvedSearchParams.error : undefined

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Login</h1>
          <p className="text-sm text-muted-foreground">
            Insira suas credenciais para entrar na sua conta
          </p>
        </div>
        <form action={login} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">
              E-mail
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="exemplo@email.com"
              required
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium">
              Senha
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>
          {errorMsg && (
            <div className="text-sm text-destructive text-center">
              {errorMsg}
            </div>
          )}
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>
        <div className="text-center text-sm">
          Não tem uma conta?{' '}
          <a href="/signup" className="underline hover:text-primary">
            Cadastre-se
          </a>
        </div>
      </div>
    </div>
  )
}
