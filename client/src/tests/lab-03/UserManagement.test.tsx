import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UserManagement from '../../pages/UserManagement';

// ---------------------------------------------------------------------------
// Mock AuthContext — logged-in as admin with id=1
// ---------------------------------------------------------------------------
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Admin One', role: 'ADMINISTRATOR', email: 'admin1@test.com', mustChangePassword: false },
  }),
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const mockUsers = [
  {
    id: 1,
    name: 'Admin One',
    email: 'admin1@test.com',
    role: 'ADMINISTRATOR',
    isActive: true,
    createdAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Staff Member',
    email: 'staff@test.com',
    role: 'IT_STAFF',
    isActive: true,
    createdAt: '2026-09-02T00:00:00Z',
  },
  {
    id: 3,
    name: 'Inactive Requester',
    email: 'inactive@test.com',
    role: 'REQUESTER',
    isActive: false,
    createdAt: '2026-09-03T00:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function mockFetchSuccess(users = mockUsers) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ users }),
  });
}

function mockFetchThenSaveConflict(conflictCode: string, conflictMessage: string) {
  // Each call to this function creates a fresh mock with its own counter
  let callCount = 0;
  global.fetch = vi.fn().mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      // First call: GET /api/admin/users — success
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ users: mockUsers }),
      });
    }
    // Subsequent calls (POST/PATCH): conflict
    return Promise.resolve({
      ok: false,
      status: 409,
      json: () =>
        Promise.resolve({
          error: { code: conflictCode, message: conflictMessage },
        }),
    });
  });
}

function mockFetchSuccessAfterConflict(conflictCode: string, conflictMessage: string) {
  // For Edit tests: GET users success, then PATCH returns conflict
  let callCount = 0;
  global.fetch = vi.fn().mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ users: mockUsers }),
      });
    }
    return Promise.resolve({
      ok: false,
      status: 409,
      json: () =>
        Promise.resolve({
          error: { code: conflictCode, message: conflictMessage },
        }),
    });
  });
}

function renderPage() {
  return render(
    <BrowserRouter>
      <UserManagement />
    </BrowserRouter>
  );
}

// ===========================================================================
// UI-12: UserManagement renders user list with all required columns
// ===========================================================================
describe('UI-12 — UserManagement renders user list table', () => {
  beforeEach(() => {
    mockFetchSuccess();
  });

  it('renders the User Management page heading', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/User Management/i)).toBeInTheDocument();
    });
  });

  it('renders the Name column header', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
    });
  });

  it('renders the Email column header', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Email')).toBeInTheDocument();
    });
  });

  it('renders the Role column header', async () => {
    renderPage();
    await waitFor(() => {
      const roleHeaders = screen.getAllByText('Role');
      expect(roleHeaders.length).toBeGreaterThan(0);
    });
  });

  it('renders the Status column header', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  it('renders all user names from the API response', async () => {
    renderPage();
    await waitFor(() => {
      // Names appear in both table and mobile card stack — use getAllByText
      expect(screen.getAllByText('Admin One').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Staff Member').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Inactive Requester').length).toBeGreaterThan(0);
    });
  });

  it('renders all user emails', async () => {
    renderPage();
    await waitFor(() => {
      // Emails appear in both table and mobile card stack — use getAllByText
      expect(screen.getAllByText('admin1@test.com').length).toBeGreaterThan(0);
      expect(screen.getAllByText('staff@test.com').length).toBeGreaterThan(0);
      expect(screen.getAllByText('inactive@test.com').length).toBeGreaterThan(0);
    });
  });

  it('renders Role badges for each user', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Administrator')).toBeInTheDocument();
      expect(screen.getByText('IT Staff')).toBeInTheDocument();
      expect(screen.getByText('Requester')).toBeInTheDocument();
    });
  });

  it('renders Status badges: Active for active users, Inactive for inactive', async () => {
    renderPage();
    await waitFor(() => {
      // Active/Inactive appear in both table and mobile card stack
      const activeBadges = screen.getAllByText('Active');
      expect(activeBadges.length).toBeGreaterThanOrEqual(2);
      const inactiveBadges = screen.getAllByText('Inactive');
      expect(inactiveBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders an Edit button for each user', async () => {
    renderPage();
    await waitFor(() => {
      const editBtn1 = document.getElementById('btn-edit-user-1');
      const editBtn2 = document.getElementById('btn-edit-user-2');
      const editBtn3 = document.getElementById('btn-edit-user-3');
      expect(editBtn1).toBeInTheDocument();
      expect(editBtn2).toBeInTheDocument();
      expect(editBtn3).toBeInTheDocument();
    });
  });

  it('renders a Reset PW button for each user', async () => {
    renderPage();
    await waitFor(() => {
      const resetBtn1 = document.getElementById('btn-reset-password-1');
      const resetBtn2 = document.getElementById('btn-reset-password-2');
      expect(resetBtn1).toBeInTheDocument();
      expect(resetBtn2).toBeInTheDocument();
    });
  });

  it('renders a Create User button', async () => {
    renderPage();
    await waitFor(() => {
      expect(document.getElementById('btn-create-user')).toBeInTheDocument();
    });
  });

  it('renders a search input', async () => {
    renderPage();
    await waitFor(() => {
      expect(document.getElementById('user-search')).toBeInTheDocument();
    });
  });

  it('renders a role filter dropdown', async () => {
    renderPage();
    await waitFor(() => {
      expect(document.getElementById('user-role-filter')).toBeInTheDocument();
    });
  });

  it('shows empty state when no users are returned', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ users: [] }),
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/No users found/i)).toBeInTheDocument();
    });
  });
});

