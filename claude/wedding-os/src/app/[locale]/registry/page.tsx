import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const registryLinks = [
  { name: 'Amazon', url: '#', description: 'Kitchen & Home essentials' },
  { name: 'Honeymoon Fund', url: '#', description: 'Help us create memories together' },
  { name: 'Charity', url: '#', description: 'Donate in our name' },
];

export default function RegistryPage() {
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="mb-16 text-center">
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">Registry</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Your presence is the greatest gift
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {registryLinks.map((link) => (
            <Card key={link.name} className="text-center transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{link.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">{link.description}</p>
                <Button variant="outline" size="sm" asChild>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    Visit <ExternalLink className="ms-2 h-3 w-3" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
