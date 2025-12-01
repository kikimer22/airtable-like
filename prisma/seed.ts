import 'dotenv/config';
// import { PrismaClient } from '@/lib/generated/prisma/client';
import prisma from '@/lib/prisma';
import { faker } from '@faker-js/faker';

// const prisma = new PrismaClient();

// ============================================================================
// ТИПИ
// ============================================================================

type BooleanStrategy = 'true_probability' | 'balanced';
type VarcharStrategy = 'name' | 'email' | 'slug' | 'word' | 'sentence' | 'mixed';
type TextStrategy = 'sentence' | 'paragraph' | 'mixed';
type LocaleType = 'uk_UA' | 'en_US' | 'de_DE' | 'fr_FR' | 'es_ES' | 'it_IT';

interface SeedConfig {
  // Кількість записів
  recordCount: number;

  // Конфігурація Boolean колон
  booleanConfig: {
    trueProbability: number; // 0-1, ймовірність true
  };

  // Конфігурація Numeric колон
  numericConfig: {
    min: number;
    max: number;
  };

  // Конфігурація String колон
  stringConfig: {
    locale: LocaleType;
    varcharStrategy: VarcharStrategy;
    textStrategy: TextStrategy;
    nullProbability: number; // 0-1, ймовірність null
  };

  // Батч для оптимізації вставки
  batchSize: number;

  // Логування
  verbose: boolean;
}

interface DataTableRecord {
  col_b_01: boolean;
  col_b_02: boolean;
  col_b_03: boolean;
  col_b_04: boolean;
  col_b_05: boolean;
  col_b_06: boolean;
  col_b_07: boolean;
  col_b_08: boolean;
  col_b_09: boolean;
  col_b_10: boolean;
  col_b_11: boolean;
  col_n_01: number;
  col_n_02: number;
  col_n_03: number;
  col_n_04: number;
  col_n_05: number;
  col_n_06: number;
  col_n_07: number;
  col_n_08: number;
  col_n_09: number;
  col_n_10: number;
  col_n_11: number;
  col_s_01: string | null;
  col_s_02: string | null;
  col_s_03: string | null;
  col_s_04: string | null;
  col_s_05: string | null;
  col_s_06: string | null;
  col_s_07: string | null;
  col_s_08: string | null;
  col_s_09: string | null;
  col_s_10: string | null;
  col_s_11: string | null;
}

// ============================================================================
// КОНФІГУРАЦІЯ ПО ЗАМОВЧУВАННЮ
// ============================================================================

const DEFAULT_CONFIG: SeedConfig = {
  recordCount: 1001,

  booleanConfig: {
    trueProbability: 0.5,
  },

  numericConfig: {
    min: 1,
    max: 10000,
  },

  stringConfig: {
    locale: 'uk_UA',
    varcharStrategy: 'mixed',
    textStrategy: 'paragraph',
    nullProbability: 0.1,
  },

  batchSize: 100,

  verbose: true,
};

// ============================================================================
// LOCALE MAPPER
// ============================================================================

const LOCALE_MAP: Record<LocaleType, string> = {
  uk_UA: 'uk',
  en_US: 'en_US',
  de_DE: 'de',
  fr_FR: 'fr',
  es_ES: 'es',
  it_IT: 'it',
};

// ============================================================================
// ГЕНЕРАТОР ДАНИХ
// ============================================================================

class DataGenerator {
  private config: SeedConfig;
  private localeCode: string;

  constructor(config: SeedConfig) {
    this.config = config;
    this.localeCode = LOCALE_MAP[config.stringConfig.locale];
    // faker.setDefaultLocale(this.localeCode);
  }

  /**
   * Генерує boolean значення
   */
  private generateBoolean(): boolean {
    return faker.datatype.boolean({ probability: this.config.booleanConfig.trueProbability });
  }

  /**
   * Генерує числове значення
   */
  private generateNumber(): number {
    return faker.number.int({
      min: this.config.numericConfig.min,
      max: this.config.numericConfig.max,
    });
  }

  /**
   * Перевіряє чи має бути null
   */
  private shouldBeNull(): boolean {
    return Math.random() < this.config.stringConfig.nullProbability;
  }

