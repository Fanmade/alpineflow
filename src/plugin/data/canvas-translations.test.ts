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

it('pluralises announcements with the configured canvas locale', () => {
  const canvas = realCanvas({
    locale: 'fr',
    translations: {
      'announce.connectionsRemoved_one': ':count connexion supprimée',
      'announce.connectionsRemoved_other': ':count connexions supprimées',
    },
  });
  canvas._container = document.createElement('div');
  canvas._initAnnouncer();
  canvas._announcer.handleEvent('edges-change', { type: 'remove', edges: [] });

  expect(canvas._container.querySelector('[role="status"]')?.textContent).toBe('0 connexion supprimée');

  canvas._announcer.destroy();
});