// ===========================================================================
// UI-13: UserManagement shows duplicate email error — AC-12
// ===========================================================================
describe('UI-13 — UserManagement shows duplicate email error on Create', () => {
  beforeEach(() => {
    mockFetchThenSaveConflict('DUPLICATE_EMAIL', 'This email address is already in use');
  });

  it('opens Create User modal when Create User button is clicked', async () => {
    mockFetchThenSaveConflict('DUPLICATE_EMAIL', 'This email address is already in use');
    renderPage();
    await waitFor(() => {
      expect(document.getElementById('btn-create-user')).toBeInTheDocument();
    });

    fireEvent.click(document.getElementById('btn-create-user')!);

    await waitFor(() => {
      // Modal heading is an <h2> with text 'Create User'
      expect(document.getElementById('modal-name')).toBeInTheDocument();
    });
  });

  it('shows duplicate email error message after API returns 409', async () => {
    mockFetchThenSaveConflict('DUPLICATE_EMAIL', 'This email address is already in use');
    renderPage();
    await waitFor(() => {
      expect(document.getElementById('btn-create-user')).toBeInTheDocument();
    });

    // Open Create modal
    fireEvent.click(document.getElementById('btn-create-user')!);

    await waitFor(() => {
      expect(document.getElementById('modal-name')).toBeInTheDocument();
    });

    // Fill in the form
    fireEvent.change(document.getElementById('modal-name')!, {
      target: { value: 'Test User' },
    });
    fireEvent.change(document.getElementById('modal-email')!, {
      target: { value: 'duplicate@test.com' },
    });
    fireEvent.change(document.getElementById('modal-role')!, {
      target: { value: 'REQUESTER' },
    });
    fireEvent.change(document.getElementById('modal-password')!, {
      target: { value: 'Valid@Pass1' },
    });
    fireEvent.change(document.getElementById('modal-confirm-password')!, {
      target: { value: 'Valid@Pass1' },
    });

    // Submit
    fireEvent.click(document.getElementById('modal-save-btn')!);

    // Expect duplicate email error to appear
    await waitFor(() => {
      expect(
        screen.getByText(/already in use/i)
      ).toBeInTheDocument();
    });
  });

  it('shows duplicate email error on Edit when API returns 409', async () => {
    mockFetchSuccessAfterConflict('DUPLICATE_EMAIL', 'This email address is already in use');

    renderPage();
    await waitFor(() => {
      expect(document.getElementById('btn-edit-user-2')).toBeInTheDocument();
    });

    // Open Edit modal for user 2
    fireEvent.click(document.getElementById('btn-edit-user-2')!);

    await waitFor(() => {
      expect(document.getElementById('modal-email')).toBeInTheDocument();
    });

    // Change email to a duplicate
    fireEvent.change(document.getElementById('modal-email')!, {
      target: { value: 'admin1@test.com' },
    });

    fireEvent.click(document.getElementById('modal-save-btn')!);

    await waitFor(() => {
      expect(screen.getByText(/already in use/i)).toBeInTheDocument();
    });
  });
});

// ===========================================================================
// UI-14: UserManagement blocks self-deactivation in UI — AC-13
// ===========================================================================
describe('UI-14 — UserManagement disables Active toggle when editing own account', () => {
  beforeEach(() => {
    mockFetchSuccess();
  });

  it('opens Edit modal for own account (id=1)', async () => {
    renderPage();
    await waitFor(() => {
      expect(document.getElementById('btn-edit-user-1')).toBeInTheDocument();
    });

    fireEvent.click(document.getElementById('btn-edit-user-1')!);

    await waitFor(() => {
      expect(screen.getByText(/Edit User/i)).toBeInTheDocument();
    });
  });

  it('Active checkbox is disabled when editing own account', async () => {
    renderPage();
    await waitFor(() => {
      expect(document.getElementById('btn-edit-user-1')).toBeInTheDocument();
    });

    // Click Edit on user with id=1 (same as authenticated user)
    fireEvent.click(document.getElementById('btn-edit-user-1')!);

    await waitFor(() => {
      const activeCheckbox = document.getElementById('modal-active') as HTMLInputElement;
      expect(activeCheckbox).toBeInTheDocument();
      expect(activeCheckbox.disabled).toBe(true);
    });
  });

  it('shows self-deactivation warning text when editing own account', async () => {
    renderPage();
    await waitFor(() => {
      expect(document.getElementById('btn-edit-user-1')).toBeInTheDocument();
    });

    fireEvent.click(document.getElementById('btn-edit-user-1')!);

    await waitFor(() => {
      expect(
        screen.getByText(/cannot deactivate your own account/i)
      ).toBeInTheDocument();
    });
  });

  it('Active checkbox is NOT disabled when editing a different user', async () => {
    renderPage();
    await waitFor(() => {
      expect(document.getElementById('btn-edit-user-2')).toBeInTheDocument();
    });

    // Click Edit on user with id=2 (different from authenticated user id=1)
    fireEvent.click(document.getElementById('btn-edit-user-2')!);

    await waitFor(() => {
      const activeCheckbox = document.getElementById('modal-active') as HTMLInputElement;
      expect(activeCheckbox).toBeInTheDocument();
      expect(activeCheckbox.disabled).toBe(false);
    });
  });

  it('does not show self-deactivation warning when editing a different user', async () => {
    renderPage();
    await waitFor(() => {
      expect(document.getElementById('btn-edit-user-2')).toBeInTheDocument();
    });

    fireEvent.click(document.getElementById('btn-edit-user-2')!);

    await waitFor(() => {
      expect(document.getElementById('modal-active')).toBeInTheDocument();
    });

    // Warning should NOT be present
    expect(
      screen.queryByText(/cannot deactivate your own account/i)
    ).not.toBeInTheDocument();
  });
});
