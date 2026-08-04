import { TestModel, TestQuestion, TestOption } from '../types';

/**
 * Парсер тестів з .txt файлів згідно з п. 2.8 ТЗ:
 * Рядок "N.Текст питання", далі варіанти з префіксами:
 * (!) - правильна відповідь
 * (?) - неправильна відповідь
 */
export function parseTestTxt(rawText: string, filename: string = 'test.txt'): TestModel {
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

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) continue;

    // Перевіряємо чи рядок є початком нового питання: "1. Текст", "1) Текст" або просто цифра з крапкою
    const questionMatch = line.match(/^(\d+)[\.\)]\s*(.+)/);
    
    if (questionMatch) {
      // Зберігаємо попереднє питання перед початком нового
      if (currentQuestion) {
        finalizeQuestion(currentQuestion, questions);
      }

      questionCounter++;
      const qNum = parseInt(questionMatch[1], 10);
      const qText = questionMatch[2].trim();

      currentQuestion = {
        id: qNum || questionCounter,
        questionText: qText,
        options: [],
        warnings: [],
      };
      continue;
    }

    // Перевіряємо варіанти відповідей: (!) або (?)
    const isCorrectOption = line.startsWith('(!)');
    const isIncorrectOption = line.startsWith('(?)');

    if (isCorrectOption || isIncorrectOption) {
      if (!currentQuestion) {
        // Запитання не було оголошено явно, створюємо безназваний контейнер
        questionCounter++;
        currentQuestion = {
          id: questionCounter,
          questionText: `Питання #${questionCounter}`,
          options: [],
          warnings: ['Питання створено без явно виділеного заголовка'],
        };
      }

      const optionText = line.substring(3).trim();
      const option: TestOption = {
        id: `q${currentQuestion.id}_opt${(currentQuestion.options?.length || 0) + 1}`,
        text: optionText,
        isCorrect: isCorrectOption,
      };

      currentQuestion.options = currentQuestion.options || [];
      currentQuestion.options.push(option);
      continue;
    }

    // Якщо це звичайний рядок і ми всередині питання — додаємо його до тексту питання
    if (currentQuestion && (!currentQuestion.options || currentQuestion.options.length === 0)) {
      currentQuestion.questionText += ` ${line}`;
    }
  }

  // Завершуємо останнє питання
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

  // 2.8.4 Валідація тесту: кожне питання має мати щонайменше 1 правильну і 1 неправильну відповідь
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
