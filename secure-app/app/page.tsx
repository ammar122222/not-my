import { redirect } from 'next/navigation';

export default function Home() {
  // No public pages: everything lives behind the admin portal.
  redirect('/login');
}
