import type { LoaderFunctionArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';

import { requireUserId } from '~/modules/session/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  return redirect('/dashboard/expenses');
}
