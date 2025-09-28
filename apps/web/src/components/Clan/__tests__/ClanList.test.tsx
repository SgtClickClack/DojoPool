import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ClanList from '../ClanList';
import type { Clan } from '@/types/clan';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const createClan = (overrides: Partial<Clan> = {}): Clan => ({
  id: overrides.id ?? 'clan-1',
  name: overrides.name ?? 'Crimson Monkeys',
  description: overrides.description ?? 'Fearless territory defenders.',
  motto: overrides.motto ?? 'Unity and precision',
  logo: overrides.logo ?? '/logo.png',
  banner: overrides.banner ?? '/banner.png',
  tag: overrides.tag ?? 'CRIM',
  leaderId: overrides.leaderId ?? 'leader-1',
  leader: overrides.leader ?? {
    id: 'leader-1',
    email: 'leader@example.com',
    username: 'MonkeyMaster',
  },
  maxMembers: overrides.maxMembers ?? 50,
  dojoCoinBalance: overrides.dojoCoinBalance ?? 1_500,
  seasonalPoints: overrides.seasonalPoints ?? 400,
  level: overrides.level ?? 3,
  experience: overrides.experience ?? 1200,
  experienceToNext: overrides.experienceToNext ?? 1800,
  reputation: overrides.reputation ?? 250,
  isActive: overrides.isActive ?? true,
  location: overrides.location ?? 'Neo Tokyo',
  warWins: overrides.warWins ?? 12,
  warLosses: overrides.warLosses ?? 4,
  territoryCount: overrides.territoryCount ?? 6,
  members: overrides.members ?? [],
  territories: overrides.territories ?? [],
  createdAt: overrides.createdAt ?? '2024-01-01T00:00:00Z',
  updatedAt: overrides.updatedAt ?? '2024-01-01T00:00:00Z',
});

describe('ClanList', () => {
  const onJoin = vi.fn();
  const onView = vi.fn();
  const onFilter = vi.fn();

  const clans = [
    createClan(),
    createClan({ id: 'clan-2', name: 'Azure Breakers' }),
  ];

  const baseProps = {
    clans,
    onJoin,
    onView,
    onFilter,
    onSort: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the heading with clan count', () => {
    renderWithTheme(<ClanList {...baseProps} />);

    expect(screen.getByText('Clans (2)')).toBeInTheDocument();
    expect(screen.getByText('Crimson Monkeys')).toBeInTheDocument();
    expect(screen.getByText('Azure Breakers')).toBeInTheDocument();
  });

  it('calls onFilter when the search term changes', () => {
    renderWithTheme(<ClanList {...baseProps} />);

    const searchField = screen.getByPlaceholderText('Search clans...');
    fireEvent.change(searchField, { target: { value: 'crimson' } });

    expect(onFilter).toHaveBeenCalledWith('crimson');
  });

  it('invokes onJoin for the rendered clan', () => {
    const targetClan = createClan({ id: 'target-clan', name: 'Shadow Tigers' });
    renderWithTheme(<ClanList {...baseProps} clans={[targetClan]} />);

    fireEvent.click(screen.getByRole('button', { name: /join clan/i }));
    expect(onJoin).toHaveBeenCalledWith('target-clan');
  });

  it('invokes onView for the rendered clan', () => {
    const targetClan = createClan({ id: 'target-clan', name: 'Shadow Tigers' });
    renderWithTheme(<ClanList {...baseProps} clans={[targetClan]} />);

    fireEvent.click(screen.getByRole('button', { name: /view details/i }));
    expect(onView).toHaveBeenCalledWith('target-clan');
  });

  it('shows the empty state when no clans are provided', () => {
    renderWithTheme(<ClanList {...baseProps} clans={[]} />);

    expect(screen.getByText('Clans (0)')).toBeInTheDocument();
    expect(screen.getByText('No clans found')).toBeInTheDocument();
  });

  it('disables join actions when the list is disabled', () => {
    renderWithTheme(<ClanList {...baseProps} disabled />);

    const joinButtons = screen.getAllByRole('button', { name: /join clan/i });
    expect(joinButtons[0]).toBeDisabled();
  });
});
