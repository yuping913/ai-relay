import { describe, it, expect } from 'vitest';
import { buildHeaders } from '../lib/relay/transform';

describe('Header Passthrough', () => {
  it('should forward all passthroughHeaders for Anthropic providers', () => {
    const passthroughHeaders = {
      'anthropic-beta': 'claude-code-20250219,interleaved-thinking-2025-05-14',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'x-app': 'cli',
      'x-claude-code-session-id': '3e5fcbf1-8eb2-4e20-8ba1-4554f39da697',
      'x-stainless-arch': 'arm64',
      'x-stainless-lang': 'js',
      'x-stainless-os': 'MacOS',
      'x-stainless-package-version': '0.94.0',
      'x-stainless-runtime': 'node',
      'x-stainless-runtime-version': 'v24.3.0',
    };

    const headers = buildHeaders(
      'anthropic',
      'sk-test-key',
      true,
      undefined,
      undefined,
      passthroughHeaders
    );

    // Check that all passthrough headers are included
    expect(headers['anthropic-beta']).toBe('claude-code-20250219,interleaved-thinking-2025-05-14');
    expect(headers['anthropic-dangerous-direct-browser-access']).toBe('true');
    expect(headers['x-app']).toBe('cli');
    expect(headers['x-claude-code-session-id']).toBe('3e5fcbf1-8eb2-4e20-8ba1-4554f39da697');
    expect(headers['x-stainless-arch']).toBe('arm64');
    expect(headers['x-stainless-lang']).toBe('js');
    expect(headers['x-stainless-os']).toBe('MacOS');
    expect(headers['x-stainless-package-version']).toBe('0.94.0');
    expect(headers['x-stainless-runtime']).toBe('node');
    expect(headers['x-stainless-runtime-version']).toBe('v24.3.0');

    // Check that required headers are still set
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['x-api-key']).toBe('sk-test-key');
    expect(headers['Accept']).toBe('text/event-stream');
  });

  it('should forward passthroughHeaders for OpenAI providers', () => {
    const passthroughHeaders = {
      'x-stainless-arch': 'arm64',
      'x-custom-header': 'value',
    };

    const headers = buildHeaders(
      'openai',
      'sk-test-key',
      false,
      undefined,
      undefined,
      passthroughHeaders
    );

    // All passthrough headers should be forwarded
    expect(headers['x-stainless-arch']).toBe('arm64');
    expect(headers['x-custom-header']).toBe('value');

    // Check that required headers are still set
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Authorization']).toBe('Bearer sk-test-key');
  });

  it('should allow client anthropic-version to override default', () => {
    const passthroughHeaders = {
      'anthropic-version': '2024-01-01',
    };

    const headers = buildHeaders(
      'anthropic',
      'sk-test-key',
      false,
      undefined,
      undefined,
      passthroughHeaders
    );

    // Client version should override our default
    expect(headers['anthropic-version']).toBe('2024-01-01');
  });

  it('should work without passthroughHeaders', () => {
    const headers = buildHeaders(
      'anthropic',
      'sk-test-key',
      false
    );

    // Should still have required headers
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['x-api-key']).toBe('sk-test-key');
    expect(headers['anthropic-version']).toBe('2023-06-01');
  });
});
