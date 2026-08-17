import { TestModel, TestQuestion, TestOption, TestParserConfig } from '../types';

export const DEFAULT_TEST_PARSER_CONFIG: TestParserConfig = {
  correctMarker: '(!)',
  incorrectMarker: '(?)',
  questionRegex: /^(\d+)[\.\)]\s*(.+)/,
  ignoredLines: [
    'начало формы',
    'початок форми',
    'конец формы',
    'кінець форми',
    'раздел',
    'розділ',
    'page break',
    '---',
  ],
};

/**
 * 2.8 Парсер тестів з .txt файлів з конфігурацією та розширеною валідацією (2.8.4, 2.8.5)
 */
export function parseTestTxt(
  rawText: string,
  filename: string = 'test.txt',
  config: TestParserConfig = DEFAULT_TEST_PARSER_CONFIG
): TestModel {
  let text = rawText;
  let hasBOM = false;

  // 2.8.3 Обробка BOM (Byte Order Mark) на початку файлу
  if (text.charCodeAt(0) === 0xFEFF || text.startsWith('\uFEFF')) {
    hasBOM = true;
    text = text.substring(1);
  }

  const lines = text.split(/\r?\n/);
  const questions: TestQuestion[] = [];
  const globalWarnings: string[] = [];

  let currentQuestion: Partial<TestQuestion> | null = null;
  let questionCounter = 0;
  let lastDeclaredQuestionNum = 0;

  const questionRegex = config.questionRegex || DEFAULT_TEST_PARSER_CONFIG.questionRegex!;
  const ignoredLines = config.ignoredLines || DEFAULT_TEST_PARSER_CONFIG.ignoredLines!;
  const correctMarker = config.correctMarker || '(!)';
  const incorrectMarker = config.incorrectMarker || '(?)';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) continue;

    // 2.8.4 Відсіювання службових рядків Word ("Начало формы", "Конец формы" тощо)
    const lineLower = line.toLowerCase();
    if (ignoredLines.some(ignored => lineLower.includes(ignored.toLowerCase()))) {
      continue;
    }

    // Перевіряємо чи рядок є початком нового питання: "1. Текст", "1) Текст"
    const questionMatch = line.match(questionRegex);

    if (questionMatch) {
      if (currentQuestion) {
        finalizeQuestion(currentQuestion, questions);
      }

      questionCounter++;
      const qNum = parseInt(questionMatch[1], 10);
      const qText = questionMatch[2].trim();

      const questionWarnings: string[] = [];

      // 2.8.4 Перевірка розривів у нумерації питань
      if (lastDeclaredQuestionNum > 0 && qNum > lastDeclaredQuestionNum + 1) {
        questionWarnings.push(`Попередження: Пропущено нумерацію (після #${lastDeclaredQuestionNum} іде #${qNum})`);
      }
      lastDeclaredQuestionNum = qNum;

      currentQuestion = {
        id: qNum || questionCounter,
        questionText: qText,
        options: [],
        warnings: questionWarnings,
      };
      continue;
    }

    // Перевіряємо варіанти відповідей згідно з конфігом
    const isCorrectOption = line.startsWith(correctMarker);
    const isIncorrectOption = line.startsWith(incorrectMarker);

    if (isCorrectOption || isIncorrectOption) {
      if (!currentQuestion) {
        questionCounter++;
        currentQuestion = {
          id: questionCounter,
          questionText: `Питання #${questionCounter}`,
          options: [],
          warnings: ['Питання створено без явно виділеного заголовка'],
        };
      }

      const markerLength = isCorrectOption ? correctMarker.length : incorrectMarker.length;
      const optionText = line.substring(markerLength).trim();
      const option: TestOption = {
        id: `q${currentQuestion.id}_opt${(currentQuestion.options?.length || 0) + 1}`,
        text: optionText,
        isCorrect: isCorrectOption,
      };

      currentQuestion.options = currentQuestion.options || [];
      currentQuestion.options.push(option);
      continue;
    }

    // Звичайний рядок — приклеюємо до тексту питання
    if (currentQuestion && (!currentQuestion.options || currentQuestion.options.length === 0)) {
      currentQuestion.questionText += ` ${line}`;
    }
  }

  if (currentQuestion) {
    finalizeQuestion(currentQuestion, questions);
  }

  if (questions.length === 0) {
    globalWarnings.push('Файл не містить жодного розпізнаного питання в форматі N. Питання / (!) / (?)');
  }

  const title = filename.replace(/\.txt$/i, '');

  return {
    title,
    totalQuestions: questions.length,
    questions,
    warnings: globalWarnings,
    hasBOM,
  };
}

function finalizeQuestion(q: Partial<TestQuestion>, questions: TestQuestion[]) {
  const options = q.options || [];
  const correctCount = options.filter(o => o.isCorrect).length;
  const incorrectCount = options.filter(o => !o.isCorrect).length;
  const warnings: string[] = q.warnings || [];

  if (correctCount === 0) {
    warnings.push('Попередження: Не знайдено жодної правильної відповіді (!)');
  }
  if (incorrectCount === 0) {
    warnings.push('Попередження: Не знайдено жодної неправильної відповіді (?)');
  }

  const isValid = correctCount > 0 && incorrectCount > 0;
  const hasMultipleCorrect = correctCount > 1;

  questions.push({
    id: q.id || questions.length + 1,
    questionText: q.questionText || '',
    options,
    hasMultipleCorrect,
    isValid,
    warnings,
  });
}
