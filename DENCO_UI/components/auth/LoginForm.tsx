'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PasswordInput } from './PasswordInput';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export function LoginForm() {
  const { login, error: authError, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError('メールアドレスとパスワードを入力してください');
      return;
    }

    if (!email.includes('@')) {
      setLocalError('有効なメールアドレスを入力してください');
      return;
    }

    try {
      await login({ email, password });
    } catch {
      // エラーはAuthContextで処理される
    }
  };

  const displayError = localError || authError;

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-2">
          <Image
            src="/logo.png"
            alt="DENCO"
            width={150}
            height={40}
            className="object-contain"
            priority
          />
        </div>
        <CardDescription className="text-center">
          AI Call Management System
        </CardDescription>
      </CardHeader>
      <CardContent>
        {displayError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{displayError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              disabled={isLoading}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <PasswordInput
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ログイン中...
              </>
            ) : (
              'ログイン'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground text-center w-full">
          © 2024 DENCO. All rights reserved.
        </p>
      </CardFooter>
    </Card>
  );
}

export default LoginForm;
