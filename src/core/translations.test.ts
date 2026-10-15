// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { translate } from './translations';
import en from '../../locales/en.json';
import de from '../../locales/de.json';
import { createControlsPanel } from './controls-panel';
import { defaultFormatAnnouncement, FlowAnnouncer } from './announcer';

const polish = {
  'announce.nodesSelected_one': ':count węzeł',
  'announce.nodesSelected_few': ':count węzły',
  'announce.nodesSelected_many': ':count węzłów',
  'announce.nodesSelected_other': ':count węzła',
};

describe('translations', () => {
  afterEach(() => {
    document.documentElement.lang = '';
  });

  it('falls back per dotted key and substitutes values literally in one pass', () => {
    expect(translate({ 'controls.zoomIn': 'Closer' }, 'controls.zoomOut')).toBe('Zoom out');
    expect(translate({ 'a11y.nodeLabel': ':label / :label' }, 'a11y.nodeLabel', { label: '$& :id <b>' }))
      .toBe('$& :id <b> / $& :id <b>');
    expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort());
  });

  it('groups every key by UI area and ends plural keys with a CLDR category', () => {
    const areas = ['controls.', 'canvas.', 'a11y.', 'announce.', 'workflow.', 'schema.inspector.'];
    const categories = ['zero', 'one', 'two', 'few', 'many', 'other'];
    for (const key of Object.keys(en)) {
      expect(areas.some((area) => key.startsWith(area)), key).toBe(true);
      const suffix = key.split('_')[1];
      if (suffix !== undefined) expect(categories, key).toContain(suffix);
    }
  });

  it('selects the English plural form from count', () => {
    expect(translate(undefined, 'announce.connectionsRemoved', { count: 1 })).toBe('Removed 1 connection');
    expect(translate(undefined, 'announce.connectionsRemoved', { count: 2 })).toBe('Removed 2 connections');
    expect(translate(undefined, 'announce.connectionsRemoved', { count: 0 })).toBe('Removed 0 connections');
  });

  it('picks plural categories with Intl.PluralRules for the given locale', () => {
    const french = { 'announce.nodesSelected_one': ':count nœud', 'announce.nodesSelected_other': ':count nœuds' };
    expect(translate(french, 'announce.nodesSelected', { count: 0 }, 'fr')).toBe('0 nœud');
    expect(translate(french, 'announce.nodesSelected', { count: 2 }, 'fr')).toBe('2 nœuds');
    expect(translate(polish, 'announce.nodesSelected', { count: 2 }, 'pl')).toBe('2 węzły');
    expect(translate(polish, 'announce.nodesSelected', { count: 5 }, 'pl')).toBe('5 węzłów');
    expect(translate(polish, 'announce.nodesSelected', { count: 22 }, 'pl')).toBe('22 węzły');
  });

  it('falls back to the _other form when a locale omits a category', () => {
    const { 'announce.nodesSelected_many': _many, ...withoutMany } = polish;
    expect(translate(withoutMany, 'announce.nodesSelected', { count: 5 }, 'pl')).toBe('5 węzła');
  });

  it('applies English plural rules when falling back to English messages', () => {
    expect(translate({}, 'announce.connectionsRemoved', { count: 0 }, 'fr')).toBe('Removed 0 connections');
  });

  it('normalises Laravel-style locales and ignores invalid tags', () => {
    const portuguese = { 'announce.nodesSelected_one': ':count nó', 'announce.nodesSelected_other': ':count nós' };
    expect(translate(portuguese, 'announce.nodesSelected', { count: 0 }, 'pt_BR')).toBe('0 nó');
    expect(translate(portuguese, 'announce.nodesSelected', { count: 0 }, 'not a locale!')).toBe('0 nós');
    expect(translate(portuguese, 'announce.nodesSelected', { count: 1 }, '')).toBe('1 nó');
  });

  it('defaults the locale to the document language', () => {
    const french = { 'announce.nodesSelected_one': ':count nœud', 'announce.nodesSelected_other': ':count nœuds' };
    document.documentElement.lang = 'fr';
    expect(translate(french, 'announce.nodesSelected', { count: 0 })).toBe('0 nœud');
    document.documentElement.lang = 'en';
    expect(translate(french, 'announce.nodesSelected', { count: 0 })).toBe('0 nœuds');
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
    const second = createControlsPanel(german, { ...options, translations: { ...de, 'controls.zoomIn': '<b>Vergrößern</b>' } });
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
    expect(defaultFormatAnnouncement('edges-change', { type: 'remove', edges: [{ id: 'e' }] }, de)).toBe('1 Verbindung entfernt');
  });

  it('announces a single removed connection without endpoints in the singular', () => {
    expect(defaultFormatAnnouncement('edges-change', { type: 'remove', edges: [{ id: 'e' }] })).toBe('Removed 1 connection');
  });

  it('pluralises announcements with the locale of the canvas', () => {
    const french = { 'announce.nodesSelected_one': ':count nœud', 'announce.nodesSelected_other': ':count nœuds' };
    expect(defaultFormatAnnouncement('selection-change', { nodes: [] , edges: ['e'] }, {}, 'fr')).toBe('1 edge selected');
    expect(defaultFormatAnnouncement('nodes-change', { type: 'remove', nodes: [] }, french, 'fr')).toBe('Removed 0 nodes');
    expect(defaultFormatAnnouncement('selection-change', { nodes: ['a', 'b'] }, french, 'fr')).toBe('2 nœuds selected');
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
