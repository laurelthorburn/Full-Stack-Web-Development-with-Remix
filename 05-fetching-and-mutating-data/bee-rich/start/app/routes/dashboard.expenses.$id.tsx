import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { H2 } from '~/components/headings';
import { FloatingActionLink } from '~/components/links';
import { db } from '~/modules/db.server';

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  const expense = await db.expense.findUnique({
    where: {
      id,
    },
  });
  if (!expense) throw new Response('Not found', { status: 404 });
  return json(expense);
}

export default function Component() {
  const expense = useLoaderData<typeof loader>();
  return (
    <>
      <div className="w-full h-full p-8">
        <section className="w-full h-full p-8">
          <H2>{expense.title}</H2>
          <p>${expense.amount}</p>
        </section>
      </div>
      <FloatingActionLink to="/dashboard/expenses/">Add Expense</FloatingActionLink>
    </>
  );
}
