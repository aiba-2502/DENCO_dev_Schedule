import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background">
      {/* Login Form Container */}
      <div className="px-4 w-full max-w-md">
        <LoginForm />
      </div>

      {/* Version Info */}
      <div className="absolute bottom-4 right-4 text-muted-foreground text-xs">
        v2.0.0
      </div>
    </div>
  );
}
