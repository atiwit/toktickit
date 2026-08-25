

import { describe, it, expect } from 'vitest';

/**
 * Build a ticket number given a date and the last sequence used today.
 * @param date     - the "today" date to stamp into the number
 * @param lastSeq  - the last sequence number used today (0 if none yet)
 */
function buildTicketNumber(date: Date, lastSeq: number): string {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ''); 
  const sequence = lastSeq + 1;
  return `TKT-${dateStr}-${String(sequence).padStart(4, '0')}`;
}


function parseSequence(ticketNumber: string): number {
  const lastSeg = ticketNumber.slice(ticketNumber.lastIndexOf('-') + 1);
  return parseInt(lastSeg, 10);
}

  // Test
  describe('UNIT-01 — Ticket Number generator', () => {
  const fixedDate = new Date('2026-08-25T00:00:00.000Z');

  // Format
  describe('format', () => {
    it('starts with TKT- prefix', () => {
      const num = buildTicketNumber(fixedDate, 0);
      expect(num).toMatch(/^TKT-/);
    });

    it('contains the date segment YYYYMMDD', () => {
      const num = buildTicketNumber(fixedDate, 0);
      expect(num).toContain('20260825');
    });

    it('matches the full pattern TKT-YYYYMMDD-NNNN', () => {
      const num = buildTicketNumber(fixedDate, 0);
      expect(num).toMatch(/^TKT-\d{8}-\d{4}$/);
    });

    it('has exactly 3 hyphen-separated segments', () => {
      const num = buildTicketNumber(fixedDate, 0);
      expect(num.split('-')).toHaveLength(3);
    });
  });

  describe('zero-padding (always 4 digits)', () => {
    it('pads sequence 1 → "0001"', () => {
      expect(buildTicketNumber(fixedDate, 0)).toBe('TKT-20260825-0001');
    });

    it('pads sequence 12 → "0012"', () => {
      expect(buildTicketNumber(fixedDate, 11)).toBe('TKT-20260825-0012');
    });

    it('pads sequence 123 → "0123"', () => {
      expect(buildTicketNumber(fixedDate, 122)).toBe('TKT-20260825-0123');
    });

    it('does not pad sequence 1234 → "1234"', () => {
      expect(buildTicketNumber(fixedDate, 1233)).toBe('TKT-20260825-1234');
    });
  });

  describe('sequence increment', () => {
    it('first ticket of the day starts at 0001 (lastSeq = 0)', () => {
      const num = buildTicketNumber(fixedDate, 0);
      expect(parseSequence(num)).toBe(1);
    });

    it('increments by 1 from the previous last sequence', () => {
      const first = buildTicketNumber(fixedDate, 0);   // → 0001
      const second = buildTicketNumber(fixedDate, parseSequence(first)); // → 0002
      expect(parseSequence(second)).toBe(2);
    });

    it('continues incrementing correctly across several tickets', () => {
      let lastSeq = 0;
      for (let i = 1; i <= 10; i++) {
        const num = buildTicketNumber(fixedDate, lastSeq);
        lastSeq = parseSequence(num);
        expect(lastSeq).toBe(i);
      }
    });

    it('produces unique ticket numbers when called sequentially', () => {
      const numbers = new Set<string>();
      let lastSeq = 0;
      for (let i = 0; i < 20; i++) {
        const num = buildTicketNumber(fixedDate, lastSeq);
        lastSeq = parseSequence(num);
        numbers.add(num);
      }
      expect(numbers.size).toBe(20); // all unique
    });
  });

  describe('date boundary', () => {
    it('uses the correct date for the given day', () => {
      const jan1 = new Date('2026-01-01T00:00:00.000Z');
      const num = buildTicketNumber(jan1, 0);
      expect(num).toBe('TKT-20260101-0001');
    });

    it('different days produce different prefixes', () => {
      const day1 = buildTicketNumber(new Date('2026-08-25T00:00:00.000Z'), 0);
      const day2 = buildTicketNumber(new Date('2026-08-26T00:00:00.000Z'), 0);
      expect(day1).not.toBe(day2);
      expect(day1).toContain('20260825');
      expect(day2).toContain('20260826');
    });
  });
});
