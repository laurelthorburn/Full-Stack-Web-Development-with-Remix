import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData, useNavigation } from '@remix-run/react';

import { Button } from '~/components/buttons';
import { Card } from '~/components/containers';
import { Input } from '~/components/forms';
import { H1 } from '~/components/headings';
import { InlineError } from '~/components/texts';
import { createUserSession, getUserId, registerUser } from '~/modules/session/session.server';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const { name, email, password } = Object.fromEntries(formData);

  if (!name || !email || !password) {
    return json({ error: 'Missing required fields' });
  }

  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    throw new Error('Invalid form data');
  }

  try {
    const user = await registerUser({ name, email, password });
    return redirect('/dashboard', {
      headers: await createUserSession(user),
    });
  } catch (error: any) {
    return json({ error: error?.message || 'Ugh, something went wrong.' });
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) {
    return redirect('/dashboard');
  }
  // return an empty object since loader cannot return undefined
  return {};
}

export default function Component() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state !== 'idle' && navigation.formAction === '/signup';

  const actionData = useActionData<typeof action>();

  return (
    <Card>
      <Form method="post" action="/signup">
        <H1>Sign Up!</H1>
        <Input label="Name" name="name" required />
        <Input label="Email" name="email" type="email" required />
        <Input label="Password" name="password" type="password" required />
        <Button type="submit" disabled={isSubmitting} isPrimary>
          {isSubmitting ? 'Signing up...' : 'Sign Up!'}
        </Button>
        <InlineError aria-live="assertive">{actionData?.error && actionData.error}</InlineError>
      </Form>
    </Card>
  );
}