  /**
   * Генерує varchar строку (255 символів)
   */
  private generateVarchar(): string | null {
    if (this.shouldBeNull()) {
      return null;
    }

    const { varcharStrategy } = this.config.stringConfig;
    let result: string;

    if (varcharStrategy === 'mixed') {
      const strategies: VarcharStrategy[] = ['name', 'email', 'slug', 'word', 'sentence'];
      const randomStrategy = faker.helpers.arrayElement(strategies);
      result = this.generateVarcharByStrategy(randomStrategy);
    } else {
      result = this.generateVarcharByStrategy(varcharStrategy);
    }

    return result.slice(0, 255);
  }

  /**
   * Генерує varchar за стратегією
   */
  private generateVarcharByStrategy(strategy: VarcharStrategy): string {
    switch (strategy) {
      case 'name': {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        return `${firstName} ${lastName}`;
      }
      case 'email': {
        return faker.internet.email();
      }
      case 'slug': {
        return faker.helpers.slugify(faker.person.fullName()).toLowerCase();
      }
      case 'word': {
        const wordCount = faker.number.int({ min: 1, max: 3 });
        return faker.word.words(wordCount);
      }
      case 'sentence': {
        return faker.lorem.sentence();
      }
      case 'mixed': {
        return faker.lorem.word();
      }
      default: {
        const exhaustive: never = strategy;
        throw new Error(`Unknown strategy: ${exhaustive}`);
      }
    }
  }

  /**
   * Генерує text строку (без ліміту)
   */
  private generateText(): string | null {
    if (this.shouldBeNull()) {
      return null;
    }

    const { textStrategy } = this.config.stringConfig;

    if (textStrategy === 'mixed') {
      const strategies: TextStrategy[] = ['sentence', 'paragraph'];
      const randomStrategy = faker.helpers.arrayElement(strategies);
      return this.generateTextByStrategy(randomStrategy);
    }

    return this.generateTextByStrategy(textStrategy);
  }

  /**
   * Генерує text за стратегією
   */
  private generateTextByStrategy(strategy: TextStrategy): string {
    switch (strategy) {
      case 'sentence': {
        return faker.lorem.sentence();
      }
      case 'paragraph': {
        return faker.lorem.paragraphs({ min: 1, max: 3 });
      }
      case 'mixed': {
        const choice = faker.helpers.arrayElement([
          faker.lorem.sentence(),
          faker.lorem.paragraphs({ min: 1, max: 2 }),
        ]);
        return choice;
      }
      default: {
        const exhaustive: never = strategy;
        throw new Error(`Unknown strategy: ${exhaustive}`);
      }
    }
  }

  /**
   * Генерує повний запис
   */
  public generateRecord(): DataTableRecord {
    return {
      // Boolean columns
      col_b_01: this.generateBoolean(),
      col_b_02: this.generateBoolean(),
      col_b_03: this.generateBoolean(),
      col_b_04: this.generateBoolean(),
      col_b_05: this.generateBoolean(),
      col_b_06: this.generateBoolean(),
      col_b_07: this.generateBoolean(),
      col_b_08: this.generateBoolean(),
      col_b_09: this.generateBoolean(),
      col_b_10: this.generateBoolean(),
      col_b_11: this.generateBoolean(),

      // Numeric columns
      col_n_01: this.generateNumber(),
      col_n_02: this.generateNumber(),
      col_n_03: this.generateNumber(),
      col_n_04: this.generateNumber(),
      col_n_05: this.generateNumber(),
      col_n_06: this.generateNumber(),
      col_n_07: this.generateNumber(),
      col_n_08: this.generateNumber(),
      col_n_09: this.generateNumber(),
      col_n_10: this.generateNumber(),
      col_n_11: this.generateNumber(),

      // String columns (varchar)
      col_s_01: this.generateVarchar(),
      col_s_02: this.generateVarchar(),
      col_s_03: this.generateVarchar(),
      col_s_04: this.generateVarchar(),
      col_s_06: this.generateVarchar(),
      col_s_08: this.generateVarchar(),
      col_s_09: this.generateVarchar(),
      col_s_10: this.generateVarchar(),

      // String columns (text)
      col_s_05: this.generateText(),
      col_s_07: this.generateText(),
      col_s_11: this.generateText(),
    };
  }
}

