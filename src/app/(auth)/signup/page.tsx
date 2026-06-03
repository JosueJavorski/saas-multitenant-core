import { signup } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SignupPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const resolvedSearchParams = await searchParams
  const errorMsg = typeof resolvedSearchParams.error === 'string' ? resolvedSearchParams.error : undefined
  const successMsg = typeof resolvedSearchParams.success === 'string' ? resolvedSearchParams.success : undefined

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Criar Conta</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre seu e-mail e senha para começar
          </p>
        </div>
        <form action={signup} className="space-y-4">
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
          {successMsg && (
            <div className="text-sm text-green-600 dark:text-green-400 text-center font-medium">
              {successMsg}
            </div>
          )}
          <Button type="submit" className="w-full">
            Cadastrar
          </Button>
        </form>
        <div className="text-center text-sm">
          Já possui uma conta?{' '}
          <a href="/login" className="underline hover:text-primary">
            Entre aqui
          </a>
        </div>
      </div>
    </div>
  )
}
