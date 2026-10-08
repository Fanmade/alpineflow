// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { translate } from './translations';
import en from '../../locales/en.json';
import de from '../../locales/de.json';
import { createControlsPanel } from './controls-panel';
import { defaultFormatAnnouncement, FlowAnnouncer } from './announcer';

describe('translations', () => {
  it('falls back per key and substitutes values literally in one pass', () => {
    expect(translate({ zoomIn: 'Closer' }, 'zoomOut')).toBe('Zoom out');
    expect(translate({ nodeLabel: ':label / :label' }, 'nodeLabel', { label: '$& :id <b>' }))
      .toBe('$& :id <b> / $& :id <b>');
    expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort());
  });

  it('keeps controls isolated and translates state changes without inserting markup', () => {
    const english = document.createElement('div');
    const german = document.createElement('div');
    const options = {
      position: 'bottom-left' as const, orientation: 'vertical' as const,
      showZoom: true, showFitView: true, showInteractive: true, showResetPanels: true,
      onZoomIn() {}, onZoomOut() {}, onFitView() {}, onToggleInteractive() {},
      onResetPanels() {}, onToggleFullscreen() {},
    };
    const first = createControlsPanel(english, options);
    const second = createControlsPanel(german, { ...options, translations: { ...de, zoomIn: '<b>Vergrößern</b>' } });
    expect(english.querySelector('[title="Zoom in"]')).not.toBeNull();
    expect(german.querySelector('[title="<b>Vergrößern</b>"]')).not.toBeNull();
    expect(german.querySelector('b')).toBeNull();
    second.update({ isInteractive: true, isFullscreen: true });
    expect(german.querySelector('[aria-label="Interaktion sperren"]')).not.toBeNull();
    expect(german.querySelector('[aria-label="Vollbild verlassen"]')).not.toBeNull();
    second.update({ isInteractive: false, isFullscreen: false });
    expect(german.querySelector('[aria-label="Interaktion entsperren"]')).not.toBeNull();
    expect(german.querySelector('[aria-label="Vollbild öffnen"]')).not.toBeNull();
    first.destroy();
    second.destroy();
  });

  it('translates announcements including singular and plural selections', () => {
    expect(defaultFormatAnnouncement('nodes-change', { type: 'add', nodes: [{ id: 'a' }] }, de)).toBe('Knoten hinzugefügt: a');
    expect(defaultFormatAnnouncement('selection-change', { nodes: ['a'], edges: ['e', 'f'] }, de)).toBe('1 Knoten und 2 Verbindungen ausgewählt');
    expect(defaultFormatAnnouncement('selection-change', { edges: ['e'] }, de)).toBe('1 Verbindung ausgewählt');
    expect(defaultFormatAnnouncement('selection-change', {}, de)).toBe('Auswahl aufgehoben');
  });

  it('preserves custom announcement formatters', () => {
    const container = document.createElement('div');
    const announcer = new FlowAnnouncer(container, () => '<b>Custom</b>', de);
    announcer.handleEvent('fit-view', {});
    expect(container.textContent).toBe('<b>Custom</b>');
    expect(container.querySelector('b')).toBeNull();
    announcer.destroy();
  });
});