// ============================================================================
// ПАРСИНГ АРГУМЕНТІВ
// ============================================================================

function parseArgs(): SeedConfig {
  const args = process.argv.slice(2);
  const config: SeedConfig = { ...DEFAULT_CONFIG };

  for (const arg of args) {
    const [key, value] = arg.split('=');

    if (!value) continue;

    switch (key) {
      case '--count': {
        const count = parseInt(value, 10);
        if (!Number.isNaN(count) && count > 0) {
          config.recordCount = count;
        }
        break;
      }
      case '--batch-size': {
        const size = parseInt(value, 10);
        if (!Number.isNaN(size) && size > 0) {
          config.batchSize = size;
        }
        break;
      }
      case '--bool-probability': {
        const prob = parseFloat(value);
        if (!Number.isNaN(prob) && prob >= 0 && prob <= 1) {
          config.booleanConfig.trueProbability = prob;
        }
        break;
      }
      case '--num-min': {
        const min = parseInt(value, 10);
        if (!Number.isNaN(min)) {
          config.numericConfig.min = min;
        }
        break;
      }
      case '--num-max': {
        const max = parseInt(value, 10);
        if (!Number.isNaN(max)) {
          config.numericConfig.max = max;
        }
        break;
      }
      case '--string-strategy': {
        const strategies: VarcharStrategy[] = ['name', 'email', 'slug', 'word', 'sentence', 'mixed'];
        if (strategies.includes(value as VarcharStrategy)) {
          config.stringConfig.varcharStrategy = value as VarcharStrategy;
        }
        break;
      }
      case '--text-strategy': {
        const strategies: TextStrategy[] = ['sentence', 'paragraph', 'mixed'];
        if (strategies.includes(value as TextStrategy)) {
          config.stringConfig.textStrategy = value as TextStrategy;
        }
        break;
      }
      case '--null-probability': {
        const prob = parseFloat(value);
        if (!Number.isNaN(prob) && prob >= 0 && prob <= 1) {
          config.stringConfig.nullProbability = prob;
        }
        break;
      }
      case '--locale': {
        const locales: LocaleType[] = ['uk_UA', 'en_US', 'de_DE', 'fr_FR', 'es_ES', 'it_IT'];
        if (locales.includes(value as LocaleType)) {
          config.stringConfig.locale = value as LocaleType;
        }
        break;
      }
      case '--no-verbose': {
        config.verbose = false;
        break;
      }
    }
  }

  return config;
}

// ============================================================================
// SEED ФУНКЦІЯ
// ============================================================================

async function seed(config: SeedConfig = DEFAULT_CONFIG): Promise<void> {
  try {
    const generator = new DataGenerator(config);

    if (config.verbose) {
      console.log('🌱 Starting DataTable seed...');
      console.log('📊 Configuration:', JSON.stringify(config, null, 2));
    }

    // Очищуємо таблицю
    if (config.verbose) {
      console.log('🗑️  Cleaning existing data...');
    }
    await prisma.dataTable.deleteMany({});

    // Генеруємо записи у батчах
    let recordsCreated = 0;
    const totalBatches = Math.ceil(config.recordCount / config.batchSize);

    for (let batch = 0; batch < totalBatches; batch++) {
      const batchStart = batch * config.batchSize;
      const batchEnd = Math.min(batchStart + config.batchSize, config.recordCount);
      const batchRecords = batchEnd - batchStart;

      // Генеруємо записи для батча
      const records: DataTableRecord[] = Array.from({ length: batchRecords }, () =>
        generator.generateRecord()
      );

      // Вставляємо батч
      await prisma.dataTable.createMany({
        data: records,
        skipDuplicates: false,
      });

      recordsCreated += records.length;

      if (config.verbose) {
        const progress = Math.round((recordsCreated / config.recordCount) * 100);
        console.log(
          `✅ Batch ${batch + 1}/${totalBatches} completed (${progress}%) - ${recordsCreated}/${config.recordCount} records`
        );
      }
    }

    // Статистика
    const count = await prisma.dataTable.count();
    if (config.verbose) {
      console.log('✨ Seed completed successfully!');
      console.log(`📈 Total records in database: ${count.toLocaleString()}`);
    }
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================================
// ЗАПУСК
// ============================================================================

const config = parseArgs();
seed(config);
