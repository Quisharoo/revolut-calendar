import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExport } from '../use-export';

describe('useExport', () => {
  it('generates an ICS file and returns success', async () => {
    const transactions = [
      { id: '1', date: new Date(), description: 'A', amount: -10, category: 'Expense', currencySymbol: '$', source: { name: 'X' }, isRecurring: true },
    ];

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
      res = await exportTransactions(transactions, ['1']);
    });

    expect(res.success).toBe(true);
    expect(res.fileName).toMatch(/recurring-transactions-.*\.ics/);

  // Restore mocks
  (global as any).URL.createObjectURL = originalCreateObjectURL;
  (global as any).URL.revokeObjectURL = originalRevokeObjectURL;
  (document.createElement as any).mockRestore();
  });
});
