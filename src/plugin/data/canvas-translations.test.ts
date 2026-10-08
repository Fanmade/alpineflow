// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { realCanvas } from './__real-canvas-harness';
import de from '../../../locales/de.json';

it('passes canvas translations to controls, loading and announcements', () => {
  const canvas = realCanvas({ controls: true, translations: de });
  canvas._container = document.createElement('div');
  canvas.$watch = () => {};
  canvas._initControls();
  canvas._initAnnouncer();
  canvas._announcer.handleEvent('fit-view', {});

  expect(canvas._loadingText).toBe('Wird geladen…');
  expect(canvas._container.querySelector('[title="Vergrößern"]')).not.toBeNull();
  expect(canvas._container.querySelector('[role="status"]')?.textContent).toBe('Ansicht an Inhalt angepasst');
  expect(realCanvas({ translations: de, loadingText: 'Custom loading' })._loadingText).toBe('Custom loading');
  expect(realCanvas()._loadingText).toBe('Loading…');

  canvas._controls.destroy();
  canvas._announcer.destroy();
});
