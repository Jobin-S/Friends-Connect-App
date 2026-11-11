import { JoinPage } from '@/components/ui/JoinPage';

export const metadata = { title: 'For hosts · Friends Connect' };

export default function HostsPage() {
  return (
    <JoinPage
      c={{
        intent: 'host',
        role: 'ORG',
        hue: 'lilac',
        title: 'Fill the room with people who live nearby.',
        lede: 'Publish events, sell tickets inside the app and reach people within a few kilometres of your venue.',
        cta: 'Start hosting',
        perks: [
          {
            title: 'Shown to people nearby',
            body: 'Your event appears in Events for everyone within the distance they choose.',
          },
          {
            title: 'Tickets in the app',
            body: 'Create ticket types with their own prices and limits. Guests get a code they show at the door.',
          },
          {
            title: 'Live sales',
            body: 'See tickets sold and seats left for each event as it happens.',
          },
        ],
        steps: [
          {
            title: 'Apply',
            body: 'Log in with your phone number and add your company name and GST or registration number.',
          },
          {
            title: 'We verify your business',
            body: 'Our team checks your details, usually within two working days.',
          },
          {
            title: 'Publish',
            body: 'Once approved, create your first event with a venue, date and ticket types.',
          },
        ],
        faq: [
          {
            q: 'Do I need a registered business?',
            a: 'Yes. We ask for a GST or company registration number so guests know who they are buying from.',
          },
          {
            q: 'Can I still use the app as a guest?',
            a: 'Yes. Your account works as normal while we review your application.',
          },
          {
            q: 'What if I am not approved?',
            a: 'We tell you why, and you can apply again with updated details.',
          },
        ],
      }}
    />
  );
}
