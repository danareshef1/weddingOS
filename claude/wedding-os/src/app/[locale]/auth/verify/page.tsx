import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, AlertCircle, Clock } from 'lucide-react';
import Link from 'next/link';

interface Props {
  params: { locale: string };
  searchParams: { error?: string };
}

export default function VerifyPage({ params, searchParams }: Props) {
  const { locale } = params;
  const { error } = searchParams;

  if (error === 'expired') {
    return (
      <main className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
            <CardTitle>Link expired</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Your verification link has expired. Please register again to get a new one.
            </p>
            <Link
              href={`/${locale}/auth/register`}
              className="text-sm font-medium text-rose-600 hover:text-rose-700"
            >
              Back to register
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (error === 'invalid' || error === 'missing') {
    return (
      <main className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle>Invalid link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This verification link is invalid or has already been used.
            </p>
            <Link
              href={`/${locale}/auth/login`}
              className="text-sm font-medium text-rose-600 hover:text-rose-700"
            >
              Go to login
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Check your email</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            We sent you a verification link. Click it to activate your account before logging in.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
