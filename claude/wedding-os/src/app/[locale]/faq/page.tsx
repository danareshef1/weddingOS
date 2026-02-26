import { prisma } from '@/lib/prisma';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default async function FaqPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const wedding = await prisma.wedding.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  const faqs = wedding
    ? await prisma.fAQ.findMany({
        where: { weddingId: wedding.id },
        orderBy: { order: 'asc' },
      })
    : [];

  return (
    <main className="container mx-auto px-4 py-16">
        <div className="mb-16 text-center">
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">FAQ</h1>
          <p className="mt-4 text-lg text-muted-foreground">Frequently Asked Questions</p>
        </div>

        <div className="mx-auto max-w-2xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger>
                  {locale === 'he' ? faq.questionHe : faq.questionEn || faq.questionHe}
                </AccordionTrigger>
                <AccordionContent>
                  {locale === 'he' ? faq.answerHe : faq.answerEn || faq.answerHe}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
    </main>
  );
}
