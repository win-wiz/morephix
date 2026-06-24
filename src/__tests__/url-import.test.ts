import { describe, it, expect } from 'vitest';
import { isPrivateHostname, formatImportError } from '@/lib/shared/url-import';

describe('isPrivateHostname', () => {
  it('rejects localhost', () => {
    expect(isPrivateHostname('localhost')).toBe(true);
    expect(isPrivateHostname('LOCALHOST')).toBe(true);
  });

  it('rejects 127.0.0.0/8 loopback range', () => {
    expect(isPrivateHostname('127.0.0.1')).toBe(true);
    expect(isPrivateHostname('127.1.2.3')).toBe(true);
    expect(isPrivateHostname('127.255.255.255')).toBe(true);
  });

  it('rejects 0.0.0.0/8', () => {
    expect(isPrivateHostname('0.0.0.0')).toBe(true);
    expect(isPrivateHostname('0.1.2.3')).toBe(true);
  });

  it('rejects RFC1918 private ranges', () => {
    expect(isPrivateHostname('10.0.0.1')).toBe(true);
    expect(isPrivateHostname('10.255.255.255')).toBe(true);
    expect(isPrivateHostname('192.168.0.1')).toBe(true);
    expect(isPrivateHostname('192.168.255.255')).toBe(true);
    expect(isPrivateHostname('172.16.0.1')).toBe(true);
    expect(isPrivateHostname('172.20.5.5')).toBe(true);
    expect(isPrivateHostname('172.31.255.255')).toBe(true);
  });

  it('does NOT reject 172.x outside 16-31', () => {
    expect(isPrivateHostname('172.15.0.1')).toBe(false);
    expect(isPrivateHostname('172.32.0.1')).toBe(false);
  });

  it('rejects link-local 169.254.x', () => {
    expect(isPrivateHostname('169.254.169.254')).toBe(true);
  });

  it('rejects IPv6 loopback and unique-local', () => {
    expect(isPrivateHostname('::1')).toBe(true);
    expect(isPrivateHostname('fc00::1')).toBe(true);
    expect(isPrivateHostname('fd12:3456::')).toBe(true);
    expect(isPrivateHostname('fe80::1')).toBe(true);
  });

  it('strips IPv6 brackets', () => {
    expect(isPrivateHostname('[::1]')).toBe(true);
  });

  it('accepts public hostnames', () => {
    expect(isPrivateHostname('example.com')).toBe(false);
    expect(isPrivateHostname('cdn.example.com')).toBe(false);
    expect(isPrivateHostname('8.8.8.8')).toBe(false);
    expect(isPrivateHostname('1.1.1.1')).toBe(false);
  });
});

describe('formatImportError', () => {
    it('formats each kind to a Chinese message', () => {
      expect(formatImportError({ kind: 'invalid-url' })).toContain('URL');
      expect(formatImportError({ kind: 'invalid-protocol' })).toContain('protocol');
      expect(formatImportError({ kind: 'private-host' })).toContain('private');
      expect(formatImportError({ kind: 'http-error', status: 404 })).toContain('404');
      expect(formatImportError({ kind: 'invalid-content-type', contentType: 'text/html' })).toContain('text/html');
      expect(formatImportError({ kind: 'too-large' })).toContain('10MB');
      expect(formatImportError({ kind: 'not-svg' })).toContain('SVG');
      expect(formatImportError({ kind: 'timeout' })).toContain('time');
      expect(formatImportError({ kind: 'network', message: 'DNS failed' })).toBe('DNS failed');
    });
  });