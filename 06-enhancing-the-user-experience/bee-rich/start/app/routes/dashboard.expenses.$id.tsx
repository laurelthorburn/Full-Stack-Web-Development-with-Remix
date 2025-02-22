import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';

import { Button } from '~/components/buttons';
import { Input, Textarea } from '~/components/forms';
import { FloatingActionLink } from '~/components/links';
import { db } from '~/modules/db.server';

async function updateExpense(formData: FormData, id: string): Promise<Response> {
  const title = formData.get('title');
  const description = formData.get('description');
  const amount = formData.get('amount');
  if (typeof title !== 'string' || typeof description !== 'string' || typeof amount !== 'string') {
    throw Error('something went wrong');
  }
  await db.expense.update({
    where: { id },
    data: { title, description, amount: Number.parseFloat(amount) },
  });
  return json({ success: true });
}

async function deleteExpense(request: Request, id: string): Promise<Response> {
  const referer = request.headers.get('referer');
  const redirectPath = referer || '/dashboard/expenses';

  try {
    await db.expense.delete({ where: { id } });
  } catch (error) {
    throw new Response('Oops, not found', { status: 404 });
  }

  return redirect(redirectPath);
}

export async function action({ params, request }: ActionFunctionArgs) {
  const { id } = params;
  if (!id) throw Error('id route parameter must be defined');

  const formData = await request.formData();
  const intent = formData.get('intent');
  if (intent === 'delete') {
    return deleteExpense(request, id);
  }
  if (intent === 'update') {
    return updateExpense(formData, id);
  }
  throw new Response('Bad request', { status: 400 });
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  const expense = await db.expense.findUnique({ where: { id } });
  if (!expense) throw new Response('Not found', { status: 404 });
  return json(expense);
}

export default function Component() {
  const expense = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state !== 'idle' && navigation.formAction === `/dashboard/expenses/${expense?.id}`;
  const actionData = useActionData<typeof action>();

  return (
    <>
      <section className="w-full h-full p-8">
        <Form method="POST" action={`/dashboard/expenses/${expense.id}`} key={expense.id}>
          <Input label="Title:" type="text" name="title" placeholder={`${expense.title}`} required />
          <Textarea label="Description:" name="description" defaultValue={`${expense.description}`} />
          <Input label="Amount (in USD):" type="number" defaultValue={`${expense.amount}`} name="amount" required />
          <Button type="submit" name="intent" value="update" isPrimary disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>

          <p aria-live="polite" className="text-green-600">
            {actionData?.success && 'Expense updated'}
          </p>
        </Form>
      </section>
      <FloatingActionLink to="/dashboard/expenses/">Add expense</FloatingActionLink>
    </>
  );
}
