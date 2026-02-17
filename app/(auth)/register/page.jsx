import RegisterForm from '@/components/auth/RegisterForm'

export const metadata = { title: 'Register — Lunchbox' }

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lunchbox</h1>
          <p className="mt-2 text-gray-500 text-sm">Create your account</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}
