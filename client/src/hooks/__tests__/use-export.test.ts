import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExport } from '../use-export';
import { detectRecurringSeries } from '@/lib/recurrenceDetection';

const buildSeries = () => {
  const transactions = [
    {
      id: 'rent-jan',
      date: new Date(2024, 0, 3),
      description: 'Rent',
      amount: -1200,
      category: 'Expense',
      currencySymbol: '$',
      source: { name: 'Landlord', type: 'merchant' as const },
      isRecurring: true,
    },
    {
      id: 'rent-feb',
      date: new Date(2024, 1, 3),
      description: 'Rent',
      amount: -1200,
      category: 'Expense',
      currencySymbol: '$',
      source: { name: 'Landlord', type: 'merchant' as const },
      isRecurring: true,
    },
    {
      id: 'rent-mar',
      date: new Date(2024, 2, 3),
      description: 'Rent',
      amount: -1200,
      category: 'Expense',
      currencySymbol: '$',
      source: { name: 'Landlord', type: 'merchant' as const },
      isRecurring: true,
    },
    {
      id: 'rent-apr',
      date: new Date(2024, 3, 10),
      description: 'Rent',
      amount: -1200,
      category: 'Expense',
      currencySymbol: '$',
      source: { name: 'Landlord', type: 'merchant' as const },
      isRecurring: true,
    },
  ];

  const detection = detectRecurringSeries(transactions as any);
  return detection.series;
};

describe('useExport', () => {
  it('generates an ICS file and returns success', async () => {
    const series = buildSeries();
    expect(series).toHaveLength(1);

  // Mock URL.createObjectURL and revokeObjectURL for the test environment
  const originalCreateObjectURL = (global as any).URL.createObjectURL;
  const originalRevokeObjectURL = (global as any).URL.revokeObjectURL;
  (global as any).URL.createObjectURL = vi.fn(() => 'blob://test');
  (global as any).URL.revokeObjectURL = vi.fn(() => undefined);

    // Mock anchor click behavior
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: any) => {
      const el = originalCreateElement(tagName);
      if (tagName === 'a') {
        (el as any).click = () => {};
        (el as any).href = '';
        (el as any).download = '';
      }
      return el;
    });

    const { result } = renderHook(() => useExport());
    const { exportTransactions } = result.current;

    let res: any;
    await act(async () => {
      res = await exportTransactions(series, [series[0].id], new Date(2024, 2, 1));
    });

    expect(res.success).toBe(true);
    expect(res.fileName).toMatch(/recurring-transactions-.*\.ics/);

  // Restore mocks
  (global as any).URL.createObjectURL = originalCreateObjectURL;
  (global as any).URL.revokeObjectURL = originalRevokeObjectURL;
  (document.createElement as any).mockRestore();
  });
});
