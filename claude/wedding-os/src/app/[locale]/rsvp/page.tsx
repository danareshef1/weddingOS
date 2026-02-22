import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { RsvpForm } from '@/components/rsvp/rsvp-form';

export default function RsvpPage() {
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <RsvpForm />
      </main>
      <Footer />
    </>
  );
}
