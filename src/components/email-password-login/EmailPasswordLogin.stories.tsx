import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, mocked } from 'storybook/test';
import { EmailPasswordLogin } from './EmailPasswordLogin';
import { loginWithEmailPassword } from '../../lib/authService';

type LoggedInUser = Awaited<ReturnType<typeof loginWithEmailPassword>>;

const meta = {
  title: 'Components/EmailPasswordLogin',
  component: EmailPasswordLogin,
  tags: ['autodocs'],
  args: {
    onLogin: fn(),
  },
  beforeEach: () => {
    mocked(loginWithEmailPassword).mockResolvedValue({} as LoggedInUser);
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EmailPasswordLogin>;

export default meta;
type Story = StoryObj<typeof meta>;

// Any user name with a non-empty password logs in.
export const Default: Story = {};

export const ValidationErrors: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Uživatel'), 'tom@example');
    await userEvent.click(canvas.getByRole('button', { name: 'Přihlásit se' }));

    await expect(canvas.getByLabelText('Uživatel')).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.getByLabelText('Heslo')).toHaveAttribute('aria-invalid', 'true');
    await expect(loginWithEmailPassword).not.toHaveBeenCalled();
  },
};

export const WrongCredentials: Story = {
  beforeEach: () => {
    mocked(loginWithEmailPassword).mockRejectedValue(new Error('auth/invalid-credential'));
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Uživatel'), 'tom');
    await userEvent.type(canvas.getByLabelText('Heslo'), 'wrong');
    await userEvent.click(canvas.getByRole('button', { name: 'Přihlásit se' }));

    await expect(await canvas.findAllByText('Špatné údaje')).toHaveLength(2);
    await expect(args.onLogin).not.toHaveBeenCalled();
  },
};

// The login request never settles, so the form stays disabled.
export const Submitting: Story = {
  beforeEach: () => {
    mocked(loginWithEmailPassword).mockReturnValue(new Promise<LoggedInUser>(() => {}));
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Uživatel'), 'tom');
    await userEvent.type(canvas.getByLabelText('Heslo'), 'secret');
    await userEvent.click(canvas.getByRole('button', { name: 'Přihlásit se' }));

    await expect(canvas.getByRole('button', { name: 'Přihlásit se' })).toBeDisabled();
  },
};
