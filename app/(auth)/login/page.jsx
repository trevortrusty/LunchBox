import LoginForm from "@/components/auth/LoginForm";

export const metadata = { title: "Login — Lunchbox" };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lunchbox</h1>
          <p className="mt-2 text-gray-500 text-sm">Sign in to manage shifts & tasks</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
