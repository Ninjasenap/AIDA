import { describe, expect, test } from 'bun:test';
import { mapReplacer, serializeWithMaps } from '../json-serialization';

/**************************************************************************
 * json-serialization - JSON utilities for CLI output
 *
 * TESTS:
 * - mapReplacer: Konverterar Map till plain object
 * - mapReplacer: Bevarar icke-Map-värden oförändrade
 * - mapReplacer: Hanterar tomma Maps
 * - mapReplacer: Hanterar Maps med flera entries
 * - serializeWithMaps: Producerar formaterad JSON
 * - serializeWithMaps: Hanterar Map i objekt
 * - serializeWithMaps: Hanterar nästlade Maps
 *
 * VALIDATES:
 * - Map-nycklar och värden bevaras korrekt
 * - String/number/boolean/array/object passerar genom
 * - null hanteras korrekt
 * - Formatering med 2-space indentation
 *
 * NOT TESTED:
 * - WeakMap, Set, WeakSet (ej använda i projektet)
 * - Circular references (hanteras av JSON.stringify)
 * - undefined values (JSON.stringify tar bort dessa automatiskt)
 **************************************************************************/

describe('mapReplacer', () => {
  /**
   * Test: Konverterar enkel Map till plain object
   * Input: Map med en key-value-par
   * Förväntat: Object med samma key-value-par
   */
  test('should convert simple Map to plain object', () => {
    const input = new Map([['a', 1]]);
    const result = mapReplacer('', input);
    expect(result).toEqual({ a: 1 });
  });

  /**
   * Test: Bevarar string-värden oförändrade
   * Input: String "hello"
   * Förväntat: Samma string
   */
  test('should pass through string values unchanged', () => {
    const input = 'hello';
    const result = mapReplacer('', input);
    expect(result).toBe('hello');
  });

  /**
   * Test: Bevarar number-värden oförändrade
   * Input: Number 42
   * Förväntat: Samma number
   */
  test('should pass through number values unchanged', () => {
    const input = 42;
    const result = mapReplacer('', input);
    expect(result).toBe(42);
  });

  /**
   * Test: Bevarar boolean-värden oförändrade
   * Input: Boolean true
   * Förväntat: Samma boolean
   */
  test('should pass through boolean values unchanged', () => {
    const input = true;
    const result = mapReplacer('', input);
    expect(result).toBe(true);
  });

  /**
   * Test: Bevarar null-värden oförändrade
   * Input: null
   * Förväntat: null
   */
  test('should pass through null values unchanged', () => {
    const input = null;
    const result = mapReplacer('', input);
    expect(result).toBe(null);
  });

  /**
   * Test: Bevarar array-värden oförändrade
   * Input: Array [1, 2, 3]
   * Förväntat: Samma array
   */
  test('should pass through array values unchanged', () => {
    const input = [1, 2, 3];
    const result = mapReplacer('', input);
    expect(result).toEqual([1, 2, 3]);
  });

  /**
   * Test: Bevarar object-värden oförändrade
   * Input: Object {a: 1}
   * Förväntat: Samma object
   */
  test('should pass through plain object values unchanged', () => {
    const input = { a: 1 };
    const result = mapReplacer('', input);
    expect(result).toEqual({ a: 1 });
  });

  /**
   * Test: Hanterar tom Map
   * Input: Tom Map
   * Förväntat: Tomt object {}
   */
  test('should handle empty Map', () => {
    const input = new Map();
    const result = mapReplacer('', input);
    expect(result).toEqual({});
  });

  /**
   * Test: Hanterar Map med flera entries
   * Input: Map med flera task-statuses
   * Förväntat: Object med alla entries bevarade
   */
  test('should handle Map with multiple entries', () => {
    const input = new Map([
      ['ready', []],
      ['done', []],
      ['captured', []],
    ]);
    const result = mapReplacer('', input);
    expect(result).toEqual({
      ready: [],
      done: [],
      captured: [],
    });
  });
});

describe('serializeWithMaps', () => {
  /**
   * Test: Producerar formaterad JSON med 2-space indentation
   * Input: Enkel object
   * Förväntat: JSON-sträng med 2-space indentation
   */
  test('should produce formatted JSON with 2-space indentation', () => {
    const input = { a: 1, b: 2 };
    const result = serializeWithMaps(input);
    const expected = JSON.stringify(input, null, 2);
    expect(result).toBe(expected);
  });

  /**
   * Test: Hanterar Map inuti object
   * Input: Object med Map som property
   * Förväntat: JSON där Map är konverterad till object
   */
  test('should handle Map inside object', () => {
    const input = {
      tasks: new Map([
        ['ready', [{ id: 1, title: 'Task 1' }]],
        ['done', [{ id: 2, title: 'Task 2' }]],
      ]),
    };
    const result = serializeWithMaps(input);
    const parsed = JSON.parse(result);

    expect(parsed.tasks).toEqual({
      ready: [{ id: 1, title: 'Task 1' }],
      done: [{ id: 2, title: 'Task 2' }],
    });
  });

  /**
   * Test: Hanterar nästlade Maps
   * Input: Map som innehåller en annan Map
   * Förväntat: Båda Maps konverterade till objects
   */
  test('should handle nested Maps', () => {
    const innerMap = new Map([['b', 1]]);
    const outerMap = new Map([['a', innerMap]]);
    const result = serializeWithMaps(outerMap);
    const parsed = JSON.parse(result);

    expect(parsed).toEqual({
      a: { b: 1 },
    });
  });
});
