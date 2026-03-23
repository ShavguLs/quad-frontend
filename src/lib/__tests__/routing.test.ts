import { describe, it, expect } from 'vitest';
import { parseBookRouteId } from '../routing';

describe('parseBookRouteId', () => {
  it('extracts numeric ID from pure numeric routes', () => {
    expect(parseBookRouteId('14')).toBe('14');
    expect(parseBookRouteId('1')).toBe('1');
    expect(parseBookRouteId('999')).toBe('999');
  });

  it('extracts numeric ID from slug-based routes', () => {
    expect(parseBookRouteId('შოთა-რუსთაველი-ვეფხისტყაოსანი--14')).toBe('14');
    expect(parseBookRouteId('some-book-title--42')).toBe('42');
    expect(parseBookRouteId('author-name-book-title--1')).toBe('1');
  });

  it('extracts numeric ID from wrong-slug routes', () => {
    expect(parseBookRouteId('wrong-slug--14')).toBe('14');
    expect(parseBookRouteId('completely-different--99')).toBe('99');
  });

  it('returns null for routes without numeric IDs', () => {
    expect(parseBookRouteId('only-slug')).toBe(null);
    expect(parseBookRouteId('no-id-here')).toBe(null);
    expect(parseBookRouteId('book-title')).toBe(null);
  });

  it('returns null for empty or undefined input', () => {
    expect(parseBookRouteId('')).toBe(null);
    expect(parseBookRouteId('   ')).toBe(null);
    expect(parseBookRouteId(undefined)).toBe(null);
  });

  it('handles routes with multiple dashes correctly', () => {
    expect(parseBookRouteId('author-with-many-dashes-title-with-dashes--123')).toBe('123');
    expect(parseBookRouteId('a-b-c-d-e-f--456')).toBe('456');
  });

  it('handles Georgian text in slugs', () => {
    expect(parseBookRouteId('ვეფხისტყაოსანი--77')).toBe('77');
    expect(parseBookRouteId('შოთა-რუსთაველი--88')).toBe('88');
  });

  it('does not match IDs that are not at the end', () => {
    expect(parseBookRouteId('14--something-else')).toBe(null);
    expect(parseBookRouteId('book--14--extra')).toBe(null);
  });

  it('handles whitespace in input', () => {
    expect(parseBookRouteId('  14  ')).toBe('14');
    expect(parseBookRouteId('  slug--42  ')).toBe('42');
  });
});
