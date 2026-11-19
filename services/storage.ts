import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AppThemeMode,
  Bookmark,
  ReaderSettings,
  ReadingHistory,
  ThemeMode,
} from '@/types/library';
import type { ThemeId } from '@/constants/Themes';

const STORAGE_KEYS = {
  APP_THEME: '@pathshala_app_theme',
  THEME: '@pathshala_theme',
  READER_SETTINGS: '@pathshala_reader_settings',
  BOOKMARKS: '@pathshala_bookmarks',
  READING_HISTORY: '@pathshala_reading_history',
};

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  themeId: 'paper-beige',
  fontSize: 19,
  lineHeightMultiplier: 2.0,
  fontFamily: 'serif',
  textAlign: 'left',
  paragraphSpacing: 'normal',
  marginSize: 'normal',
  firstLineIndent: false,
};

const DEFAULT_SETTINGS = DEFAULT_READER_SETTINGS;

let historyCache: Record<string, ReadingHistory> | null = null;
let bookmarksCache: Bookmark[] | null = null;

function isValidAppThemeMode(val: string | null): val is AppThemeMode {
  return val === 'system' || val === 'light' || val === 'dark';
}

function isValidThemeMode(val: string | null): val is ThemeMode {
  return (
    val === 'auto' ||
    val === 'paper-beige' ||
    val === 'antique-book' ||
    val === 'terracotta' ||
    val === 'deep-forest'
  );
}

export const StorageService = {
  async getAppThemeMode(): Promise<AppThemeMode> {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.APP_THEME);
      if (isValidAppThemeMode(saved)) {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'system';
  },

  async saveAppThemeMode(mode: AppThemeMode): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APP_THEME, mode);
    } catch (e) {
      console.error('Error saving app theme mode', e);
    }
  },

  async getThemeMode(): Promise<ThemeMode> {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      if (isValidThemeMode(saved)) {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'paper-beige';
  },

  async saveThemeMode(mode: ThemeMode): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, mode);
    } catch (e) {
      console.error('Error saving theme mode', e);
    }
  },

  async getTheme(): Promise<ThemeId> {
    const mode = await StorageService.getThemeMode();
    return mode === 'auto' ? 'paper-beige' : mode;
  },

  async saveTheme(theme: ThemeId): Promise<void> {
    await StorageService.saveThemeMode(theme);
  },

  async getReaderSettings(): Promise<ReaderSettings> {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.READER_SETTINGS);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  },

  async saveReaderSettings(settings: Partial<ReaderSettings>): Promise<ReaderSettings> {
    try {
      const current = await StorageService.getReaderSettings();
      const updated = { ...current, ...settings };
      await AsyncStorage.setItem(STORAGE_KEYS.READER_SETTINGS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Error saving reader settings', e);
      return DEFAULT_SETTINGS;
    }
  },

  async resetReaderSettings(): Promise<ReaderSettings> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.READER_SETTINGS,
        JSON.stringify(DEFAULT_SETTINGS)
      );
      return DEFAULT_SETTINGS;
    } catch (e) {
      console.error('Error resetting reader settings', e);
      return DEFAULT_SETTINGS;
    }
  },

  async getBookmarks(): Promise<Bookmark[]> {
    if (bookmarksCache) return bookmarksCache;
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          bookmarksCache = parsed;
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    bookmarksCache = [];
    return bookmarksCache;
  },

  async addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Promise<Bookmark[]> {
    try {
      const current = await StorageService.getBookmarks();
      const newBookmark: Bookmark = {
        ...bookmark,
        id: `bm-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      const updated = [newBookmark, ...current];
      bookmarksCache = updated;
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Error adding bookmark', e);
      return [];
    }
  },

  async restoreBookmark(bookmark: Bookmark): Promise<Bookmark[]> {
    try {
      const current = await StorageService.getBookmarks();
      if (current.some((b) => b.id === bookmark.id)) return current;
      const updated = [bookmark, ...current];
      bookmarksCache = updated;
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  async removeBookmark(id: string): Promise<Bookmark[]> {
    try {
      const current = await StorageService.getBookmarks();
      const updated = current.filter((b) => b.id !== id);
      bookmarksCache = updated;
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Error removing bookmark', e);
      return [];
    }
  },

  async saveReadingPosition(
    bookId: string,
    chapterSequence: number,
    paragraphIndex = 0,
    scrollProgress = 0
  ): Promise<void> {
    try {
      const existing = await StorageService.getAllReadingHistory();
      const updated: Record<string, ReadingHistory> = {
        ...existing,
        [bookId]: {
          bookId,
          chapterSequence,
          paragraphIndex,
          scrollProgress,
          lastReadAt: new Date().toISOString(),
        },
      };
      historyCache = updated;
      await AsyncStorage.setItem(STORAGE_KEYS.READING_HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving reading position', e);
    }
  },

  async getReadingEntry(bookId: string): Promise<ReadingHistory | null> {
    const history = await StorageService.getAllReadingHistory();
    return history[bookId] ?? null;
  },

  async getReadingPosition(bookId: string): Promise<number | null> {
    const entry = await StorageService.getReadingEntry(bookId);
    return entry?.chapterSequence ?? null;
  },

  async getAllReadingHistory(): Promise<Record<string, ReadingHistory>> {
    if (historyCache) return historyCache;
    try {
      const historyStr = await AsyncStorage.getItem(STORAGE_KEYS.READING_HISTORY);
      if (historyStr) {
        const parsed = JSON.parse(historyStr);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          historyCache = parsed;
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    historyCache = {};
    return historyCache;
  },

  async removeReadingHistory(bookId: string): Promise<Record<string, ReadingHistory>> {
    try {
      const existing = await StorageService.getAllReadingHistory();
      const { [bookId]: _removed, ...rest } = existing;
      void _removed;
      historyCache = rest;
      await AsyncStorage.setItem(STORAGE_KEYS.READING_HISTORY, JSON.stringify(rest));
      return rest;
    } catch (e) {
      console.error('Error removing reading history', e);
      return historyCache ?? {};
    }
  },

  async restoreReadingHistory(
    entry: ReadingHistory
  ): Promise<Record<string, ReadingHistory>> {
    try {
      const existing = await StorageService.getAllReadingHistory();
      const updated: Record<string, ReadingHistory> = {
        ...existing,
        [entry.bookId]: entry,
      };
      historyCache = updated;
      await AsyncStorage.setItem(STORAGE_KEYS.READING_HISTORY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Error restoring reading history', e);
      return historyCache ?? {};
    }
  },
};
