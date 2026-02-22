import { PrismaClient, Role, RsvpStatus, Channel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.guest.deleteMany();
  await prisma.table.deleteMany();
  await prisma.budgetItem.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.galleryImage.deleteMany();
  await prisma.messageTemplate.deleteMany();
  await prisma.fAQ.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.scheduleItem.deleteMany();
  await prisma.inviteCode.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.wedding.deleteMany();

  // Create wedding
  const wedding = await prisma.wedding.create({
    data: {
      slug: 'dana-and-alex-2026',
      partner1Name: 'Dana',
      partner2Name: 'Alex',
      date: new Date('2026-09-15T18:00:00Z'),
      venue: 'Garden Venue, Tel Aviv',
      locale: 'he',
      theme: 'default',
      onboardingComplete: true,
    },
  });

  // Create couple user
  await prisma.user.create({
    data: {
      email: 'couple@wedding-os.demo',
      name: 'Dana & Alex',
      role: Role.COUPLE,
      weddingId: wedding.id,
      // Password: "demo1234" (in production, use bcrypt)
      passwordHash: '$2b$10$demohashedpasswordplaceholder',
    },
  });

  // Create tables
  const tables = await Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      prisma.table.create({
        data: {
          weddingId: wedding.id,
          name: `Table ${i + 1}`,
          capacity: i < 2 ? 12 : 10,
          x: (i % 4) * 200 + 100,
          y: Math.floor(i / 4) * 200 + 100,
        },
      })
    )
  );

  // Create guests
  const guestData = [
    { firstName: 'Sarah', lastName: 'Cohen', group: 'Family', rsvpStatus: RsvpStatus.ACCEPTED, mealChoice: 'Chicken', tableId: tables[0].id },
    { firstName: 'David', lastName: 'Levy', group: 'Family', rsvpStatus: RsvpStatus.ACCEPTED, mealChoice: 'Fish', tableId: tables[0].id },
    { firstName: 'Rachel', lastName: 'Green', group: 'Friends', rsvpStatus: RsvpStatus.ACCEPTED, mealChoice: 'Vegetarian', tableId: tables[1].id },
    { firstName: 'Michael', lastName: 'Ross', group: 'Friends', rsvpStatus: RsvpStatus.PENDING, tableId: tables[1].id },
    { firstName: 'Yael', lastName: 'Shapira', group: 'Work', rsvpStatus: RsvpStatus.DECLINED },
    { firstName: 'Avi', lastName: 'Goldstein', group: 'Family', rsvpStatus: RsvpStatus.ACCEPTED, mealChoice: 'Chicken', plusOneName: 'Miriam Goldstein', tableId: tables[2].id },
    { firstName: 'Noa', lastName: 'Ben-David', group: 'Friends', rsvpStatus: RsvpStatus.PENDING, songRequest: 'Hava Nagila' },
    { firstName: 'Eitan', lastName: 'Katz', group: 'Work', rsvpStatus: RsvpStatus.ACCEPTED, mealChoice: 'Fish', allergies: 'Nuts', tableId: tables[3].id },
    { firstName: 'Maya', lastName: 'Friedman', group: 'Friends', rsvpStatus: RsvpStatus.ACCEPTED, mealChoice: 'Vegetarian', tableId: tables[2].id },
    { firstName: 'Oren', lastName: 'Mizrahi', group: 'Family', rsvpStatus: RsvpStatus.PENDING },
  ];

  for (const guest of guestData) {
    await prisma.guest.create({
      data: {
        weddingId: wedding.id,
        ...guest,
        tags: [guest.group],
        respondedAt: guest.rsvpStatus !== RsvpStatus.PENDING ? new Date() : null,
      },
    });
  }

  // Create invite codes
  await prisma.inviteCode.create({
    data: {
      code: 'LOVE2026',
      weddingId: wedding.id,
      maxUses: 100,
      uses: 0,
    },
  });

  // Create budget items
  const budgetItems = [
    { category: 'Venue', vendor: 'Garden Venue', description: 'Venue rental + setup', estimated: 25000, actual: 25000, paid: 12500 },
    { category: 'Catering', vendor: 'Gourmet Events', description: 'Food & beverages for 150 guests', estimated: 45000, actual: 42000, paid: 21000 },
    { category: 'Photography', vendor: 'Studio Light', description: 'Photo + video package', estimated: 12000, actual: 12000, paid: 6000 },
    { category: 'Music', vendor: 'DJ Beats', description: 'DJ + sound system', estimated: 8000, actual: 8500, paid: 4000 },
    { category: 'Flowers', vendor: 'Bloom Design', description: 'Centerpieces + bouquets', estimated: 6000, actual: 0, paid: 0 },
    { category: 'Dress & Suit', description: 'Wedding attire', estimated: 10000, actual: 9500, paid: 9500 },
  ];

  for (const item of budgetItems) {
    await prisma.budgetItem.create({
      data: { weddingId: wedding.id, ...item },
    });
  }

  // Create vendors
  const vendors = [
    { name: 'Garden Venue', category: 'Venue', phone: '03-1234567', email: 'info@gardenvenue.co.il' },
    { name: 'Gourmet Events', category: 'Catering', phone: '03-2345678', email: 'events@gourmet.co.il' },
    { name: 'Studio Light', category: 'Photography', phone: '054-3456789', email: 'book@studiolight.co.il' },
    { name: 'DJ Beats', category: 'Music', phone: '052-4567890', email: 'dj@beats.co.il' },
    { name: 'Bloom Design', category: 'Flowers', phone: '050-5678901', email: 'hello@bloomdesign.co.il' },
  ];

  for (const vendor of vendors) {
    await prisma.vendor.create({
      data: { weddingId: wedding.id, ...vendor },
    });
  }

  // Create FAQs
  const faqs = [
    { questionHe: 'מה קוד הלבוש?', answerHe: 'אלגנטי-קז\'ואל. צבעים בהירים מועדפים.', questionEn: 'What is the dress code?', answerEn: 'Smart casual. Light colors preferred.', order: 1 },
    { questionHe: 'האם יש חניה?', answerHe: 'כן, חניה חינם צמוד למקום.', questionEn: 'Is there parking?', answerEn: 'Yes, free parking is available on-site.', order: 2 },
    { questionHe: 'האם אפשר להביא ילדים?', answerHe: 'האירוע מיועד למבוגרים בלבד.', questionEn: 'Can we bring children?', answerEn: 'This is an adults-only event.', order: 3 },
    { questionHe: 'מתי צריך לאשר הגעה?', answerHe: 'נא לאשר עד חודש לפני האירוע.', questionEn: 'When is the RSVP deadline?', answerEn: 'Please RSVP at least one month before the event.', order: 4 },
  ];

  for (const faq of faqs) {
    await prisma.fAQ.create({
      data: { weddingId: wedding.id, ...faq },
    });
  }

  // Create timeline events
  const timelineEvents = [
    { title: 'First Met', description: 'We met at a coffee shop in Tel Aviv', date: new Date('2020-03-15'), iconType: 'heart', order: 1 },
    { title: 'First Date', description: 'A walk along the beach at sunset', date: new Date('2020-04-02'), iconType: 'star', order: 2 },
    { title: 'Moved In Together', description: 'Our first apartment in Jaffa', date: new Date('2021-06-01'), iconType: 'home', order: 3 },
    { title: 'The Proposal', description: 'A surprise proposal at our favorite restaurant', date: new Date('2025-12-25'), iconType: 'ring', order: 4 },
  ];

  for (const event of timelineEvents) {
    await prisma.timelineEvent.create({
      data: { weddingId: wedding.id, ...event },
    });
  }

  // Create schedule items
  const scheduleItems = [
    { time: '17:30', title: 'Guest Arrival', description: 'Welcome drinks & mingling', order: 1 },
    { time: '18:00', title: 'Ceremony', description: 'The main event under the chuppah', order: 2 },
    { time: '18:45', title: 'Cocktail Hour', description: 'Drinks and appetizers in the garden', order: 3 },
    { time: '19:30', title: 'Dinner', description: 'Seated dinner', order: 4 },
    { time: '21:00', title: 'Dancing', description: 'Party time!', order: 5 },
    { time: '23:00', title: 'Late Night Snacks', description: 'Food stations', order: 6 },
  ];

  for (const item of scheduleItems) {
    await prisma.scheduleItem.create({
      data: { weddingId: wedding.id, ...item },
    });
  }

  // Create message templates
  await prisma.messageTemplate.create({
    data: {
      weddingId: wedding.id,
      name: 'RSVP Reminder',
      subject: 'Don\'t forget to RSVP!',
      body: 'Hi {{name}}, we haven\'t received your RSVP yet. Please let us know if you can make it to our wedding on {{date}}!',
      channel: Channel.EMAIL,
    },
  });

  console.log('Seed completed successfully!');
  console.log(`Wedding: ${wedding.slug} (${wedding.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
