import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData, useFetcher, useLoaderData } from '@remix-run/react';

import { Button } from '~/components/buttons';
import { Input, Textarea } from '~/components/forms';
import { FloatingActionLink } from '~/components/links';
import { db } from '~/modules/db.server';

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  const invoice = await db.invoice.findUnique({ where: { id } });
  if (!invoice) throw new Response('Not found', { status: 404 });
  return json(invoice);
}

async function updateInvoice(formData: FormData, id: string): Promise<Response> {
  const title = formData.get('title');
  const description = formData.get('description');
  const amount = formData.get('amount');
  if (typeof title !== 'string' || typeof description !== 'string' || typeof amount !== 'string') {
    throw Error('something went wrong');
  }
  await db.invoice.update({
    where: { id },
    data: { title, description, amount: Number.parseFloat(amount) },
  });
  return json({ success: true });
}

async function deleteInvoice(request: Request, id: string): Promise<Response> {
  const referer = request.headers.get('referer');
  const redirectPath = referer || '/dashboard/income';

  try {
    await db.invoice.delete({ where: { id } });
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
    return deleteInvoice(request, id);
  }
  if (intent === 'update') {
    return updateInvoice(formData, id);
  }
  throw new Response('Invalid intent', { status: 400 });
}

export default function Component() {
  const invoice = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== 'idle';
  const actionData = useActionData<typeof action>();
  return (
    <>
      <section className="w-full h-full p-8">
        <Form method="POST" action={`/dashboard/income/${invoice.id}`} key={invoice.id}>
          <Input label="Title:" type="text" name="title" placeholder={`${invoice.title}`} required />
          <Textarea label="Description:" name="description" defaultValue={`${invoice.description}`} />
          <Input label="Amount (in USD):" type="number" defaultValue={`${invoice.amount}`} name="amount" required />
          <Button type="submit" name="intent" value="update" isPrimary disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>

          <p aria-live="polite" className="text-green-600">
            {actionData?.success && 'Expense updated'}
          </p>
        </Form>
      </section>
      <FloatingActionLink to="/dashboard/income/">Add invoice</FloatingActionLink>
    </>
  );
}
