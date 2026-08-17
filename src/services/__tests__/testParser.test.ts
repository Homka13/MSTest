import { describe, it, expect } from 'vitest';
import { parseTestTxt } from '../testParser';

describe('testParser (2.8)', () => {
  it('correctly handles BOM and parses valid test questions', () => {
    const rawTxt = '\uFEFF1. Яка основна функція сироватки?\n(!) Зволоження\n(?) Очищення\n(?) Макіяж';
    const result = parseTestTxt(rawTxt, 'serum_test.txt');

    expect(result.hasBOM).toBe(true);
    expect(result.totalQuestions).toBe(1);
    expect(result.questions[0].questionText).toBe('Яка основна функція сироватки?');
    expect(result.questions[0].options.length).toBe(3);
    expect(result.questions[0].options[0].isCorrect).toBe(true);
    expect(result.questions[0].isValid).toBe(true);
  });

  it('filters out Word service lines like "Начало формы"', () => {
    const rawTxt = 'Начало формы\n1. Питання номер один\n(!) Правильно\n(?) Неправильно\nКонец формы';
    const result = parseTestTxt(rawTxt, 'word_test.txt');

    expect(result.totalQuestions).toBe(1);
    expect(result.questions[0].questionText).toBe('Питання номер один');
  });

  it('warns about numbering gaps in test questions', () => {
    const rawTxt = '1. Перше питання\n(!) А\n(?) Б\n3. Третє питання\n(!) В\n(?) Г';
    const result = parseTestTxt(rawTxt, 'gap_test.txt');

    expect(result.totalQuestions).toBe(2);
    expect(result.questions[1].warnings.some(w => w.includes('Пропущено нумерацію'))).toBe(true);
  });

  it('warns if question has no correct options', () => {
    const rawTxt = '1. Питання без правильної відповіді\n(?) Неправильно 1\n(?) Неправильно 2';
    const result = parseTestTxt(rawTxt, 'invalid_test.txt');

    expect(result.questions[0].isValid).toBe(false);
    expect(result.questions[0].warnings.some(w => w.includes('Не знайдено жодної правильної відповіді'))).toBe(true);
  });
});
