import { JoinPage } from '@/components/ui/JoinPage';

export const metadata = { title: 'For creators · Friends Connect' };

export default function CreatorsPage() {
  return (
    <JoinPage
      c={{
        intent: 'creator',
        role: 'CELEBRITY',
        hue: 'peach',
        title: 'Your fans want to hear from you. Let them call.',
        lede: 'Take one-to-one audio and video calls from the people who follow you, at a per-minute rate you choose.',
        cta: 'Apply as a creator',
        perks: [
          {
            title: 'You set the price',
            body: 'Pick separate audio and video rates. Fans pay in coins before the call connects.',
          },
          {
            title: 'Calls on your terms',
            body: 'Go online when you want, cap your daily calls and end any call with one tap.',
          },
          {
            title: 'A verified profile',
            body: 'A badge next to your name, and a feed for photos and clips that only you can post to.',
          },
        ],
        steps: [
          {
            title: 'Apply',
            body: 'Log in with your phone number and tell us what you do, with a link to a public profile.',
          },
          {
            title: 'We check it is you',
            body: 'Our team reviews every application, usually within two working days.',
          },
          {
            title: 'Go live',
            body: 'Once approved, set your rates and switch on calls. Your profile appears under Stars.',
          },
        ],
        faq: [
          {
            q: 'Who can apply?',
            a: 'Anyone with a public following: artists, athletes, chefs, comics, educators. You must be 18 or older.',
          },
          {
            q: 'Can I use the app while my application is reviewed?',
            a: 'Yes. You can meet people and call stars as a regular member. Your creator tools switch on after approval.',
          },
          {
            q: 'What if I am not approved?',
            a: 'We tell you why, and you can apply again later with more details.',
          },
        ],
      }}
    />
  );
}
