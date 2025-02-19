import { type ActionFunctionArgs, redirect } from '@remix-run/node';

import { Button } from '~/components/buttons';
import { Form, Input, Textarea } from '~/components/forms';
import { db } from '~/modules/db.server';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const title = formData.get('title');
  const description = formData.get('description');
  const amount = formData.get('amount');

  if (typeof title !== 'string' || typeof description !== 'string' || typeof amount !== 'string') {
    throw new Error('Invalid form data, something went wrong');
  }

  const amountNumber = Number.parseFloat(amount);
  if (Number.isNaN(amountNumber)) {
    throw new Error('Something went wrong, the amount is not a number');
  }

  const invoice = await db.invoice.create({
    data: {
      title,
      description,
      amount: amountNumber,
      currencyCode: 'USD',
    },
  });

  return redirect(`/dashboard/income/${invoice.id}`);
}

export default function Component() {
  return (
    <Form method="post" action="/dashboard/income/?index">
      <label className="w-full lg:max-w-md">
        Title:
        <Input label="Title:" name="title" placeholder="Babysitting" required />
      </label>
      <label className="w-full lg:max-w-md">
        Description:
        <Textarea label="Description:" name="description" />
      </label>
      <label className="w-full lg:max-w-md">
        Amount (in USD):
        <Input label="Amount (in USD):" type="number" defaultValue={0} name="amount" required />
      </label>
      <Button type="submit" isPrimary>
        Create
      </Button>
    </Form>
  );
}
