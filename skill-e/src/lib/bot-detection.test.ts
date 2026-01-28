/**
 * Bot Detection Tests
 * 
 * Tests for anti-bot measure detection functionality.
 * Requirements: FR-10.6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  BotDetector,
  createBotDetector,
  hasAntiBotIndicators,
  getAntiBotTypeFromUrl,
} from './bot-detection';

describe('BotDetector', () => {
  let detector: BotDetector;

  beforeEach(() => {
    detector = createBotDetector();
  });

  describe('Factory and Creation', () => {
    it('should create a bot detector', () => {
      const newDetector = createBotDetector();
      expect(newDetector).toBeInstanceOf(BotDetector);
    });
  });

  describe('Cloudflare Detection', () => {
    it('should detect Cloudflare from URL', async () => {
      const url = 'https://example.com/cdn-cgi/challenge-platform/h/b';
      const result = await detector.detect(url);

      expect(result.detected).toBe(true);
      expect(result.type).toBe('cloudflare');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.warning).toContain('Cloudflare');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should detect Cloudflare from content', async () => {
      const url = 'https://example.com';
      const content = '<html><head><title>Just a moment...</title></head><body><h1>Checking your browser</h1></body></html>';
      const result = await detector.detect(url, content);

      expect(result.detected).toBe(true);
      expect(result.type).toBe('cloudflare');
    });

    it('should suggest image-based automation', async () => {
      const url = 'https://example.com/cdn-cgi/challenge';
      const result = await detector.detect(url);

      expect(result.suggestions).toContain('Use image-based automation instead of DOM selectors');
    });

    it('should recommend image mode', async () => {
      const url = 'https://example.com/cdn-cgi/challenge';
      const result = await detector.detect(url);
      const mode = detector.getRecommendedMode(result);

      expect(mode).toBe('image');
    });
  });

  describe('reCAPTCHA Detection', () => {
    it('should detect reCAPTCHA from URL', async () => {
      const url = 'https://www.google.com/recaptcha/api2/anchor';
      const result = await detector.detect(url);

      expect(result.detected).toBe(true);
      expect(result.type).toBe('recaptcha');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should detect reCAPTCHA from content', async () => {
      const url = 'https://example.com';
      const content = '<html><body><script src="https://www.google.com/recaptcha/api.js"></script></body></html>';
      const result = await detector.detect(url, content);

      expect(result.detected).toBe(true);
      expect(result.type).toBe('recaptcha');
    });

    it('should suggest manual verification', async () => {
      const url = 'https://www.google.com/recaptcha/api2/anchor';
      const result = await detector.detect(url);

      expect(result.suggestions).toContain('Pause execution and solve the CAPTCHA manually');
    });
  });

  describe('hCaptcha Detection', () => {
    it('should detect hCaptcha from URL', async () => {
      const url = 'https://hcaptcha.com/captcha/v1/abc123';
      const result = await detector.detect(url);

      expect(result.detected).toBe(true);
      expect(result.type).toBe('hcaptcha');
    });

    it('should detect hCaptcha from content', async () => {
      const url = 'https://example.com';
      const content = '<html><body><script src="https://hcaptcha.com/1/api.js"></script></body></html>';
      const result = await detector.detect(url, content);

      expect(result.detected).toBe(true);
      expect(result.type).toBe('hcaptcha');
    });
  });

  describe('Other Anti-Bot Systems', () => {
    it('should detect Turnstile', async () => {
      const url = 'https://example.com';
      const content = '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js"></script>';
      const result = await detector.detect(url, content);

      expect(result.detected).toBe(true);
      expect(result.type).toBe('turnstile');
    });

    it('should detect FunCaptcha', async () => {
      const url = 'https://client-api.arkoselabs.com/fc/api/';
      const result = await detector.detect(url);

      expect(result.detected).toBe(true);
      expect(result.type).toBe('funcaptcha');
    });

    it('should detect generic challenges', async () => {
      const url = 'https://example.com';
      const content = '<html><body><h1>Verify you are human</h1><p>Suspicious activity detected</p></body></html>';
      const result = await detector.detect(url, content);

      expect(result.detected).toBe(true);
      expect(result.type).toBe('generic-challenge');
    });

    it('should detect rate limiting', async () => {
      const url = 'https://example.com';
      const content = '<html><body><h1>Too many requests</h1></body></html>';
      const result = await detector.detect(url, content);

      expect(result.detected).toBe(true);
      expect(result.type).toBe('rate-limit');
    });
  });

  describe('Detection Options', () => {
    it('should respect minConfidence threshold', async () => {
      const url = 'https://example.com';
      const content = '<p>verify</p>';
      
      const result = await detector.detect(url, content, { minConfidence: 0.9 });

      expect(result.detected).toBe(false);
    });

    it('should allow disabling content checks', async () => {
      const url = 'https://example.com';
      const content = '<script src="https://www.google.com/recaptcha/api.js"></script>';
      
      const result = await detector.detect(url, content, { checkContent: false });

      expect(result.detected).toBe(false);
    });

    it('should allow disabling URL checks', async () => {
      const url = 'https://www.google.com/recaptcha/api2/anchor';
      
      const result = await detector.detect(url, undefined, { checkUrl: false });

      expect(result.detected).toBe(false);
    });
  });

  describe('No Detection', () => {
    it('should not detect on clean pages', async () => {
      const url = 'https://example.com/normal-page';
      const result = await detector.detect(url);

      expect(result.detected).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('should recommend hybrid mode for clean pages', async () => {
      const url = 'https://example.com';
      const result = await detector.detect(url);
      const mode = detector.getRecommendedMode(result);

      expect(mode).toBe('hybrid');
    });
  });

  describe('isPresent Method', () => {
    it('should check for specific anti-bot type', async () => {
      const url = 'https://www.google.com/recaptcha/api2/anchor';
      const content = '';

      const isRecaptcha = await detector.isPresent(url, content, 'recaptcha');
      const isCloudflare = await detector.isPresent(url, content, 'cloudflare');

      expect(isRecaptcha).toBe(true);
      expect(isCloudflare).toBe(false);
    });
  });

  describe('Helper Functions', () => {
    it('should detect anti-bot indicators in URL', () => {
      expect(hasAntiBotIndicators('https://example.com/cloudflare')).toBe(true);
      expect(hasAntiBotIndicators('https://example.com/captcha')).toBe(true);
      expect(hasAntiBotIndicators('https://example.com/challenge')).toBe(true);
      expect(hasAntiBotIndicators('https://example.com/normal-page')).toBe(false);
    });

    it('should identify anti-bot type from URL', () => {
      expect(getAntiBotTypeFromUrl('https://example.com/cdn-cgi/challenge')).toBe('cloudflare');
      expect(getAntiBotTypeFromUrl('https://www.google.com/recaptcha/api')).toBe('recaptcha');
      expect(getAntiBotTypeFromUrl('https://hcaptcha.com/captcha')).toBe('hcaptcha');
      expect(getAntiBotTypeFromUrl('https://challenges.cloudflare.com/turnstile')).toBe('turnstile');
      expect(getAntiBotTypeFromUrl('https://client-api.arkoselabs.com/fc')).toBe('funcaptcha');
      expect(getAntiBotTypeFromUrl('https://example.com/normal-page')).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', async () => {
      const url = 'https://example.com';
      const result = await detector.detect(url, '');

      expect(result.detected).toBe(false);
    });

    it('should handle malformed HTML', async () => {
      const url = 'https://example.com';
      const content = '<html><body><p>Incomplete';
      
      const result = await detector.detect(url, content);

      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });
  });
});
