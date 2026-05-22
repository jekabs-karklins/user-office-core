import { expect, test } from '@playwright/test';

const frontendUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';
const graphqlUrl = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:4000/graphql';

const gqlRequest = async <T>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string
) => {
  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  return (await response.json()) as T;
};

type ExternalTokenLoginResponse = {
  data?: { externalTokenLogin: string | null };
  errors?: { message: string }[];
};

type SelectRoleResponse = {
  data?: { selectRole: string | null };
  errors?: { message: string }[];
};

test('sorting experiments by End does not throw bad sort field error', async ({
  page,
}) => {
  const externalTokenLogin = await gqlRequest<ExternalTokenLoginResponse>(
    `
      mutation Login($externalToken: String!, $redirectUri: String!, $iss: String) {
        externalTokenLogin(
          externalToken: $externalToken
          redirectUri: $redirectUri
          iss: $iss
        )
      }
    `,
    {
      externalToken: 'officer',
      redirectUri: `${frontendUrl}/external-auth`,
      iss: null,
    }
  );

  expect(externalTokenLogin.errors ?? []).toHaveLength(0);
  expect(externalTokenLogin.data?.externalTokenLogin).toBeTruthy();

  const roleSelection = await gqlRequest<SelectRoleResponse>(
    `
      mutation SelectRole($selectedRoleId: Int!, $token: String!) {
        selectRole(selectedRoleId: $selectedRoleId, token: $token)
      }
    `,
    {
      selectedRoleId: 2,
      token: externalTokenLogin.data!.externalTokenLogin!,
    }
  );

  expect(roleSelection.errors ?? []).toHaveLength(0);
  expect(roleSelection.data?.selectRole).toBeTruthy();

  const roleToken = roleSelection.data!.selectRole!;
  const tokenPayload = JSON.parse(
    Buffer.from(roleToken.split('.')[1], 'base64url').toString('utf8')
  ) as {
    user: unknown;
    exp: number;
    currentRole: { shortCode?: string; id: number };
  };

  await page.addInitScript(
    ({ token, payload }) => {
      window.localStorage.setItem('token', token);
      window.localStorage.setItem('expToken', `${payload.exp}`);
      window.localStorage.setItem('user', JSON.stringify(payload.user));
      window.localStorage.setItem('currentRoleId', `${payload.currentRole.id}`);
      if (payload.currentRole.shortCode) {
        window.localStorage.setItem(
          'currentRole',
          payload.currentRole.shortCode.toUpperCase()
        );
      }
    },
    {
      token: roleToken,
      payload: tokenPayload,
    }
  );

  await page.goto(`${frontendUrl}/experiments`);
  await page.getByText('Experiments').first().waitFor();
  await page.getByRole('radio', { name: 'None' }).click();
  await page.getByRole('columnheader', { name: 'End' }).click();

  await expect(page.getByText('Bad sort field given: startsAt')).toHaveCount(0);
  await expect(page.getByText('Bad sort field given: endsAt')).toHaveCount(0);
});
